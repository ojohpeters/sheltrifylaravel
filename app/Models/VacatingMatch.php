<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VacatingMatch extends Model
{
    use SerializesCamelCase;

    protected $fillable = [
        'vacating_soon_listing_id', 'waitlist_entry_id', 'notified_at', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return ['notified_at' => 'datetime'];
    }

    public function vacating(): BelongsTo
    {
        return $this->belongsTo(VacatingSoonListing::class, 'vacating_soon_listing_id');
    }

    public function waitlistEntry(): BelongsTo
    {
        return $this->belongsTo(WaitlistEntry::class, 'waitlist_entry_id');
    }
}
