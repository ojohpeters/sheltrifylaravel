import React, { useCallback, useEffect, useState } from 'react';
import { vacatingAPI } from '../services/api';
import { formatNaira } from '../utils/format';
import { formatPhone, whatsAppLink } from '../utils/phone';
import { useToast } from '../contexts/ToastContext';
import { ArrowPathIcon, CalendarIcon, MapIcon, UsersIcon, WhatsAppIcon } from './icons';

/**
 * Admin view for Vacating Soon: what has been captured, who is waiting, and
 * which of them have been paired.
 *
 * The WhatsApp button on each match is the part that matters. Sending a message
 * to someone who has not messaged first needs the WhatsApp Business Cloud API
 * and an approved template, which this account does not have — so the message
 * is prepared here and the team sends it with one tap, which is how the
 * door-to-door capture works anyway.
 */

type Tab = 'vacating' | 'waitlist' | 'matches';

const VACATING_STATUSES = ['available', 'reserved', 'taken', 'withdrawn', 'expired'];
const MATCH_STATUSES = ['new', 'contacted', 'viewing', 'closed', 'dropped'];

const STATUS_TONE: Record<string, string> = {
    available: 'bg-green-500/10 text-green-600 dark:text-green-400',
    reserved: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    taken: 'bg-light-border/60 dark:bg-dark-border/60 text-light-text-secondary dark:text-dark-text-secondary',
    new: 'bg-brand-primary/10 text-brand-primary',
    contacted: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    viewing: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    closed: 'bg-green-500/10 text-green-600 dark:text-green-400',
};

