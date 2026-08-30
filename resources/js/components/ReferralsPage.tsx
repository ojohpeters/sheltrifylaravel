import React, { useState, useEffect, useCallback } from 'react';
import { UsersIcon, LinkIcon, CoinIcon, CheckCircleIcon, WhatsAppIcon } from './icons';
import { dashboardAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { referralLinkFor } from '../referral';

interface EarningEntry {
    id: number | string;
    amount: number;
    description: string;
    date?: string | null;
}

const Stat: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5">
        <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary">
            {icon}
            <span className="text-xs font-semibold tracking-wide uppercase">{label}</span>
        </div>
        <p className="mt-2 text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">{value}</p>
    </div>
);

const ReferralsPage: React.FC<{ currentUser?: { referralCode?: string | null } | null }> = ({ currentUser }) => {
    const { showSuccess, showError } = useToast();
    const [history, setHistory] = useState<EarningEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const code = currentUser?.referralCode || '';
    const link = code ? referralLinkFor(code) : '';

    const load = useCallback(async () => {
        try {
            const res: any = await dashboardAPI.getEarnings();
            if (res?.success) {
                const entries: EarningEntry[] = (res.data.earningsHistory || []);
                setHistory(entries);
                setTotal(res.data.totalEarnings || 0);
            }
        } catch {
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const copy = async () => {
        if (!link) return;
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            showSuccess('Referral link copied.');
        } catch {
            // Clipboard is unavailable over plain HTTP and in some in-app
            // browsers; selecting the text is the reliable fallback.
            showError('Could not copy automatically — select the link and copy it.');
        }
    };

    const share = async () => {
        if (!link) return;
        const text = `Join me on ShelTrify — find homes, shortlets, land and trusted local artisans across Nigeria.`;
        // Web Share gives the native sheet on Android, which is where most of
        // this sharing happens; falls back to WhatsApp elsewhere.
        if (navigator.share) {
            try {
                await navigator.share({ title: 'ShelTrify', text, url: link });
                return;
            } catch {
                return; // user dismissed the sheet
            }
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`, '_blank', 'noopener');
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
            <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold tracking-wide">
                    <UsersIcon className="w-4 h-4" /> REFER &amp; EARN
                </span>
                <h1 className="mt-4 text-3xl md:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    Invite friends, earn SWC
                </h1>
                <p className="mt-3 max-w-xl mx-auto text-light-text-secondary dark:text-dark-text-secondary">
                    Share your link. When someone joins ShelTrify through it, the reward lands
                    in your wallet.
                </p>
            </div>

            <div className="mt-8 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 md:p-6">
                <label className="block text-xs font-semibold tracking-wide uppercase text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    Your referral link
                </label>

                {link ? (
                    <>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                readOnly
                                value={link}
                                onFocus={e => e.currentTarget.select()}
                                className="flex-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-sm text-light-text-primary dark:text-dark-text-primary font-mono"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={copy}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-primary text-white font-semibold text-sm hover:bg-brand-secondary transition-colors"
                                >
                                    {copied ? <CheckCircleIcon className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                                <button
                                    onClick={share}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors"
                                >
                                    <WhatsAppIcon className="w-4 h-4" /> Share
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                            Your code: <span className="font-mono font-semibold">{code}</span>
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        Your referral link is being generated. Refresh in a moment.
                    </p>
                )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
                <Stat
                    label="Total referrals"
                    value={loading ? '—' : String(history.length)}
                    icon={<UsersIcon className="w-4 h-4" />}
                />
                <Stat
                    label="Earned"
                    value={loading ? '—' : `${total.toLocaleString()} SWC`}
                    icon={<CoinIcon className="w-4 h-4" />}
                />
            </div>

            <div className="mt-8">
                <h2 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-3">
                    Referral history
                </h2>
                {loading ? (
                    <div className="space-y-2">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="h-16 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border animate-pulse" />
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl">
                        <UsersIcon className="w-10 h-10 mx-auto text-light-text-muted dark:text-dark-text-muted" />
                        <p className="mt-2 font-semibold text-light-text-primary dark:text-dark-text-primary">
                            No referrals yet
                        </p>
                        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            Share your link above to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {history.map(h => (
                            <div key={h.id} className="flex items-center justify-between gap-3 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary truncate">
                                        {h.description}
                                    </p>
                                    {h.date && (
                                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                            {new Date(h.date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                    +{Number(h.amount).toLocaleString()} SWC
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReferralsPage;
