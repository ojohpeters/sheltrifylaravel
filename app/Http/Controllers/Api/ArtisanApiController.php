<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArtisanReview;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ArtisanApiController extends Controller
{
    /** Columns safe to expose publicly — no email, no NIN, no verification docs. */
    private const PUBLIC_COLUMNS = [
        'id', 'full_name', 'phone', 'whatsapp', 'avatar_url',
        'artisan_location', 'artisan_service', 'artisan_bio',
        'artisan_rating', 'artisan_reviews_count', 'artisan_experience_years',
        'created_at',
    ];

    /**
     * Public directory of verified artisans.
     *
     * Only verified accounts are listed: an unvetted tradesperson appearing
     * beside vetted ones is the whole risk the platform exists to remove.
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'search' => 'nullable|string|max:120',
            'service' => 'nullable|string|max:60',
        ]);

        $query = User::query()
            ->where('role', 'ARTISAN')
            ->where('is_verified', true)
            ->where(fn ($q) => $q->whereNull('is_suspended')->orWhere('is_suspended', false));

        if (! empty($data['service'])) {
            $query->where('artisan_service', $data['service']);
        }

        if (! empty($data['search'])) {
            // Escape LIKE wildcards so a user searching "100%" does not match everything.
            $term = '%'.addcslashes($data['search'], '%_\\').'%';
            $query->where(fn ($q) => $q
                ->where('full_name', 'like', $term)
                ->orWhere('artisan_location', 'like', $term)
                ->orWhere('artisan_service', 'like', $term));
        }

        $artisans = $query
            ->orderByDesc('artisan_rating')
            ->orderByDesc('created_at')
            ->get(self::PUBLIC_COLUMNS);

        return $this->jsonOk(['artisans' => $artisans]);
    }

    /** Reviews for one artisan, newest first. */
    public function reviews(string $id)
    {
        $artisan = User::query()->where('role', 'ARTISAN')->find($id);
        if (! $artisan) {
            return $this->jsonErr('Artisan not found', 404);
        }

        $reviews = ArtisanReview::query()
            ->where('artisan_id', $artisan->id)
            ->with('reviewer:id,full_name,avatar_url')
            ->orderByDesc('created_at')
            ->limit(100)
            ->get(['id', 'reviewer_id', 'rating', 'comment', 'created_at']);

        return $this->jsonOk([
            'reviews' => $reviews,
            'average' => $artisan->artisan_rating,
            'count' => $artisan->artisan_reviews_count,
        ]);
    }

    /**
     * Leave or update a review. The unique index on (artisan_id, reviewer_id)
     * means a second submission edits the first rather than letting one account
     * stack ratings.
     */
    public function storeReview(Request $request, string $id)
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $artisan = User::query()->where('role', 'ARTISAN')->find($id);
        if (! $artisan) {
            return $this->jsonErr('Artisan not found', 404);
        }

        $reviewer = $request->user();
        if ((int) $reviewer->id === (int) $artisan->id) {
            return $this->jsonErr('You cannot review your own profile.', 422);
        }

        ArtisanReview::updateOrCreate(
            ['artisan_id' => $artisan->id, 'reviewer_id' => $reviewer->id],
            ['rating' => $data['rating'], 'comment' => $data['comment'] ?? null],
        );

        ArtisanReview::refreshAggregates((int) $artisan->id);

        return $this->jsonOk([
            'average' => $artisan->fresh()->artisan_rating,
            'count' => $artisan->fresh()->artisan_reviews_count,
        ], 'Thank you for your review.');
    }

    /**
     * Artisan onboarding. Converts the signed-in account into an artisan
     * profile awaiting verification — it deliberately does NOT set is_verified,
     * so an applicant cannot list themselves as vetted.
     */
    public function apply(Request $request)
    {
        $data = $request->validate([
            'fullName' => 'required|string|max:120',
            'service' => ['required', 'string', 'max:60'],
            'phone' => 'required|string|max:30',
            'whatsapp' => 'nullable|string|max:30',
            'experienceYears' => 'nullable|integer|min:0|max:70',
            'state' => 'required|string|max:60',
            'lga' => 'nullable|string|max:60',
            'bio' => 'nullable|string|max:1000',
            'avatarUrl' => 'nullable|string|max:2048',
        ]);

        $user = $request->user();

        $user->fill([
            'full_name' => $data['fullName'],
            'role' => 'ARTISAN',
            'phone' => $data['phone'],
            'whatsapp' => $data['whatsapp'] ?? $user->whatsapp,
            'artisan_service' => $data['service'],
            'artisan_location' => trim(($data['lga'] ?? '').', '.$data['state'], ', '),
            'artisan_bio' => $data['bio'] ?? null,
            'artisan_experience_years' => $data['experienceYears'] ?? null,
        ]);

        if (! empty($data['avatarUrl'])) {
            $user->avatar_url = $data['avatarUrl'];
        }

        $user->save();

        return $this->jsonOk(
            ['role' => $user->role, 'isVerified' => (bool) $user->is_verified],
            'Application submitted. Your profile will appear once our team verifies it.'
        );
    }
}
