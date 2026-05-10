import React, { useState, useEffect, useCallback } from 'react';
import {
    CloseIcon, UserIcon, WalletIcon, BuildingStorefrontIcon, ShoppingCartIcon,
    StarIcon, TrendingUpIcon, PencilIcon, TrashIcon, PlusIcon, FilmIcon,
    GlobeAltIcon, VideoCameraIcon, HeartIcon,
} from './icons';
import {
    dashboardAPI, feelsAPI, rentalWahalaAPI, globalTalesAPI,
    communityAPI, marketplaceAPI, listingAPI,
} from '../services/api';
import { useToast } from '../contexts/ToastContext';

type TabType = 'overview' | 'listings' | 'marketplace' | 'feels' | 'rental-wahala' | 'global-tales' | 'community' | 'earnings';

interface UserDashboardProps {
    onClose?: () => void;
    user: any;
}

const isMine = (item: any, userId: any) =>
    item.userId === userId || item.user_id === userId || item.user?.id === userId;

const TABS: { key: TabType; label: string }[] = [
    { key: 'overview',      label: 'Overview' },
    { key: 'listings',      label: 'Listings' },
    { key: 'marketplace',   label: 'Marketplace' },
    { key: 'feels',         label: 'Feels' },
    { key: 'rental-wahala', label: 'Rental Wahala' },
    { key: 'global-tales',  label: 'Global Tales' },
    { key: 'community',     label: 'Community' },
    { key: 'earnings',      label: 'Earnings' },
];

const MARKETPLACE_CATEGORIES = [
    'RESIDENTIAL_HOUSE','SHORTLET','STUDENT_HOSTEL','OFFICE_SPACE','BUSINESS_SPACE',
    'EVENT_VENUE','WEDDING_MATERIALS','RENT_TO_OWN','LAND_FOR_SALE','INTERIOR_DESIGN',
    'BUY_PROPERTIES','SALES_PROPERTIES','PROPERTY_MANAGEMENT','BUILDING_MATERIALS','TIPPER_DRIVERS',
];

const GLOBAL_TALES_CATEGORIES = ['travel','finance','real_estate','lifestyle','technology','culture','other'];
const COMMUNITY_CATEGORIES = ['general','advice','listings','market','rental','investment'];
const PROPERTY_TYPES = ['Apartment','Duplex','Bungalow','Self-contain','Office Space','Land','Hotel','Shortlet'];

// ── empty form factory ────────────────────────────────────────────────────────

function emptyForm(tab: TabType) {
    switch (tab) {
        case 'feels':
        case 'rental-wahala':
            return { videoUrl: '', caption: '', music: '' };
        case 'global-tales':
            return { title: '', content: '', category: 'real_estate', imageUrl: '', videoUrl: '' };
        case 'community':
            return { title: '', content: '', category: 'general', imageUrl: '' };
        case 'marketplace':
            return { name: '', description: '', price: '', category: 'FURNITURE', location: '', contact: '', imageUrl: '' };
        case 'listings':
            return { title: '', price: '', location: '', description: '', bedrooms: '', propertyType: 'Apartment', imageUrl: '', videoUrl: '' };
        default:
            return {};
    }
}

// ── small reusable components ─────────────────────────────────────────────────

const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }> = ({ label, value, onChange, placeholder, type = 'text', required }) => (
    <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">{label}{required && ' *'}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2 text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
        />
    </div>
);

const TextareaField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }> = ({ label, value, onChange, placeholder, rows = 3 }) => (
    <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">{label}</label>
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2 text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none"
        />
    </div>
);

const SelectField: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: string[] }> = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">{label}</label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2 text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
        >
            {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
        </select>
    </div>
);

// ── main component ────────────────────────────────────────────────────────────

