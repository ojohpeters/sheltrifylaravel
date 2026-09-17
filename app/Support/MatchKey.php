<?php

namespace App\Support;

/**
 * Comparison keys for the vacating/waitlist matcher.
 *
 * Matching is the whole feature: a tenant's "Makurdi" has to find a seeker's
 * "makurdi LGA", and "High-Level" has to find "High Level". There is no LGA or
 * area dataset to pick from, so both sides are free text and the raw strings
 * would almost never be equal. Every place value is stored twice — as typed,
 * for display, and as a key, for comparison.
 */
class MatchKey
{
    /** Noise words people append to a place name without changing which place it is. */
    private const SUFFIXES = [
        'local government area', 'local government', 'local govt area',
        'local govt', 'lga', 'l g a', 'state', 'town', 'city', 'area',
    ];

    public static function make(?string $raw): string
    {
        $key = strtolower(trim((string) $raw));

        if ($key === '') {
            return '';
        }

        // Punctuation and separators carry no meaning here: "High-Level" and
        // "High Level" are the same place.
        $key = (string) preg_replace('/[^a-z0-9\s]+/', ' ', $key);
        $key = (string) preg_replace('/\s+/', ' ', $key);
        $key = trim($key);

        // Strip trailing noise repeatedly: "makurdi local government area" and
        // "benue state" both reduce to the name itself.
        $changed = true;
        while ($changed) {
            $changed = false;

            foreach (self::SUFFIXES as $suffix) {
                if (str_ends_with($key, ' '.$suffix)) {
                    $key = trim(substr($key, 0, -strlen($suffix) - 1));
                    $changed = true;
                }
            }
        }

        return $key;
    }

    /**
     * Whether two place keys refer to the same place.
     *
     * Containment counts, so "high level" matches "high level gra" — a seeker
     * who wrote the estate should still hear about the neighbourhood. Very
     * short keys are compared strictly, or "ab" would match half of Nigeria.
     */
    public static function alike(string $a, string $b): bool
    {
        if ($a === '' || $b === '') {
            return false;
        }

        if ($a === $b) {
            return true;
        }

        if (min(strlen($a), strlen($b)) < 4) {
            return false;
        }

        return str_contains($a, $b) || str_contains($b, $a);
    }
}
