import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { vacatingAPI, uploadAPI, PHOTO_UPLOAD_TARGET_BYTES } from '../services/api';
import { NIGERIAN_STATES } from '../constants/locations';
import { APARTMENT_TYPES, ANY_APARTMENT_TYPE } from '../constants/apartments';
import { formatNaira } from '../utils/format';
import { whatsAppLink, formatPhone, localPart } from '../utils/phone';
import { useToast } from '../contexts/ToastContext';
import { AreaChips, Field, PhoneInput, Select, TextInput, FIELD } from './VacatingFields';
import {
    CalendarIcon, CheckCircleIcon, MapIcon, UsersIcon, WhatsAppIcon,
    ArrowPathIcon, PhotoIcon, ChevronLeftIcon, ResidentialHouseIcon,
} from './icons';

/**
 * "Vacating Soon" — flats with notice already given, and the seekers waiting.
 *
 * Built for a specific failure the team hit: thirty people asked for one
 * neighbourhood in a month and none were housed, because a flat is gone by the
 * time it is listed. Catching it at notice, not at listing, is the point — so
 * both forms are open to guests. A tenant met at their door has no account, and
 * asking them to make one is how you lose the capture.
 */

type Mode = 'choose' | 'tenant' | 'seeker';

interface Vacancy {
    id: number;
    state: string;
    lga?: string | null;
    area: string;
    apartmentType: string;
    rentAmount?: number | null;
    vacateDate: string;
    status: string;
    imageUrl?: string | null;
}

interface Places {
    areas: string[];
    lgas: string[];
}

const TENANT_BLANK = {
    address: '', state: '', lga: '', area: '', apartmentType: '',
    rentAmount: '', vacateDate: '', reason: '', contactName: '', whatsapp: '', imageUrl: '',
};

const SEEKER_BLANK = {
    fullName: '', whatsapp: '', email: '', state: '', lga: '',
    areas: [] as string[], apartmentType: ANY_APARTMENT_TYPE,
    budgetMin: '', budgetMax: '', moveInDate: '',
};

/** "in 12 days" / "on 3 Oct" — the number people actually act on. */
function whenLabel(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
    const on = date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

    if (days <= 0) return `Available now · ${on}`;
    if (days === 1) return `Vacant tomorrow · ${on}`;
    if (days <= 45) return `Vacant in ${days} days · ${on}`;
    return `Vacant ${on}`;
}

// ── pieces ───────────────────────────────────────────────────────────────────

