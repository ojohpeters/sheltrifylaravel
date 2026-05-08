import React, { useState, useEffect, useRef } from 'react';
import { userAPI, uploadAPI, listingAPI } from '../services/api';

// ── Role config ──────────────────────────────────────────────────────────────
const LISTING_ROLES = ['LANDLORD', 'AGENT', 'REFERRER', 'INVESTOR', 'ESTATE_MANAGER', 'TIPPER_DRIVER'];
const ROLE_LABELS: Record<string, string> = {
    LANDLORD:       'Landlord',
    AGENT:          'CC / Agent',
    REFERRER:       'Referrer',
    INVESTOR:       'Investor',
    ESTATE_MANAGER: 'Estate Manager',
    TIPPER_DRIVER:  'Tipper Driver',
};

const ID_TYPES = [
    { value: 'NIN_SLIP',      label: "NIN Slip / National ID Card" },
    { value: 'VOTERS_CARD',   label: "Voter's Card" },
    { value: 'DRIVERS_LICENSE', label: "Driver's License" },
    { value: 'INTL_PASSPORT', label: "International Passport" },
    { value: 'CAC',           label: "CAC Certificate (for companies)" },
];

interface Listing {
    id: number; title: string; price: string; location: string;
    propertyType?: string; isActive: boolean; createdAt: string;
    imageUrl?: string; boostCost?: number; isBoosted?: boolean;
}

// ── Status banner ─────────────────────────────────────────────────────────────
const StatusBanner: React.FC<{ user: any; onResubmit: () => void }> = ({ user, onResubmit }) => {
    const status = user?.listingApprovalStatus;
    if (status === 'approved') return null;

    if (!user?.ninNumber) return (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">📋</span>
            <div>
                <p className="font-bold text-amber-600 dark:text-amber-400">Verification Required</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                    You must submit your NIN and a valid ID before you can create listings. Use the form below.
                </p>
            </div>
        </div>
    );

    if (status === 'pending') return (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">⏳</span>
            <div>
                <p className="font-bold text-blue-600 dark:text-blue-400">Verification Pending</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                    Your NIN and documents are being reviewed by our admin team. You'll be able to create listings once approved.
                </p>
            </div>
        </div>
    );

    if (status === 'rejected') return (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
                <p className="font-bold text-red-600 dark:text-red-400">Verification Rejected</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                    {user?.listingApprovalRejectionReason || 'Your documents did not meet requirements.'}
                </p>
                <button onClick={onResubmit} className="mt-2 px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-full hover:bg-brand-secondary transition-colors">
                    Resubmit Documents
                </button>
            </div>
        </div>
    );

    return null;
};

