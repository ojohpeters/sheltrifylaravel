/**
 * Money and count formatting.
 *
 * Listing prices are stored as whatever the owner typed ("2.5M/Year"), with a
 * parsed figure alongside it (see app/Support/PriceText.php). Cards show the
 * parsed figure when there is one, because "₦2,500,000/year" reads the same on
 * every card, and fall back to the owner's own words when there is not.
 */

/** "₦2,500,000" — the full figure, for detail views and inputs. */
export function formatNaira(value?: number | string | null): string {
    const n = typeof value === 'string' ? Number(value) : value;
    if (n === null || n === undefined || !Number.isFinite(n)) return '';
    return `₦${Math.round(n).toLocaleString('en-NG')}`;
}

/** "₦2.5M", "₦450k" — for card badges and range labels, where space is tight. */
export function compactNaira(value?: number | string | null): string {
    const n = typeof value === 'string' ? Number(value) : value;
    if (n === null || n === undefined || !Number.isFinite(n)) return '';

    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return `₦${trim(n / 1_000_000_000)}B`;
    if (abs >= 1_000_000) return `₦${trim(n / 1_000_000)}M`;
    if (abs >= 1_000) return `₦${trim(n / 1_000)}k`;
    return `₦${Math.round(n)}`;
}

/** One decimal place, but only when it says something: 2.5 stays, 3.0 becomes 3. */
function trim(n: number): string {
    return (Math.round(n * 10) / 10).toString();
}

/** "/year" → the suffix a price carries, or "" when the period is unknown. */
export function periodSuffix(period?: string | null): string {
    return period ? `/${period}` : '';
}

/**
 * What to print on a listing card.
 *
 * Prefers the parsed amount so prices line up across cards, and keeps the
 * owner's text for the ones that say "Negotiable" or "Contact for price".
 */
export function listingPrice(
    listing: { price?: string | null; priceAmount?: number | null; pricePeriod?: string | null },
): string {
    if (listing.priceAmount) {
        return `${formatNaira(listing.priceAmount)}${periodSuffix(listing.pricePeriod)}`;
    }
    return (listing.price || '').trim() || 'Price on request';
}

/** "1 bedroom" / "3 bedrooms" — plural without the (s). */
export function plural(count: number, singular: string, pluralForm?: string): string {
    return `${count} ${count === 1 ? singular : pluralForm ?? `${singular}s`}`;
}
