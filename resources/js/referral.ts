/**
 * Referral attribution.
 *
 * Someone arriving on a `/join/CODE` link rarely signs up in the same breath —
 * they browse first, sometimes for days. So the code is persisted rather than
 * read straight off the URL at signup time, with an expiry so a stale code
 * cannot credit a referrer months later.
 */

const KEY = 'sheltrify:referral';
const TTL_DAYS = 30;

interface StoredReferral {
    code: string;
    capturedAt: number;
}

/**
 * Read `?ref=` off the current URL and remember it.
 *
 * Call once on app start. An existing unexpired code is NOT overwritten:
 * first-touch attribution means the person who actually introduced the user
 * keeps the credit, rather than whoever's link they happened to click last.
 */
export function captureReferralCode(): void {
    if (typeof window === 'undefined') return;

    try {
        const code = new URLSearchParams(window.location.search).get('ref');
        if (!code) return;

        const clean = code.trim().toUpperCase();
        if (!/^[A-Z0-9]{4,32}$/.test(clean)) return;

        if (getReferralCode()) return;

        const payload: StoredReferral = { code: clean, capturedAt: Date.now() };
        localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {
        // Private browsing and blocked site data both throw here. A referral is
        // a nice-to-have; never let it break app start.
    }
}

/** The stored referral code, or null if absent, malformed, or expired. */
export function getReferralCode(): string | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as StoredReferral;
        if (!parsed?.code || typeof parsed.capturedAt !== 'number') return null;

        const ageDays = (Date.now() - parsed.capturedAt) / 86_400_000;
        if (ageDays > TTL_DAYS) {
            localStorage.removeItem(KEY);
            return null;
        }

        return parsed.code;
    } catch {
        return null;
    }
}

/** Drop the stored code once it has been spent on a completed signup. */
export function clearReferralCode(): void {
    try {
        localStorage.removeItem(KEY);
    } catch {
        /* see captureReferralCode */
    }
}

/** The shareable invite link for a given code. */
export function referralLinkFor(code: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/join/${code}`;
}
