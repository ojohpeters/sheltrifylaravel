<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\MarketplaceProduct;
use Illuminate\Http\Request;

class CartApiController extends Controller
{
    public function index(Request $request)
    {
        $items = Cart::query()
            ->where('user_id', $request->user()->id)
            ->with(['product.user:id,email,full_name,phone,avatar_url'])
            ->orderByDesc('created_at')
            ->get();

        $total = $items->sum(fn ($i) => $i->product->price * $i->quantity);

        return $this->jsonOk([
            'items' => $items,
            'total' => $total,
            'itemCount' => $items->count(),
        ]);
    }

    public function store(Request $request, string $productId)
    {
        $quantity = (int) ($request->input('quantity', 1));
        $product = MarketplaceProduct::query()->find($productId);
        if (! $product) {
            return $this->jsonErr('Product not found', 404);
        }
        if (! $product->is_active) {
            return $this->jsonErr('Product is not available', 400);
        }

        $existing = Cart::query()->where('user_id', $request->user()->id)->where('product_id', $productId)->first();
        if ($existing) {
            $existing->update(['quantity' => $existing->quantity + $quantity]);
            $existing->load(['product.user:id,email,full_name,phone,avatar_url']);

            return $this->jsonOk($existing, 'Cart updated');
        }

        $item = Cart::create([
            'user_id' => $request->user()->id,
            'product_id' => $productId,
            'quantity' => $quantity,
        ]);
        $item->load(['product.user:id,email,full_name,phone,avatar_url']);

        return $this->jsonOk($item, 'Added to cart', 201);
    }

    public function update(Request $request, string $productId)
    {
        $quantity = (int) $request->input('quantity');
        if ($quantity < 1) {
            return $this->jsonErr('Quantity must be at least 1', 400);
        }
        $item = Cart::query()->where('user_id', $request->user()->id)->where('product_id', $productId)->first();
        if (! $item) {
            return $this->jsonErr('Cart item not found', 404);
        }
        $item->update(['quantity' => $quantity]);
        $item->load(['product.user:id,email,full_name,phone,avatar_url']);

        return $this->jsonOk($item, 'Cart updated');
    }

    public function destroyItem(Request $request, string $productId)
    {
        $item = Cart::query()->where('user_id', $request->user()->id)->where('product_id', $productId)->first();
        if (! $item) {
            return $this->jsonErr('Cart item not found', 404);
        }
        $item->delete();

        return $this->jsonOk(null, 'Removed from cart');
    }

    public function clear(Request $request)
    {
        Cart::query()->where('user_id', $request->user()->id)->delete();

        return $this->jsonOk(null, 'Cart cleared');
    }
}
