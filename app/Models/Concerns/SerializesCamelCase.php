<?php

namespace App\Models\Concerns;

use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

trait SerializesCamelCase
{
    public function toArray(): array
    {
        return $this->camelizeArray(parent::toArray());
    }

    protected function camelizeArray(mixed $data): mixed
    {
        if ($data instanceof Carbon) {
            return $data->toIso8601String();
        }
        if ($data instanceof \DateTimeInterface) {
            return $data->format('c');
        }
        if (is_array($data)) {
            $out = [];
            foreach ($data as $k => $v) {
                $key = is_string($k) && str_starts_with($k, '_')
                    ? $k
                    : (is_string($k) ? Str::camel($k) : $k);
                $out[$key] = $k === '_count' && is_array($v)
                    ? $v
                    : $this->camelizeArray($v);
            }

            return $out;
        }
        if (is_object($data) && method_exists($data, 'toArray')) {
            return $this->camelizeArray($data->toArray());
        }

        return $data;
    }
}
