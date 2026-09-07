import React, { useState } from 'react';
import { CloseIcon, LinkIcon, CheckCircleIcon, WhatsAppIcon, UsersIcon } from './icons';
import { referralLinkFor } from '../referral';

/**
 * Shown once, immediately after signup.
 *
 * The referral link existed but nothing ever put it in front of a new user, so
 * in practice nobody shared one. This is the moment with the most intent —
 * straight after joining — so it is where the ask belongs.
 */
const WelcomeShareModal: React.FC<{
    code: string;
    firstName?: string;
    onClose: () => void;
    onViewReferrals: () => void;
}> = ({ code, firstName, onClose, onViewReferrals }) => {
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const link = referralLinkFor(code);
    const message = `I just joined ShelTrify — homes, shortlets, land and trusted local artisans across Nigeria. Join me:`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setError(null);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // The clipboard API is unavailable over plain HTTP and inside some
            // in-app browsers; say so rather than appearing to do nothing.
            setError('Could not copy automatically — tap the link and copy it.');
        }
    };

    const share = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: 'ShelTrify', text: message, url: link });
                return;
            } catch {
                return; // dismissed the sheet
            }
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(`${message} ${link}`)}`, '_blank', 'noopener');
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full sm:max-w-md bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>

                <div className="bg-gradient-to-br from-[#0B1524] via-[#07090F] to-[#042A28] px-6 pt-8 pb-7 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-primary/20 flex items-center justify-center">
                        <UsersIcon className="w-7 h-7 text-brand-primary" />
                    </div>
                    <h2 className="mt-4 text-2xl font-bold text-white">
                        Welcome{firstName ? `, ${firstName}` : ''}!
                    </h2>
                    <p className="mt-2 text-sm text-white/70">
                        Share your link and earn SWC every time someone joins ShelTrify through it.
                    </p>
                </div>

                <div className="p-6">
                    <label className="block text-xs font-semibold tracking-wide uppercase text-light-text-secondary dark:text-dark-text-secondary mb-2">
                        Your referral link
                    </label>
                    <input
                        readOnly
                        value={link}
                        onFocus={e => e.currentTarget.select()}
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-sm text-light-text-primary dark:text-dark-text-primary font-mono"
                    />

                    {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                            onClick={copy}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary font-semibold text-sm hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                        >
                            {copied ? <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy link'}
                        </button>
                        <button
                            onClick={share}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors"
                        >
                            <WhatsAppIcon className="w-4 h-4" /> Share
                        </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <button
                            onClick={onViewReferrals}
                            className="text-sm font-semibold text-brand-primary hover:underline"
                        >
                            View my referrals
                        </button>
                        <button
                            onClick={onClose}
                            className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:underline"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeShareModal;
