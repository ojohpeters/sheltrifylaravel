<?php

namespace App\Services;

use App\Models\VacatingMatch;
use App\Models\VacatingSoonListing;
use App\Models\WaitlistEntry;
use App\Support\ApartmentTypes;
use App\Support\MatchKey;
use App\Support\Phone;
use Illuminate\Support\Collection;

/**
 * Pairs flats that are about to be empty with the people waiting for them.
 *
 * The brief asked for an exact match on state, LGA, area and apartment type.
 * Taken literally that would almost never fire: LGA and area are free text, so
 * "High Level" and "high-level" would be different places and the seeker would
 * hear nothing. Matching is therefore done on normalised keys (MatchKey), and
 * apartment type — the one field both sides pick from a fixed list — is the
 * part compared exactly.
 *
 * The bias is deliberately towards telling someone: a seeker who hears about a
 * flat that is not quite right can ignore it, while the alternative is the
 * thirty people who waited a month and were told about nothing.
 */
class VacatingMatcher
{
    /** How far either side of a seeker's move-in date a vacancy is still useful. */
    private const MOVE_IN_WINDOW_DAYS = 90;

    /**
     * Find, record and announce every seeker waiting for this flat.
     *
     * @return Collection<int, VacatingMatch> the matches created by this call
     */
    public static function run(VacatingSoonListing $vacating): Collection
    {
        if (! $vacating->isOpen()) {
            return collect();
        }

        $created = collect();

        foreach (self::seekersFor($vacating) as $entry) {
            // A match row already exists when a flat is edited and re-matched;
            // the seeker should not be told twice about the same address.
            $match = VacatingMatch::query()->firstOrNew([
                'vacating_soon_listing_id' => $vacating->id,
                'waitlist_entry_id' => $entry->id,
            ]);

            if ($match->exists) {
                continue;
            }

            $match->status = 'new';
            $match->save();

            self::notify($vacating, $entry);

            $entry->forceFill([
                'status' => $entry->status === 'active' ? 'matched' : $entry->status,
                'last_notified_at' => now(),
            ])->save();

            $created->push($match);
        }

        return $created;
    }

    /**
     * Seekers whose criteria this flat satisfies.
     *
     * @return Collection<int, WaitlistEntry>
     */
    public static function seekersFor(VacatingSoonListing $vacating): Collection
    {
        return WaitlistEntry::query()
            ->whereIn('status', ['active', 'matched'])
            ->where('state_key', $vacating->state_key)
            ->get()
            ->filter(fn (WaitlistEntry $entry) => self::fits($vacating, $entry))
            ->values();
    }

    /**
     * Flats a seeker would want to hear about, for the moment they join —
     * otherwise someone joining today learns nothing about the flat captured
     * yesterday.
     *
     * @return Collection<int, VacatingSoonListing>
     */
    public static function vacanciesFor(WaitlistEntry $entry): Collection
    {
        return VacatingSoonListing::query()
            ->where('state_key', $entry->state_key)
            ->whereIn('status', ['available', 'reserved'])
            ->whereDate('vacate_date', '>=', now()->toDateString())
            ->get()
            ->filter(fn (VacatingSoonListing $vacating) => self::fits($vacating, $entry))
            ->values();
    }

    /** Record and announce the flats already waiting when a seeker signs up. */
    public static function runForSeeker(WaitlistEntry $entry): Collection
    {
        $created = collect();

        foreach (self::vacanciesFor($entry) as $vacating) {
            $match = VacatingMatch::query()->firstOrNew([
                'vacating_soon_listing_id' => $vacating->id,
                'waitlist_entry_id' => $entry->id,
            ]);

            if ($match->exists) {
                continue;
            }

            $match->status = 'new';
            $match->save();

            self::notify($vacating, $entry);
            $created->push($match);
        }

        if ($created->isNotEmpty()) {
            $entry->forceFill(['status' => 'matched', 'last_notified_at' => now()])->save();
        }

        return $created;
    }