// ── NIN + Document verification form ─────────────────────────────────────────
const VerificationForm: React.FC<{ user: any; onSuccess: () => void }> = ({ user, onSuccess }) => {
    const [form, setForm] = useState({ ninNumber: '', idType: 'NIN_SLIP' });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [idFile, setIdFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [idPreview, setIdPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const photoRef = useRef<HTMLInputElement>(null);
    const idRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (f: File | null) => void,
        previewSetter: (s: string | null) => void,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setter(file);
        const reader = new FileReader();
        reader.onloadend = () => previewSetter(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!photoFile || !idFile) { setError('Please upload both your face photo and ID document.'); return; }
        if (form.ninNumber.length !== 11 || !/^\d+$/.test(form.ninNumber)) {
            setError('NIN must be exactly 11 digits.'); return;
        }
        setLoading(true); setError(null);
        try {
            const [photoRes, idRes] = await Promise.all([
                uploadAPI.uploadImage(photoFile, true),
                uploadAPI.uploadImage(idFile, true),
            ]);
            if (!photoRes.success || !idRes.success) throw new Error('File upload failed. Please try again.');
            const res = await userAPI.submitVerification({
                verificationPhotoUrl: photoRes.data.url,
                verificationIdUrl: idRes.data.url,
                verificationIdType: form.idType,
                ninNumber: form.ninNumber,
            });
            if (res.success) { onSuccess(); } else { throw new Error(res.message || 'Submission failed'); }
        } catch (err: any) {
            setError(err.message || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
                Identity Verification
            </h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-5">
                Required for all listing roles. Your NIN is encrypted and only used for identity verification.
            </p>

            {error && <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-xl text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* NIN */}
                <div>
                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                        NIN Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text" inputMode="numeric" maxLength={11}
                        placeholder="12345678901"
                        value={form.ninNumber}
                        onChange={e => setForm({ ...form, ninNumber: e.target.value.replace(/\D/g, '') })}
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none font-mono tracking-widest"
                        required
                    />
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">11-digit National Identification Number</p>
                </div>

                {/* ID Type */}
                <div>
                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                        ID Document Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={form.idType}
                        onChange={e => setForm({ ...form, idType: e.target.value })}
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        required
                    >
                        {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                {/* Face photo */}
                <div>
                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                        Clear Face Photo <span className="text-red-500">*</span>
                    </label>
                    <input type="file" accept="image/*" ref={photoRef} onChange={e => handleFileChange(e, setPhotoFile, setPhotoPreview)} className="hidden" />
                    <div className="flex items-center gap-4">
                        {photoPreview
                            ? <img src={photoPreview} className="w-20 h-20 rounded-full object-cover border-2 border-brand-primary" alt="Face" />
                            : <div className="w-20 h-20 rounded-full bg-light-bg dark:bg-dark-bg border-2 border-dashed border-light-border dark:border-dark-border flex items-center justify-center text-3xl">🤳</div>
                        }
                        <button type="button" onClick={() => photoRef.current?.click()}
                            className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-sm font-semibold text-light-text-primary dark:text-dark-text-primary hover:bg-light-border dark:hover:bg-dark-border transition">
                            {photoPreview ? 'Change Photo' : 'Upload Photo'}
                        </button>
                    </div>
                </div>

                {/* ID document */}
                <div>
                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                        ID Document (front) <span className="text-red-500">*</span>
                    </label>
                    <input type="file" accept="image/*" ref={idRef} onChange={e => handleFileChange(e, setIdFile, setIdPreview)} className="hidden" />
                    {idPreview
                        ? <img src={idPreview} className="w-full max-w-xs h-32 object-cover rounded-xl border-2 border-brand-primary mb-2" alt="ID" />
                        : <div className="w-full max-w-xs h-32 rounded-xl bg-light-bg dark:bg-dark-bg border-2 border-dashed border-light-border dark:border-dark-border flex flex-col items-center justify-center gap-1 mb-2 text-light-text-secondary dark:text-dark-text-secondary">
                            <span className="text-3xl">🪪</span>
                            <span className="text-xs">ID document front</span>
                        </div>
                    }
                    <button type="button" onClick={() => idRef.current?.click()}
                        className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-sm font-semibold text-light-text-primary dark:text-dark-text-primary hover:bg-light-border dark:hover:bg-dark-border transition">
                        {idPreview ? 'Change Document' : 'Upload ID Document'}
                    </button>
                </div>

                <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-brand-primary to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'Submitting...' : 'Submit for Verification'}
                </button>
            </form>
        </div>
    );
};

// ── Create Listing Form ───────────────────────────────────────────────────────
const CreateListingForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const [form, setForm] = useState({
        title: '', description: '', price: '', location: '',
        bedrooms: '', propertyType: 'Apartment', imageUrl: '', videoUrl: '',
        landlordName: '', landlordEmail: '', landlordPhone: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const imgRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            let imageUrl = form.imageUrl;
            if (imageFile) {
                const res = await uploadAPI.uploadImage(imageFile, true);
                if (res.success) imageUrl = res.data.url;
            }
            const res = await listingAPI.create({ ...form, imageUrl, bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined });
            if (res.success || res.id) { onSuccess(); } else { throw new Error(res.message || 'Failed to create listing'); }
        } catch (err: any) {
            setError(err.message || 'Failed to create listing.');
        } finally { setLoading(false); }
    };

    return (
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary mb-4">Create New Listing</h2>
            {error && <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-xl text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Title <span className="text-red-500">*</span></label>
                        <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="3 Bedroom Flat in Lekki" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Price <span className="text-red-500">*</span></label>
                        <input required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="₦450,000/year" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Location <span className="text-red-500">*</span></label>
                        <input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Lekki Phase 1, Lagos" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Property Type</label>
                        <select value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value })} className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none">
                            {['Apartment', 'House', 'Duplex', 'Studio', 'Office', 'Land', 'Warehouse', 'Hotel', 'Shortlet'].map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Bedrooms</label>
                        <input type="number" min={1} value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} placeholder="3" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Description</label>
                        <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the property..." className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none" />
                    </div>
                    {/* Property Image */}
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Property Image</label>
                        <input type="file" accept="image/*" ref={imgRef} onChange={e => { const f = e.target.files?.[0]; if(f){setImageFile(f); const r=new FileReader(); r.onloadend=()=>setImagePreview(r.result as string); r.readAsDataURL(f);} }} className="hidden" />
                        {imagePreview && <img src={imagePreview} className="w-full max-w-xs h-36 object-cover rounded-xl mb-2 border border-light-border dark:border-dark-border" alt="preview" />}
                        <button type="button" onClick={() => imgRef.current?.click()} className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-sm font-semibold text-light-text-primary dark:text-dark-text-primary hover:bg-light-border dark:hover:bg-dark-border transition">
                            {imagePreview ? 'Change Image' : 'Upload Image'}
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">YouTube Video URL</label>
                        <input type="url" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtu.be/..." className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Landlord Name</label>
                        <input value={form.landlordName} onChange={e => setForm({ ...form, landlordName: e.target.value })} placeholder="Mr. Adeyemi" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Landlord Phone</label>
                        <input type="tel" value={form.landlordPhone} onChange={e => setForm({ ...form, landlordPhone: e.target.value })} placeholder="+234 800 000 0000" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Landlord Email</label>
                        <input type="email" value={form.landlordEmail} onChange={e => setForm({ ...form, landlordEmail: e.target.value })} placeholder="landlord@email.com" className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                    </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-primary to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create Listing'}
                </button>
            </form>
        </div>
    );
};

