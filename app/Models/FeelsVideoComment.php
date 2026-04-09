<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeelsVideoComment extends Model
{
    use SerializesCamelCase;

    protected $table = 'feels_video_comments';

    public $timestamps = false;

    const UPDATED_AT = null;

    protected $fillable = ['text', 'feels_video_id', 'user_id', 'created_at'];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function feelsVideo(): BelongsTo
    {
        return $this->belongsTo(FeelsVideo::class, 'feels_video_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
