<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityPost;
use App\Models\FeelsVideo;
use App\Models\GlobalTale;
use App\Models\Listing;
use App\Models\MarketplaceProduct;
use App\Models\PaymentTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminApiController extends Controller
{
    protected function userPublic(User $u): array
    {
        $u->loadMissing(['wallet:id,user_id,swc_balance,tier,referrals']);
        $u->loadCount(['listings', 'favorites']);

        return $u->makeHidden(['password', 'remember_token'])->toArray();
    }

    public function usersIndex(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = max(1, min(100, (int) $request->query('limit', 50)));
        $q = User::query()->with(['wallet:id,user_id,swc_balance,tier,referrals'])->withCount(['listings', 'favorites']);
        if ($request->filled('search')) {
            $s = '%'.$request->query('search').'%';
            $q->where(function ($w) use ($s) {
                $w->where('email', 'like', $s)->orWhere('full_name', 'like', $s);
            });
        }
        if ($request->filled('role')) {
            $q->where('role', $request->query('role'));
        }
        $total = (clone $q)->count();
        $users = $q->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get()
            ->map(fn ($u) => $this->userPublic($u));

        return $this->jsonOk([
            'users' => $users,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / $limit)],
        ]);
    }

    public function userShow(string $id)
    {
        $u = User::query()->with(['wallet', 'listings' => fn ($q) => $q->select('id', 'user_id', 'title', 'price', 'location', 'is_active', 'created_at'), 'favorites.listing'])->withCount(['listings', 'favorites', 'appointments'])->find($id);
        if (! $u) {
            return $this->jsonErr('User not found', 404);
        }

        return $this->jsonOk($u->makeHidden(['password', 'remember_token'])->toArray());
    }

    public function userUpdate(Request $request, string $id)
    {
        $u = User::query()->find($id);
        if (! $u) {
            return $this->jsonErr('User not found', 404);
        }
        $data = $request->validate([
            'email' => 'sometimes|email|unique:users,email,'.$id,
            'fullName' => 'sometimes|string',
            'phone' => 'sometimes|string',
            'role' => 'sometimes|string',
            'isPremium' => 'sometimes|boolean',
            'isVerified' => 'sometimes|boolean',
            'artisanService' => 'nullable|string',
            'artisanLocation' => 'nullable|string',
            'artisanBio' => 'nullable|string',
        ]);
        $map = ['fullName' => 'full_name', 'isPremium' => 'is_premium', 'isVerified' => 'is_verified', 'artisanService' => 'artisan_service', 'artisanLocation' => 'artisan_location', 'artisanBio' => 'artisan_bio'];
        $updates = [];
        foreach ($data as $k => $v) {
            if (isset($map[$k])) {
                $updates[$map[$k]] = $v;
            } elseif (in_array($k, ['email', 'phone', 'role'], true)) {
                $updates[$k] = $v;
            }
        }
        $u->update($updates);

        return $this->jsonOk($this->userPublic($u->fresh()), 'User updated successfully');
    }

    public function userDestroy(Request $request, string $id)
    {
        if ((string) $id === (string) $request->user()->id) {
            return $this->jsonErr('You cannot delete your own account', 400);
        }
        $u = User::query()->find($id);
        if (! $u) {
            return $this->jsonErr('User not found', 404);
        }
        $u->delete();

        return $this->jsonOk(null, 'User deleted successfully');
    }

    public function listingsIndex(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = max(1, min(100, (int) $request->query('limit', 50)));
        $q = Listing::query()->with(['user:id,email,full_name,phone,avatar_url'])->withCount(['favorites', 'appointments']);
        if ($request->filled('search')) {
            $s = '%'.$request->query('search').'%';
            $q->where(function ($w) use ($s) {
                $w->where('title', 'like', $s)->orWhere('description', 'like', $s)->orWhere('location', 'like', $s);
            });
        }
        if ($request->filled('propertyType')) {
            $q->where('property_type', $request->query('propertyType'));
        }
        if ($request->filled('isActive')) {
            $q->where('is_active', filter_var($request->query('isActive'), FILTER_VALIDATE_BOOLEAN));
        }
        $total = (clone $q)->count();
        $rows = $q->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return $this->jsonOk([
            'listings' => $rows,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / $limit)],
        ]);
    }

    public function listingShow(string $id)
    {
        $l = Listing::query()->with(['user', 'favorites.user', 'appointments.user'])->find($id);
        if (! $l) {
            return $this->jsonErr('Listing not found', 404);
        }

        return $this->jsonOk($l);
    }

    public function listingUpdate(Request $request, string $id)
    {
        $l = Listing::query()->find($id);
        if (! $l) {
            return $this->jsonErr('Listing not found', 404);
        }
        $data = $request->all();
        unset($data['_token']);
        if (isset($data['isActive'])) {
            $l->is_active = filter_var($data['isActive'], FILTER_VALIDATE_BOOLEAN);
        }
        $l->fill(array_filter([
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'price' => $data['price'] ?? null,
            'location' => $data['location'] ?? null,
        ], fn ($v) => $v !== null));
        $l->save();
        $l->load(['user:id,email,full_name']);

        return $this->jsonOk($l, 'Listing updated successfully');
    }

    public function listingDestroy(string $id)
    {
        $l = Listing::query()->find($id);
        if (! $l) {
            return $this->jsonErr('Listing not found', 404);
        }
        $l->delete();

        return $this->jsonOk(null, 'Listing deleted successfully');
    }

    public function stats()
    {
        return $this->jsonOk([
            'users' => [
                'total' => User::query()->count(),
                'premium' => User::query()->where('is_premium', true)->count(),
                'recent' => User::query()->where('created_at', '>=', now()->subDays(30))->count(),
            ],
            'listings' => [
                'total' => Listing::query()->count(),
                'active' => Listing::query()->where('is_active', true)->count(),
                'recent' => Listing::query()->where('created_at', '>=', now()->subDays(30))->count(),
            ],
            'favorites' => ['total' => DB::table('favorites')->count()],
        ]);
    }

    public function approveProduct(string $id)
    {
        $p = MarketplaceProduct::query()->find($id);
        if (! $p) {
            return $this->jsonErr('Product not found', 404);
        }
        $p->update(['is_approved' => true, 'is_active' => true, 'approved_at' => now(), 'approved_by' => request()->user()->id]);
        $p->load(['user:id,full_name,email']);

        return $this->jsonOk($p, 'Product approved successfully');
    }

    public function rejectProduct(string $id)
    {
        $p = MarketplaceProduct::query()->find($id);
        if (! $p) {
            return $this->jsonErr('Product not found', 404);
        }
        $p->update(['is_approved' => false, 'is_active' => false]);

        return $this->jsonOk($p, 'Product rejected');
    }

    public function pendingProducts()
    {
        $rows = MarketplaceProduct::query()->where('is_approved', false)
            ->with(['user:id,full_name,email,avatar_url'])->orderByDesc('created_at')->get();

        return $this->jsonOk($rows);
    }

    public function allMarketplaceProducts(Request $request)
    {
        $q = MarketplaceProduct::query()->with(['user:id,full_name,email,avatar_url'])->orderByDesc('created_at');
        if ($request->filled('isApproved')) {
            $q->where('is_approved', filter_var($request->query('isApproved'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('category')) {
            $q->where('category', $request->query('category'));
        }
        $rows = $q->get();
        return $this->jsonOk(['products' => $rows, 'total' => $rows->count()]);
    }

    // ── Property Requests (Appointments) ──────────────────────────────────
    public function allAppointments(Request $request)
    {
        $q = \App\Models\Appointment::query()
            ->with([
                'user:id,full_name,email,phone',
                'listing:id,title,price,location,user_id,image_url',
                'listing.user:id,full_name,email,phone,role',
            ])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $q->where('status', $request->query('status'));
        }
        $rows = $q->get();
        return $this->jsonOk(['appointments' => $rows, 'total' => $rows->count()]);
    }

    public function updateAppointment(Request $request, string $id)
    {
        $appt = \App\Models\Appointment::query()->find($id);
        if (! $appt) return $this->jsonErr('Appointment not found', 404);
        $data = $request->validate(['status' => 'required|in:pending,confirmed,completed,cancelled,rented_out']);
        $appt->update(['status' => $data['status']]);
        $appt->load(['user:id,full_name,email,phone', 'listing:id,title,price,location,user_id', 'listing.user:id,full_name,email,phone,role']);
        return $this->jsonOk($appt, 'Appointment updated');
    }

    // ── Pending verifications (all roles that need NIN approval) ──────────
    public function pendingVerifications()
    {
        $listingRoles = ['LANDLORD', 'AGENT', 'REFERRER', 'INVESTOR', 'ESTATE_MANAGER', 'ARTISAN', 'SURVEYOR', 'DEVELOPER'];
        $rows = User::query()
            ->where('listing_approval_status', 'pending')
            ->whereIn('role', $listingRoles)
            ->orderBy('created_at')
            ->get(['id', 'email', 'full_name', 'phone', 'role',
                   'nin_number', 'verification_photo_url', 'verification_id_url',
                   'verification_id_type', 'verification_status',
                   'listing_approval_status', 'created_at']);

        return $this->jsonOk(['verifications' => $rows]);
    }

    public function approveVerification(string $id)
    {
        $u = User::query()->find($id);
        if (! $u) {
            return $this->jsonErr('User not found', 404);
        }
        $u->update([
            'is_verified'              => true,
            'nin_verified'             => true,
            'verification_status'      => 'approved',
            'listing_approval_status'  => 'approved',
            'verified_at'              => now(),
            'listing_approved_at'      => now(),
            'verification_rejected_at'              => null,
            'verification_rejection_reason'         => null,
            'listing_approval_rejection_reason'     => null,
        ]);

        return $this->jsonOk($u->only(['id', 'email', 'full_name', 'is_verified', 'verification_status', 'listing_approval_status', 'verified_at']), 'Verification and listing access approved');
    }

    public function rejectVerification(Request $request, string $id)
    {
        $u = User::query()->find($id);
        if (! $u) {
            return $this->jsonErr('User not found', 404);
        }
        $reason = $request->input('reason', 'Documents did not meet requirements');
        $u->update([
            'is_verified'                           => false,
            'nin_verified'                          => false,
            'verification_status'                   => 'rejected',
            'listing_approval_status'               => 'rejected',
            'verification_rejected_at'              => now(),
            'verification_rejection_reason'         => $reason,
            'listing_approval_rejection_reason'     => $reason,
        ]);

        return $this->jsonOk($u->only(['id', 'email', 'full_name', 'verification_status', 'listing_approval_status', 'verification_rejection_reason']), 'Verification rejected');
    }

    // ── Professional profiles (Surveyors / Developers) ────────────────────
    public function pendingProfessionalProfiles()
    {
        $profiles = \App\Models\ProfessionalProfile::query()
            ->where('status', 'pending')
            ->with(['user:id,email,full_name,phone,avatar_url,role'])
            ->orderBy('created_at')
            ->get();

        return $this->jsonOk(['profiles' => $profiles]);
    }

    public function approveProfessionalProfile(string $id)
    {
        $profile = \App\Models\ProfessionalProfile::query()->with('user')->find($id);
        if (! $profile) {
            return $this->jsonErr('Profile not found', 404);
        }
        $profile->update([
            'status'      => 'approved',
            'approved_at' => now(),
            'approved_by' => request()->user()->id,
            'rejection_reason' => null,
        ]);
        // Also approve the user's listing access
        $profile->user->update([
            'is_verified'             => true,
            'nin_verified'            => true,
            'listing_approval_status' => 'approved',
            'listing_approved_at'     => now(),
        ]);

        return $this->jsonOk($profile->load('user'), 'Professional profile approved');
    }

    public function rejectProfessionalProfile(Request $request, string $id)
    {
        $profile = \App\Models\ProfessionalProfile::query()->with('user')->find($id);
        if (! $profile) {
            return $this->jsonErr('Profile not found', 404);
        }
        $reason = $request->input('reason', 'Professional documents did not meet requirements');
        $profile->update([
            'status'           => 'rejected',
            'rejection_reason' => $reason,
        ]);
        $profile->user->update([
            'listing_approval_status'           => 'rejected',
            'listing_approval_rejection_reason' => $reason,
        ]);

        return $this->jsonOk($profile->load('user'), 'Professional profile rejected');
    }

    public function analytics(Request $request)
    {
        $days = max(1, (int) $request->query('period', 30));
        $start = now()->subDays($days);
        $revenue = PaymentTransaction::query()->where('status', 'completed')->where('created_at', '>=', $start)->get(['amount', 'created_at']);
        $topLocations = Listing::query()->where('is_active', true)->select('location', DB::raw('count(*) as cnt'))->groupBy('location')->orderByDesc('cnt')->limit(10)->get();
        $roleDistribution = User::query()->select('role', DB::raw('count(*) as cnt'))->groupBy('role')->get();

        return $this->jsonOk([
            'userGrowth' => [],
            'listingGrowth' => [],
            'revenue' => [
                'total' => $revenue->sum('amount'),
                'transactions' => $revenue->count(),
                'daily' => $revenue->groupBy(fn ($t) => $t->created_at->format('Y-m-d'))->map->sum('amount'),
            ],
            'topLocations' => $topLocations,
            'roleDistribution' => $roleDistribution,
        ]);
    }

    public function systemHealth()
    {
        $t0 = microtime(true);
        User::query()->count();
        $lat = (int) ((microtime(true) - $t0) * 1000);

        return $this->jsonOk([
            'database' => ['status' => $lat < 1000 ? 'healthy' : 'slow', 'latency' => $lat, 'connected' => true],
            'system' => ['uptime' => null, 'memory' => [], 'nodeVersion' => null],
            'metrics' => [
                'totalUsers' => User::query()->count(),
                'totalListings' => Listing::query()->count(),
                'activeListings' => Listing::query()->where('is_active', true)->count(),
                'pendingProducts' => MarketplaceProduct::query()->where('is_approved', false)->count(),
            ],
        ]);
    }

    public function transactions(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = max(1, min(100, (int) $request->query('limit', 50)));
        $q = PaymentTransaction::query()->with(['user:id,email,full_name']);
        if ($request->filled('status')) {
            $q->where('status', $request->query('status'));
        }
        if ($request->filled('type')) {
            $q->where('type', $request->query('type'));
        }
        $total = (clone $q)->count();
        $rows = $q->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return $this->jsonOk([
            'transactions' => $rows,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / $limit)],
        ]);
    }

    public function content(Request $request)
    {
        $type = $request->query('type');
        $page = max(1, (int) $request->query('page', 1));
        $limit = max(1, min(100, (int) $request->query('limit', 50)));
        if (! $type) {
            return $this->jsonOk([
                'content' => [
                    'listings' => Listing::query()->count(),
                    'posts' => CommunityPost::query()->count(),
                    'videos' => FeelsVideo::query()->count(),
                    'stories' => GlobalTale::query()->count(),
                ],
                'pagination' => null,
            ]);
        }
        $content = [];
        $total = 0;
        if ($type === 'listings') {
            $total = Listing::query()->count();
            $content = Listing::query()->with(['user:id,email,full_name'])->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();
        } elseif ($type === 'posts') {
            $total = CommunityPost::query()->count();
            $content = CommunityPost::query()->with(['user:id,email,full_name'])->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();
        } elseif ($type === 'videos') {
            $total = FeelsVideo::query()->count();
            $content = FeelsVideo::query()->with(['user:id,email,full_name'])->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();
        } elseif ($type === 'stories') {
            $total = GlobalTale::query()->count();
            $content = GlobalTale::query()->with(['user:id,email,full_name'])->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();
        }

        return $this->jsonOk([
            'content' => $content,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / $limit)],
        ]);
    }

    public function aiStats()
    {
        return $this->jsonOk([
            'aiEnabled' => (bool) env('GEMINI_API_KEY'),
            'totalQueries' => 0,
            'availableData' => ['listings' => Listing::query()->where('is_active', true)->count(), 'lastUpdated' => now()->toIso8601String()],
            'model' => 'Gemini',
            'status' => 'active',
        ]);
    }

    public function bulkAction(Request $request)
    {
        $data = $request->validate(['action' => 'required|string', 'type' => 'required|string', 'ids' => 'required|array']);
        $result = [];
        if ($data['type'] === 'listings') {
            if ($data['action'] === 'activate') {
                Listing::query()->whereIn('id', $data['ids'])->update(['is_active' => true]);
            } elseif ($data['action'] === 'deactivate') {
                Listing::query()->whereIn('id', $data['ids'])->update(['is_active' => false]);
            } elseif ($data['action'] === 'delete') {
                Listing::query()->whereIn('id', $data['ids'])->delete();
            }
        } elseif ($data['type'] === 'users' && $data['action'] === 'ban') {
            $result['message'] = 'User ban functionality not implemented';
        }

        return $this->jsonOk($result, 'Bulk '.$data['action'].' completed');
    }
}
