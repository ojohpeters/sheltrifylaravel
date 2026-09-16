<?php

namespace App\Support;

/**
 * Listing prices are free text — "2.5M/Year", "₦450,000 per annum", "Negotiable".
 * That is fine to read and impossible to filter or sort on, so this reduces the
 * string to a number and a billing period. `listings.price` stays exactly what
 * the owner typed (and what the seeker is shown); `price_amount` / `price_period`
 * are the derived columns the search query uses.
 */
class PriceText
{
    /** Longest first: "million" must win before the "m" alternative can match it. */
    private const SUFFIXES = [
        'thousand' => 1_000,
        'million' => 1_000_000,
        'billion' => 1_000_000_000,
        'mil' => 1_000_000,
        'mn' => 1_000_000,
        'bn' => 1_000_000_000,
        'k' => 1_000,
        'm' => 1_000_000,
        'b' => 1_000_000_000,
    ];

    private const PERIOD_PATTERNS = [
        'year' => '/\b(year|years|yr|yrs|annum|annual|annually|yearly|pa|p\.a)\b/',
        'month' => '/\b(month|months|mo|mth|monthly|pm)\b/',
        'week' => '/\b(week|weeks|wk|weekly)\b/',
        'night' => '/\b(night|nights|nightly|day|daily|per\s*night)\b/',
    ];

    /**
     * Anything below this is not a Nigerian property price — it is a bedroom
     * count or a plot size that wandered into the field. Skipping those keeps
     * "3 bedroom flat, 2.5m" from being read as ₦3.
     */
    private const MIN_PLAUSIBLE = 1_000;

    private const MAX_PLAUSIBLE = 100_000_000_000;

    /**
     * @return array{amount: float|null, period: string|null}
     */
    public static function parse(?string $raw): array
    {
        $text = strtolower(trim((string) $raw));

        if ($text === '') {
            return ['amount' => null, 'period' => null];
        }

        return [
            'amount' => self::amount($text),
            'period' => self::period($text),
        ];
    }

    /** The first plausible figure in the text; the low end of a range. */
    private static function amount(string $text): ?float
    {
        // Drop currency markers so "n1.2m" and "₦450,000" both reduce to digits.
        $text = str_replace(['₦', 'ngn', 'naira'], ' ', $text);
        $text = (string) preg_replace('/(?<![a-z])n(?=\s*\d)/', ' ', $text);

        $suffixes = implode('|', array_keys(self::SUFFIXES));
        $matched = preg_match_all(
            '/(\d[\d,]*(?:\.\d+)?)\s*('.$suffixes.')?\b/',
            $text,
            $matches,
            PREG_SET_ORDER
        );

        if (! $matched) {
            return null;
        }

        foreach ($matches as $match) {
            $value = (float) str_replace(',', '', $match[1]);
            $suffix = $match[2] ?? '';

            if ($suffix !== '') {
                $value *= self::SUFFIXES[$suffix];
            }

            if ($value >= self::MIN_PLAUSIBLE && $value <= self::MAX_PLAUSIBLE) {
                return round($value, 2);
            }
        }

        return null;
    }

    private static function period(string $text): ?string
    {
        foreach (self::PERIOD_PATTERNS as $period => $pattern) {
            if (preg_match($pattern, $text)) {
                return $period;
            }
        }

        return null;
    }

    /** "₦2,500,000" — for prices we render ourselves rather than echo back. */
    public static function format(?float $amount, ?string $period = null): string
    {
        if ($amount === null) {
            return '';
        }

        $money = '₦'.number_format($amount, fmod($amount, 1) === 0.0 ? 0 : 2);

        return $period ? $money.'/'.$period : $money;
    }
}
