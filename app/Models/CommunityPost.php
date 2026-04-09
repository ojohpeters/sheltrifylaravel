<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunityPost extends Model
{
    use SerializesCamelCase;

    protected $fillable = [
        'user_id', 'title', 'content', 'category', 'image_url', 'video_url',
        'likes', 'loves', 'reposts', 'replies',
    ];

    protected $hidden = ['comments_count'];

    public function toArray(): array
    {
        if (! array_key_exists('comments_count', $this->attributes)) {
            $this->loadCount('comments');
        }
        $arr = $this->camelizeArray(array_merge(
            $this->attributesToArray(),
            $this->relationsToArray()
        ));
        unset($arr['commentsCount']);
        $arr['_count'] = ['comments' => (int) ($this->comments_count ?? 0)];

        return $arr;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(CommunityComment::class, 'post_id');
    }
}
