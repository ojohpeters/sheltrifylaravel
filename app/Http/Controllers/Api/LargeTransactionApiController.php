<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LargeTransactionRequest;
use Illuminate\Http\Request;

class LargeTransactionApiController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'cartItems' => 'required|array',
            'cartItems.*.productId' => 'required|string',
            'cartItems.*.quantity' => 'required|integer|min:1',
            'cartItems.*.price' => 'required|numeric|min:0.01',
            'customerName' => 'required|string',
            'customerEmail' => 'required|email',
            'customerPhone' => 'nullable|string',
            'customerAddress' => 'nullable|string',
        ]);

        $req = LargeTransactionRequest::create([
            'user_id' => $request->user()->id,
            'amount' => $data['amount'],
            'cart_items' => $data['cartItems'],
            'customer_name' => $data['customerName'],
            'customer_email' => $data['customerEmail'],
            'customer_phone' => $data['customerPhone'] ?? null,
            'customer_address' => $data['customerAddress'] ?? null,
        ]);
        $req->load(['user:id,email,full_name,phone']);

        return $this->jsonOk($req, 'Your request has been submitted. Our admin team will contact you shortly.', 201);
    }

    public function myRequests(Request $request)
    {
        $rows = LargeTransactionRequest::query()->where('user_id', $request->user()->id)->orderByDesc('created_at')->get();

        return $this->jsonOk($rows);
    }
}
