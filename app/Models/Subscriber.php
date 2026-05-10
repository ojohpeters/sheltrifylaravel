<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;

class Subscriber extends Model
{
    use SerializesCamelCase;

    protected $fillable = [
        'email',
        'product_name',
        'product_category',
        'product_id',
    ];
}
