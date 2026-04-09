<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\PaymentTransaction;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PaymentApiController extends Controller
{
    protected function paystack(): ?\Illuminate\Http\Client\PendingRequest
    {
        $secret = config('services.paystack.secret');
        if (! $secret) {
            return null;
        }

        return Http::baseUrl('https://api.paystack.co')->withToken($secret)->acceptJson();
    }

    public function initialize(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:1']);
        $client = $this->paystack();
        if (! $client) {
            return $this->jsonErr('Payment gateway not configured. Please contact support.', 500);
        }
        $user = $request->user();
        $amountKobo = (int) round($request->amount * 100);
        $res = $client->post('/transaction/initialize', [
            'email' => $user->email,
            'amount' => $amountKobo,
            'currency' => config('services.paystack.currency', 'NGN'),
            'callback_url' => config('services.paystack.callback_url', url('/payments/verify')),
            'metadata' => array_replace(
                ['type' => 'wallet_deposit'],
                (array) $request->input('metadata', []),
                ['userId' => (string) $user->id]
            ),
        ]);
        if (! $res->json('status')) {
            return $this->jsonErr($res->json('message') ?? 'Failed to initialize payment', 400);
        }

        $d = $res->json('data');

        return $this->jsonOk([
            'authorizationUrl' => $d['authorization_url'],
            'accessCode' => $d['access_code'],
            'reference' => $d['reference'],
        ]);
    }

    public function verify(string $reference)
    {
        $existing = PaymentTransaction::query()->where('reference', $reference)->first();
        if ($existing && $existing->status === 'completed') {
            $wallet = Wallet::query()->where('user_id', $existing->user_id)->first();

            return $this->jsonOk([
                'reference' => $reference,
                'amount' => $existing->amount,
                'swcAdded' => $existing->swc_amount,
                'newBalance' => $wallet?->swc_balance ?? 0,
            ], 'Payment already verified');
        }

        $client = $this->paystack();
        if (! $client) {
            return $this->jsonErr('Payment gateway not configured', 500);
        }
        $res = $client->get("/transaction/verify/{$reference}");
        if (! $res->json('status')) {
            return $this->jsonErr('Payment verification failed', 400);
        }
        $tx = $res->json('data');
        if (($tx['status'] ?? '') !== 'success') {
            return $this->jsonErr('Payment not successful', 400);
        }
        $userId = $tx['metadata']['userId'] ?? null;
        if (! $userId) {
            return $this->jsonErr('User ID not found in transaction metadata', 400);
        }
        $amount = ($tx['amount'] ?? 0) / 100;
        $type = $tx['metadata']['type'] ?? 'wallet_deposit';

        $wallet = Wallet::query()->firstOrCreate(['user_id' => $userId], ['swc_balance' => 0, 'tier' => 'bronze']);
        $swcAmount = 0;
        if ($type === 'wallet_deposit') {
            $swcAmount = $amount;
            $wallet->increment('swc_balance', $swcAmount);
        }
        PaymentTransaction::query()->updateOrCreate(
            ['reference' => $reference],
            [
                'user_id' => $userId,
                'amount' => $amount,
                'swc_amount' => $swcAmount,
                'type' => $type,
                'status' => 'completed',
                'paystack_data' => json_encode($tx),
            ]
        );
        if ($type === 'marketplace_checkout') {
            Cart::query()->where('user_id', $userId)->delete();
        }
        $wallet->refresh();

        return $this->jsonOk([
            'reference' => $reference,
            'amount' => $amount,
            'swcAdded' => $type === 'marketplace_checkout' ? 0 : $swcAmount,
            'newBalance' => $wallet->swc_balance,
            'type' => $type,
        ], $type === 'marketplace_checkout' ? 'Payment verified and order placed' : 'Payment verified and wallet updated');
    }

    public function withdraw(Request $request)
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:1',
            'bankCode' => 'required|string',
            'accountNumber' => 'required|string',
            'accountName' => 'required|string',
        ]);
        $wallet = Wallet::query()->where('user_id', $request->user()->id)->first();
        if (! $wallet || $wallet->swc_balance < $data['amount']) {
            return $this->jsonErr('Insufficient balance', 400);
        }
        $user = $request->user();
        if (in_array($user->role, ['REFERRER', 'AGENT'], true) && $wallet->referrals < 2) {
            return $this->jsonErr('Wallet is dormant. Refer at least 2 users to activate withdrawal.', 400);
        }
        $client = $this->paystack();
        if (! $client) {
            return $this->jsonErr('Payment gateway not configured', 500);
        }
        $ngn = $data['amount'] * 90;
        $kobo = (int) round($ngn * 100);
        $rec = $client->post('/transferrecipient', [
            'type' => 'nuban',
            'name' => $data['accountName'],
            'account_number' => $data['accountNumber'],
            'bank_code' => $data['bankCode'],
            'currency' => 'NGN',
        ]);
        if (! $rec->json('status')) {
            return $this->jsonErr('Failed to create transfer recipient', 400);
        }
        $tr = $client->post('/transfer', [
            'source' => 'balance',
            'amount' => $kobo,
            'recipient' => $rec->json('data.recipient_code'),
            'reason' => 'ShelTrify Wallet Withdrawal',
        ]);
        if (! $tr->json('status')) {
            return $this->jsonErr($tr->json('message') ?? 'Failed to process withdrawal', 400);
        }
        $wallet->decrement('swc_balance', $data['amount']);

        return $this->jsonOk([
            'transferCode' => $tr->json('data.transfer_code'),
            'amount' => $data['amount'],
            'ngnAmount' => $ngn,
            'newBalance' => $wallet->fresh()->swc_balance,
        ], 'Withdrawal processed successfully');
    }

    public function banks()
    {
        $client = $this->paystack();
        if (! $client) {
            return $this->jsonErr('Payment gateway not configured', 500);
        }
        $res = $client->get('/bank', ['country' => 'nigeria']);
        if (! $res->json('status')) {
            return $this->jsonErr('Failed to fetch banks', 400);
        }

        return $this->jsonOk($res->json('data'));
    }
}
