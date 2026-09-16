<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\FiltersListings;
use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\ListingView;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ListingApiController extends Controller
{
    use FiltersListings;

    /**
     * What the public browse endpoint returns.
     *
     * Enumerated rather than returning the whole row: landlord_email and
     * landlord_phone would otherwise sit in a page of JSON that anyone can
     * fetch. Contact details come from the contact endpoint instead, which
     * also records that the seeker asked for them.
     */
    private const PUBLIC_COLUMNS = [
        'id', 'user_id', 'title', 'slug', 'description', 'price', 'price_amount',
        'price_period', 'location', 'state', 'city', 'lat', 'lng', 'bedrooms',
        'bathrooms', 'property_type', 'listing_type', 'status', 'image_url',
        'video_url', 'images', 'videos', 'amenities', 'tags', 'furnished',
        'parking', 'landlord_name', 'is_boosted', 'boosted_until', 'views_count',
        'created_at', 'updated_at',
    ];

    /** Sort keys the client may ask for, mapped to raw ORDER BY fragments. */
    private const SORTS = [
        'newest' => 'created_at DESC',
        'oldest' => 'created_at ASC',
        // Listings whose price is unparseable text ("Negotiable") sort last
        // either way, rather than pretending to be the cheapest.
        'priceAsc' => 'price_amount IS NULL ASC, price_amount ASC',
        'priceDesc' => 'price_amount IS NULL ASC, price_amount DESC',
        'bedrooms' => 'bedrooms IS NULL ASC, bedrooms DESC',
        'popular' => 'views_count DESC',
    ];

    public function index(Request $request)
    {
        $data = $request->validate([
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:100',
            'search' => 'nullable|string|max:120',
            'propertyType' => 'nullable|string|max:200',
            'listingType' => 'nullable|string|max:40',
            'state' => 'nullable|string|max:40',
            'city' => 'nullable|string|max:80',
            'location' => 'nullable|string|max:120',
            'minPrice' => 'nullable|numeric|min:0|max:100000000000',
            'maxPrice' => 'nullable|numeric|min:0|max:100000000000',
            'pricePeriod' => 'nullable|string|in:year,month,week,night',
            'minBedrooms' => 'nullable|integer|min:0|max:20',
            'maxBedrooms' => 'nullable|integer|min:0|max:20',
            'minBathrooms' => 'nullable|integer|min:0|max:20',
            'furnished' => 'nullable|boolean',
            'parking' => 'nullable|boolean',
            'boosted' => 'nullable|boolean',
            'amenities' => 'nullable|string|max:300',
            'sort' => 'nullable|string|in:'.implode(',', array_keys(self::SORTS)),
        ]);

        $page = max(1, (int) ($data['page'] ?? 1));
        $limit = max(1, min(100, (int) ($data['limit'] ?? 20)));

        $q = Listing::query()
            ->select(self::PUBLIC_COLUMNS)
            ->with(['user:id,full_name,avatar_url'])
            ->where('is_active', true);

        if (filled($data['search'] ?? null)) {
            $s = '%'.$this->escapeLike($data['search']).'%';
            $q->where(function ($w) use ($s) {
                $w->where('title', 'like', $s)
                    ->orWhere('description', 'like', $s)
                    ->orWhere('location', 'like', $s)
                    ->orWhere('city', 'like', $s)
                    ->orWhere('state', 'like', $s)
                    ->orWhere('property_type', 'like', $s);
            });
        }

        // Facets come from the searched set before the discrete filters narrow
        // it, so the options a seeker sees stay the same as they tick boxes
        // instead of vanishing one by one.
        $facets = $this->facets(clone $q);

        if (filled($data['propertyType'] ?? null)) {
            $this->whereInLower($q, 'property_type', $data['propertyType']);
        }
        if (filled($data['listingType'] ?? null)) {
            $this->whereInLower($q, 'listing_type', $data['listingType']);
        }
        if (filled($data['state'] ?? null)) {
            $this->whereInLower($q, 'state', $data['state']);
        }
        if (filled($data['city'] ?? null)) {
            $q->where('city', 'like', '%'.$this->escapeLike($data['city']).'%');
        }
        if (filled($data['location'] ?? null)) {
            $q->where('location', 'like', '%'.$this->escapeLike($data['location']).'%');
        }
        if (isset($data['minPrice'])) {
            $q->where('price_amount', '>=', (float) $data['minPrice']);
        }
        if (isset($data['maxPrice'])) {
            $q->where('price_amount', '<=', (float) $data['maxPrice']);
        }
        if (filled($data['pricePeriod'] ?? null)) {
            $q->where('price_period', $data['pricePeriod']);
        }
        if (isset($data['minBedrooms'])) {
            $q->where('bedrooms', '>=', (int) $data['minBedrooms']);
        }
        if (isset($data['maxBedrooms'])) {
            $q->where('bedrooms', '<=', (int) $data['maxBedrooms']);
        }
        if (isset($data['minBathrooms'])) {
            $q->where('bathrooms', '>=', (int) $data['minBathrooms']);
        }
        if (isset($data['furnished'])) {
            $q->where('furnished', (bool) $data['furnished']);
        }
        if (isset($data['parking'])) {
            $q->where('parking', (bool) $data['parking']);
        }
        if (! empty($data['boosted'])) {
            $q->where('is_boosted', true)->where('boosted_until', '>', now());
        }

        foreach ($this->csv($data['amenities'] ?? null) as $amenity) {
            // The column is a JSON array; a LIKE on the encoded text matches on
            // both MySQL and SQLite, where whereJsonContains does not.
            $q->where('amenities', 'like', '%"'.$this->escapeLike($amenity).'"%');
        }

        $total = (clone $q)->count();

        // Boosted listings lead — the owner paid for that placement. This used
        // to be done in PHP after skip/take, which only reordered whichever
        // slice had already been fetched.
        $q->orderByRaw(
            '(is_boosted = 1 AND boosted_until IS NOT NULL AND boosted_until > ?) DESC',
            [now()->toDateTimeString()]
        );

        $q->orderByRaw(self::SORTS[$data['sort'] ?? 'newest'])->orderByDesc('id');

        $listings = $q->skip(($page - 1) * $limit)->take($limit)->get();

        return $this->jsonOk([
            'listings' => $listings,
            'facets' => $facets,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int) ceil($total / $limit),
            ],
        ]);
    }

    /**
     * The option lists the filter UI draws itself from: only values that
     * actually appear in the data, each with the number of listings behind it.
     */
    private function facets($base): array
    {
        $bounds = (clone $base)
            ->selectRaw('min(price_amount) as low, max(price_amount) as high')
            ->first();

        return [
            'propertyTypes' => $this->facetCounts($base, 'property_type'),
            'listingTypes' => $this->facetCounts($base, 'listing_type'),
            'states' => $this->facetCounts($base, 'state'),
            'priceRange' => [
                'min' => $bounds && $bounds->low !== null ? (float) $bounds->low : null,
                'max' => $bounds && $bounds->high !== null ? (float) $bounds->high : null,
            ],
        ];
    }

    public function show(Request $request, string $id)
    {
        $listing = Listing::query()
            ->select(self::PUBLIC_COLUMNS)
            ->with(['user:id,full_name,avatar_url'])
            ->find($id);

        if (! $listing) {
            return $this->jsonErr('Listing not found', 404);
        }

        $this->recordView($request, $listing);

        return $this->jsonOk($listing);
    }

    /**
     * Contact details, revealed on request.
     *
     * Keeping them behind their own call means a listing page of JSON does not
     * hand out every landlord's phone number, and gives the owner a count of
     * how many seekers actually reached for the phone — which is what a boost
     * is meant to buy.
     */
    public function contact(Request $request, string $id)
    {
        $listing = Listing::query()->with(['user:id,full_name,phone'])->find($id);

        if (! $listing || ! $listing->is_active) {
            return $this->jsonErr('Listing not found', 404);
        }

        $listing->increment('contact_views');

        return $this->jsonOk([
            'name' => $listing->landlord_name ?: $listing->user?->full_name,
            'phone' => $listing->landlord_phone ?: $listing->user?->phone,
            'email' => $listing->landlord_email,
        ]);
    }

    /**
     * One view per visitor per listing per six hours.
     *
     * views_count was never written to by anything, so the "most viewed" sort
     * the AI assistant already used was ordering by a column of zeros. Without
     * the window, a refresh or a back-navigation would inflate it instead.
     */
    private function recordView(Request $request, Listing $listing): void
    {
        $ip = $request->ip();

        $seen = ListingView::query()
            ->where('listing_id', $listing->id)
            ->where('ip', $ip)
            ->where('created_at', '>', now()->subHours(6))
            ->exists();

        if ($seen) {
            return;
        }

        ListingView::create([
            'listing_id' => $listing->id,
            'user_id' => $request->user()?->id,
            'ip' => $ip,
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'created_at' => now(),
        ]);

        $listing->increment('views_count');
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
            'images' => 'nullable|array',
            'images.*' => 'string',
            'videoUrl' => 'nullable|string',
            'videos' => 'nullable|array',
            'videos.*' => 'string',
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
            'images' => $data['images'] ?? null,
            'video_url' => $data['videoUrl'] ?? null,
            'videos' => $data['videos'] ?? null,
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
            'images' => 'nullable|array',
            'images.*' => 'string',
            'videoUrl' => 'nullable|string',
            'videos' => 'nullable|array',
            'videos.*' => 'string',
            'amenities' => 'nullable|array',
            'landlordName' => 'nullable|string',
            'landlordEmail' => 'nullable|email',
            'landlordPhone' => 'nullable|string',
        ]);

        $map = [
            'title' => 'title', 'description' => 'description', 'price' => 'price', 'location' => 'location',
            'bedrooms' => 'bedrooms', 'propertyType' => 'property_type', 'imageUrl' => 'image_url',
            'images' => 'images', 'videoUrl' => 'video_url', 'videos' => 'videos',
            'amenities' => 'amenities', 'landlordName' => 'landlord_name',
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
