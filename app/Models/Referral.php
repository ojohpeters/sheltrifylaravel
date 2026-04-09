<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Referral extends Model
{
    use SerializesCamelCase;

    protected $fillable = [
        'referrer_id', 'referred_user_id', 'status', 'reward_earned',
    ];

    protected function casts(): array
    {
        return [
            'reward_earned' => 'float',
        ];
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    public function referredUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }
}