const Pill: React.FC<{ status: string }> = ({ status }) => (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${STATUS_TONE[status] ?? 'bg-light-border/60 dark:bg-dark-border/60 text-light-text-secondary dark:text-dark-text-secondary'}`}>
        {status}
    </span>
);

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border p-4">
        {children}
    </div>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
    <p className="py-12 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">{text}</p>
);

const VacatingAdminPanel: React.FC = () => {
    const { showSuccess, showError } = useToast();

    const [tab, setTab] = useState<Tab>('vacating');
    const [vacating, setVacating] = useState<any[]>([]);
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [demand, setDemand] = useState<{ value: string; count: number }[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [v, w, m]: any[] = await Promise.all([
                vacatingAPI.adminVacating(),
                vacatingAPI.adminWaitlist(),
                vacatingAPI.adminMatches(),
            ]);
            if (v?.success) setVacating(v.data.vacating ?? []);
            if (w?.success) { setWaitlist(w.data.waitlist ?? []); setDemand(w.data.demand ?? []); }
            if (m?.success) setMatches(m.data.matches ?? []);
        } catch {
            showError('Could not load the Vacating Soon data.');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => { void load(); }, [load]);

    const setVacatingStatus = async (id: number, status: string) => {
        try {
            const res: any = await vacatingAPI.adminUpdateVacating(id, { status });
            if (res?.success) {
                setVacating(prev => prev.map(v => (v.id === id ? { ...v, status } : v)));
                showSuccess('Updated');
            }
        } catch { showError('Could not update that.'); }
    };

    const setMatchStatus = async (id: number, status: string) => {
        try {
            const res: any = await vacatingAPI.adminUpdateMatch(id, { status });
            if (res?.success) {
                setMatches(prev => prev.map(m => (m.id === id ? { ...m, status } : m)));
            }
        } catch { showError('Could not update that.'); }
    };

    const rematch = async (id: number) => {
        try {
            const res: any = await vacatingAPI.adminRematch(id);
            if (res?.success) {
                showSuccess(res.message || 'Re-matched');
                void load();
            }
        } catch { showError('Could not re-run the match.'); }
    };

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: 'vacating', label: 'Vacating', count: vacating.length },
        { id: 'waitlist', label: 'Waitlist', count: waitlist.length },
        { id: 'matches', label: 'Matches', count: matches.filter(m => m.status === 'new').length },
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            tab === t.id
                                ? 'bg-brand-primary text-white'
                                : 'bg-light-bg dark:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary'
                        }`}
                    >
                        {t.label} ({t.count})
                    </button>
                ))}
                <button
                    onClick={() => void load()}
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary"
                >
                    <ArrowPathIcon className="w-4 h-4" /> Refresh
                </button>
            </div>

            {loading ? (
                <Empty text="Loading…" />
            ) : tab === 'vacating' ? (
                vacating.length === 0 ? (
                    <Empty text="No apartments captured yet. Tenants submit these from the Vacating Soon page." />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {vacating.map(v => (
                            <Card key={v.id}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-bold text-light-text-primary dark:text-dark-text-primary">
                                            {v.apartmentType}
                                        </p>
                                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                            <MapIcon className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{[v.area, v.lga, v.state].filter(Boolean).join(', ')}</span>
                                        </p>
                                    </div>
                                    <Pill status={v.status} />
                                </div>

                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                    <span className="inline-flex items-center gap-1">
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                        {v.vacateDate?.slice(0, 10)}
                                        {typeof v.daysToVacate === 'number' && v.daysToVacate >= 0 && ` · ${v.daysToVacate}d`}
                                    </span>
                                    {v.rentAmount ? <span>{formatNaira(v.rentAmount)}/yr</span> : null}
                                    <span className="inline-flex items-center gap-1">
                                        <UsersIcon className="w-3.5 h-3.5" /> {v.matchCount ?? 0} matched
                                    </span>
                                </div>

                                {v.address && (
                                    <p className="mt-2 text-xs text-light-text-muted dark:text-dark-text-muted">{v.address}</p>
                                )}

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {v.whatsapp && (
                                        <a
                                            href={whatsAppLink(v.whatsapp, `Hello${v.contactName ? ' ' + v.contactName : ''}, this is ShelTrify about the ${v.apartmentType} in ${v.area} you told us is being vacated.`)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-bold"
                                        >
                                            <WhatsAppIcon className="w-3.5 h-3.5" /> {formatPhone(v.whatsapp)}
                                        </a>
                                    )}
                                    <select
                                        value={v.status}
                                        onChange={e => void setVacatingStatus(v.id, e.target.value)}
                                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary"
                                    >
                                        {VACATING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <button
                                        onClick={() => void rematch(v.id)}
                                        className="px-3 py-1.5 rounded-full text-xs font-semibold border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary hover:border-brand-primary"
                                    >
                                        Re-match
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )
            ) : tab === 'waitlist' ? (
                <>
                    {demand.length > 0 && (
                        <Card>
                            <p className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
                                Demand by area
                            </p>
                            <p className="mt-0.5 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                Where to knock on doors first.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {demand.map(d => (
                                    <span key={d.value} className="px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
                                        {d.value} · {d.count}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    )}

                    {waitlist.length === 0 ? (
                        <Empty text="Nobody on the waitlist yet." />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {waitlist.map(w => (
                                <Card key={w.id}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-bold text-light-text-primary dark:text-dark-text-primary truncate">{w.fullName}</p>
                                            <p className="mt-0.5 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                                {w.apartmentType} · {(w.areas ?? []).join(', ')}
                                            </p>
                                            <p className="mt-0.5 text-xs text-light-text-muted dark:text-dark-text-muted">
                                                {[w.lga, w.state].filter(Boolean).join(', ')}
                                                {w.budgetMax ? ` · up to ${formatNaira(w.budgetMax)}` : ''}
                                                {w.moveInDate ? ` · moves ${String(w.moveInDate).slice(0, 10)}` : ''}
                                            </p>
                                        </div>
                                        <Pill status={w.status} />
                                    </div>
                                    {w.whatsapp && (
                                        <a
                                            href={whatsAppLink(w.whatsapp, `Hello ${String(w.fullName).split(' ')[0]}, this is ShelTrify about the apartment you are waiting for.`)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-bold"
                                        >
                                            <WhatsAppIcon className="w-3.5 h-3.5" /> {formatPhone(w.whatsapp)}
                                        </a>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            ) : matches.length === 0 ? (
                <Empty text="No matches yet. They are created automatically when a capture fits someone on the waitlist." />
            ) : (
                <div className="space-y-3">
                    {matches.map(m => (
                        <Card key={m.id}>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-light-text-primary dark:text-dark-text-primary truncate">
                                        {m.waitlistEntry?.fullName} → {m.vacating?.apartmentType} in {m.vacating?.area}
                                    </p>
                                    <p className="mt-0.5 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                        Vacant {String(m.vacating?.vacateDate ?? '').slice(0, 10)}
                                        {m.notifiedAt ? ` · contacted ${String(m.notifiedAt).slice(0, 10)}` : ''}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Pill status={m.status} />
                                    {m.whatsappUrl && (
                                        <a
                                            href={m.whatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => { if (m.status === 'new') void setMatchStatus(m.id, 'contacted'); }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-bold"
                                        >
                                            <WhatsAppIcon className="w-3.5 h-3.5" /> Send
                                        </a>
                                    )}
                                    <select
                                        value={m.status}
                                        onChange={e => void setMatchStatus(m.id, e.target.value)}
                                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary"
                                    >
                                        {MATCH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VacatingAdminPanel;
