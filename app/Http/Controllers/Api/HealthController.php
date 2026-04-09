<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
class HealthController extends Controller
{
    public function __invoke()
    {
        try {
            User::query()->limit(1)->count();

            return response()->json([
                'status' => 'ok',
                'message' => 'ShelTrify API is running',
                'timestamp' => now()->toIso8601String(),
                'environment' => config('app.env'),
                'version' => '1.0.0',
                'uptime' => null,
                'database' => 'connected',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'API is running but database connection failed',
                'database' => 'disconnected',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
