<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use App\Support\MatchKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WaitlistEntry extends Model
{
    use SerializesCamelCase;

    protected $fillable = [
        'user_id', 'full_name', 'whatsapp', 'email', 'state', 'lga', 'areas',
        'apartment_type', 'budget_min', 'budget_max', 'move_in_date', 'status',
        'last_notified_at',
    ];

    protected function casts(): array
    {
        return [
            'areas' => 'array',
            'area_keys' => 'array',
            'budget_min' => 'float',
            'budget_max' => 'float',
            'move_in_date' => 'date',
            'last_notified_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (self $row) {
            $row->state_key = MatchKey::make($row->state);
            $row->lga_key = MatchKey::make($row->lga);

            $keys = array_values(array_filter(array_map(
                fn ($area) => MatchKey::make($area),
                is_array($row->areas) ? $row->areas : [],
            ), 'strlen'));

            $row->area_keys = array_values(array_unique($keys));
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(VacatingMatch::class);
    }
}
