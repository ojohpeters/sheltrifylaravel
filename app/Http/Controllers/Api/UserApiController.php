<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        $listingRoles = ['LANDLORD', 'AGENT', 'REFERRER', 'INVESTOR', 'ESTATE_MANAGER'];
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

        $data = $request->validate([
            'professionalType'   => 'required|in:SURVEYOR,DEVELOPER',
            'companyName'        => 'required|string|max:255',
            'licenseNumber'      => 'required|string|max:100',
            'licenseUrl'         => 'required|string',
            'ninNumber'          => 'required|string|min:11|max:11',
            'cacNumber'          => 'nullable|string|max:20',
            'cacDocumentUrl'     => 'nullable|string',
            'professionalBody'   => 'nullable|string|max:100',
            'membershipId'       => 'nullable|string|max:100',
            'membershipDocUrl'   => 'nullable|string',
            'businessAddress'    => 'nullable|string',
            'yearsExperience'    => 'nullable|string|max:10',
            'bio'                => 'nullable|string|max:1000',
        ]);

        $profile = ProfessionalProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'professional_type' => $data['professionalType'],
                'company_name'      => $data['companyName'],
                'license_number'    => $data['licenseNumber'],
                'license_url'       => $data['licenseUrl'],
                'nin_number'        => $data['ninNumber'],
                'cac_number'        => $data['cacNumber'] ?? null,
                'cac_document_url'  => $data['cacDocumentUrl'] ?? null,
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
            'role'                   => $data['professionalType'],
            'professional_type'      => $data['professionalType'],
            'nin_number'             => $data['ninNumber'],
            'listing_approval_status'=> 'pending',
        ]);

        return $this->jsonOk($profile->load('user'), 'Professional profile submitted for admin review.');
    }

    public function getProfessionalProfile(Request $request)
    {
        $profile = $request->user()->professionalProfile;

        return $this->jsonOk(['profile' => $profile]);
    }
}
