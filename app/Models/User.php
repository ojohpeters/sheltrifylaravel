<?php

namespace App\Models;

use App\Models\Concerns\SerializesCamelCase;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\AiConversation;
use App\Models\Investment;
use App\Models\UserActivity;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SerializesCamelCase;

    protected $fillable = [
        'email', 'password', 'full_name', 'phone', 'whatsapp', 'role',
        'is_premium', 'premium_expiry_date', 'is_verified',
        'is_suspended', 'suspended_at', 'suspension_reason',
        'avatar_url',
        'bio', 'referral_code', 'last_seen_at', 'notification_preferences',
        'onboarding_completed', 'chat_enabled',
        'verification_photo_url', 'verification_id_url', 'verification_id_type',
        'verification_status', 'verification_rejected_at', 'verification_rejection_reason',
        'verified_at', 'artisan_service', 'artisan_location', 'artisan_rating', 'artisan_bio',
        'nin_number', 'nin_verified',
        'listing_approval_status', 'listing_approval_rejection_reason', 'listing_approved_at',
        'professional_license_url', 'professional_type',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'is_premium'               => 'boolean',
            'is_verified'              => 'boolean',
            'is_suspended'             => 'boolean',
            'suspended_at'             => 'datetime',
            'nin_verified'             => 'boolean',
            'onboarding_completed'     => 'boolean',
            'chat_enabled'             => 'boolean',
            'premium_expiry_date'      => 'datetime',
            'verification_rejected_at' => 'datetime',
            'verified_at'              => 'datetime',
            'listing_approved_at'      => 'datetime',
            'last_seen_at'             => 'datetime',
            'notification_preferences' => 'array',
            'artisan_rating'           => 'float',
            'password'                 => 'hashed',
        ];
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function listings(): HasMany
    {
        return $this->hasMany(Listing::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function marketplaceProducts(): HasMany
    {
        return $this->hasMany(MarketplaceProduct::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class, 'referrer_id');
    }

    /**
     * A short, unambiguous referral code.
     *
     * The alphabet omits O/0 and I/1 because these codes get read aloud and
     * copied off phone screens, where those pairs are routinely confused.
     */
    public static function generateReferralCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        do {
            $code = '';
            for ($i = 0; $i < 8; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
        } while (static::query()->where('referral_code', $code)->exists());

        return $code;
    }

    /**
     * Return this user's referral code, creating one on first use.
     *
     * Accounts created before referral codes existed have a null column, so the
     * code is issued lazily rather than in a backfill migration that would have
     * to touch every row.
     */
    public function ensureReferralCode(): string
    {
        if (blank($this->referral_code)) {
            $this->referral_code = static::generateReferralCode();
            $this->save();
        }

        return $this->referral_code;
    }

    public function communityPosts(): HasMany
    {
        return $this->hasMany(CommunityPost::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function investments(): HasMany
    {
        return $this->hasMany(Investment::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(\App\Models\Notification::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(UserActivity::class);
    }

    public function aiConversations(): HasMany
    {
        return $this->hasMany(AiConversation::class);
    }

    public function professionalProfile(): HasOne
    {
        return $this->hasOne(ProfessionalProfile::class);
    }
}
