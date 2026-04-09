<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Listing;
use Illuminate\Http\Request;

class FavoriteApiController extends Controller
{
    public function index(Request $request)
    {
        $favorites = Favorite::query()
            ->where('user_id', $request->user()->id)
            ->with(['listing.user:id,email,full_name,avatar_url'])
            ->orderByDesc('created_at')
            ->get();

        return $this->jsonOk($favorites->map(fn ($f) => $f->listing)->filter()->values());
    }

    public function store(Request $request, string $listingId)
    {
        $listing = Listing::query()->find($listingId);
        if (! $listing) {
            return $this->jsonErr('Listing not found', 404);
        }
        if (Favorite::query()->where('user_id', $request->user()->id)->where('listing_id', $listingId)->exists()) {
            return $this->jsonErr('Listing already in favorites', 400);
        }
        Favorite::create([
            'user_id' => $request->user()->id,
            'listing_id' => $listingId,
            'created_at' => now(),
        ]);

        return $this->jsonOk(null, 'Added to favorites');
    }

    public function destroy(Request $request, string $listingId)
    {
        Favorite::query()->where('user_id', $request->user()->id)->where('listing_id', $listingId)->delete();

        return $this->jsonOk(null, 'Removed from favorites');
    }
}
