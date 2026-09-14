/**
 * Phone helpers.
 *
 * WhatsApp's wa.me links only resolve international numbers written as digits:
 * `wa.me/2348075887105` opens the chat, `wa.me/08075887105` opens nothing.
 * Numbers reach the app in every local variant, so they are folded to the
 * international form here instead of being patched at each link. The server
 * applies the same rules on save (app/Support/Phone.php).
 */

/** Digits in international form, e.g. "2348075887105", or "" if unusable. */
export function toInternationalDigits(raw?: string | null): string {
    let d = String(raw ?? '').replace(/\D/g, '');
    if (!d) return '';

    if (d.startsWith('00')) d = d.slice(2);                          // 00234…
    if (d.startsWith('2340') && d.length === 14) d = '234' + d.slice(4); // +234 0807…
    if (d.startsWith('0') && d.length === 11) d = '234' + d.slice(1);    // 0807…
    if (d.length === 10 && /^[789]/.test(d)) d = '234' + d;              // 807…

    return d.length >= 8 && d.length <= 15 ? d : '';
}

/** A wa.me link, optionally with a prefilled message; "" when there is no usable number. */
export function whatsAppLink(raw?: string | null, message?: string): string {
    const d = toInternationalDigits(raw);
    if (!d) return '';
    return `https://wa.me/${d}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

/** A tel: href in international form, so it dials correctly from any network. */
export function telLink(raw?: string | null): string {
    const d = toInternationalDigits(raw);
    return d ? `tel:+${d}` : '';
}

/** "+234 807 588 7105" for display; falls back to whatever was given. */
export function formatPhone(raw?: string | null): string {
    const d = toInternationalDigits(raw);
    if (d.startsWith('234') && d.length === 13) {
        return `+234 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
    }
    return d ? `+${d}` : String(raw ?? '');
}

/** The part after +234, for an input that shows the country code as a fixed prefix. */
export function localPart(raw?: string | null): string {
    const d = toInternationalDigits(raw);
    return d.startsWith('234') ? d.slice(3) : String(raw ?? '').replace(/\D/g, '');
}
