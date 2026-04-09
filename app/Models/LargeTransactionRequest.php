<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LargeTransactionRequest extends Model
{
    use SerializesCamelCase;

    protected $fillable = [
        'user_id', 'amount', 'cart_items', 'customer_name', 'customer_email',
        'customer_phone', 'customer_address', 'status', 'admin_notes', 'processed_by', 'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'cart_items' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
