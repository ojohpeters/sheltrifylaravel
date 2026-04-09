<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Wallet extends Model
{
    use SerializesCamelCase;

    protected $fillable = [
        'user_id', 'swc_balance', 'credibility_score', 'tier', 'referrals',
    ];

    protected function casts(): array
    {
        return [
            'swc_balance' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
