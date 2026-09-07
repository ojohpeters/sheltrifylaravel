import React, { useState, useEffect } from 'react';
import { CloseIcon, UserIcon } from './icons';
import { referralAPI } from '../services/api';
import { getReferralCode } from '../referral';

const DISMISS_KEY = 'sheltrify:inviteBannerDismissed';

interface Inviter {
    firstName?: string | null;
    avatarUrl?: string | null;
}

/**
 * Shown to a signed-out visitor who arrived on somebody's invite link.
 *
 * A bare `?ref=` link gives the invitee no signal they were invited at all —
 * they land on a generic homepage. Naming the person who invited them turns
 * the link back into a personal recommendation, which is the thing that
 * actually converts.
 *
 * Deliberately a slim bar rather than a modal: the stored code lasts 30 days
 * and people browse before signing up, so this has to be able to sit there
 * across a long visit without being in the way.
 */
const ReferralInviteBanner: React.FC<{ onJoin: () => void }> = ({ onJoin }) => {
    const [inviter, setInviter] = useState<Inviter | null>(null);
    const [bonus, setBonus] = useState(0);
    const [dismissed, setDismissed] = useState(() => {
        try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
    });

    useEffect(() => {
        if (dismissed) return;

        const code = getReferralCode();
        if (!code) return;

        let cancelled = false;
        referralAPI.lookup(code)
            .then((res: any) => {
                // An unknown or expired code simply yields no banner. Nothing is
                // shown and nothing is said — the visitor never asked about it.
                if (!cancelled && res?.success && res.data?.inviter?.firstName) {
                    setInviter(res.data.inviter);
                    setBonus(Number(res.data.inviteeBonus) || 0);
                }
            })
            .catch(() => { /* the invite is a nicety; never surface a failure */ });

        return () => { cancelled = true; };
    }, [dismissed]);

    if (dismissed || !inviter?.firstName) return null;

    const dismiss = () => {
        setDismissed(true);
        try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode */ }
    };

    return (
        <div className="border-b border-brand-primary/20 bg-brand-primary/[0.07]">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
                {inviter.avatarUrl ? (
                    <img
                        src={inviter.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-primary/30 flex-shrink-0"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-primary/15 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-brand-primary" />
                    </div>
                )}

                <p className="min-w-0 flex-1 text-sm text-light-text-primary dark:text-dark-text-primary truncate">
                    <span className="font-semibold">{inviter.firstName}</span>
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">
                        {' '}invited you to ShelTrify
                        {bonus > 0 && <> &mdash; get <span className="font-semibold text-brand-primary">{bonus.toLocaleString()} SWC</span> when you join</>}
                    </span>
                </p>

                <button
                    onClick={onJoin}
                    className="flex-shrink-0 px-4 py-1.5 rounded-full bg-brand-primary text-white text-xs font-bold hover:bg-brand-secondary transition-colors"
                >
                    Join free
                </button>

                <button
                    onClick={dismiss}
                    aria-label="Dismiss invitation"
                    className="flex-shrink-0 p-1 -mr-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary transition-colors"
                >
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ReferralInviteBanner;