    private static function fits(VacatingSoonListing $vacating, WaitlistEntry $entry): bool
    {
        if ($vacating->state_key === '' || $vacating->state_key !== $entry->state_key) {
            return false;
        }

        // A seeker who did not name an LGA is not fussy about it; one who did
        // has to be in the same one.
        if (filled($entry->lga_key) && filled($vacating->lga_key)
            && ! MatchKey::alike($vacating->lga_key, $entry->lga_key)) {
            return false;
        }

        $areas = is_array($entry->area_keys) ? $entry->area_keys : [];
        $areaMatches = collect($areas)->contains(
            fn ($key) => MatchKey::alike($vacating->area_key, (string) $key)
        );

        if (! $areaMatches) {
            return false;
        }

        if ($entry->apartment_type !== ApartmentTypes::ANY
            && $entry->apartment_type !== $vacating->apartment_type) {
            return false;
        }

        // Budget only applies when both sides named a figure; most captures at
        // someone's door will not have one.
        if ($vacating->rent_amount !== null && $entry->budget_max !== null
            && $vacating->rent_amount > $entry->budget_max) {
            return false;
        }

        if ($entry->move_in_date !== null && $vacating->vacate_date !== null
            && abs($entry->move_in_date->diffInDays($vacating->vacate_date)) > self::MOVE_IN_WINDOW_DAYS) {
            return false;
        }

        return true;
    }

    /**
     * Tell the seeker.
     *
     * In-app and email go out here. WhatsApp cannot: sending a message to
     * someone who has not messaged first needs the WhatsApp Business Cloud API
     * and an approved template, neither of which this account has. The admin
     * match list carries a prefilled wa.me link instead, so the team sends it
     * with one tap — which is how the door-to-door capture works anyway.
     */
    private static function notify(VacatingSoonListing $vacating, WaitlistEntry $entry): void
    {
        $when = $vacating->vacate_date?->format('j M Y') ?? 'soon';
        $title = "A {$vacating->apartment_type} in {$vacating->area} is coming up";
        $body = "The {$vacating->apartment_type} you waitlisted in {$vacating->area}, {$vacating->state} "
            ."is due to be vacant on {$when}. Contact the tenant now to arrange an inspection "
            .'before it is listed publicly.';

        if (! $entry->user_id) {
            // A guest has no inbox to write to; the team reaches them on
            // WhatsApp from the admin match list.
            return;
        }

        NotifyUser::send(
            user: $entry->user_id,
            type: 'vacating_match',
            title: $title,
            body: $body,
            data: [
                'vacatingId' => $vacating->id,
                'area' => $vacating->area,
                'state' => $vacating->state,
                'apartmentType' => $vacating->apartment_type,
                'vacateDate' => $vacating->vacate_date?->toDateString(),
            ],
            ctaUrl: '/vacating-soon',
            ctaLabel: 'View the apartment',
        );
    }

    /** The message the team sends a matched seeker, prefilled on wa.me. */
    public static function whatsAppMessage(VacatingSoonListing $vacating, WaitlistEntry $entry): string
    {
        $when = $vacating->vacate_date?->format('j M Y') ?? 'soon';
        $first = trim(explode(' ', trim($entry->full_name))[0] ?? '');

        return ($first !== '' ? "Hello {$first}, " : 'Hello, ')
            ."you joined the ShelTrify waitlist for a {$entry->apartment_type} in {$vacating->area}. "
            ."A {$vacating->apartment_type} there is due to be vacant on {$when}. "
            .'Would you like to inspect it?';
    }

    /** wa.me link for the admin match list; "" when the number is unusable. */
    public static function whatsAppLink(VacatingSoonListing $vacating, WaitlistEntry $entry): string
    {
        $normalized = Phone::normalize($entry->whatsapp);

        if (! Phone::isValid($normalized)) {
            return '';
        }

        // Digits only: wa.me/+2348075887105 opens nothing, wa.me/2348075887105
        // opens the chat.
        $digits = ltrim((string) $normalized, '+');

        return 'https://wa.me/'.$digits.'?text='.rawurlencode(self::whatsAppMessage($vacating, $entry));
    }
}
