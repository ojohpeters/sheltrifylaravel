<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\MarketplaceProduct;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class StatsApiController extends Controller
{
    /**
     * Public headline counts for the landing page.
     *
     * Real figures, not marketing ones. The page previously advertised
     * "50K+ listings" and "12K+ happy tenants" against a database holding a
     * handful of rows.
     *
     * Cached, because this is the busiest page on the site and these are four
     * COUNT queries that do not need to be exact to the second.
     */
    public function index()
    {
        $stats = Cache::remember('public.stats', now()->addMinutes(10), fn () => [
            'listings' => Listing::query()->where('is_active', true)->count(),
            'artisans' => User::query()->where('role', 'ARTISAN')->where('is_verified', true)->count(),
            'products' => MarketplaceProduct::query()->where('is_active', true)->where('is_approved', true)->count(),
            'members' => User::query()->count(),
        ]);

        return $this->jsonOk(['stats' => $stats]);
    }
}
