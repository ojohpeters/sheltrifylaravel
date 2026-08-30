<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use App\Models\User;
use App\Models\Wallet;
use App\Services\JwtService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AuthApiController extends Controller
{
    public function __construct(protected JwtService $jwt) {}

    public function signup(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'fullName' => 'required|string|min:2',
            'phone' => 'nullable|string',
            'whatsapp' => 'nullable|string',
            'role' => 'nullable|string',
            'avatarUrl' => 'nullable|string',
            'artisanService' => 'nullable|string',
            'artisanLocation' => 'nullable|string',
            'artisanBio' => 'nullable|string',
            'referralCode' => 'nullable|string|max:32',
        ]);

        $role = $data['role'] ?? 'SEEKER';

        $user = User::create([
            'email' => $data['email'],
            'password' => $data['password'],
            'full_name' => $data['fullName'],
            'phone' => $data['phone'] ?? null,
            'whatsapp' => $data['whatsapp'] ?? null,
            'role' => $role,
            'avatar_url' => $data['avatarUrl'] ?? null,
            // Transport/logistics providers (TIPPER_DRIVER) reuse these columns to
            // store their service category, so the guard covers both roles.
            'artisan_service' => in_array($role, ['ARTISAN', 'TIPPER_DRIVER'], true)
                ? ($data['artisanService'] ?? null)
                : null,
            'artisan_location' => $data['artisanLocation'] ?? null,
            'artisan_bio' => $data['artisanBio'] ?? null,
            'referral_code' => User::generateReferralCode(),
        ]);

        Wallet::create([
            'user_id' => $user->id,
            'swc_balance' => 11,
            'tier' => 'bronze',
        ]);

        $this->attachReferrer($user, $data['referralCode'] ?? null);

        Auth::login($user);
        $request->session()->regenerate();

        $user = $user->fresh();

        return $this->jsonOk([
            'user' => $user->toArray(),
            'token' => 'session',
        ], 'User created successfully', 201);
    }

    /**
     * Credit the referrer who introduced this user, if any.
     *
     * Failures here are logged and swallowed: a bad or stale referral code must
     * never cost somebody their registration, which has already succeeded by
     * this point. `referrals.referred_user_id` is unique, so a user can only
     * ever be attributed to one referrer.
     */
    private function attachReferrer(User $user, ?string $code): void
    {
        if (blank($code)) {
            return;
        }

        try {
            $referrer = User::query()
                ->where('referral_code', strtoupper(trim($code)))
                ->first();

            // Unknown code, or somebody pasting their own link back into signup.
            if (! $referrer || $referrer->id === $user->id) {
                return;
            }

            Referral::create([
                'referrer_id' => $referrer->id,
                'referred_user_id' => $user->id,
                'status' => 'pending',
                'reward_earned' => 0,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Referral attribution failed', [
                'user_id' => $user->id,
                'code' => $code,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (! Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']])) {
            return $this->jsonErr('Invalid email or password', 401);
        }

        if (Auth::user() && Auth::user()->is_suspended) {
            $reason = Auth::user()->suspension_reason;
            Auth::logout();
            return $this->jsonErr(
                'Your account has been suspended.' . ($reason ? " Reason: {$reason}" : ' Contact support to appeal.'),
                403
            );
        }

        $request->session()->regenerate();

        return $this->jsonOk([
            'user' => Auth::user()->toArray(),
            'token' => 'session',
        ], 'Login successful');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->jsonOk(null, 'Logged out');
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('wallet');

        $isPremiumActive = $user->is_premium;
        if ($user->is_premium && $user->premium_expiry_date) {
            $isPremiumActive = $user->premium_expiry_date->isFuture();
            if (! $isPremiumActive) {
                $user->update(['is_premium' => false]);
            }
        }

        $payload = $user->fresh()->load('wallet')->toArray();
        $payload['isPremium'] = $isPremiumActive;

        return $this->jsonOk($payload);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::query()->where('email', $request->email)->first();
        if ($user && app()->environment('local')) {
            $token = $this->jwt->encodePasswordReset($user->id);
            Log::info('Password reset token', ['email' => $user->email, 'token' => $token]);
        }

        return $this->jsonOk(null, 'If an account with that email exists, a password reset link has been sent.');
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'newPassword' => 'required|min:6',
        ]);

        try {
            $decoded = $this->jwt->decode($data['token']);
        } catch (\Throwable) {
            return $this->jsonErr('Invalid or expired reset token', 400);
        }

        if (($decoded->type ?? null) !== 'password-reset') {
            return $this->jsonErr('Invalid token type', 400);
        }

        $userId = $decoded->userId ?? null;
        if (! $userId) {
            return $this->jsonErr('Invalid token', 400);
        }

        $user = User::query()->find($userId);
        if (! $user) {
            return $this->jsonErr('User not found', 404);
        }

        $user->update(['password' => $data['newPassword']]);

        return $this->jsonOk(null, 'Password reset successfully');
    }
}
