<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarketplaceProduct extends Model
{
    use SerializesCamelCase;

    protected $table = 'marketplace_products';

    protected $fillable = [
        'user_id', 'name', 'description', 'price', 'old_price', 'category',
        'image_url', 'video_url', 'is_active', 'is_approved', 'approved_at', 'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'old_price' => 'float',
            'is_active' => 'boolean',
            'is_approved' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(Cart::class, 'product_id');
    }
}
