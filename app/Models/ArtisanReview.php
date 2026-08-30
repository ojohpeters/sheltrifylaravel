<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArtisanReview extends Model
{
    use HasFactory;

    protected $fillable = ['artisan_id', 'reviewer_id', 'rating', 'comment'];

    protected function casts(): array
    {
        return ['rating' => 'integer'];
    }

    public function artisan(): BelongsTo
    {
        return $this->belongsTo(User::class, 'artisan_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Recompute the artisan's cached rating and review count from the reviews
     * table. Kept denormalised on `users` so the artisan listing does not run
     * an aggregate per row, and recalculated here so the two can never drift.
     */
    public static function refreshAggregates(int $artisanId): void
    {
        $stats = static::query()
            ->where('artisan_id', $artisanId)
            ->selectRaw('COUNT(*) AS c, AVG(rating) AS avg')
            ->first();

        // 0 rather than null when there are no reviews: users.artisan_rating is
        // NOT NULL, so writing null throws the moment an artisan's last review
        // is removed. The UI keys off artisan_reviews_count to decide whether a
        // rating is meaningful, so 0 reads as "unrated", not "rated zero".
        User::query()->whereKey($artisanId)->update([
            'artisan_reviews_count' => (int) ($stats->c ?? 0),
            'artisan_rating' => $stats && $stats->c > 0 ? round((float) $stats->avg, 2) : 0,
        ]);
    }
}
