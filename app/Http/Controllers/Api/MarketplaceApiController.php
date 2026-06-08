<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceProduct;
use App\Models\Notification;
use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Http\Request;

class MarketplaceApiController extends Controller
{
    public function index(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = max(1, min(200, (int) $request->query('limit', 50)));
        $q = MarketplaceProduct::query()->with(['user:id,email,full_name,avatar_url'])
            ->where('is_active', true)->where('is_approved', true);
        if ($request->filled('category')) {
            $q->where('category', $request->query('category'));
        }
        $total = (clone $q)->count();
        $products = $q->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return $this->jsonOk([
            'products' => $products,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int) ceil($total / $limit),
            ],
        ]);
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

        if (! $recent) {
            Notification::create([
                'user_id' => $product->user_id,
                'type'    => 'product_interest',
                'title'   => "{$seeker->full_name} is interested in your listing",
                'body'    => "{$seeker->full_name} just expressed interest in \"{$product->name}\". Reach out: " . ($seeker->phone ?: $seeker->email),
                'data'    => [
                    'productId'    => (int) $product->id,
                    'productName'  => $product->name,
                    'seekerId'     => (int) $seeker->id,
                    'seekerName'   => $seeker->full_name,
                    'seekerEmail'  => $seeker->email,
                    'seekerPhone'  => $seeker->phone,
                ],
            ]);
        }

        return $this->jsonOk(null, 'Your interest has been sent. The seller will contact you soon.');
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
            'imageUrl' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'string',
            'videoUrl' => 'nullable|string',
            'videos' => 'nullable|array',
            'videos.*' => 'string',
        ]);
        $map = ['name' => 'name', 'description' => 'description', 'price' => 'price', 'oldPrice' => 'old_price', 'category' => 'category', 'imageUrl' => 'image_url', 'images' => 'images', 'videoUrl' => 'video_url', 'videos' => 'videos'];
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
