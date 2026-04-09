<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardApiController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user()->load([
            'wallet',
            'listings' => fn ($q) => $q->where('is_active', true),
            'marketplaceProducts' => fn ($q) => $q->where('is_active', true),
            'referrals' => fn ($q) => $q->where('status', 'completed'),
        ]);

        $totalEarnings = 0;
        $activeListings = 0;
        $totalViews = 0;
        $totalSales = 0;

        if (in_array($user->role, ['LANDLORD', 'AGENT'], true)) {
            $activeListings = $user->listings->count();
            $totalEarnings = $user->listings->count() * 100000;
        }
        if ($user->role === 'ARTISAN') {
            $totalEarnings = $user->artisan_rating * 5000;
        }
        if ($user->role === 'REFERRER') {
            $totalEarnings = $user->referrals->sum('reward_earned');
        }
        $marketplaceEarnings = $user->marketplaceProducts->count() * 5000;
        $totalEarnings += $marketplaceEarnings;
        $totalSales = $user->marketplaceProducts->count();

        return $this->jsonOk([
            'user' => [
                'id' => $user->id,
                'fullName' => $user->full_name,
                'email' => $user->email,
                'role' => $user->role,
                'avatarUrl' => $user->avatar_url,
                'isPremium' => $user->is_premium,
                'isVerified' => $user->is_verified,
                'artisanService' => $user->artisan_service,
                'artisanRating' => $user->artisan_rating,
            ],
            'stats' => [
                'totalEarnings' => $totalEarnings,
                'activeListings' => $activeListings,
                'totalViews' => $totalViews,
                'totalSales' => $totalSales,
                'walletBalance' => $user->wallet?->swc_balance ?? 0,
                'swcBalance' => $user->wallet?->swc_balance ?? 0,
                'referrals' => $user->referrals->count(),
                'credibilityScore' => $user->wallet?->credibility_score ?? 0,
                'tier' => $user->wallet?->tier ?? 'bronze',
            ],
            'listings' => $user->listings->map(fn ($l) => [
                'id' => $l->id,
                'title' => $l->title,
                'price' => $l->price,
                'location' => $l->location,
                'isActive' => $l->is_active,
                'createdAt' => $l->created_at?->toIso8601String(),
            ]),
            'marketplaceProducts' => $user->marketplaceProducts->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => $p->price,
                'category' => $p->category,
                'isActive' => $p->is_active,
                'createdAt' => $p->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function earnings(Request $request)
    {
        $user = $request->user()->load(['wallet', 'referrals' => fn ($q) => $q->where('status', 'completed')->orderByDesc('created_at')]);
        $history = $user->referrals->map(fn ($r) => [
            'id' => $r->id,
            'type' => 'referral',
            'amount' => $r->reward_earned,
            'description' => 'Referral reward',
            'date' => $r->created_at?->toIso8601String(),
        ]);

        return $this->jsonOk([
            'totalEarnings' => $history->sum('amount'),
            'earningsHistory' => $history,
            'walletBalance' => $user->wallet?->swc_balance ?? 0,
        ]);
    }
}
