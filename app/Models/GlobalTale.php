<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GlobalTale extends Model
{
    use SerializesCamelCase;

    protected $table = 'global_tales';

    protected $fillable = [
        'title', 'content', 'image_url', 'video_url', 'category', 'read_time', 'user_id', 'is_active',
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
}
