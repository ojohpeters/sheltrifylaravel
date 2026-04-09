<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListingView extends Model
{
    public $timestamps = false;

    protected $fillable = ['listing_id', 'user_id', 'ip', 'user_agent'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
