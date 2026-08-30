import '../css/app.css';
import '../css/sheltrify.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { registerServiceWorker } from './platform';
import { captureReferralCode } from './referral';

registerServiceWorker();
captureReferralCode();

/**
 * Hide the server-rendered boot splash once React has taken over.
 *
 * A frame is yielded first so the app paints underneath before the splash
 * fades, otherwise the fade reveals an empty page. The element is removed
 * rather than left hidden so it can never trap clicks.
 */
function dismissBootSplash(): void {
    const boot = document.getElementById('app-boot');
    if (!boot) return;
    requestAnimationFrame(() => {
        boot.classList.add('is-done');
        setTimeout(() => boot.remove(), 400);
    });
}

createInertiaApp({
    title: (title) => (title ? `${title} — ShelTrify` : 'ShelTrify'),
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
        dismissBootSplash();
    },
    progress: {
        color: '#00A8A8',
    },
});
