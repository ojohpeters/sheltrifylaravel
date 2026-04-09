<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;

class Artisan extends Model
{
    use SerializesCamelCase;

    protected $fillable = [
        'name', 'service', 'email', 'phone', 'location', 'avatar_url', 'rating', 'is_verified',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'float',
            'is_verified' => 'boolean',
        ];
    }
}
