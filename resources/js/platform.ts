/**
 * Platform detection + service worker registration.
 *
 * The Android build is a Trusted Web Activity (TWA) wrapping this same site,
 * so the server cannot tell the two apart — detection has to happen client-side.
 */

const TWA_FLAG = 'sheltrify:isAndroidApp';

/**
 * True when running inside the Play Store TWA build.
 *
 * Chrome sets `document.referrer` to `android-app://<package>` on the launch
 * navigation of a TWA, and only on that navigation — a later full reload sees
 * a same-origin referrer instead. So the positive result is memoised for the
 * session. sessionStorage (not localStorage) is deliberate: the TWA and the
 * plain browser share an origin, and a persisted flag would leak the app-mode
 * behaviour into ordinary browser tabs.
 *
 * Note this is intentionally FALSE for a browser-installed PWA. Only Play
 * Store distribution is subject to Google's billing policy; a PWA installed
 * from Chrome is not, and should keep the full payment flow.
 */
export function isAndroidApp(): boolean {
    if (typeof window === 'undefined') return false;

    if (sessionStorage.getItem(TWA_FLAG) === '1') return true;

    const detected =
        document.referrer.startsWith('android-app://') ||
        // Manual override, for testing the app-mode UI in a desktop browser.
        new URLSearchParams(window.location.search).get('source') === 'twa';

    if (detected) sessionStorage.setItem(TWA_FLAG, '1');

    return detected;
}

/** True when launched from a home-screen icon (TWA or installed PWA). */
export function isStandalone(): boolean {
    if (typeof window === 'undefined') return false;

    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        // iOS Safari does not implement display-mode.
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

/**
 * Google Play requires Play Billing for digital goods. SWC wallet top-ups and
 * the premium tier are digital, so those flows are hidden in the Play build.
 * Listings, marketplace goods, and artisan services are real-world goods and
 * remain exempt, so Paystack keeps working for them everywhere.
 */
export function digitalPurchasesAllowed(): boolean {
    return !isAndroidApp();
}

/**
 * The chat upgrade cannot be sold inside the Play build, so leaving the paywall
 * in place there would strand users at a wall with no way past it — which reads
 * as a broken app to a Play reviewer, and earns nothing either way.
 *
 * Flip to `false` to keep the paywall in the app and accept the dead end.
 */
export const LIFT_CHAT_PAYWALL_IN_APP = true;

/** Whether the free-message limit should be enforced at all. */
export function chatPaywallEnabled(): boolean {
    return digitalPurchasesAllowed() || !LIFT_CHAT_PAYWALL_IN_APP;
}

export function registerServiceWorker(): void {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (!import.meta.env.PROD) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.warn('Service worker registration failed', error);
        });
    });
}
