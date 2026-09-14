<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Validation\Rule;
use App\Support\Phone;
use App\Support\NigerianStates;
use App\Models\ProfessionalProfile;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserApiController extends Controller
{
    public function profile(Request $request)
    {
        $user = $request->user()
            ->loadCount(['listings', 'favorites'])
            ->load(['wallet', 'professionalProfile']);

        return $this->jsonOk($user);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'fullName'  => 'sometimes|string',
            'phone'     => 'sometimes|string',
            'avatarUrl' => 'sometimes|string',
        ]);
        $updates = [];
        if (isset($data['fullName']))  $updates['full_name']  = $data['fullName'];
        if (isset($data['phone']))     $updates['phone']      = $data['phone'];
        if (isset($data['avatarUrl'])) $updates['avatar_url'] = $data['avatarUrl'];
        $request->user()->update($updates);

        return $this->jsonOk($request->user()->fresh()->toArray(), 'Profile updated successfully');
    }

    public function upgradePremium(Request $request)
    {
        $PREMIUM_COST = 15000;
        $user = $request->user()->load('wallet');
        if (! $user->wallet) {
            return $this->jsonErr('Wallet not found. Please contact support.', 400, ['code' => 'WALLET_NOT_FOUND']);
        }
        if ($user->is_premium && $user->premium_expiry_date && $user->premium_expiry_date->isFuture()) {
            return $this->jsonErr('You already have an active premium subscription', 400);
        }
        if ($user->wallet->swc_balance < $PREMIUM_COST) {
            $shortage = $PREMIUM_COST - $user->wallet->swc_balance;
            return $this->jsonErr(
                "Insufficient wallet balance. You need ₦{$PREMIUM_COST} but only have ₦{$user->wallet->swc_balance}. Please fund your wallet with ₦{$shortage} or more.",
                400,
                ['code' => 'INSUFFICIENT_BALANCE', 'currentBalance' => $user->wallet->swc_balance, 'requiredAmount' => $PREMIUM_COST, 'shortage' => $shortage]
            );
        }

        return DB::transaction(function () use ($user, $PREMIUM_COST) {
            $user->wallet->decrement('swc_balance', $PREMIUM_COST);
            $expiry = now()->addMonth();
            $user->update(['is_premium' => true, 'premium_expiry_date' => $expiry]);

            return $this->jsonOk([
                'id'               => $user->id,
                'email'            => $user->email,
                'isPremium'        => true,
                'premiumExpiryDate'=> $expiry->toIso8601String(),
                'walletBalance'    => $user->wallet->fresh()->swc_balance,
            ], 'Premium upgrade successful');
        });
    }

    public function upgradeChat(Request $request)
    {
        $cost = 2000;
        $user = $request->user()->load('wallet');
        if (! $user->wallet) {
            return $this->jsonErr('Wallet not found.', 400, ['code' => 'WALLET_NOT_FOUND']);
        }
        if ($user->wallet->swc_balance < $cost) {
            $shortage = $cost - $user->wallet->swc_balance;
            return $this->jsonErr(
                "Insufficient wallet balance. You need ₦{$cost} but only have ₦{$user->wallet->swc_balance}. Please fund your wallet with ₦{$shortage} or more.",
                400,
                ['code' => 'INSUFFICIENT_BALANCE', 'currentBalance' => $user->wallet->swc_balance, 'requiredAmount' => $cost, 'shortage' => $shortage]
            );
        }
        $user->wallet->decrement('swc_balance', $cost);

        return $this->jsonOk(['walletBalance' => $user->wallet->fresh()->swc_balance], 'Chat upgrade successful.');
    }

    // ── Identity/NIN + listing-permission verification (all listing roles + artisans) ──
    public function submitVerification(Request $request)
    {
        $listingRoles = ['LANDLORD', 'AGENT', 'REFERRER', 'INVESTOR', 'ESTATE_MANAGER', 'TIPPER_DRIVER'];
        $artisanRole  = 'ARTISAN';

        $data = $request->validate([
            'verificationPhotoUrl' => 'required|string',
            'verificationIdUrl'    => 'required|string',
            'verificationIdType'   => 'required|string',
            'ninNumber'            => 'required|string|min:11|max:11',
        ]);

        $user = $request->user();

        if (! in_array($user->role, [...$listingRoles, $artisanRole], true)) {
            return $this->jsonErr('Verification is not required for your account type.', 400);
        }
        if ($user->is_verified && $user->verification_status === 'approved') {
            return $this->jsonErr('You are already verified.', 400);
        }

        $user->update([
            'verification_photo_url'  => $data['verificationPhotoUrl'],
            'verification_id_url'     => $data['verificationIdUrl'],
            'verification_id_type'    => $data['verificationIdType'],
            'nin_number'              => $data['ninNumber'],
            'verification_status'     => 'pending',
            'listing_approval_status' => 'pending',
            'is_verified'             => false,
            'verification_rejected_at'          => null,
            'verification_rejection_reason'     => null,
            'listing_approval_rejection_reason' => null,
            'listing_approved_at'               => null,
            'verified_at'                       => null,
        ]);

        return $this->jsonOk(
            $user->fresh()->only(['id', 'email', 'verification_status', 'listing_approval_status']),
            'Documents submitted. An admin will review your NIN and ID shortly.'
        );
    }

    // ── Professional profile (Surveyor / Developer) ──────────────────────
    public function submitProfessionalProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate(array_merge([
            // NIN is the only hard requirement. Most local artisans have no
            // company, no licence number and no professional body — demanding
            // them kept exactly the people this page exists for from applying.
            'professionalType'   => 'required|string|max:60',
            'companyName'        => 'nullable|string|max:255',
            'licenseNumber'      => 'nullable|string|max:100',
            'licenseUrl'         => 'nullable|string',
            'ninNumber'          => 'required|digits:11',
            'professionalBody'   => 'nullable|string|max:100',
            'membershipId'       => 'nullable|string|max:100',
            'membershipDocUrl'   => 'nullable|string',
            'businessAddress'    => 'nullable|string',
            'yearsExperience'    => 'nullable|string|max:10',
            'bio'                => 'nullable|string|max:1000',
        ], $this->artisanDetailRules()));

        if ($message = $this->invalidPhoneMessage($data)) {
            return $this->jsonErr($message, 422);
        }

        // Older clients send only the range string ("6–10 years").
        if (! array_key_exists('experienceYears', $data)
            && preg_match('/\d+/', (string) ($data['yearsExperience'] ?? ''), $m)) {
            $data['experienceYears'] = (int) $m[0];
        }

        $profile = ProfessionalProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'professional_type' => $data['professionalType'],
                'company_name'      => $data['companyName'] ?? null,
                'license_number'    => $data['licenseNumber'] ?? null,
                'license_url'       => $data['licenseUrl'] ?? null,
                'nin_number'        => $data['ninNumber'],
                'professional_body' => $data['professionalBody'] ?? null,
                'membership_id'     => $data['membershipId'] ?? null,
                'membership_doc_url'=> $data['membershipDocUrl'] ?? null,
                'business_address'  => $data['businessAddress'] ?? null,
                'years_experience'  => $data['yearsExperience'] ?? null,
                'bio'               => $data['bio'] ?? null,
                'status'            => 'pending',
                'rejection_reason'  => null,
                'approved_at'       => null,
                'approved_by'       => null,
            ]
        );

        // Also update user role and NIN
        $user->update([
            // Role stays ARTISAN; the trade lives in professional_type and
            // artisan_service. professionalType used to be SURVEYOR/DEVELOPER
            // and was written straight into `role` — now that it carries a
            // trade, doing that would set role to something like PLUMBER and
            // break every role comparison in the app.
            // Never demote an administrator. Submitting this form used to
            // overwrite `role` unconditionally, so an admin who filled it in
            // lost admin access entirely and could not reach the dashboard to
            // undo it. Everyone else becomes an artisan; the trade itself lives
            // in professional_type and artisan_service, never in `role`.
            'role'                   => $user->role === 'ADMIN' ? 'ADMIN' : 'ARTISAN',
            'professional_type'      => $data['professionalType'],
            'artisan_service'        => $data['professionalType'],
            'nin_number'             => $data['ninNumber'],
            'listing_approval_status'=> 'pending',
        ]);

        // The directory reads phone, WhatsApp, location, bio, experience and
        // photo from the user row. This form used to write bio and experience
        // only to professional_profiles, so no artisan's bio ever appeared.
        $this->saveArtisanDetails($user, $data);

        return $this->jsonOk($profile->load('user'), 'Professional profile submitted for admin review.');
    }

    /**
     * Update the public details of an artisan's directory listing.
     *
     * Kept apart from the verification submission on purpose. Phone, WhatsApp,
     * location, bio, experience and photo are what seekers see and have to stay
     * current long after approval; sending those edits through the verification
     * form would either reopen review for a changed phone number or let identity
     * details change unreviewed. Nothing verification-related is touched here.
     */
    public function updateArtisanDetails(Request $request)
    {
        $data = $request->validate($this->artisanDetailRules());

        if ($message = $this->invalidPhoneMessage($data)) {
            return $this->jsonErr($message, 422);
        }

        $user = $this->saveArtisanDetails($request->user(), $data);

        return $this->jsonOk([
            'phone' => $user->phone,
            'whatsapp' => $user->whatsapp,
            'artisanState' => $user->artisan_state,
            'artisanLga' => $user->artisan_lga,
            'artisanLocation' => $user->artisan_location,
            'artisanBio' => $user->artisan_bio,
            'artisanExperienceYears' => $user->artisan_experience_years,
            'avatarUrl' => $user->avatar_url,
        ], 'Your listing details are saved.');
    }

    /** Validation for the fields shown on an artisan's public listing. */
    private function artisanDetailRules(): array
    {
        return [
            'phone' => 'nullable|string|max:30',
            'whatsapp' => 'nullable|string|max:30',
            'state' => ['nullable', 'string', Rule::in(NigerianStates::ALL)],
            'lga' => 'nullable|string|max:80',
            'bio' => 'nullable|string|max:1000',
            'experienceYears' => 'nullable|integer|min:0|max:70',
            // Our own uploads, or an https image — never a data: or javascript: URL.
            'avatarUrl' => ['nullable', 'string', 'max:2048', 'regex:#^(/storage/|https://)#'],
        ];
    }

    /** A message for the first supplied number that cannot be made valid, or null. */
    private function invalidPhoneMessage(array $data): ?string
    {
        foreach (['phone' => 'phone', 'whatsapp' => 'WhatsApp'] as $field => $label) {
            if (filled($data[$field] ?? null) && ! Phone::isValid(Phone::normalize($data[$field]))) {
                return "Enter a valid {$label} number.";
            }
        }

        return null;
    }

    /**
     * Write whichever public listing fields were supplied onto the user.
     * Keys absent from $data are left alone, so a partial update cannot blank
     * out fields the client never sent.
     */
    private function saveArtisanDetails(User $user, array $data): User
    {
        $attributes = [];

        if (array_key_exists('phone', $data)) {
            $attributes['phone'] = Phone::normalize($data['phone']);
        }
        if (array_key_exists('whatsapp', $data)) {
            $attributes['whatsapp'] = Phone::normalize($data['whatsapp']);
        }
        if (array_key_exists('state', $data)) {
            $attributes['artisan_state'] = $data['state'] ?: null;
        }
        if (array_key_exists('lga', $data)) {
            $attributes['artisan_lga'] = filled($data['lga']) ? trim($data['lga']) : null;
        }
        if (array_key_exists('bio', $data)) {
            $attributes['artisan_bio'] = filled($data['bio']) ? trim($data['bio']) : null;
        }
        if (array_key_exists('experienceYears', $data)) {
            $attributes['artisan_experience_years'] = $data['experienceYears'];
        }
        if (filled($data['avatarUrl'] ?? null)) {
            $attributes['avatar_url'] = $data['avatarUrl'];
        }

        $user->fill($attributes);

        // Keep the display string in step with the structured fields it is built from.
        if ($user->isDirty(['artisan_state', 'artisan_lga'])) {
            $user->artisan_location = collect([$user->artisan_lga, $user->artisan_state])
                ->filter()
                ->implode(', ') ?: null;
        }

        $user->save();

        return $user;
    }

    public function getProfessionalProfile(Request $request)
    {
        $profile = $request->user()->professionalProfile;

        return $this->jsonOk(['profile' => $profile]);
    }
}
