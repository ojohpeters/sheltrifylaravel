<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;

class ReferralApiController extends Controller
{
    /**
     * Resolve an invite code to the person who sent it.
     *
     * Public by necessity — the invitee has no account yet. Deliberately
     * returns only a first name and avatar: enough to make the invitation feel
     * personal, and nothing that identifies the account beyond what the inviter
     * already chose to share by sending the link. No id, no email, no role, no
     * counts.
     *
     * The route is throttled. Codes are eight characters from a 30-odd
     * character alphabet, so enumeration is impractical anyway, but an
     * unmetered public lookup that returns a name is not something to leave
     * open.
     */
    public function show(string $code)
    {
        $clean = strtoupper(trim($code));

        if (! preg_match('/^[A-Z0-9]{4,32}$/', $clean)) {
            return $this->jsonErr('Invalid invite code', 404);
        }

        $inviter = User::query()
            ->where('referral_code', $clean)
            ->first(['full_name', 'avatar_url']);

        if (! $inviter) {
            return $this->jsonErr('Invite code not found', 404);
        }

        $full = trim((string) $inviter->full_name);
        $first = $full !== '' ? explode(' ', $full)[0] : null;

        return $this->jsonOk([
            'inviter' => [
                'firstName' => $first,
                'avatarUrl' => $inviter->avatar_url,
            ],
        ]);
    }
}