// ── My Listings ───────────────────────────────────────────────────────────────
const MyListings: React.FC<{ refresh: number }> = ({ refresh }) => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        listingAPI.myListings().then(r => {
            if (r.success) setListings(r.data?.listings || r.data || []);
        }).catch(console.error).finally(() => setLoading(false));
    }, [refresh]);

    if (loading) return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-light-border dark:bg-dark-border rounded-2xl animate-pulse" />)}
        </div>
    );
    if (!listings.length) return (
        <div className="text-center py-12 text-light-text-secondary dark:text-dark-text-secondary">
            <span className="text-5xl block mb-3">🏠</span>
            <p className="font-semibold">No listings yet</p>
            <p className="text-sm mt-1">Create your first listing above</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listings.map(l => (
                <div key={l.id} className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
                    {l.imageUrl && <img src={l.imageUrl} alt={l.title} className="w-full h-36 object-cover" />}
                    <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary text-sm leading-tight">{l.title}</h3>
                            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${l.isActive ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-500'}`}>
                                {l.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <p className="text-brand-primary font-bold text-sm mt-1">{l.price}</p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">{l.location}</p>
                        {l.isBoosted && <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 text-xs font-bold rounded-full">🚀 Boosted</span>}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ListingDashboardPage: React.FC<{ currentUser: any }> = ({ currentUser }) => {
    const [user, setUser] = useState<any>(currentUser);
    const [tab, setTab] = useState<'listings' | 'create' | 'verify'>('listings');
    const [listingRefresh, setListingRefresh] = useState(0);
    const [showVerifyForm, setShowVerifyForm] = useState(false);

    const isApproved = user?.listingApprovalStatus === 'approved';
    const hasNin    = !!user?.ninNumber;
    const isPending = user?.listingApprovalStatus === 'pending';

    const refreshUser = async () => {
        try {
            const res = await userAPI.getProfile();
            if (res.success) setUser(res.data);
        } catch {}
    };

    useEffect(() => { refreshUser(); }, []);

    const roleName = ROLE_LABELS[user?.role] || user?.role || 'Listing Professional';

    const tabs = [
        { id: 'listings', label: 'My Listings', icon: '🏠' },
        ...(isApproved ? [{ id: 'create', label: 'Create Listing', icon: '➕' }] : []),
        ...(!isApproved ? [{ id: 'verify', label: 'Get Verified', icon: '🪪' }] : []),
    ] as const;

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-primary via-brand-secondary to-purple-600 px-4 sm:px-6 pt-6 pb-16">
                <div className="max-w-4xl mx-auto">
                    <p className="text-white/70 text-sm font-semibold uppercase tracking-wider">{roleName} Dashboard</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Listing Manager</h1>
                    <p className="text-white/70 text-sm mt-1">Manage your property listings on Sheltrify</p>

                    {/* Approval badge */}
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-white/20
                        bg-white/20 text-white">
                        <span>{isApproved ? '✅' : isPending ? '⏳' : '🔒'}</span>
                        <span>{isApproved ? 'Verified & Approved' : isPending ? 'Approval Pending' : 'Verification Required'}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id as any)}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition-all ${
                                tab === t.id
                                    ? 'bg-light-card dark:bg-dark-card text-brand-primary border border-brand-primary/30 shadow-brand-sm'
                                    : 'bg-light-card dark:bg-dark-card text-light-text-secondary dark:text-dark-text-secondary border border-light-border dark:border-dark-border hover:border-brand-primary/30'
                            }`}>
                            <span>{t.icon}</span>{t.label}
                        </button>
                    ))}
                </div>

                <StatusBanner user={user} onResubmit={() => setTab('verify')} />

                {tab === 'listings' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-light-text-primary dark:text-dark-text-primary">Your Properties</h2>
                            <button onClick={() => setListingRefresh(n => n + 1)} className="text-xs text-brand-primary font-semibold hover:underline">Refresh</button>
                        </div>
                        <MyListings refresh={listingRefresh} />
                    </div>
                )}

                {tab === 'create' && isApproved && (
                    <CreateListingForm onSuccess={() => { setTab('listings'); setListingRefresh(n => n + 1); }} />
                )}

                {tab === 'verify' && !isApproved && (
                    <VerificationForm user={user} onSuccess={() => { refreshUser(); setTab('listings'); }} />
                )}

                <div className="h-8" />
            </div>
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>
        </div>
    );
};

export default ListingDashboardPage;
