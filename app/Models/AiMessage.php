<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiMessage extends Model
{
    use SerializesCamelCase;

    protected $fillable = ['conversation_id', 'role', 'content', 'intent', 'result_metadata'];

    protected function casts(): array
    {
        return [
            'intent'          => 'array',
            'result_metadata' => 'array',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AiConversation::class, 'conversation_id');
    }
}
