<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\FiltersListings;
use App\Http\Controllers\Controller;
use App\Models\MarketplaceProduct;
use App\Models\Notification;
use App\Models\Subscriber;
use App\Models\User;
use App\Services\NotifyUser;
use Illuminate\Http\Request;

class MarketplaceApiController extends Controller
{
    use FiltersListings;

    /** Sort keys the client may ask for, mapped to raw ORDER BY fragments. */
    private const SORTS = [
        'newest' => 'created_at DESC',
        'oldest' => 'created_at ASC',
        'priceAsc' => 'price IS NULL ASC, price ASC',
        'priceDesc' => 'price IS NULL ASC, price DESC',
        'popular' => 'views_count DESC',
        'name' => 'name ASC',
    ];

    public function index(Request $request)
    {
        $data = $request->validate([
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:200',
            'search' => 'nullable|string|max:120',
            'category' => 'nullable|string|max:400',
            'brand' => 'nullable|string|max:200',
            'location' => 'nullable|string|max:400',
            'minPrice' => 'nullable|numeric|min:0|max:100000000000',
            'maxPrice' => 'nullable|numeric|min:0|max:100000000000',
            'featured' => 'nullable|boolean',
            'discounted' => 'nullable|boolean',
            'sort' => 'nullable|string|in:'.implode(',', array_keys(self::SORTS)),
        ]);

        $page = max(1, (int) ($data['page'] ?? 1));
        $limit = max(1, min(200, (int) ($data['limit'] ?? 50)));

        $q = MarketplaceProduct::query()
            ->with(['user:id,email,full_name,avatar_url'])
            ->where('is_active', true)
            ->where('is_approved', true);

        if (filled($data['search'] ?? null)) {
            $s = '%'.$this->escapeLike($data['search']).'%';
            $q->where(function ($w) use ($s) {
                $w->where('name', 'like', $s)
                    ->orWhere('description', 'like', $s)
                    ->orWhere('brand', 'like', $s)
                    ->orWhere('category', 'like', $s)
                    // Shoppers search by area first — "High Level", "Wadata" —
                    // so the place a seller gave has to be part of the query.
                    ->orWhere('location', 'like', $s);
            });
        }

        // Facets reflect the searched set before the discrete filters narrow it,
        // so category counts stay steady while a shopper ticks through them.
        $facets = [
            'categories' => $this->facetCounts(clone $q, 'category'),
            'brands' => $this->facetCounts(clone $q, 'brand'),
            'locations' => $this->facetCounts(clone $q, 'location'),
            'priceRange' => $this->priceBounds(clone $q),
        ];

        if (filled($data['category'] ?? null)) {
            $this->whereInLower($q, 'category', $data['category']);
        }
        if (filled($data['brand'] ?? null)) {
            $this->whereInLower($q, 'brand', $data['brand']);
        }
        if (filled($data['location'] ?? null)) {
            // Pipe-separated: "Lekki, Lagos" is one place, not two.
            $this->whereInLower($q, 'location', $data['location'], '|');
        }
        if (isset($data['minPrice'])) {
            $q->where('price', '>=', (float) $data['minPrice']);
        }
        if (isset($data['maxPrice'])) {
            $q->where('price', '<=', (float) $data['maxPrice']);
        }
        if (! empty($data['featured'])) {
            $q->where('featured', true);
        }
        if (! empty($data['discounted'])) {
            $q->whereNotNull('old_price')->whereColumn('old_price', '>', 'price');
        }

        $total = (clone $q)->count();

        $products = $q
            ->orderByRaw(self::SORTS[$data['sort'] ?? 'newest'])
            ->orderByDesc('id')
            ->skip(($page - 1) * $limit)
            ->take($limit)
            ->get();

        return $this->jsonOk([
            'products' => $products,
            'facets' => $facets,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int) ceil($total / $limit),
            ],
        ]);
    }

    /** @return array{min: float|null, max: float|null} */
    private function priceBounds($base): array
    {
        $bounds = $base->selectRaw('min(price) as low, max(price) as high')->first();

        return [
            'min' => $bounds && $bounds->low !== null ? (float) $bounds->low : null,
            'max' => $bounds && $bounds->high !== null ? (float) $bounds->high : null,
        ];
    }

    public function subscribe(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'productName' => 'nullable|string',
            'productCategory' => 'nullable|string',
            'productId' => 'nullable|integer',
        ]);

        $exists = Subscriber::query()->where('email', $data['email'])->exists();
        if ($exists) {
            return $this->jsonOk(null, 'You are already subscribed!');
        }

        Subscriber::create([
            'email' => $data['email'],
            'product_name' => $data['productName'] ?? null,
            'product_category' => $data['productCategory'] ?? null,
            'product_id' => $data['productId'] ?? null,
        ]);

        return $this->jsonOk(null, 'Subscribed successfully!');
    }

    public function tipperDrivers()
    {
        $drivers = User::query()
            ->where('role', 'TIPPER_DRIVER')
            ->where('is_verified', true)
            ->orderByDesc('created_at')
            ->get(['id', 'full_name', 'phone', 'whatsapp', 'avatar_url', 'artisan_location', 'created_at']);

        return $this->jsonOk(['drivers' => $drivers]);
    }

    /**
     * Local artisans directory — users with role=ARTISAN. Mirrors tipperDrivers.
     */
    public function localArtisans()
    {
        $artisans = User::query()
            ->where('role', 'ARTISAN')
            ->where('is_verified', true)
            ->orderByDesc('created_at')
            ->get(['id', 'full_name', 'phone', 'whatsapp', 'avatar_url', 'artisan_location', 'artisan_service', 'artisan_rating', 'created_at']);

        return $this->jsonOk(['artisans' => $artisans]);
    }

    /**
     * A seeker expresses interest in a marketplace product. Creates a
     * notification for the product owner so they know somebody wants it.
     * Idempotent within 24h — a seeker who taps twice doesn't spam the owner.
     */
    public function interest(Request $request, string $id)
    {
        $product = MarketplaceProduct::query()->find($id);
        if (! $product) {
            return $this->jsonErr('Product not found', 404);
        }

        $seeker = $request->user();
        if ($product->user_id === $seeker->id) {
            return $this->jsonErr('You cannot express interest in your own listing.', 422);
        }

        $oneDayAgo = now()->subDay();
        $recent = Notification::where('user_id', $product->user_id)
            ->where('type', 'product_interest')
            ->where('created_at', '>=', $oneDayAgo)
            ->whereJsonContains('data->productId', (int) $product->id)
            ->whereJsonContains('data->seekerId', (int) $seeker->id)
            ->first();

        $payload = [
            'productId'   => (int) $product->id,
            'productName' => $product->name,
            'seekerId'    => (int) $seeker->id,
            'seekerName'  => $seeker->full_name,
            'seekerEmail' => $seeker->email,
            'seekerPhone' => $seeker->phone,
        ];

        if (! $recent) {
            // 1. Notify the listing owner (DB + email)
            NotifyUser::send(
                user: (int) $product->user_id,
                type: 'product_interest',
                title: "{$seeker->full_name} is interested in your listing",
                body: "{$seeker->full_name} just expressed interest in \"{$product->name}\". Reach out via: " . ($seeker->phone ?: $seeker->email),
                data: $payload,
                ctaUrl: rtrim(config('app.url', ''), '/') . '/notifications',
                ctaLabel: 'View on ShelTrify',
            );

            // 2. Also notify every admin so they can track all platform activity
            User::query()->where('role', 'ADMIN')->get()->each(function ($admin) use ($seeker, $product, $payload) {
                NotifyUser::send(
                    user: $admin,
                    type: 'product_interest_admin',
                    title: "New interest: {$seeker->full_name} → \"{$product->name}\"",
                    body: "Seeker {$seeker->full_name} (" . ($seeker->phone ?: $seeker->email) . ") is interested in \"{$product->name}\" listed by user #{$product->user_id}.",
                    data: $payload,
                );
            });
        }

        // Build a WhatsApp deep link the frontend can open immediately —
        // works even when the seller is offline / not logged in.
        $ownerPhone = '';
        if ($product->relationLoaded('user') === false) {
            $product->load('user:id,phone,whatsapp,full_name');
        }
        $ownerPhone = $product->user?->whatsapp ?: $product->user?->phone ?: '';
        $whatsapp   = preg_replace('/[^\d+]/', '', $ownerPhone);
        $waMessage  = "Hi, I'm {$seeker->full_name}. I'm interested in your listing \"{$product->name}\" on ShelTrify. My phone: " . ($seeker->phone ?: 'see email ' . $seeker->email);
        $waUrl      = $whatsapp
            ? 'https://wa.me/' . ltrim($whatsapp, '+') . '?text=' . rawurlencode($waMessage)
            : null;

        return $this->jsonOk(
            ['whatsappUrl' => $waUrl, 'ownerPhone' => $ownerPhone],
            'Your interest has been sent. The seller will contact you soon.'
        );
    }

    public function byCategory(string $category)
    {
        $products = MarketplaceProduct::query()->with(['user:id,email,full_name,avatar_url'])
            ->where('category', $category)->where('is_active', true)->where('is_approved', true)
            ->orderByDesc('created_at')->get();

        return $this->jsonOk($products);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0.01',
            'oldPrice' => 'nullable|numeric|min:0.01',
            'category' => 'required|string',
            'location' => 'nullable|string|max:160',
            'imageUrl' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'string',
            'videoUrl' => 'nullable|string',
            'videos' => 'nullable|array',
            'videos.*' => 'string',
        ]);

        $p = MarketplaceProduct::create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'old_price' => $data['oldPrice'] ?? null,
            'category' => $data['category'],
            'location' => $data['location'] ?? null,
            'image_url' => $data['imageUrl'] ?? null,
            'images' => $data['images'] ?? null,
            'video_url' => $data['videoUrl'] ?? null,
            'videos' => $data['videos'] ?? null,
            'is_active' => false,
            'is_approved' => false,
        ]);
        $p->load(['user:id,email,full_name,avatar_url']);

        return $this->jsonOk($p, 'Product created successfully', 201);
    }

    public function myProducts(Request $request)
    {
        $products = MarketplaceProduct::query()->where('user_id', $request->user()->id)->orderByDesc('created_at')->get();

        return $this->jsonOk($products);
    }

    public function update(Request $request, string $id)
    {
        $p = MarketplaceProduct::query()->find($id);
        if (! $p) {
            return $this->jsonErr('Product not found', 404);
        }
        if ((string) $p->user_id !== (string) $request->user()->id) {
            return $this->jsonErr('You can only update your own products', 403);
        }
        $data = $request->validate([
            'name' => 'sometimes|string',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0.01',
            'oldPrice' => 'nullable|numeric|min:0.01',
            'category' => 'sometimes|string',
            'location' => 'nullable|string|max:160',
            'imageUrl' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'string',
            'videoUrl' => 'nullable|string',
            'videos' => 'nullable|array',
            'videos.*' => 'string',
        ]);
        $map = ['name' => 'name', 'description' => 'description', 'price' => 'price', 'oldPrice' => 'old_price', 'category' => 'category', 'location' => 'location', 'imageUrl' => 'image_url', 'images' => 'images', 'videoUrl' => 'video_url', 'videos' => 'videos'];
        $u = [];
        foreach ($map as $k => $col) {
            if (array_key_exists($k, $data)) {
                $u[$col] = $data[$k];
            }
        }
        $p->update($u);
        $p->load(['user:id,email,full_name,avatar_url']);

        return $this->jsonOk($p, 'Product updated successfully');
    }

    public function destroy(Request $request, string $id)
    {
        $p = MarketplaceProduct::query()->find($id);
        if (! $p) {
            return $this->jsonErr('Product not found', 404);
        }
        if ((string) $p->user_id !== (string) $request->user()->id) {
            return $this->jsonErr('You can only delete your own products', 403);
        }
        $p->delete();

        return $this->jsonOk(null, 'Product deleted successfully');
    }
}
