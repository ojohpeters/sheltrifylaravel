<?php

namespace App\Services;

use App\Mail\NotificationMail;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Single entry point for sending a notification — writes the row to
 * the notifications table (so it shows in the bell dropdown / inbox)
 * AND sends an email if the user has an email address. Email failures
 * are logged but never abort the DB notification.
 */
class NotifyUser
{
    public static function send(
        User|int $user,
        string $type,
        string $title,
        string $body,
        array $data = [],
        ?string $ctaUrl = null,
        ?string $ctaLabel = null,
        bool $emailToo = true,
    ): Notification {
        $userModel = $user instanceof User ? $user : User::find($user);

        $notification = Notification::create([
            'user_id' => $userModel?->id ?? (is_int($user) ? $user : null),
            'type'    => $type,
            'title'   => $title,
            'body'    => $body,
            'data'    => array_merge($data, $ctaUrl ? ['ctaUrl' => $ctaUrl, 'ctaLabel' => $ctaLabel] : []),
        ]);

        if ($emailToo && $userModel && $userModel->email) {
            try {
                Mail::to($userModel->email)->send(new NotificationMail(
                    recipientName: $userModel->full_name ?: explode('@', $userModel->email)[0],
                    subject: $title,
                    bodyText: $body,
                    data: $data,
                    ctaUrl: $ctaUrl,
                    ctaLabel: $ctaLabel,
                ));
            } catch (\Throwable $e) {
                Log::warning('NotifyUser email failed', [
                    'user_id' => $userModel->id,
                    'type'    => $type,
                    'error'   => $e->getMessage(),
                ]);
            }
        }

        return $notification;
    }
}