export const UserDashboard: React.FC<UserDashboardProps> = ({ onClose, user }) => {
    const { showSuccess, showError } = useToast();

    const [stats, setStats]     = useState<any>(null);
    const [earnings, setEarnings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // per-tab data
    const [myListings,     setMyListings]     = useState<any[]>([]);
    const [myProducts,     setMyProducts]     = useState<any[]>([]);
    const [myFeels,        setMyFeels]        = useState<any[]>([]);
    const [myWahala,       setMyWahala]       = useState<any[]>([]);
    const [myGlobalTales,  setMyGlobalTales]  = useState<any[]>([]);
    const [myCommunity,    setMyCommunity]    = useState<any[]>([]);
    const [tabLoading,     setTabLoading]     = useState(false);

    // modal
    const [modalOpen,  setModalOpen]  = useState(false);
    const [modalMode,  setModalMode]  = useState<'create' | 'edit'>('create');
    const [editItem,   setEditItem]   = useState<any>(null);
    const [form,       setForm]       = useState<any>({});
    const [saving,     setSaving]     = useState(false);

    // delete confirm
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ── initial load ──────────────────────────────────────────────────────────

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const [s, e] = await Promise.all([dashboardAPI.getStats(), dashboardAPI.getEarnings()]);
                if (s.success) setStats(s.data);
                if (e.success) setEarnings(e.data);
            } catch { /* ignore */ } finally { setLoading(false); }
        })();
    }, []);

    // ── lazy-load tab data ────────────────────────────────────────────────────

    const loadTab = useCallback(async (tab: TabType) => {
        setTabLoading(true);
        try {
            if (tab === 'listings') {
                const r = await listingAPI.myListings();
                if (r.success) setMyListings(r.data?.listings ?? r.data ?? []);
            } else if (tab === 'marketplace') {
                const r = await marketplaceAPI.getMyProducts();
                if (r.success) setMyProducts(r.data?.products ?? r.data ?? []);
            } else if (tab === 'feels') {
                const r = await feelsAPI.getAll();
                const all = r.data?.feels ?? r.data ?? [];
                setMyFeels(all.filter((x: any) => isMine(x, user?.id)));
            } else if (tab === 'rental-wahala') {
                const r = await rentalWahalaAPI.getAll();
                const all = r.data?.videos ?? r.data ?? [];
                setMyWahala(all.filter((x: any) => isMine(x, user?.id)));
            } else if (tab === 'global-tales') {
                const r = await globalTalesAPI.getAll();
                const all = r.data?.tales ?? r.data ?? [];
                setMyGlobalTales(all.filter((x: any) => isMine(x, user?.id)));
            } else if (tab === 'community') {
                const r = await communityAPI.getPosts();
                const all = r.data?.posts ?? r.data ?? [];
                setMyCommunity(all.filter((x: any) => isMine(x, user?.id)));
            }
        } catch { /* ignore */ } finally { setTabLoading(false); }
    }, [user?.id]);

    useEffect(() => {
        if (!['overview', 'earnings'].includes(activeTab)) loadTab(activeTab);
    }, [activeTab, loadTab]);

    // ── modal helpers ─────────────────────────────────────────────────────────

    const openCreate = () => {
        setModalMode('create');
        setEditItem(null);
        setForm(emptyForm(activeTab));
        setModalOpen(true);
    };

    const openEdit = (item: any) => {
        setModalMode('edit');
        setEditItem(item);
        const base = emptyForm(activeTab);
        setForm({ ...base, ...Object.fromEntries(Object.keys(base).map(k => [k, item[k] ?? ''])) });
        setModalOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let r: any;
            if (activeTab === 'feels') {
                r = modalMode === 'create'
                    ? await feelsAPI.create(form)
                    : await feelsAPI.update(String(editItem.id), form);
            } else if (activeTab === 'rental-wahala') {
                r = modalMode === 'create'
                    ? await rentalWahalaAPI.create(form)
                    : await rentalWahalaAPI.update(String(editItem.id), form);
            } else if (activeTab === 'global-tales') {
                r = modalMode === 'create'
                    ? await globalTalesAPI.create(form)
                    : await globalTalesAPI.update(String(editItem.id), form);
            } else if (activeTab === 'community') {
                r = await communityAPI.createPost(form);
            } else if (activeTab === 'marketplace') {
                const payload = { ...form, price: parseFloat(form.price) || 0 };
                r = modalMode === 'create'
                    ? await marketplaceAPI.create(payload)
                    : await marketplaceAPI.update(String(editItem.id), payload);
            } else if (activeTab === 'listings') {
                r = modalMode === 'create'
                    ? await listingAPI.create(form)
                    : await listingAPI.update(String(editItem.id), form);
            }
            if (r?.success) {
                showSuccess(modalMode === 'create' ? 'Created successfully!' : 'Updated successfully!');
                setModalOpen(false);
                loadTab(activeTab);
            } else {
                showError(r?.message || 'Something went wrong');
            }
        } catch (err: any) {
            showError(err.message || 'Failed to save');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            let r: any;
            if (activeTab === 'feels')          r = await feelsAPI.delete(id);
            else if (activeTab === 'rental-wahala') r = await rentalWahalaAPI.delete(id);
            else if (activeTab === 'global-tales')  r = await globalTalesAPI.delete(id);
            else if (activeTab === 'community')     r = await communityAPI.deletePost(id);
            else if (activeTab === 'marketplace')   r = await marketplaceAPI.delete(id);
            else if (activeTab === 'listings')      r = await listingAPI.delete(id);

            if (r?.success || r?.message?.toLowerCase().includes('deleted')) {
                showSuccess('Deleted successfully!');
                setDeletingId(null);
                loadTab(activeTab);
            } else {
                showError(r?.message || 'Delete failed');
            }
        } catch (err: any) { showError(err.message || 'Delete failed'); }
    };

    // ── formatters ────────────────────────────────────────────────────────────

    const formatCurrency = (amount: number) =>
        amount >= 1000000 ? `₦${(amount / 1000000).toFixed(2)}M` : `₦${amount?.toLocaleString()}`;

    const getRoleDisplayName = (role: string) => ({
        SEEKER: 'Seeker/Tenant', LANDLORD: 'Landlord', AGENT: 'CC/Agent',
        REFERRER: 'Referrer', TENANT: 'Tenant', INVESTOR: 'Investor',
        ARTISAN: 'Local Artisan', ADMIN: 'Administrator', TIPPER_DRIVER: 'Tipper Driver',
    }[role] || role);

    // ── item card ─────────────────────────────────────────────────────────────

    const canEdit = activeTab !== 'community';

    const ItemCard: React.FC<{ item: any; title: string; sub?: string; badge?: string; badgeColor?: string }> = ({ item, title, sub, badge, badgeColor = 'green' }) => (
        <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary truncate">{title}</p>
                {sub && <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5 truncate">{sub}</p>}
                {badge && (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-${badgeColor}-500/10 text-${badgeColor}-500`}>
                        {badge}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {canEdit && (
                    <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                )}
                {deletingId === String(item.id) ? (
                    <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(String(item.id))} className="text-xs px-2 py-1 bg-red-500 text-white rounded-md font-medium">Yes</button>
                        <button onClick={() => setDeletingId(null)} className="text-xs px-2 py-1 bg-light-border dark:bg-dark-border rounded-md">No</button>
                    </div>
                ) : (
                    <button
                        onClick={() => setDeletingId(String(item.id))}
                        className="p-1.5 rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );

    const EmptyState: React.FC<{ label: string }> = ({ label }) => (
        <div className="text-center py-10 text-light-text-secondary dark:text-dark-text-secondary">
            <PlusIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No {label} yet. Create your first one!</p>
        </div>
    );

    // ── tab content ───────────────────────────────────────────────────────────

    const tabHasCreate = !['overview', 'earnings'].includes(activeTab);
    const tabLabel = TABS.find(t => t.key === activeTab)?.label ?? '';

    const renderTabContent = () => {
        if (tabLoading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                </div>
            );
        }

        switch (activeTab) {

            case 'overview':
                return stats ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { icon: <TrendingUpIcon className="w-5 h-5 text-green-500" />, bg: 'bg-green-500/10', label: 'Total Earnings', value: formatCurrency(stats.stats.totalEarnings) },
                                { icon: <BuildingStorefrontIcon className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-500/10', label: 'Active Listings', value: stats.stats.activeListings },
                                { icon: <WalletIcon className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-500/10', label: 'Wallet Balance', value: `${stats.stats.walletBalance} SWC` },
                            ].map(card => (
                                <div key={card.label} className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4 flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${card.bg}`}>{card.icon}</div>
                                    <div>
                                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{card.label}</p>
                                        <p className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">{card.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Total Sales', value: stats.stats.totalSales },
                                { label: 'Referrals', value: stats.stats.referrals },
                                { label: 'Credibility', value: stats.stats.credibilityScore },
                                { label: 'Tier', value: <span className="capitalize">{stats.stats.tier}</span> },
                            ].map((s, i) => (
                                <div key={i} className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{s.value}</p>
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{s.label}</p>
                                </div>
                            ))}
                        </div>
                        {user?.role === 'ARTISAN' && stats.user.artisanService && (
                            <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4 space-y-1 text-sm">
                                <p className="font-bold mb-2">Artisan Profile</p>
                                <p><span className="font-semibold">Service:</span> {stats.user.artisanService}</p>
                                {stats.user.artisanLocation && <p><span className="font-semibold">Location:</span> {stats.user.artisanLocation}</p>}
                                <div className="flex items-center gap-1"><StarIcon className="w-4 h-4 text-yellow-500" /><span className="font-semibold">Rating:</span> {stats.user.artisanRating?.toFixed(1)}/5.0</div>
                            </div>
                        )}
                    </div>
                ) : null;

            case 'listings':
                return myListings.length > 0
                    ? <div className="space-y-2">{myListings.map(l => <ItemCard key={l.id} item={l} title={l.title} sub={`${l.location} · ${l.price}`} badge={l.isActive ? 'Active' : 'Inactive'} badgeColor={l.isActive ? 'green' : 'gray'} />)}</div>
                    : <EmptyState label="listings" />;

            case 'marketplace':
                return myProducts.length > 0
                    ? <div className="space-y-2">{myProducts.map(p => <ItemCard key={p.id} item={p} title={p.name} sub={`${p.category?.replace(/_/g,' ')} · ₦${Number(p.price).toLocaleString()}`} badge={p.isApproved ? 'Approved' : 'Pending'} badgeColor={p.isApproved ? 'green' : 'yellow'} />)}</div>
                    : <EmptyState label="marketplace products" />;

            case 'feels':
                return myFeels.length > 0
                    ? <div className="space-y-2">{myFeels.map(f => <ItemCard key={f.id} item={f} title={f.caption || 'Untitled Feel'} sub={`❤️ ${f.likes ?? 0} likes`} />)}</div>
                    : <EmptyState label="Feels" />;

            case 'rental-wahala':
                return myWahala.length > 0
                    ? <div className="space-y-2">{myWahala.map(w => <ItemCard key={w.id} item={w} title={w.caption || 'Untitled Video'} sub={`❤️ ${w.likes ?? 0} likes`} />)}</div>
                    : <EmptyState label="Rental Wahala videos" />;

            case 'global-tales':
                return myGlobalTales.length > 0
                    ? <div className="space-y-2">{myGlobalTales.map(t => <ItemCard key={t.id} item={t} title={t.title} sub={`${t.category ?? ''} · ${t.readTime ?? 0} min read`} />)}</div>
                    : <EmptyState label="Global Tales" />;

            case 'community':
                return myCommunity.length > 0
                    ? <div className="space-y-2">{myCommunity.map(p => <ItemCard key={p.id} item={p} title={p.title} sub={p.category ?? ''} />)}</div>
                    : <EmptyState label="community posts" />;

            case 'earnings':
                return earnings ? (
                    <div className="space-y-4">
                        <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4">
                            <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Total: {formatCurrency(earnings.totalEarnings)}</p>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">Wallet: {earnings.walletBalance} SWC</p>
                        </div>
                        {earnings.earningsHistory?.length > 0
                            ? <div className="space-y-2">{earnings.earningsHistory.map((e: any) => (
                                <div key={e.id} className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary">{e.description}</p>
                                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{new Date(e.date).toLocaleDateString()}</p>
                                    </div>
                                    <p className="font-bold text-green-500">+{formatCurrency(e.amount)}</p>
                                </div>
                            ))}</div>
                            : <EmptyState label="earnings" />}
                    </div>
                ) : null;

            default:
                return null;
        }
    };

    // ── modal form fields ─────────────────────────────────────────────────────

    const renderFormFields = () => {
        const set = (key: string) => (v: string) => setForm((f: any) => ({ ...f, [key]: v }));
        switch (activeTab) {
            case 'feels':
            case 'rental-wahala':
                return (
                    <div className="space-y-3">
                        {modalMode === 'create' && <InputField label="Video URL" value={form.videoUrl} onChange={set('videoUrl')} placeholder="https://..." required />}
                        <TextareaField label="Caption" value={form.caption} onChange={set('caption')} placeholder="What's this video about?" />
                        <InputField label="Music / Song (optional)" value={form.music} onChange={set('music')} placeholder="Song name or artist" />
                    </div>
                );
            case 'global-tales':
                return (
                    <div className="space-y-3">
                        <InputField label="Title" value={form.title} onChange={set('title')} placeholder="Your story title" required />
                        <TextareaField label="Content" value={form.content} onChange={set('content')} placeholder="Write your story..." rows={5} />
                        <SelectField label="Category" value={form.category} onChange={set('category')} options={GLOBAL_TALES_CATEGORIES} />
                        <InputField label="Cover Image URL (optional)" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." />
                        <InputField label="Video URL (optional)" value={form.videoUrl} onChange={set('videoUrl')} placeholder="https://youtube.com/..." />
                    </div>
                );
            case 'community':
                return (
                    <div className="space-y-3">
                        <InputField label="Title" value={form.title} onChange={set('title')} placeholder="Post title" required />
                        <TextareaField label="Content" value={form.content} onChange={set('content')} placeholder="Share your thoughts..." rows={4} />
                        <SelectField label="Category" value={form.category} onChange={set('category')} options={COMMUNITY_CATEGORIES} />
                        <InputField label="Image URL (optional)" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." />
                    </div>
                );
            case 'marketplace':
                return (
                    <div className="space-y-3">
                        <InputField label="Product / Service Name" value={form.name} onChange={set('name')} placeholder="e.g. Used Sofa Set" required />
                        <TextareaField label="Description" value={form.description} onChange={set('description')} placeholder="Describe the item..." />
                        <div className="grid grid-cols-2 gap-3">
                            <InputField label="Price (₦)" value={form.price} onChange={set('price')} placeholder="e.g. 50000" type="number" required />
                            <SelectField label="Category" value={form.category} onChange={set('category')} options={MARKETPLACE_CATEGORIES} />
                        </div>
                        <InputField label="Location" value={form.location} onChange={set('location')} placeholder="e.g. Ikeja, Lagos" />
                        <InputField label="Contact (Phone/WhatsApp)" value={form.contact} onChange={set('contact')} placeholder="+234..." />
                        <InputField label="Image URL (optional)" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." />
                    </div>
                );
            case 'listings':
                return (
                    <div className="space-y-3">
                        <InputField label="Property Title" value={form.title} onChange={set('title')} placeholder="e.g. 3-Bedroom Duplex in Lekki" required />
                        <div className="grid grid-cols-2 gap-3">
                            <InputField label="Price" value={form.price} onChange={set('price')} placeholder="e.g. ₦2.5M/yr" required />
                            <SelectField label="Property Type" value={form.propertyType} onChange={set('propertyType')} options={PROPERTY_TYPES} />
                        </div>
                        <InputField label="Location" value={form.location} onChange={set('location')} placeholder="e.g. Lekki Phase 1, Lagos" required />
                        <TextareaField label="Description" value={form.description} onChange={set('description')} placeholder="Describe the property..." />
                        <InputField label="Bedrooms" value={form.bedrooms} onChange={set('bedrooms')} placeholder="e.g. 3" type="number" />
                        <InputField label="Image URL (optional)" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." />
                        <InputField label="Video URL (optional)" value={form.videoUrl} onChange={set('videoUrl')} placeholder="https://youtube.com/..." />
                    </div>
                );
            default:
                return null;
        }
    };

    // ── loading skeleton ──────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
                    <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
            {/* Mobile header */}
            <div className="sticky top-0 z-10 bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-sm border-b border-light-border dark:border-dark-border lg:hidden">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">My Dashboard</h2>
                    {onClose && (
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 md:py-12 max-w-5xl">
                {/* Desktop header */}
                <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-light-border dark:border-dark-border">
                    <h2 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">My Dashboard</h2>
                    {onClose && (
                        <button onClick={onClose} className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>

                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-lg overflow-hidden">
                    {/* Profile strip */}
                    <div className="border-b border-light-border dark:border-dark-border px-6 py-4 flex items-center gap-4">
                        {user?.avatarUrl
                            ? <img src={user.avatarUrl} alt={user.fullName} className="w-12 h-12 rounded-full object-cover" />
                            : <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center"><UserIcon className="w-6 h-6 text-brand-primary" /></div>}
                        <div>
                            <p className="font-bold text-light-text-primary dark:text-dark-text-primary">{user?.fullName || 'User'}</p>
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{getRoleDisplayName(user?.role || 'SEEKER')} · {user?.email}</p>
                        </div>
                    </div>

                    {/* Tabs — horizontally scrollable on mobile */}
                    <div className="flex overflow-x-auto border-b border-light-border dark:border-dark-border scrollbar-hide">
                        {TABS.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                className={`shrink-0 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                                    activeTab === t.key
                                        ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5'
                                        : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div className="p-4 md:p-6 max-h-[65vh] overflow-y-auto">
                        {/* Create button */}
                        {tabHasCreate && (
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary">My {tabLabel}</h3>
                                <button
                                    onClick={openCreate}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-secondary transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    New {tabLabel === 'Rental Wahala' ? 'Video' : tabLabel === 'Global Tales' ? 'Story' : tabLabel === 'Community' ? 'Post' : tabLabel.replace(/s$/, '')}
                                </button>
                            </div>
                        )}
                        {renderTabContent()}
                    </div>
                </div>
            </div>

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
                    <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border">
                            <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary">
                                {modalMode === 'create' ? 'Create New' : 'Edit'} {tabLabel === 'Rental Wahala' ? 'Video' : tabLabel === 'Global Tales' ? 'Story' : tabLabel === 'Community' ? 'Post' : tabLabel.replace(/s$/, '')}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-5 overflow-y-auto flex-1">
                            {renderFormFields()}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-light-border dark:border-dark-border flex gap-3 justify-end">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-light-border dark:border-dark-border text-sm text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary transition-colors disabled:opacity-60"
                            >
                                {saving ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
