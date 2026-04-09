<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeelsVideo extends Model
{
    use SerializesCamelCase;

    protected $table = 'feels_videos';

    protected $fillable = [
        'video_url', 'caption', 'music', 'likes', 'comments', 'shares', 'user_id', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function commentRecords(): HasMany
    {
        return $this->hasMany(FeelsVideoComment::class, 'feels_video_id');
    }
}
