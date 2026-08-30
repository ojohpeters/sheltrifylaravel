<?php

namespace App\Http\Controllers;

use App\Mail\NotificationMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Public account + data deletion request channel.
 *
 * Google Play requires apps that let users create an account to publish a
 * deletion route reachable WITHOUT installing the app, so these endpoints are
 * deliberately unauthenticated. Deletion is request-based rather than an
 * immediate self-service wipe because ShelTrify carries financial records that
 * Nigerian record-keeping law requires us to retain — an admin reconciles the
 * wallet, settles open orders, then erases the personal data.
 */
class AccountDeletionController extends Controller
{
    public function show()
    {
        return view('legal.account-deletion');
    }

    public function submit(Request $request)
    {
        // Unauthenticated public endpoint — honeypot catches naive bots, and the
        // route carries a throttle. Both are cheap; neither is load-bearing for
        // correctness, since the request only ever sends mail.
        if ($request->filled('website')) {
            return back()->with('status', 'Request received.');
        }

        $validated = $request->validate([
            'email'   => ['required', 'email', 'max:255'],
            'reason'  => ['nullable', 'string', 'max:2000'],
            'confirm' => ['accepted'],
        ], [
            'confirm.accepted' => 'Please confirm you understand the account will be permanently deleted.',
        ]);

        // Deliberately not disclosed to the requester: revealing whether an
        // address has an account would turn this open endpoint into an account
        // enumeration oracle. The response below is identical either way.
        $user = User::where('email', $validated['email'])->first();

        try {
            Mail::to(config('legal.admin_email'))->send(new NotificationMail(
                recipientName: 'ShelTrify Admin',
                mailSubject: 'Account deletion request — ' . $validated['email'],
                bodyText: 'A data deletion request was submitted from the public deletion page. '
                    . 'Verify the requester owns this address before erasing anything.',
                data: [
                    'Email'          => $validated['email'],
                    'Account found'  => $user ? 'Yes (user #' . $user->id . ')' : 'No matching account',
                    'Reason given'   => $validated['reason'] ?: '—',
                    'Submitted at'   => now()->toDayDateTimeString(),
                    'Requester IP'   => $request->ip(),
                ],
            ));
        } catch (\Throwable $e) {
            // The requester must never be left thinking a deletion request was
            // filed when the mail never went out.
            Log::error('Account deletion request failed to send', [
                'email' => $validated['email'],
                'error' => $e->getMessage(),
            ]);

            return back()
                ->withInput()
                ->withErrors(['email' => 'We could not submit your request. Please email '
                    . config('legal.privacy_email') . ' directly.']);
        }

        if ($user) {
            try {
                Mail::to($user->email)->send(new NotificationMail(
                    recipientName: $user->full_name ?: explode('@', $user->email)[0],
                    mailSubject: 'We received your deletion request',
                    bodyText: 'We have received your request to delete your ShelTrify account. '
                        . 'We will confirm by email once it is complete, within 30 days. '
                        . 'If you did not make this request, contact us immediately — no action '
                        . 'is taken until we verify ownership of the account.',
                ));
            } catch (\Throwable $e) {
                Log::warning('Deletion acknowledgement email failed', [
                    'user_id' => $user->id,
                    'error'   => $e->getMessage(),
                ]);
            }
        }

        return back()->with('status',
            'Request received. If an account exists for that address, we will email a confirmation '
            . 'and complete the deletion within 30 days.');
    }
}
