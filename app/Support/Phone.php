<?php

namespace App\Support;

final class Phone
{
    /**
     * Normalise a phone number to international form, e.g. +2348075887105.
     *
     * WhatsApp's wa.me links only resolve international numbers: 08075887105
     * opens nothing, 2348075887105 opens the chat. People type every variant —
     * 0807…, 807…, 234807…, +234 0807…, 00234… — so they are folded to one
     * representation at the point of saving rather than patched at each link.
     *
     * Numbers that are plainly not Nigerian are kept as digits with a leading
     * plus rather than being forced into a Nigerian shape.
     */
    public static function normalize(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $raw) ?? '';
        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);                       // 00234…
        }
        if (str_starts_with($digits, '2340') && strlen($digits) === 14) {
            $digits = '234'.substr($digits, 4);                 // +234 0807…
        }
        if (str_starts_with($digits, '0') && strlen($digits) === 11) {
            $digits = '234'.substr($digits, 1);                 // 0807…
        }
        if (strlen($digits) === 10 && preg_match('/^[789]/', $digits)) {
            $digits = '234'.$digits;                            // 807…
        }

        return '+'.$digits;
    }

    /** Whether a normalised number is plausible (E.164 allows 8–15 digits). */
    public static function isValid(?string $normalized): bool
    {
        return $normalized !== null && preg_match('/^\+\d{8,15}$/', $normalized) === 1;
    }
}
