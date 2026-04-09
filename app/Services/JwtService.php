<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtService
{
    public function encodeUserId(int|string $userId, string $ttl): string
    {
        $secret = config('jwt.secret');
        $exp = match ($ttl) {
            '24h' => time() + 86400,
            '7d' => time() + 86400 * 7,
            '1h' => time() + 3600,
            default => time() + (int) $ttl,
        };

        $payload = [
            'userId' => (string) $userId,
            'iat' => time(),
            'exp' => $exp,
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }

    public function encodePasswordReset(int|string $userId): string
    {
        $secret = config('jwt.secret');
        $payload = [
            'userId' => (string) $userId,
            'type' => 'password-reset',
            'iat' => time(),
            'exp' => time() + 3600,
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }

    public function decode(string $token): object
    {
        return JWT::decode($token, new Key(config('jwt.secret'), 'HS256'));
    }
}
