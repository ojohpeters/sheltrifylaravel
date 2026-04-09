<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InvestmentOpportunity extends Model
{
    use SerializesCamelCase;

    protected $table = 'investment_opportunities';

    protected $hidden = ['investments_count'];

    protected $fillable = [
        'title', 'description', 'type', 'min_investment', 'max_investment', 'expected_roi',
        'duration', 'status', 'image_url', 'total_raised', 'target_amount',
    ];

    protected function casts(): array
    {
        return [
            'min_investment' => 'float',
            'max_investment' => 'float',
            'expected_roi' => 'float',
            'total_raised' => 'float',
            'target_amount' => 'float',
        ];
    }

    public function toArray(): array
    {
        if (! array_key_exists('investments_count', $this->attributes)) {
            $this->loadCount('investments');
        }
        $arr = $this->camelizeArray(array_merge(
            $this->attributesToArray(),
            $this->relationsToArray()
        ));
        unset($arr['investmentsCount']);
        $arr['_count'] = ['investments' => (int) ($this->investments_count ?? 0)];

        return $arr;
    }

    public function investments(): HasMany
    {
        return $this->hasMany(Investment::class, 'opportunity_id');
    }
}
