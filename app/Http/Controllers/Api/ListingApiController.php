<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ListingApiController extends Controller
{
    public function index(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = max(1, min(100, (int) $request->query('limit', 20)));
        $q = Listing::query()->with(['user:id,email,full_name,avatar_url'])->where('is_active', true);

        if ($request->filled('search')) {
            $s = '%'.$request->query('search').'%';
            $q->where(function ($w) use ($s) {
                $w->where('title', 'like', $s)->orWhere('description', 'like', $s)->orWhere('location', 'like', $s);
            });
        }
        if ($request->filled('propertyType')) {
            $q->where('property_type', $request->query('propertyType'));
        }
        if ($request->filled('location')) {
            $q->where('location', 'like', '%'.$request->query('location').'%');
        }
        if ($request->filled('minBedrooms')) {
            $q->where('bedrooms', '>=', (int) $request->query('minBedrooms'));
        }

        $total = (clone $q)->count();
        $listings = $q->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        $sorted = $listings->sort(function ($a, $b) {
            $aB = $a->is_boosted && $a->boosted_until && $a->boosted_until->isFuture();
            $bB = $b->is_boosted && $b->boosted_until && $b->boosted_until->isFuture();
            if ($aB && ! $bB) {
                return -1;
            }
            if (! $aB && $bB) {
                return 1;
            }
            if ($aB && $bB) {
                return $b->boosted_until->timestamp <=> $a->boosted_until->timestamp;
            }

            return 0;
        })->values();

        return $this->jsonOk([
            'listings' => $sorted,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int) ceil($total / $limit),
            ],
        ]);
    }

    public function show(string $id)
    {
        $listing = Listing::query()->with(['user:id,email,full_name,avatar_url,phone'])->find($id);
        if (! $listing) {
            return $this->jsonErr('Listing not found', 404);
        }

        return $this->jsonOk($listing);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $listingRoles = ['LANDLORD', 'AGENT', 'REFERRER', 'INVESTOR', 'ESTATE_MANAGER', 'SURVEYOR', 'DEVELOPER', 'TIPPER_DRIVER'];

        if (in_array($user->role, $listingRoles, true)) {
            // Must have submitted NIN + documents
            if (! $user->nin_number) {
                return $this->jsonErr('You must submit your NIN and verification documents before creating listings.', 403, ['code' => 'NIN_REQUIRED']);
            }
            // Must be approved by admin
            $status = $user->listing_approval_status;
            if ($status === 'pending' || $status === null) {
                return $this->jsonErr('Your account is pending admin approval. You will be notified once approved.', 403, ['code' => 'APPROVAL_PENDING']);
            }
            if ($status === 'rejected') {
                return $this->jsonErr('Your listing access was rejected. Please contact support or resubmit your documents.', 403, ['code' => 'APPROVAL_REJECTED']);
            }
        }

        $data = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'price' => 'required|string',
            'location' => 'required|string',
            'bedrooms' => 'nullable|integer|min:1',
            'propertyType' => 'nullable|string',
            'imageUrl' => 'nullable|string',
            'videoUrl' => 'nullable|string',
            'amenities' => 'nullable|array',
            'landlordName' => 'nullable|string',
            'landlordEmail' => 'nullable|email',
            'landlordPhone' => 'nullable|string',
        ]);

        $listing = Listing::create([
            'user_id' => $user->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'location' => $data['location'],
            'bedrooms' => $data['bedrooms'] ?? null,
            'property_type' => $data['propertyType'] ?? null,
            'image_url' => $data['imageUrl'] ?? null,
            'video_url' => $data['videoUrl'] ?? null,
            'amenities' => $data['amenities'] ?? [],
            'landlord_name' => $data['landlordName'] ?? null,
            'landlord_email' => $data['landlordEmail'] ?? null,
            'landlord_phone' => $data['landlordPhone'] ?? null,
        ]);

        $listing->load(['user:id,email,full_name,avatar_url']);

        return $this->jsonOk($listing, 'Listing created successfully', 201);
    }

    public function update(Request $request, string $id)
    {
        $listing = Listing::query()->find($id);
        if (! $listing) {
            return $this->jsonErr('Listing not found', 404);
        }
        if ((string) $listing->user_id !== (string) $request->user()->id) {
            return $this->jsonErr('You can only update your own listings', 403);
        }

        $data = $request->validate([
            'title' => 'sometimes|string',
            'description' => 'nullable|string',
            'price' => 'sometimes|string',
            'location' => 'sometimes|string',
            'bedrooms' => 'nullable|integer|min:1',
            'propertyType' => 'nullable|string',
            'imageUrl' => 'nullable|string',
            'videoUrl' => 'nullable|string',
            'amenities' => 'nullable|array',
            'landlordName' => 'nullable|string',
            'landlordEmail' => 'nullable|email',
            'landlordPhone' => 'nullable|string',
        ]);

        $map = [
            'title' => 'title', 'description' => 'description', 'price' => 'price', 'location' => 'location',
            'bedrooms' => 'bedrooms', 'propertyType' => 'property_type', 'imageUrl' => 'image_url',
            'videoUrl' => 'video_url', 'amenities' => 'amenities', 'landlordName' => 'landlord_name',
            'landlordEmail' => 'landlord_email', 'landlordPhone' => 'landlord_phone',
        ];
        $updates = [];
        foreach ($map as $json => $col) {
            if (array_key_exists($json, $data)) {
                $updates[$col] = $data[$json];
            }
        }
        $listing->update($updates);
        $listing->load(['user:id,email,full_name,avatar_url']);

        return $this->jsonOk($listing, 'Listing updated successfully');
    }

    public function destroy(Request $request, string $id)
    {
        $listing = Listing::query()->find($id);
        if (! $listing) {
            return $this->jsonErr('Listing not found', 404);
        }
        if ((string) $listing->user_id !== (string) $request->user()->id) {
            return $this->jsonErr('You can only delete your own listings', 403);
        }
        $listing->delete();

        return $this->jsonOk(null, 'Listing deleted successfully');
    }

    public function myListings(Request $request)
    {
        $listings = Listing::query()->where('user_id', $request->user()->id)->orderByDesc('created_at')->get();
        $sorted = $listings->sort(function ($a, $b) {
            $aB = $a->is_boosted && $a->boosted_until && $a->boosted_until->isFuture();
            $bB = $b->is_boosted && $b->boosted_until && $b->boosted_until->isFuture();
            if ($aB && ! $bB) {
                return -1;
            }
            if (! $aB && $bB) {
                return 1;
            }
            if ($aB && $bB) {
                return $b->boosted_until->timestamp <=> $a->boosted_until->timestamp;
            }

            return 0;
        })->values();

        return $this->jsonOk($sorted);
    }

    public function boost(Request $request, string $id)
    {
        $listing = Listing::query()->find($id);
        if (! $listing) {
            return $this->jsonErr('Listing not found', 404);
        }
        if ((string) $listing->user_id !== (string) $request->user()->id) {
            return $this->jsonErr('You can only boost your own listings', 403);
        }

        $duration = (int) ($request->input('duration', 30));
        $boostCost = 10;

        $wallet = Wallet::query()->firstOrCreate(['user_id' => $request->user()->id], ['swc_balance' => 0, 'tier' => 'bronze']);
        if ($wallet->swc_balance < $boostCost) {
            return $this->jsonErr("Insufficient SWC balance. You need {$boostCost} SWC to boost a listing.", 400);
        }

        $isBoosted = $listing->is_boosted && $listing->boosted_until && $listing->boosted_until->isFuture();
        if ($isBoosted) {
            return $this->jsonErr('This listing is already boosted. Wait for the current boost to expire.', 400);
        }

        return DB::transaction(function () use ($listing, $wallet, $duration, $boostCost, $request) {
            $until = now()->addDays($duration);
            $listing->update([
                'is_boosted' => true,
                'boosted_until' => $until,
                'boosted_at' => now(),
                'boost_cost' => $boostCost,
            ]);
            $wallet->decrement('swc_balance', $boostCost);
            $listing->load(['user:id,email,full_name,avatar_url']);

            return $this->jsonOk([
                'listing' => $listing,
                'newBalance' => $wallet->fresh()->swc_balance,
            ], "Listing boosted successfully for {$duration} days");
        });
    }
}
