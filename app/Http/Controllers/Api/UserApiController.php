<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserApiController extends Controller
{
    public function profile(Request $request)
    {
        $user = $request->user()->loadCount(['listings', 'favorites'])->load('wallet');

        return $this->jsonOk($user);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'fullName' => 'sometimes|string',
            'phone' => 'sometimes|string',
            'avatarUrl' => 'sometimes|string',
        ]);
        $updates = [];
        if (isset($data['fullName'])) {
            $updates['full_name'] = $data['fullName'];
        }
        if (isset($data['phone'])) {
            $updates['phone'] = $data['phone'];
        }
        if (isset($data['avatarUrl'])) {
            $updates['avatar_url'] = $data['avatarUrl'];
        }
        $request->user()->update($updates);

        return $this->jsonOk($request->user()->fresh()->toArray(), 'Profile updated successfully');
    }

    public function upgradePremium(Request $request)
    {
        $PREMIUM_COST = 15000;
        $user = $request->user()->load('wallet');
        if (! $user->wallet) {
            return $this->jsonErr('Wallet not found. Please contact support.', 400, ['code' => 'WALLET_NOT_FOUND']);
        }
        if ($user->is_premium && $user->premium_expiry_date && $user->premium_expiry_date->isFuture()) {
            return $this->jsonErr('You already have an active premium subscription', 400);
        }
        if ($user->wallet->swc_balance < $PREMIUM_COST) {
            $shortage = $PREMIUM_COST - $user->wallet->swc_balance;

            return $this->jsonErr(
                "Insufficient wallet balance. You need ₦{$PREMIUM_COST} but only have ₦{$user->wallet->swc_balance}. Please fund your wallet with ₦{$shortage} or more.",
                400,
                ['code' => 'INSUFFICIENT_BALANCE', 'currentBalance' => $user->wallet->swc_balance, 'requiredAmount' => $PREMIUM_COST, 'shortage' => $shortage]
            );
        }

        return DB::transaction(function () use ($user, $PREMIUM_COST) {
            $user->wallet->decrement('swc_balance', $PREMIUM_COST);
            $expiry = now()->addMonth();
            $user->update(['is_premium' => true, 'premium_expiry_date' => $expiry]);

            return $this->jsonOk([
                'id' => $user->id,
                'email' => $user->email,
                'isPremium' => true,
                'premiumExpiryDate' => $expiry->toIso8601String(),
                'walletBalance' => $user->wallet->fresh()->swc_balance,
            ], 'Premium upgrade successful');
        });
    }

    public function upgradeChat(Request $request)
    {
        $cost = 2000;
        $user = $request->user()->load('wallet');
        if (! $user->wallet) {
            return $this->jsonErr('Wallet not found. Please contact support.', 400, ['code' => 'WALLET_NOT_FOUND']);
        }
        if ($user->wallet->swc_balance < $cost) {
            $shortage = $cost - $user->wallet->swc_balance;

            return $this->jsonErr(
                "Insufficient wallet balance. You need ₦{$cost} but only have ₦{$user->wallet->swc_balance}. Please fund your wallet with ₦{$shortage} or more.",
                400,
                ['code' => 'INSUFFICIENT_BALANCE', 'currentBalance' => $user->wallet->swc_balance, 'requiredAmount' => $cost, 'shortage' => $shortage]
            );
        }
        $user->wallet->decrement('swc_balance', $cost);

        return $this->jsonOk(['walletBalance' => $user->wallet->fresh()->swc_balance], 'Chat upgrade successful. You can now continue chatting to find accommodation.');
    }

    public function submitVerification(Request $request)
    {
        $data = $request->validate([
            'verificationPhotoUrl' => 'required|string',
            'verificationIdUrl' => 'required|string',
            'verificationIdType' => 'required|string',
        ]);
        $user = $request->user();
        if (! in_array($user->role, ['LANDLORD', 'AGENT'], true)) {
            return $this->jsonErr('Verification is only required for landlords and agents', 400);
        }
        if ($user->is_verified && $user->verification_status === 'approved') {
            return $this->jsonErr('You are already verified', 400);
        }
        $user->update([
            'verification_photo_url' => $data['verificationPhotoUrl'],
            'verification_id_url' => $data['verificationIdUrl'],
            'verification_id_type' => $data['verificationIdType'],
            'verification_status' => 'pending',
            'is_verified' => false,
            'verification_rejected_at' => null,
            'verification_rejection_reason' => null,
            'verified_at' => null,
        ]);

        return $this->jsonOk($user->fresh()->only(['id', 'email', 'verification_status']), 'Verification documents submitted successfully. Please wait for admin review.');
    }
}
