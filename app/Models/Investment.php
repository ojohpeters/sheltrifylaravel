<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Investment extends Model
{
    use SerializesCamelCase;

    protected $fillable = [
        'user_id', 'opportunity_id', 'amount', 'status', 'profit_earned', 'roi_percentage', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'profit_earned' => 'float',
            'roi_percentage' => 'float',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(InvestmentOpportunity::class, 'opportunity_id');
    }
}
