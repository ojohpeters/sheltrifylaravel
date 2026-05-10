<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ListingView;

class Listing extends Model
{
    use SerializesCamelCase;

    protected $fillable = [
        'user_id', 'title', 'slug', 'description', 'price', 'location', 'state', 'city',
        'lat', 'lng', 'bedrooms', 'bathrooms', 'property_type', 'listing_type', 'status',
        'image_url', 'video_url', 'images', 'videos', 'amenities', 'tags', 'furnished', 'parking',
        'landlord_name', 'landlord_email', 'landlord_phone',
        'is_active', 'is_boosted', 'boosted_until', 'boosted_at', 'boost_cost',
        'views_count', 'contact_views',
    ];

    protected function casts(): array
    {
        return [
            'amenities'     => 'array',
            'tags'          => 'array',
            'images'        => 'array',
            'videos'        => 'array',
            'is_active'     => 'boolean',
            'is_boosted'    => 'boolean',
            'furnished'     => 'boolean',
            'parking'       => 'boolean',
            'boosted_until' => 'datetime',
            'boosted_at'    => 'datetime',
            'boost_cost'    => 'float',
            'lat'           => 'float',
            'lng'           => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function views(): HasMany
    {
        return $this->hasMany(ListingView::class);
    }
}