const ChoiceCard: React.FC<{
    title: string;
    blurb: string;
    cta: string;
    icon: React.ReactNode;
    onClick: () => void;
}> = ({ title, blurb, cta, icon, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="text-left p-6 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-brand-primary hover:shadow-lg transition-all flex flex-col"
    >
        <span className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            {icon}
        </span>
        <h3 className="mt-4 text-lg font-bold text-light-text-primary dark:text-dark-text-primary">{title}</h3>
        <p className="mt-1 flex-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{blurb}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-primary">
            {cta} →
        </span>
    </button>
);

const VacancyCard: React.FC<{ vacancy: Vacancy; onContact: (v: Vacancy) => void }> = ({ vacancy, onContact }) => (
    <article className="rounded-2xl overflow-hidden bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border flex flex-col">
        <div className="aspect-[4/3] bg-light-bg dark:bg-dark-bg">
            {vacancy.imageUrl ? (
                <img src={vacancy.imageUrl} alt={`${vacancy.apartmentType} in ${vacancy.area}`} loading="lazy" className="w-full h-full object-cover" />
            ) : (
                <span className="w-full h-full flex items-center justify-center text-light-text-muted dark:text-dark-text-muted">
                    <ResidentialHouseIcon className="w-10 h-10" />
                </span>
            )}
        </div>
        <div className="p-4 flex flex-col flex-1">
            <p className="font-bold text-light-text-primary dark:text-dark-text-primary">{vacancy.apartmentType}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <MapIcon className="w-4 h-4 shrink-0" />
                <span className="line-clamp-1">{[vacancy.area, vacancy.lga, vacancy.state].filter(Boolean).join(', ')}</span>
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary">
                <CalendarIcon className="w-3.5 h-3.5" /> {whenLabel(vacancy.vacateDate)}
            </p>
            {vacancy.rentAmount ? (
                <p className="mt-2 text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
                    {formatNaira(vacancy.rentAmount)}<span className="font-normal text-light-text-secondary dark:text-dark-text-secondary">/year</span>
                </p>
            ) : null}
            <button
                type="button"
                onClick={() => onContact(vacancy)}
                className="mt-4 w-full px-4 py-2.5 rounded-full bg-brand-primary text-white text-sm font-bold hover:bg-brand-secondary transition-colors"
            >
                Contact the tenant
            </button>
        </div>
    </article>
);

const Done: React.FC<{ title: string; body: string; onAgain: () => void; againLabel: string }> = ({
    title, body, onAgain, againLabel,
}) => (
    <div className="max-w-xl mx-auto text-center py-10">
        <CheckCircleIcon className="w-14 h-14 mx-auto text-brand-primary" />
        <h2 className="mt-4 text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">{title}</h2>
        <p className="mt-2 text-light-text-secondary dark:text-dark-text-secondary">{body}</p>
        <button
            type="button"
            onClick={onAgain}
            className="mt-6 px-6 py-3 rounded-full bg-brand-primary text-white font-semibold hover:bg-brand-secondary transition-colors"
        >
            {againLabel}
        </button>
    </div>
);

// ── page ─────────────────────────────────────────────────────────────────────

const VacatingSoonPage: React.FC<{
    currentUser?: any;
    isAuthenticated?: boolean;
}> = ({ currentUser, isAuthenticated = false }) => {
    const { showError } = useToast();

    // The landing page sends people straight to one form; arriving on the
    // chooser after they already chose is a step backwards.
    const [mode, setMode] = useState<Mode>(() => {
        if (typeof window === 'undefined') return 'choose';
        const as = new URLSearchParams(window.location.search).get('as');
        return as === 'tenant' || as === 'seeker' ? as : 'choose';
    });
    const [vacancies, setVacancies] = useState<Vacancy[]>([]);
    const [waitingCount, setWaitingCount] = useState(0);
    const [places, setPlaces] = useState<Places>({ areas: [], lgas: [] });
    const [loading, setLoading] = useState(true);

    const [tenant, setTenant] = useState({ ...TENANT_BLANK });
    const [seeker, setSeeker] = useState({ ...SEEKER_BLANK });
    const [areaDraft, setAreaDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [done, setDone] = useState<{ title: string; body: string } | null>(null);
    const [revealed, setRevealed] = useState<{ vacancy: Vacancy; whatsapp: string; name?: string | null } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res: any = await vacatingAPI.list({ limit: 12 });
            if (res?.success) {
                setVacancies(res.data.vacating ?? []);
                setWaitingCount(res.data.waitingCount ?? 0);
            }
        } catch {
            setVacancies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    // Suggestions come from places already captured, so the second person to
    // type "High Level" spells it the same way as the first — which is what
    // makes the match fire.
    useEffect(() => {
        const state = mode === 'tenant' ? tenant.state : seeker.state;
        let cancelled = false;

        (async () => {
            try {
                const res: any = await vacatingAPI.places(state || undefined);
                if (!cancelled && res?.success) {
                    setPlaces({ areas: res.data.areas ?? [], lgas: res.data.lgas ?? [] });
                }
            } catch { /* suggestions are a convenience, never a blocker */ }
        })();

        return () => { cancelled = true; };
    }, [mode, tenant.state, seeker.state]);

    // Prefill what we already know, so a signed-in seeker types less.
    useEffect(() => {
        if (!currentUser) return;
        setSeeker(prev => ({
            ...prev,
            fullName: prev.fullName || (currentUser.fullName ?? ''),
            email: prev.email || (currentUser.email ?? ''),
            whatsapp: prev.whatsapp || localPart(currentUser.whatsapp || currentUser.phone),
        }));
        setTenant(prev => ({
            ...prev,
            contactName: prev.contactName || (currentUser.fullName ?? ''),
            whatsapp: prev.whatsapp || localPart(currentUser.whatsapp || currentUser.phone),
        }));
    }, [currentUser]);

    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

    const pickPhoto = async (file?: File | null) => {
        if (!file) return;
        setUploading(true);
        try {
            const res: any = await uploadAPI.uploadImage(file, false, PHOTO_UPLOAD_TARGET_BYTES);
            const url = res?.data?.url ?? res?.url ?? '';
            if (url) setTenant(prev => ({ ...prev, imageUrl: url }));
            else showError('Upload failed — you can submit without a photo.');
        } catch (e: any) {
            showError(e?.message || 'Upload failed — you can submit without a photo.');
        } finally {
            setUploading(false);
        }
    };

    const submitTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;

        if (!tenant.state || !tenant.area.trim() || !tenant.apartmentType || !tenant.vacateDate) {
            showError('State, area, apartment type and the vacating date are needed.');
            return;
        }
        if (tenant.whatsapp.replace(/\D/g, '').length < 10) {
            showError('Enter the tenant’s WhatsApp number.');
            return;
        }

        setSaving(true);
        try {
            const res: any = await vacatingAPI.submitVacating({
                address: tenant.address.trim() || undefined,
                state: tenant.state,
                lga: tenant.lga.trim() || undefined,
                area: tenant.area.trim(),
                apartmentType: tenant.apartmentType,
                rentAmount: tenant.rentAmount ? Number(tenant.rentAmount) : undefined,
                vacateDate: tenant.vacateDate,
                reason: tenant.reason.trim() || undefined,
                contactName: tenant.contactName.trim() || undefined,
                whatsapp: `+234${localPart(tenant.whatsapp)}`,
                imageUrl: tenant.imageUrl || undefined,
            });

            if (!res?.success) {
                showError(res?.message || 'Could not save that. Please check the form.');
                return;
            }

            const matched = res.data?.matchedSeekers ?? 0;
            setDone({
                title: 'Recorded — thank you',
                body: matched > 0
                    ? `${matched} ${matched === 1 ? 'person has' : 'people have'} been waiting for an apartment like this. `
                      + 'Our team will be in touch to arrange inspections.'
                    : 'We will let seekers know as soon as they are looking for this area. '
                      + 'Our team may call to confirm the details.',
            });
            setTenant({ ...TENANT_BLANK });
            void load();
        } catch (err: any) {
            showError(err?.message || 'Could not save that.');
        } finally {
            setSaving(false);
        }
    };

    const submitSeeker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;

        // An area typed but not yet added counts. Requiring the + button first
        // means a filled-in form is rejected as empty, which is what happened.
        const typed = areaDraft.trim();
        const areas = typed && !seeker.areas.some(a => a.toLowerCase() === typed.toLowerCase())
            ? [...seeker.areas, typed].slice(0, 5)
            : seeker.areas;

        if (areas !== seeker.areas) {
            setSeeker(prev => ({ ...prev, areas }));
            setAreaDraft('');
        }

        // Named one at a time, so the message points at the field to fix
        // rather than listing everything it could have been.
        if (!seeker.fullName.trim()) {
            showError('Enter your full name.');
            return;
        }
        if (seeker.whatsapp.replace(/\D/g, '').length < 10) {
            showError('Enter your WhatsApp number so we can reach you.');
            return;
        }
        if (!seeker.state) {
            showError('Choose the state you are looking in.');
            return;
        }
        if (areas.length === 0) {
            showError('Add at least one area — type it, then press the + button.');
            return;
        }

        setSaving(true);
        try {
            const res: any = await vacatingAPI.joinWaitlist({
                fullName: seeker.fullName.trim(),
                whatsapp: `+234${localPart(seeker.whatsapp)}`,
                email: seeker.email.trim() || undefined,
                state: seeker.state,
                lga: seeker.lga.trim() || undefined,
                areas,
                apartmentType: seeker.apartmentType,
                budgetMin: seeker.budgetMin ? Number(seeker.budgetMin) : undefined,
                budgetMax: seeker.budgetMax ? Number(seeker.budgetMax) : undefined,
                moveInDate: seeker.moveInDate || undefined,
            });

            if (!res?.success) {
                showError(res?.message || 'Could not join the waitlist.');
                return;
            }

            const found = res.data?.matchesFound ?? 0;
            setDone({
                title: found > 0 ? 'You are on the list — and we have something' : 'You are on the waitlist',
                body: found > 0
                    ? `${found} ${found === 1 ? 'apartment' : 'apartments'} already match what you are looking for. `
                      + 'We will contact you on WhatsApp to arrange an inspection.'
                    : 'You will be notified as soon as an apartment in this area becomes available.',
            });
            setSeeker({ ...SEEKER_BLANK, state: seeker.state });
            setAreaDraft('');
            void load();
        } catch (err: any) {
            showError(err?.message || 'Could not join the waitlist.');
        } finally {
            setSaving(false);
        }
    };

    const contactTenant = async (vacancy: Vacancy) => {
        try {
            const res: any = await vacatingAPI.contact(vacancy.id);
            if (res?.success && res.data?.whatsapp) {
                setRevealed({ vacancy, whatsapp: res.data.whatsapp, name: res.data.name });
            } else {
                showError('This apartment is no longer available.');
                void load();
            }
        } catch {
            showError('Could not fetch the contact just now.');
        }
    };

    if (done) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-10">
                <Done
                    title={done.title}
                    body={done.body}
                    againLabel="Back to Vacating Soon"
                    onAgain={() => { setDone(null); setMode('choose'); }}
                />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
            <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold tracking-wide">
                    <ArrowPathIcon className="w-4 h-4" /> VACATING SOON
                </span>
                <h1 className="mt-4 text-3xl md:text-5xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    Know about an apartment before it is empty
                </h1>
                <p className="mt-3 max-w-2xl mx-auto text-light-text-secondary dark:text-dark-text-secondary">
                    Most apartments are taken before they are ever advertised. Tell us when you are
                    moving out, or join the waitlist for the area you want and hear about it first.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    <span className="inline-flex items-center gap-1.5">
                        <ResidentialHouseIcon className="w-4 h-4 text-brand-primary" />
                        <strong className="text-light-text-primary dark:text-dark-text-primary">{vacancies.length}</strong> coming up
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <UsersIcon className="w-4 h-4 text-brand-primary" />
                        <strong className="text-light-text-primary dark:text-dark-text-primary">{waitingCount}</strong> waiting
                    </span>
                </div>
            </div>

            {mode !== 'choose' && (
                <button
                    type="button"
                    onClick={() => setMode('choose')}
                    className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary"
                >
                    <ChevronLeftIcon className="w-4 h-4" /> Back
                </button>
            )}

            {mode === 'choose' && (
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <ChoiceCard
                        title="I am a tenant"
                        blurb="You have given notice, or you are moving out soon. Tell us when, and we will line up someone to take it over."
                        cta="I'm vacating"
                        icon={<ResidentialHouseIcon className="w-6 h-6" />}
                        onClick={() => setMode('tenant')}
                    />
                    <ChoiceCard
                        title="I am a seeker"
                        blurb="Nothing available in the area you want? Join the waitlist and be told the moment a tenant there gives notice."
                        cta="Join the waitlist"
                        icon={<UsersIcon className="w-6 h-6" />}
                        onClick={() => setMode('seeker')}
                    />
                </div>
            )}

            {/* Shared by both forms: the areas already captured. */}
            <datalist id="vacating-area-suggestions">
                {places.areas.map(a => <option key={a} value={a} />)}
            </datalist>
            <datalist id="vacating-lga-suggestions">
                {places.lgas.map(l => <option key={l} value={l} />)}
            </datalist>

            {mode === 'tenant' && (
                <form onSubmit={submitTenant} className="mt-6 max-w-2xl mx-auto space-y-4 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-7">
                    <div>
                        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Your apartment</h2>
                        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            Only the area, type and date are shown publicly. Your number is given out
                            only when a seeker asks for it.
                        </p>
                    </div>

                    <Field label="Address or landmark" hint="Kept private — it helps our team find the place.">
                        <TextInput value={tenant.address} onChange={v => setTenant({ ...tenant, address: v })} placeholder="e.g. 14 Owner-Occupier Road, off Ankpa Quarters" />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="State" required>
                            <Select value={tenant.state} onChange={v => setTenant({ ...tenant, state: v })} options={NIGERIAN_STATES} placeholder="Select a state" />
                        </Field>
                        <Field label="LGA">
                            <TextInput value={tenant.lga} onChange={v => setTenant({ ...tenant, lga: v })} list="vacating-lga-suggestions" placeholder="e.g. Makurdi" />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Area" required hint="The neighbourhood seekers would name.">
                            <TextInput value={tenant.area} onChange={v => setTenant({ ...tenant, area: v })} list="vacating-area-suggestions" placeholder="e.g. High Level" />
                        </Field>
                        <Field label="Apartment type" required>
                            <Select value={tenant.apartmentType} onChange={v => setTenant({ ...tenant, apartmentType: v })} options={APARTMENT_TYPES} placeholder="Select a type" />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Date you will vacate" required>
                            <TextInput type="date" min={today} value={tenant.vacateDate} onChange={v => setTenant({ ...tenant, vacateDate: v })} />
                        </Field>
                        <Field label="Current rent (₦ per year)" hint="Optional — helps us match people by budget.">
                            <TextInput type="number" value={tenant.rentAmount} onChange={v => setTenant({ ...tenant, rentAmount: v })} placeholder="e.g. 650000" />
                        </Field>
                    </div>

                    <Field label="Reason for leaving">
                        <textarea
                            value={tenant.reason}
                            onChange={e => setTenant({ ...tenant, reason: e.target.value })}
                            rows={2}
                            placeholder="Optional"
                            className={`${FIELD} resize-none`}
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Contact name">
                            <TextInput value={tenant.contactName} onChange={v => setTenant({ ...tenant, contactName: v })} placeholder="Who should we ask for?" />
                        </Field>
                        <Field label="WhatsApp number" required>
                            <PhoneInput value={tenant.whatsapp} onChange={v => setTenant({ ...tenant, whatsapp: v })} />
                        </Field>
                    </div>

                    <Field label="Photo of the apartment" hint="Optional. Helps a seeker decide before travelling to see it.">
                        <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-light-border dark:border-dark-border text-sm text-light-text-secondary dark:text-dark-text-secondary cursor-pointer hover:border-brand-primary">
                                <PhotoIcon className="w-4 h-4" />
                                {uploading ? 'Uploading…' : tenant.imageUrl ? 'Change photo' : 'Add a photo'}
                                <input type="file" accept="image/*" className="hidden" onChange={e => void pickPhoto(e.target.files?.[0])} />
                            </label>
                            {tenant.imageUrl && (
                                <img src={tenant.imageUrl} alt="The apartment" className="w-16 h-16 rounded-xl object-cover" />
                            )}
                        </div>
                    </Field>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full px-6 py-3.5 rounded-full bg-brand-primary text-white font-bold hover:bg-brand-secondary transition-colors disabled:opacity-60"
                    >
                        {saving ? 'Saving…' : 'Submit my apartment'}
                    </button>
                </form>
            )}

            {mode === 'seeker' && (
                <form onSubmit={submitSeeker} className="mt-6 max-w-2xl mx-auto space-y-4 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-7">
                    <div>
                        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Join the waitlist</h2>
                        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            You will be notified as soon as an apartment in this area becomes available.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Full name" required>
                            <TextInput value={seeker.fullName} onChange={v => setSeeker({ ...seeker, fullName: v })} placeholder="Your name" />
                        </Field>
                        <Field label="WhatsApp number" required hint="This is how we reach you first.">
                            <PhoneInput value={seeker.whatsapp} onChange={v => setSeeker({ ...seeker, whatsapp: v })} />
                        </Field>
                    </div>

                    {!isAuthenticated && (
                        <Field label="Email" hint="Optional — so you also get the alert by email.">
                            <TextInput type="email" value={seeker.email} onChange={v => setSeeker({ ...seeker, email: v })} placeholder="you@example.com" />
                        </Field>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Desired state" required>
                            <Select value={seeker.state} onChange={v => setSeeker({ ...seeker, state: v })} options={NIGERIAN_STATES} placeholder="Select a state" />
                        </Field>
                        <Field label="Desired LGA">
                            <TextInput value={seeker.lga} onChange={v => setSeeker({ ...seeker, lga: v })} list="vacating-lga-suggestions" placeholder="e.g. Makurdi" />
                        </Field>
                    </div>

                    <Field label="Desired areas" required hint="Add up to five. More areas, more chances.">
                        <AreaChips
                            values={seeker.areas}
                            onChange={areas => setSeeker({ ...seeker, areas })}
                            draft={areaDraft}
                            onDraftChange={setAreaDraft}
                            suggestions={places.areas}
                        />
                    </Field>

                    <Field label="Apartment type" required>
                        <Select
                            value={seeker.apartmentType}
                            onChange={v => setSeeker({ ...seeker, apartmentType: v })}
                            options={[ANY_APARTMENT_TYPE, ...APARTMENT_TYPES]}
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Budget from (₦)">
                            <TextInput type="number" value={seeker.budgetMin} onChange={v => setSeeker({ ...seeker, budgetMin: v })} placeholder="300000" />
                        </Field>
                        <Field label="Budget to (₦)">
                            <TextInput type="number" value={seeker.budgetMax} onChange={v => setSeeker({ ...seeker, budgetMax: v })} placeholder="800000" />
                        </Field>
                        <Field label="Move-in date">
                            <TextInput type="date" min={today} value={seeker.moveInDate} onChange={v => setSeeker({ ...seeker, moveInDate: v })} />
                        </Field>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full px-6 py-3.5 rounded-full bg-brand-primary text-white font-bold hover:bg-brand-secondary transition-colors disabled:opacity-60"
                    >
                        {saving ? 'Joining…' : 'Join the waitlist'}
                    </button>
                </form>
            )}

            {/* Everything already captured — proof the waitlist is worth joining. */}
            <section className="mt-14">
                <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Coming up soon</h2>
                <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Apartments where the tenant has already given notice.
                </p>

                {loading ? (
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="h-72 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border animate-pulse" />
                        ))}
                    </div>
                ) : vacancies.length === 0 ? (
                    <div className="mt-5 text-center py-12 rounded-2xl border border-dashed border-light-border dark:border-dark-border">
                        <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">Nothing captured yet</p>
                        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary max-w-sm mx-auto">
                            Join the waitlist for your area — you will hear the moment a tenant there gives notice.
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {vacancies.map(v => <VacancyCard key={v.id} vacancy={v} onContact={contactTenant} />)}
                    </div>
                )}
            </section>

            {revealed && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button type="button" aria-label="Close" onClick={() => setRevealed(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div role="dialog" aria-modal="true" className="relative w-full max-w-sm bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-6 text-center shadow-2xl">
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            {revealed.vacancy.apartmentType} in {revealed.vacancy.area}
                        </p>
                        <p className="mt-1 font-bold text-lg text-light-text-primary dark:text-dark-text-primary">
                            {revealed.name || 'The tenant'}
                        </p>
                        <p className="mt-1 text-sm text-light-text-primary dark:text-dark-text-primary">
                            {formatPhone(revealed.whatsapp)}
                        </p>
                        <a
                            href={whatsAppLink(revealed.whatsapp, `Hello, I saw on ShelTrify that your ${revealed.vacancy.apartmentType} in ${revealed.vacancy.area} will be vacant soon. Is it still available?`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#25D366] text-white text-sm font-bold"
                        >
                            <WhatsAppIcon className="w-4 h-4" /> Message on WhatsApp
                        </a>
                        <p className="mt-3 text-[11px] text-light-text-muted dark:text-dark-text-muted">
                            Pay the landlord directly. Never send money before seeing the apartment.
                        </p>
                        <button
                            type="button"
                            onClick={() => setRevealed(null)}
                            className="mt-3 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VacatingSoonPage;
