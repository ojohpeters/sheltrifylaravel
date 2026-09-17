<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use App\Support\MatchKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VacatingSoonListing extends Model
{
    use SerializesCamelCase;

    protected $fillable = [
        'user_id', 'captured_by', 'listing_id', 'address', 'state', 'lga', 'area',
        'apartment_type', 'rent_amount', 'vacate_date', 'reason', 'contact_name',
        'whatsapp', 'image_url', 'status', 'admin_notes',
    ];

    /**
     * The column default only reaches the row, not the instance in hand — so
     * a freshly created flat read back its own status as null and isOpen()
     * said no, which meant the matcher skipped every new capture silently.
     */
    protected $attributes = ['status' => 'available'];

    protected function casts(): array
    {
        return [
            'vacate_date' => 'date',
            'rent_amount' => 'float',
        ];
    }

    /** Contact details are revealed through their own endpoint, as on listings. */
    public const PUBLIC_COLUMNS = [
        'id', 'state', 'lga', 'area', 'apartment_type', 'rent_amount',
        'vacate_date', 'status', 'image_url', 'created_at',
    ];

    protected static function booted(): void
    {
        // The comparison keys are derived, never accepted from a client: a
        // forged area_key would put a flat in front of the wrong waitlist.
        static::saving(function (self $row) {
            $row->state_key = MatchKey::make($row->state);
            $row->lga_key = MatchKey::make($row->lga);
            $row->area_key = MatchKey::make($row->area);
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

    /** Still worth telling someone about: not taken, and not already empty. */
    public function isOpen(): bool
    {
        return in_array($this->status, ['available', 'reserved'], true)
            && $this->vacate_date !== null
            && $this->vacate_date->endOfDay()->isFuture();
    }
}
