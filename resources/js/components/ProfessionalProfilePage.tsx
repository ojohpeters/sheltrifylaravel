import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { userAPI, uploadAPI, PHOTO_UPLOAD_TARGET_BYTES } from '../services/api';
import { ARTISAN_CATEGORIES, serviceLabel } from '../constants/services';
import { NIGERIAN_STATES } from '../constants/locations';
import { localPart } from '../utils/phone';

const INPUT = 'w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none';
const LABEL = 'block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1';

/** Sorted by name: at 27 trades, taxonomy order is too long to scan. */
const TRADES_BY_NAME = [...ARTISAN_CATEGORIES].sort((a, b) => a.label.localeCompare(b.label));

const Optional: React.FC = () => (
    <span className="text-light-text-secondary dark:text-dark-text-secondary font-normal">(optional)</span>
);

const SectionTitle: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (
    <div className="mb-3">
        <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary">{title}</h3>
        {sub && <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{sub}</p>}
    </div>
);

// ── Listing details ──────────────────────────────────────────────────────────

/** What seekers see on the Local Artisans page. */
interface ListingDetails {
    phone: string;          // local part only — the +234 is a fixed prefix in the input
    whatsapp: string;
    state: string;
    lga: string;
    bio: string;
    experienceYears: string;
    avatarUrl: string;
}

function detailsFromUser(user: any): ListingDetails {
    return {
        phone: localPart(user?.phone),
        whatsapp: localPart(user?.whatsapp),
        state: user?.artisanState ?? '',
        lga: user?.artisanLga ?? '',
        bio: user?.artisanBio ?? '',
        experienceYears: user?.artisanExperienceYears != null ? String(user.artisanExperienceYears) : '',
        avatarUrl: user?.avatarUrl ?? '',
    };
}

/** Numbers go up with +234 so the server stores the international form WhatsApp needs. */
function detailsPayload(d: ListingDetails) {
    const withCode = (local: string) => (local ? `+234${local}` : null);
    return {
        phone: withCode(d.phone),
        whatsapp: withCode(d.whatsapp),
        state: d.state || null,
        lga: d.lga.trim() || null,
        bio: d.bio.trim() || null,
        experienceYears: d.experienceYears === '' ? null : Number(d.experienceYears),
        avatarUrl: d.avatarUrl || null,
    };
}

/** A Nigerian number is 10 digits after +234, or 11 if typed with the leading 0. */
function phoneProblem(details: ListingDetails): string | null {
    for (const [label, value] of [['Phone number', details.phone], ['WhatsApp number', details.whatsapp]] as const) {
        if (value && !/^0?\d{10}$/.test(value)) {
            return `${label} should be 10 digits after +234, or 11 digits starting with 0.`;
        }
    }
    return null;
}

