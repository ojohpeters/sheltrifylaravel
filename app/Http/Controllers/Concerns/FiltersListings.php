<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Support\Facades\DB;

/**
 * Shared pieces of the browse endpoints (listings, marketplace).
 *
 * Both take the same shape of request — free text, comma-separated multi-selects,
 * ranges — and both answer with facets so the filter UI can offer only values
 * that exist in the data.
 */
trait FiltersListings
{
    /**
     * Value/count pairs for one column, ordered by how common they are.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $base
     * @return array<int, array{value: string, count: int}>
     */
    protected function facetCounts($base, string $column): array
    {
        return (clone $base)
            ->select($column, DB::raw('count(*) as aggregate'))
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->groupBy($column)
            ->orderByDesc('aggregate')
            ->get()
            ->map(fn ($row) => ['value' => (string) $row->{$column}, 'count' => (int) $row->aggregate])
            ->values()
            ->all();
    }

    /**
     * Case-insensitive IN over a comma-separated client value, so "duplex" and
     * "Duplex" select the same listings whatever case the data was saved in.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $q
     */
    protected function whereInLower($q, string $column, ?string $csv): void
    {
        $values = array_map('strtolower', $this->csv($csv));

        if ($values === []) {
            return;
        }

        $q->whereRaw(
            'lower('.$column.') in ('.implode(',', array_fill(0, count($values), '?')).')',
            $values
        );
    }

    /** @return string[] */
    protected function csv(?string $raw): array
    {
        return array_values(array_filter(array_map('trim', explode(',', (string) $raw)), 'strlen'));
    }

    /** Wildcards typed by a user are literal text, not operators. */
    protected function escapeLike(string $value): string
    {
        return addcslashes($value, '%_\\');
    }
}
