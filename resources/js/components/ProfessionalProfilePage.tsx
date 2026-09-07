import React, { useState, useEffect, useRef } from 'react';
import { userAPI, uploadAPI } from '../services/api';
import { ARTISAN_CATEGORIES } from '../constants/services';

const StatusCard: React.FC<{ profile: any }> = ({ profile }) => {
    const s = profile?.status;
    const config = {
        pending:  { bg: 'bg-blue-500/10',  border: 'border-blue-500/30',  text: 'text-blue-600 dark:text-blue-400',  icon: '⏳', title: 'Under Review', body: 'Your professional profile has been submitted and is being reviewed by our admin team. This typically takes 1–3 business days.' },
        approved: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400', icon: '✅', title: 'Profile Approved', body: 'Your professional profile is verified. You can now create property listings on Sheltrify.' },
        rejected: { bg: 'bg-red-500/10',   border: 'border-red-500/30',   text: 'text-red-600 dark:text-red-400',   icon: '❌', title: 'Profile Rejected', body: profile?.rejectionReason || 'Your documents did not meet requirements.' },
    }[s] ?? null;

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

const ProfessionalProfilePage: React.FC<{ currentUser: any }> = ({ currentUser }) => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        professionalType: ARTISAN_CATEGORIES[0]?.value ?? 'PLUMBER',
        companyName: '', licenseNumber: '', ninNumber: '',
        professionalBody: '', membershipId: '',
        businessAddress: '', yearsExperience: '', bio: '',
    });

    const [licenseFile, setLicenseFile]   = useState<File | null>(null);
    const [membershipFile, setMembershipFile] = useState<File | null>(null);
    const [licensePrev, setLicensePrev]   = useState<string | null>(null);
    const [membershipPrev, setMembershipPrev] = useState<string | null>(null);

    const licenseRef    = useRef<HTMLInputElement>(null);
    const membershipRef = useRef<HTMLInputElement>(null);
    const licenseCamRef    = useRef<HTMLInputElement>(null);
    const membershipCamRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        userAPI.getProfessionalProfile().then(r => {
            if (r.success && r.data?.profile) setProfile(r.data.profile);
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
        if (form.ninNumber.length !== 11 || !/^\d+$/.test(form.ninNumber)) { setError('NIN must be exactly 11 digits.'); return; }
        setSubmitting(true); setError(null);

        try {
            // Uploaded by name rather than positionally. The previous code
            // destructured a conditionally-built array, so submitting a
            // membership card without a licence stored it under the wrong URL.
            const [licRes, memRes] = await Promise.all([
                licenseFile ? uploadAPI.uploadImage(licenseFile, true) : Promise.resolve(null),
                membershipFile ? uploadAPI.uploadImage(membershipFile, true) : Promise.resolve(null),
            ]);

            if (licenseFile && !licRes?.success) throw new Error('Licence upload failed');
            if (membershipFile && !memRes?.success) throw new Error('Membership card upload failed');

            const payload: any = {
                ...form,
                licenseUrl: licRes?.data?.url ?? undefined,
                membershipDocUrl: memRes?.data?.url ?? undefined,
            };

            const res = await userAPI.submitProfessionalProfile(payload);
            if (res.success) { setSuccess(true); setProfile(res.data); } else { throw new Error(res.message || 'Submission failed'); }
        } catch (err: any) {
            setError(err.message || 'Submission failed. Please try again.');
        } finally { setSubmitting(false); }
    };

    if (loading) return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">Loading...</p>
            </div>
        </div>
    );

    const isApproved = profile?.status === 'approved';
    const hasSubmitted = !!profile;

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
                {/* What you need card */}
                {!hasSubmitted && (
                    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 mb-6 shadow-sm">
                        <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-1">What you need</h3>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
                            Only your NIN is required. Everything else is optional — you can snap a
                            photo now or add it later.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { icon: '🪪', text: 'Your 11-digit NIN — required' },
                                { icon: '🛠️', text: 'The trade you practise' },
                                { icon: '📜', text: 'Trade certificate or licence — optional' },
                                { icon: '🎓', text: 'Membership card, if you have one — optional' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
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
                        <p className="font-bold text-green-600 dark:text-green-400">Profile submitted successfully!</p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">Our admin team will review your credentials within 1–3 business days.</p>
                    </div>
                )}

                {(!hasSubmitted || profile?.status === 'rejected') && !success && (
                    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-6">
                        <h2 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
                            {profile?.status === 'rejected' ? 'Resubmit Professional Profile' : 'Register as a Professional'}
                        </h2>

                        {error && <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-xl text-sm">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Type */}
                            <div>
                                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Your Trade <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {ARTISAN_CATEGORIES.map(trade => (
                                        <button key={trade.value} type="button"
                                            onClick={() => setForm({ ...form, professionalType: trade.value })}
                                            className={`py-2.5 px-2 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all ${form.professionalType === trade.value ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:border-brand-primary/50'}`}>
                                            {trade.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Business Name <span className="text-light-text-secondary dark:text-dark-text-secondary font-normal">(optional)</span></label>
                                    <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="e.g. Musa Plumbing Services" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Licence Number <span className="text-light-text-secondary dark:text-dark-text-secondary font-normal">(optional)</span></label>
                                    <input value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} placeholder="If you have one" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">NIN Number <span className="text-red-500">*</span></label>
                                    <input type="text" inputMode="numeric" maxLength={11} required value={form.ninNumber}
                                        onChange={e => setForm({ ...form, ninNumber: e.target.value.replace(/\D/g, '') })}
                                        placeholder="12345678901" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none font-mono tracking-widest" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Professional Body <span className="text-light-text-secondary dark:text-dark-text-secondary font-normal">(optional)</span></label>
                                    <input value={form.professionalBody} onChange={e => setForm({ ...form, professionalBody: e.target.value })} placeholder="Association or union, if any" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Membership ID <span className="text-light-text-secondary dark:text-dark-text-secondary font-normal">(optional)</span></label>
                                    <input value={form.membershipId} onChange={e => setForm({ ...form, membershipId: e.target.value })} placeholder="MEM/2024/001" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Years of Experience</label>
                                    <select value={form.yearsExperience} onChange={e => setForm({ ...form, yearsExperience: e.target.value })} className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                        <option value="">Select...</option>
                                        {['1–2 years','3–5 years','6–10 years','11–20 years','20+ years'].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Business Address</label>
                                    <input value={form.businessAddress} onChange={e => setForm({ ...form, businessAddress: e.target.value })} placeholder="12 Marina Road, Lagos Island, Lagos" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Bio / Description</label>
                                    <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about your company and expertise..." className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none" />
                                </div>
                            </div>

                            {/* Document uploads */}
                            <div className="border-t border-light-border dark:border-dark-border pt-5 space-y-4">
                                <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary">Supporting Documents</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary -mt-2">
                                    Both are optional. Adding them helps your profile get approved faster.
                                </p>

                                {[
                                    { label: 'Trade Certificate or Licence', ref: licenseRef, camRef: licenseCamRef,
                                      file: licenseFile, preview: licensePrev, setter: setLicenseFile, prevSetter: setLicensePrev, icon: '📜' },
                                    { label: 'Membership Card', ref: membershipRef, camRef: membershipCamRef,
                                      file: membershipFile, preview: membershipPrev, setter: setMembershipFile, prevSetter: setMembershipPrev, icon: '🎓' },
                                ].map((doc) => (
                                    <div key={doc.label}>
                                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                                            {doc.label}{' '}
                                            <span className="text-light-text-secondary dark:text-dark-text-secondary font-normal">(optional)</span>
                                        </label>

                                        {/* Two inputs per document: `capture` opens the camera
                                            straight away on a phone but hides the gallery, so the
                                            plain input stays for anyone picking an existing file
                                            or a PDF. */}
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
                            </div>

                            <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                🔒 Your NIN and documents are encrypted and only used for identity and professional verification. They will not be shared publicly.
                            </div>

                            <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-emerald-600 to-brand-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
                                {submitting ? 'Submitting...' : 'Submit Professional Profile'}
                            </button>
                        </form>
                    </div>
                )}

                {isApproved && (
                    <div className="bg-light-card dark:bg-dark-card border border-green-500/30 rounded-2xl p-5">
                        <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-3">Verified Profile Summary</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><p className="text-light-text-secondary dark:text-dark-text-secondary">Type</p><p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{profile.professionalType}</p></div>
                            <div><p className="text-light-text-secondary dark:text-dark-text-secondary">Company</p><p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{profile.companyName}</p></div>
                            <div><p className="text-light-text-secondary dark:text-dark-text-secondary">License No.</p><p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{profile.licenseNumber}</p></div>
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