const PhoneField: React.FC<{ label: string; value: string; onChange: (v: string) => void; hint?: string }> = ({ label, value, onChange, hint }) => (
    <div>
        <label className={LABEL}>{label} <Optional /></label>
        <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-light-border dark:border-dark-border bg-light-border/40 dark:bg-dark-border/40 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">
                +234
            </span>
            <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={11}
                value={value}
                onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
                placeholder="807 588 7105"
                className={`${INPUT} rounded-l-none`}
            />
        </div>
        {hint && <p className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">{hint}</p>}
    </div>
);

/**
 * The seeker-facing fields, shared by the application form and the editor shown
 * after applying. Declared at module level so its inputs keep focus while
 * typing — a component declared inside a render is recreated on every keystroke.
 */
const ArtisanDetailsFields: React.FC<{
    value: ListingDetails;
    onChange: (patch: Partial<ListingDetails>) => void;
}> = ({ value, onChange }) => {
    const pickRef = useRef<HTMLInputElement>(null);
    const camRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);

    const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';   // allow choosing the same file again after a failure
        if (!file) return;

        setUploading(true);
        setPhotoError(null);
        try {
            const res: any = await uploadAPI.uploadImage(file, true, PHOTO_UPLOAD_TARGET_BYTES);
            if (!res?.data?.url) throw new Error('Upload returned no URL.');
            onChange({ avatarUrl: res.data.url });
        } catch (err: any) {
            setPhotoError(err?.message || 'Could not upload the photo.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className={LABEL}>Profile Photo <Optional /></label>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    A clear, well-lit photo of your face gets more calls — seekers see it first.
                </p>

                {/* Two inputs: `capture` opens the camera straight away on a phone
                    but hides the gallery, so the plain picker stays for choosing an
                    existing photo. */}
                <input type="file" accept="image/*" ref={pickRef} onChange={handlePhoto} className="hidden" />
                <input type="file" accept="image/*" capture="user" ref={camRef} onChange={handlePhoto} className="hidden" />

                <div className="flex items-center gap-3 flex-wrap">
                    {value.avatarUrl ? (
                        <img src={value.avatarUrl} alt="" className="w-20 h-24 rounded-xl object-cover object-top border border-light-border dark:border-dark-border" />
                    ) : (
                        <div className="w-20 h-24 rounded-xl bg-light-bg dark:bg-dark-bg border-2 border-dashed border-light-border dark:border-dark-border flex items-center justify-center text-2xl">
                            👤
                        </div>
                    )}
                    <button
                        type="button"
                        disabled={uploading}
                        onClick={() => camRef.current?.click()}
                        className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-secondary disabled:opacity-60 transition"
                    >
                        {uploading ? 'Uploading…' : '📷 Take photo'}
                    </button>
                    <button
                        type="button"
                        disabled={uploading}
                        onClick={() => pickRef.current?.click()}
                        className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-sm font-semibold text-light-text-primary dark:text-dark-text-primary hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-60 transition"
                    >
                        {value.avatarUrl ? 'Change photo' : 'Choose photo'}
                    </button>
                </div>
                {photoError && <p className="mt-1.5 text-xs text-red-500">{photoError}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PhoneField
                    label="Phone Number"
                    value={value.phone}
                    onChange={v => onChange({ phone: v })}
                    hint="Seekers tap Call Now to reach this number."
                />
                <PhoneField
                    label="WhatsApp Number"
                    value={value.whatsapp}
                    onChange={v => onChange({ whatsapp: v })}
                    hint="Leave blank if it's the same as your phone."
                />

                <div>
                    <label className={LABEL}>State <Optional /></label>
                    <select value={value.state} onChange={e => onChange({ state: e.target.value })} className={INPUT}>
                        <option value="">Select state…</option>
                        {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className={LABEL}>LGA <Optional /></label>
                    <input
                        value={value.lga}
                        onChange={e => onChange({ lga: e.target.value })}
                        maxLength={80}
                        placeholder="e.g. Makurdi"
                        className={INPUT}
                    />
                </div>

                <div>
                    <label className={LABEL}>Years of Experience <Optional /></label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={value.experienceYears}
                        onChange={e => onChange({ experienceYears: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                        placeholder="e.g. 5"
                        className={INPUT}
                    />
                </div>

                <div className="sm:col-span-2">
                    <label className={LABEL}>Bio / Description <Optional /></label>
                    <textarea
                        rows={4}
                        maxLength={1000}
                        value={value.bio}
                        onChange={e => onChange({ bio: e.target.value })}
                        placeholder="What work do you do, what are you known for, and which areas do you cover?"
                        className={`${INPUT} resize-none`}
                    />
                    <p className="mt-1 text-xs text-right text-light-text-muted dark:text-dark-text-muted">{value.bio.length}/1000</p>
                </div>
            </div>
        </div>
    );
};

// ── Status ───────────────────────────────────────────────────────────────────

const StatusCard: React.FC<{ profile: any }> = ({ profile }) => {
    const configs: Record<string, { bg: string; border: string; text: string; icon: string; title: string; body: string }> = {
        pending:  { bg: 'bg-blue-500/10',  border: 'border-blue-500/30',  text: 'text-blue-600 dark:text-blue-400',  icon: '⏳', title: 'Under Review', body: 'Your application is being reviewed by our team. This typically takes 1–3 business days. You can keep your listing details up to date below in the meantime.' },
        approved: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400', icon: '✅', title: 'Verified', body: 'You are verified and listed on the Local Artisans page. Keep your details current so seekers can reach you.' },
        rejected: { bg: 'bg-red-500/10',   border: 'border-red-500/30',   text: 'text-red-600 dark:text-red-400',   icon: '❌', title: 'Not approved yet', body: profile?.rejectionReason || 'Your application did not meet our requirements. Update it below and resubmit.' },
    };
    const config = configs[profile?.status as string];
    if (!config) return null;

    return (
        <div className={`mb-6 p-4 rounded-2xl border ${config.bg} ${config.border} flex items-start gap-3`}>
            <span className="text-2xl">{config.icon}</span>
            <div>
                <p className={`font-bold ${config.text}`}>{config.title}</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{config.body}</p>
            </div>
        </div>
    );
};

// ── Page ─────────────────────────────────────────────────────────────────────

const ProfessionalProfilePage: React.FC<{ currentUser: any }> = ({ currentUser }) => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const knownTrade = ARTISAN_CATEGORIES.some(c => c.value === currentUser?.artisanService)
        ? currentUser.artisanService
        : '';

    const [form, setForm] = useState({
        // No default trade. Defaulting to the first in the list meant anyone who
        // skipped the field was silently submitted as a plumber.
        professionalType: knownTrade as string,
        companyName: '', licenseNumber: '', ninNumber: '',
        professionalBody: '', membershipId: '', businessAddress: '',
    });

    const [details, setDetails] = useState<ListingDetails>(() => detailsFromUser(currentUser));
    const patchDetails = (patch: Partial<ListingDetails>) => setDetails(d => ({ ...d, ...patch }));

    const [savingDetails, setSavingDetails] = useState(false);
    const [detailsMessage, setDetailsMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const [licenseFile, setLicenseFile]       = useState<File | null>(null);
    const [membershipFile, setMembershipFile] = useState<File | null>(null);
    const [licensePrev, setLicensePrev]       = useState<string | null>(null);
    const [membershipPrev, setMembershipPrev] = useState<string | null>(null);

    const licenseRef       = useRef<HTMLInputElement>(null);
    const membershipRef    = useRef<HTMLInputElement>(null);
    const licenseCamRef    = useRef<HTMLInputElement>(null);
    const membershipCamRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        userAPI.getProfessionalProfile().then(r => {
            const p = r.success ? r.data?.profile : null;
            if (!p) return;
            setProfile(p);
            // Prefill a resubmission rather than making a rejected applicant start over.
            setForm(f => ({
                ...f,
                professionalType: p.professionalType || f.professionalType,
                companyName: p.companyName || '',
                licenseNumber: p.licenseNumber || '',
                ninNumber: p.ninNumber || '',
                professionalBody: p.professionalBody || '',
                membershipId: p.membershipId || '',
                businessAddress: p.businessAddress || '',
            }));
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const handleFile = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (f: File | null) => void,
        prevSetter: (s: string | null) => void,
    ) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setter(f);
        const r = new FileReader();
        r.onloadend = () => prevSetter(r.result as string);
        r.readAsDataURL(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.professionalType) { setError('Choose the trade you practise.'); return; }
        if (!/^\d{11}$/.test(form.ninNumber)) { setError('NIN must be exactly 11 digits.'); return; }
        const phoneIssue = phoneProblem(details);
        if (phoneIssue) { setError(phoneIssue); return; }

        setSubmitting(true);
        setError(null);

        try {
            // Documents keep the default upload target, not the 200 KB photo one:
            // a reviewer has to be able to read the numbers on them.
            const [licRes, memRes] = await Promise.all([
                licenseFile ? uploadAPI.uploadImage(licenseFile, true) : Promise.resolve(null),
                membershipFile ? uploadAPI.uploadImage(membershipFile, true) : Promise.resolve(null),
            ]);

            if (licenseFile && !licRes?.success) throw new Error('Licence upload failed');
            if (membershipFile && !memRes?.success) throw new Error('Membership card upload failed');

            const res = await userAPI.submitProfessionalProfile({
                ...form,
                ...detailsPayload(details),
                yearsExperience: details.experienceYears,
                licenseUrl: licRes?.data?.url ?? undefined,
                membershipDocUrl: memRes?.data?.url ?? undefined,
            });
            if (!res.success) throw new Error(res.message || 'Submission failed');

            setSuccess(true);
            setProfile(res.data);
            router.reload({ only: ['auth'] });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            setError(err.message || 'Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const saveDetails = async () => {
        const phoneIssue = phoneProblem(details);
        if (phoneIssue) { setDetailsMessage({ ok: false, text: phoneIssue }); return; }

        setSavingDetails(true);
        setDetailsMessage(null);
        try {
            const res: any = await userAPI.updateArtisanDetails(detailsPayload(details));
            if (!res?.success) throw new Error(res?.message || 'Could not save your details.');
            setDetailsMessage({ ok: true, text: res.message || 'Your listing details are saved.' });
            router.reload({ only: ['auth'] });
        } catch (err: any) {
            setDetailsMessage({ ok: false, text: err?.message || 'Could not save your details.' });
        } finally {
            setSavingDetails(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">Loading...</p>
            </div>
        </div>
    );

    const status = profile?.status;
    const showApplicationForm = (!profile || status === 'rejected') && !success;
    const showDetailsEditor = !!profile && !showApplicationForm;

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-primary px-4 sm:px-6 pt-6 pb-16">
                <div className="max-w-3xl mx-auto">
                    <p className="text-white/70 text-sm font-semibold uppercase tracking-wider">Artisan Verification</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Professional Skills Artisans</h1>
                    <p className="text-white/70 text-sm mt-1">Verify your identity to be listed and start getting hired on Sheltrify</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-10 pb-16">
                {!profile && (
                    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 mb-6 shadow-sm">
                        <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-1">What you need</h3>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
                            Only your NIN and trade are required. The more you add, the more seekers trust and
                            hire you — you can snap photos straight from your phone.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { icon: '🪪', text: 'Your 11-digit NIN — required' },
                                { icon: '🛠️', text: 'The trade you practise — required' },
                                { icon: '📱', text: 'Phone and WhatsApp numbers' },
                                { icon: '📍', text: 'Your state and LGA' },
                                { icon: '📷', text: 'A clear photo of your face' },
                                { icon: '📜', text: 'Certificate or membership card' },
                            ].map(item => (
                                <div key={item.text} className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                    <span>{item.icon}</span><span>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <StatusCard profile={profile} />

                {success && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
                        <span className="text-3xl block mb-2">🎉</span>
                        <p className="font-bold text-green-600 dark:text-green-400">Application submitted!</p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                            Our team will review it within 1–3 business days.
                        </p>
                    </div>
                )}

                {showApplicationForm && (
                    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-6">
                        <h2 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary mb-5">
                            {status === 'rejected' ? 'Update and resubmit your application' : 'Apply to be listed'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <section>
                                <SectionTitle title="Your trade" />
                                <label className={LABEL}>Trade <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={form.professionalType}
                                    onChange={e => setForm({ ...form, professionalType: e.target.value })}
                                    className={INPUT}
                                >
                                    <option value="">Select your trade…</option>
                                    {TRADES_BY_NAME.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </section>

                            <section className="border-t border-light-border dark:border-dark-border pt-6">
                                <SectionTitle title="What seekers see" sub="Shown on your listing on the Local Artisans page." />
                                <ArtisanDetailsFields value={details} onChange={patchDetails} />
                            </section>

                            <section className="border-t border-light-border dark:border-dark-border pt-6">
                                <SectionTitle title="Verification" sub="Private — used only to confirm who you are." />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className={LABEL}>NIN Number <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={11}
                                            required
                                            value={form.ninNumber}
                                            onChange={e => setForm({ ...form, ninNumber: e.target.value.replace(/\D/g, '') })}
                                            placeholder="12345678901"
                                            className={`${INPUT} font-mono tracking-widest`}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Business Name <Optional /></label>
                                        <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="e.g. Musa Plumbing Services" className={INPUT} />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Licence Number <Optional /></label>
                                        <input value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} placeholder="If you have one" className={INPUT} />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Professional Body <Optional /></label>
                                        <input value={form.professionalBody} onChange={e => setForm({ ...form, professionalBody: e.target.value })} placeholder="Association or union, if any" className={INPUT} />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Membership ID <Optional /></label>
                                        <input value={form.membershipId} onChange={e => setForm({ ...form, membershipId: e.target.value })} placeholder="MEM/2024/001" className={INPUT} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={LABEL}>Business Address <Optional /></label>
                                        <input value={form.businessAddress} onChange={e => setForm({ ...form, businessAddress: e.target.value })} placeholder="Where customers can find you, if anywhere" className={INPUT} />
                                    </div>
                                </div>
                            </section>

                            <section className="border-t border-light-border dark:border-dark-border pt-6 space-y-4">
                                <SectionTitle title="Supporting documents" sub="Both optional. Adding them helps your application get approved faster." />

                                {[
                                    { label: 'Trade Certificate or Licence', ref: licenseRef, camRef: licenseCamRef,
                                      file: licenseFile, preview: licensePrev, setter: setLicenseFile, prevSetter: setLicensePrev, icon: '📜' },
                                    { label: 'Membership Card', ref: membershipRef, camRef: membershipCamRef,
                                      file: membershipFile, preview: membershipPrev, setter: setMembershipFile, prevSetter: setMembershipPrev, icon: '🎓' },
                                ].map(doc => (
                                    <div key={doc.label}>
                                        <label className={`${LABEL} mb-2`}>{doc.label} <Optional /></label>

                                        {/* `capture` opens the camera directly but hides the gallery,
                                            so the plain input stays for an existing file or a PDF. */}
                                        <input type="file" accept="image/*,.pdf" ref={doc.ref}
                                            onChange={e => handleFile(e, doc.setter, doc.prevSetter)} className="hidden" />
                                        <input type="file" accept="image/*" capture="environment" ref={doc.camRef}
                                            onChange={e => handleFile(e, doc.setter, doc.prevSetter)} className="hidden" />

                                        <div className="flex items-center gap-3 flex-wrap">
                                            {doc.preview
                                                ? <img src={doc.preview} className="w-20 h-20 object-cover rounded-xl border border-light-border dark:border-dark-border" alt="" />
                                                : <div className="w-20 h-20 rounded-xl bg-light-bg dark:bg-dark-bg border-2 border-dashed border-light-border dark:border-dark-border flex items-center justify-center text-2xl">{doc.icon}</div>
                                            }
                                            <button type="button" onClick={() => doc.camRef.current?.click()}
                                                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-secondary transition">
                                                📷 Take photo
                                            </button>
                                            <button type="button" onClick={() => doc.ref.current?.click()}
                                                className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-sm font-semibold text-light-text-primary dark:text-dark-text-primary hover:bg-light-border dark:hover:bg-dark-border transition">
                                                {doc.file ? 'Change file' : 'Choose file'}
                                            </button>
                                            {doc.file && (
                                                <button type="button"
                                                    onClick={() => { doc.setter(null); doc.prevSetter(null); }}
                                                    className="text-xs font-semibold text-red-500 hover:underline">
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        {doc.file && <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 font-semibold truncate">✓ {doc.file.name}</p>}
                                    </div>
                                ))}
                            </section>

                            <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                🔒 Your NIN and documents are only used for identity and professional verification. They are never shown on your public listing.
                            </div>

                            {error && <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-sm">{error}</div>}

                            <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-emerald-600 to-brand-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
                                {submitting ? 'Submitting...' : status === 'rejected' ? 'Resubmit Application' : 'Submit Application'}
                            </button>
                        </form>
                    </div>
                )}

                {showDetailsEditor && (
                    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-6 mb-6">
                        <SectionTitle
                            title="Your listing details"
                            sub="Keep these current — seekers use them to find and contact you. Changing them does not affect your verification."
                        />
                        <ArtisanDetailsFields value={details} onChange={patchDetails} />

                        {detailsMessage && (
                            <p className={`mt-4 text-sm px-3 py-2 rounded-lg ${detailsMessage.ok ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                                {detailsMessage.text}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={saveDetails}
                            disabled={savingDetails}
                            className="mt-4 w-full sm:w-auto px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-secondary disabled:opacity-50 transition-colors"
                        >
                            {savingDetails ? 'Saving…' : 'Save details'}
                        </button>
                    </div>
                )}

                {status === 'approved' && (
                    <div className="bg-light-card dark:bg-dark-card border border-green-500/30 rounded-2xl p-5">
                        <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-3">Verified profile</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><p className="text-light-text-secondary dark:text-dark-text-secondary">Trade</p><p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{serviceLabel(profile.professionalType) || '—'}</p></div>
                            <div><p className="text-light-text-secondary dark:text-dark-text-secondary">Business</p><p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{profile.companyName || '—'}</p></div>
                            <div><p className="text-light-text-secondary dark:text-dark-text-secondary">Professional Body</p><p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{profile.professionalBody || '—'}</p></div>
                            <div><p className="text-light-text-secondary dark:text-dark-text-secondary">Approved</p><p className="font-semibold text-green-600">{profile.approvedAt ? new Date(profile.approvedAt).toLocaleDateString() : '—'}</p></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfessionalProfilePage;
