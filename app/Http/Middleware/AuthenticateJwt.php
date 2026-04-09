<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateJwt
{
    public function __construct(protected JwtService $jwt) {}

    public function handle(Request $request, Closure $next): Response
    {
        $auth = $request->header('Authorization');
        $token = $auth && str_starts_with($auth, 'Bearer ') ? substr($auth, 7) : null;

        if (! $token) {
            return response()->json(['success' => false, 'message' => 'Access token required'], 401);
        }

        try {
            $decoded = $this->jwt->decode($token);
            $userId = $decoded->userId ?? null;
            if (! $userId) {
                return response()->json(['success' => false, 'message' => 'Invalid token'], 401);
            }
            $user = User::query()->find($userId);
            if (! $user) {
                return response()->json(['success' => false, 'message' => 'User not found'], 401);
            }
            $request->attributes->set('userId', (string) $user->id);
            $request->attributes->set('authUser', $user);
            $request->setUserResolver(fn () => $user);
        } catch (ExpiredException) {
            return response()->json(['success' => false, 'message' => 'Token expired'], 401);
        } catch (SignatureInvalidException|\UnexpectedValueException|\DomainException) {
            return response()->json(['success' => false, 'message' => 'Invalid token'], 401);
        } catch (\Throwable) {
            return response()->json(['success' => false, 'message' => 'Authentication error'], 500);
        }

        return $next($request);
    }
}
