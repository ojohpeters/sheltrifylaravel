<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    use SerializesCamelCase;

    protected $fillable = [
        'user_id', 'reference', 'amount', 'swc_amount', 'type', 'status', 'paystack_data',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'swc_amount' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
