<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceProduct;
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

    public function tipperDrivers()
    {
        $drivers = User::query()
            ->where('role', 'TIPPER_DRIVER')
            ->where('is_verified', true)
            ->orderByDesc('created_at')
            ->get(['id', 'full_name', 'phone', 'whatsapp', 'avatar_url', 'artisan_location', 'created_at']);

        return $this->jsonOk(['drivers' => $drivers]);
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
            'videoUrl' => 'nullable|string',
        ]);

        $p = MarketplaceProduct::create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'old_price' => $data['oldPrice'] ?? null,
            'category' => $data['category'],
            'image_url' => $data['imageUrl'] ?? null,
            'video_url' => $data['videoUrl'] ?? null,
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
            'videoUrl' => 'nullable|string',
        ]);
        $map = ['name' => 'name', 'description' => 'description', 'price' => 'price', 'oldPrice' => 'old_price', 'category' => 'category', 'imageUrl' => 'image_url', 'videoUrl' => 'video_url'];
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
