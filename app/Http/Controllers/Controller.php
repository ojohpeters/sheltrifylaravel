<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

abstract class Controller
{
    protected function jsonOk(mixed $data = null, ?string $message = null, int $status = 200): JsonResponse
    {
        return response()->json(array_filter([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], fn ($v) => $v !== null), $status);
    }

    protected function jsonErr(string $message, int $status = 400, mixed $extra = null): JsonResponse
    {
        $body = ['success' => false, 'message' => $message];
        if (is_array($extra)) {
            $body = array_merge($body, $extra);
        }

        return response()->json($body, $status);
    }
}
