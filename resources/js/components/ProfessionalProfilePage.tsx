import React, { useState, useEffect, useRef } from 'react';
import { userAPI, uploadAPI } from '../services/api';

const PROFESSIONAL_BODIES: Record<string, string[]> = {
    SURVEYOR:  ['NIESV (Nigerian Institution of Estate Surveyors & Valuers)', 'NIS (Nigerian Institution of Surveyors)', 'NIQS (Nigerian Institute of Quantity Surveyors)', 'Other'],
    DEVELOPER: ['NIA (Nigerian Institute of Architects)', 'NIOB (Nigerian Institute of Building)', 'NSE (Nigerian Society of Engineers)', 'CORBON', 'Other'],
};

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
        professionalType: 'SURVEYOR',
        companyName: '', licenseNumber: '', ninNumber: '',
        cacNumber: '', professionalBody: '', membershipId: '',
        businessAddress: '', yearsExperience: '', bio: '',
    });

    const [licenseFile, setLicenseFile]   = useState<File | null>(null);
    const [cacFile, setCacFile]           = useState<File | null>(null);
    const [membershipFile, setMembershipFile] = useState<File | null>(null);
    const [licensePrev, setLicensePrev]   = useState<string | null>(null);
    const [cacPrev, setCacPrev]           = useState<string | null>(null);
    const [membershipPrev, setMembershipPrev] = useState<string | null>(null);

    const licenseRef    = useRef<HTMLInputElement>(null);
    const cacRef        = useRef<HTMLInputElement>(null);
    const membershipRef = useRef<HTMLInputElement>(null);

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
        if (!licenseFile) { setError('Please upload your professional license document.'); return; }
        if (form.ninNumber.length !== 11 || !/^\d+$/.test(form.ninNumber)) { setError('NIN must be exactly 11 digits.'); return; }
        setSubmitting(true); setError(null);

        try {
            const uploads: Promise<any>[] = [uploadAPI.uploadImage(licenseFile, true)];
            if (cacFile) uploads.push(uploadAPI.uploadImage(cacFile, true));
            if (membershipFile) uploads.push(uploadAPI.uploadImage(membershipFile, true));
            const [licRes, cacRes, memRes] = await Promise.all(uploads);

            if (!licRes.success) throw new Error('License upload failed');
            const payload: any = {
                ...form,
                licenseUrl: licRes.data.url,
                cacDocumentUrl: cacRes?.data?.url ?? undefined,
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
                    <p className="text-white/70 text-sm font-semibold uppercase tracking-wider">Professional Registration</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Licensed Surveyors & Developers</h1>
                    <p className="text-white/70 text-sm mt-1">Submit your credentials for verification to list properties on Sheltrify</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-10 pb-16">
                {/* What you need card */}
                {!hasSubmitted && (
                    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 mb-6 shadow-sm">
                        <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-3">What you need to submit</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { icon: '🪪', text: '11-digit NIN number' },
                                { icon: '📜', text: 'Professional license document' },
                                { icon: '🏢', text: 'CAC certificate (optional for companies)' },
                                { icon: '🎓', text: 'Professional body membership card' },
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
                                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Professional Type <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['SURVEYOR', 'DEVELOPER'].map(type => (
                                        <button key={type} type="button"
                                            onClick={() => setForm({ ...form, professionalType: type, professionalBody: '' })}
                                            className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${form.professionalType === type ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:border-brand-primary/50'}`}>
                                            {type === 'SURVEYOR' ? '📐 Surveyor' : '🏗️ Developer'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Company / Firm Name <span className="text-red-500">*</span></label>
                                    <input required value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="Adeyemi Surveyors Ltd" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">License Number <span className="text-red-500">*</span></label>
                                    <input required value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} placeholder="NIESV/2024/001" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">NIN Number <span className="text-red-500">*</span></label>
                                    <input type="text" inputMode="numeric" maxLength={11} required value={form.ninNumber}
                                        onChange={e => setForm({ ...form, ninNumber: e.target.value.replace(/\D/g, '') })}
                                        placeholder="12345678901" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none font-mono tracking-widest" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">CAC Number <span className="text-light-text-secondary dark:text-dark-text-secondary font-normal">(optional)</span></label>
                                    <input value={form.cacNumber} onChange={e => setForm({ ...form, cacNumber: e.target.value })} placeholder="RC123456" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Professional Body</label>
                                    <select value={form.professionalBody} onChange={e => setForm({ ...form, professionalBody: e.target.value })} className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                        <option value="">Select...</option>
                                        {(PROFESSIONAL_BODIES[form.professionalType] || []).map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Membership ID</label>
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
                                <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary">Document Uploads</h3>

                                {[
                                    { label: 'Professional License / Certificate', required: true, ref: licenseRef, file: licenseFile, preview: licensePrev, setter: setLicenseFile, prevSetter: setLicensePrev, icon: '📜' },
                                    { label: 'CAC Certificate', required: false, ref: cacRef, file: cacFile, preview: cacPrev, setter: setCacFile, prevSetter: setCacPrev, icon: '🏢' },
                                    { label: 'Membership Card / Certificate', required: false, ref: membershipRef, file: membershipFile, preview: membershipPrev, setter: setMembershipFile, prevSetter: setMembershipPrev, icon: '🎓' },
                                ].map((doc) => (
                                    <div key={doc.label}>
                                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                                            {doc.label} {doc.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <input type="file" accept="image/*,.pdf" ref={doc.ref} onChange={e => handleFile(e, doc.setter, doc.prevSetter)} className="hidden" />
                                        <div className="flex items-center gap-3">
                                            {doc.preview
                                                ? <img src={doc.preview} className="w-20 h-20 object-cover rounded-xl border border-light-border dark:border-dark-border" alt="doc" />
                                                : <div className="w-20 h-20 rounded-xl bg-light-bg dark:bg-dark-bg border-2 border-dashed border-light-border dark:border-dark-border flex items-center justify-center text-2xl">{doc.icon}</div>
                                            }
                                            <button type="button" onClick={() => doc.ref.current?.click()} className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-sm font-semibold text-light-text-primary dark:text-dark-text-primary hover:bg-light-border dark:hover:bg-dark-border transition">
                                                {doc.file ? 'Change File' : 'Upload File'}
                                            </button>
                                            {doc.file && <span className="text-xs text-green-600 dark:text-green-400 font-semibold">✓ {doc.file.name}</span>}
                                        </div>
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
