import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    SearchIcon, PlusIcon, StarSolidIcon, MapIcon, PhoneIcon,
    WhatsAppIcon, CommentBubbleIcon, CloseIcon, CheckCircleIcon, ShieldCheckIcon,
} from './icons';
import { artisanAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ARTISAN_CATEGORIES, serviceLabel } from '../constants/services';
import Pagination, { PageMeta } from './Pagination';

interface Artisan {
    id: number;
    fullName: string;
    phone?: string | null;
    whatsapp?: string | null;
    avatarUrl?: string | null;
    artisanLocation?: string | null;
    artisanService?: string | null;
    artisanBio?: string | null;
    artisanRating?: number | null;
    artisanReviewsCount?: number | null;
    artisanExperienceYears?: number | null;
}

interface Review {
    id: number;
    rating: number;
    comment?: string | null;
    createdAt: string;
    reviewer?: { id: number; fullName?: string | null; avatarUrl?: string | null } | null;
}

/** Only the trades that actually have someone listed are worth a filter chip. */
const FILTER_LIMIT = 8;

const Stars: React.FC<{ value: number; size?: string }> = ({ value, size = 'w-4 h-4' }) => (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
        {[1, 2, 3, 4, 5].map(i => (
            <StarSolidIcon
                key={i}
                className={`${size} ${i <= Math.round(value) ? 'text-yellow-400' : 'text-light-border dark:text-dark-border'}`}
            />
        ))}
    </span>
);

// ── Reviews modal ────────────────────────────────────────────────────────────

const ReviewsModal: React.FC<{
    artisan: Artisan;
    isAuthenticated: boolean;
    onClose: () => void;
    onRated: (average: number, count: number) => void;
}> = ({ artisan, isAuthenticated, onClose, onRated }) => {
    const { showError, showSuccess } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [average, setAverage] = useState<number>(artisan.artisanRating ?? 0);
    const [count, setCount] = useState<number>(artisan.artisanReviewsCount ?? 0);
    const [loading, setLoading] = useState(true);

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [rateOpen, setRateOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            const res: any = await artisanAPI.reviews(artisan.id);
            if (res?.success) {
                setReviews(res.data.reviews || []);
                setAverage(res.data.average ?? 0);
                setCount(res.data.count ?? 0);
            }
        } catch {
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }, [artisan.id]);

    useEffect(() => { load(); }, [load]);

    const submit = async () => {
        if (rating < 1) { showError('Please choose a star rating.'); return; }
        setSaving(true);
        try {
            const res: any = await artisanAPI.submitReview(artisan.id, rating, comment || undefined);
            if (!res?.success) throw new Error(res?.message || 'Could not save your review.');
            showSuccess(res.message || 'Thank you for your review.');
            setRateOpen(false);
            setRating(0);
            setComment('');
            onRated(res.data.average ?? 0, res.data.count ?? 0);
            await load();
        } catch (e: any) {
            showError(e?.message || 'Could not save your review.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl p-6">
                <button
                    onClick={onClose}
                    aria-label="Close reviews"
                    className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary pr-8">
                    {artisan.fullName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <Stars value={average} />
                    <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {average ? average.toFixed(1) : '—'} Average &middot; {count} Review{count === 1 ? '' : 's'}
                    </span>
                </div>

                <div className="flex items-center justify-between mt-6 mb-3">
                    <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary">Customer Reviews</h3>
                    {isAuthenticated ? (
                        <button
                            onClick={() => setRateOpen(v => !v)}
                            className="px-4 py-2 rounded-full bg-emerald-500 text-white text-xs font-bold tracking-wide hover:bg-emerald-600 transition-colors"
                        >
                            RATE THIS ARTISAN
                        </button>
                    ) : (
                        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                            Sign in to leave a review
                        </span>
                    )}
                </div>

                {rateOpen && (
                    <div className="mb-4 p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg">
                        <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setRating(i)}
                                    aria-label={`Rate ${i} star${i === 1 ? '' : 's'}`}
                                    className="p-0.5"
                                >
                                    <StarSolidIcon
                                        className={`w-7 h-7 transition-colors ${i <= rating ? 'text-yellow-400' : 'text-light-border dark:text-dark-border hover:text-yellow-300'}`}
                                    />
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={3}
                            maxLength={1000}
                            placeholder="How was the work? (optional)"
                            className="w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg px-3 py-2 text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none"
                        />
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={submit}
                                disabled={saving}
                                className="flex-1 bg-brand-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-secondary disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : 'Submit review'}
                            </button>
                            <button
                                onClick={() => setRateOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary py-6 text-center">Loading reviews…</p>
                ) : reviews.length === 0 ? (
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary py-6 text-center">
                        No reviews yet. Be the first to rate {artisan.fullName.split(' ')[0]}.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {reviews.map(r => (
                            <div key={r.id} className="p-4 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {r.reviewer?.avatarUrl
                                            ? <img src={r.reviewer.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                            : <div className="w-8 h-8 rounded-full bg-brand-primary/15 flex-shrink-0" />}
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary truncate">
                                                {r.reviewer?.fullName || 'ShelTrify user'}
                                            </p>
                                            <Stars value={r.rating} size="w-3 h-3" />
                                        </div>
                                    </div>
                                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary flex-shrink-0">
                                        {new Date(r.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {r.comment && (
                                    <p className="mt-2 text-sm italic text-light-text-secondary dark:text-dark-text-secondary">
                                        &ldquo;{r.comment}&rdquo;
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Artisan card ─────────────────────────────────────────────────────────────

const ArtisanCard: React.FC<{ artisan: Artisan; onReviews: () => void }> = ({ artisan, onReviews }) => {
    const rating = artisan.artisanRating ?? 0;
    const reviews = artisan.artisanReviewsCount ?? 0;
    // Digits only — wa.me rejects spaces, plus signs, and punctuation.
    const waNumber = (artisan.whatsapp || artisan.phone || '').replace(/\D/g, '');

    return (
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-shadow">
            <div className="relative sm:w-40 flex-shrink-0 bg-light-bg dark:bg-dark-bg">
                {artisan.avatarUrl ? (
                    <img src={artisan.avatarUrl} alt={artisan.fullName} className="w-full h-40 sm:h-full object-cover" />
                ) : (
                    <div className="w-full h-40 sm:h-full min-h-[10rem] flex items-center justify-center">
                        <ShieldCheckIcon className="w-10 h-10 text-brand-primary/40" />
                    </div>
                )}
                {artisan.artisanExperienceYears ? (
                    <span className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/70 text-white text-[10px] font-bold tracking-wide">
                        {artisan.artisanExperienceYears} YEARS EXP.
                    </span>
                ) : null}
            </div>

            <div className="flex-1 p-4 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary leading-tight">
                        {artisan.fullName}
                    </h3>
                    {reviews > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex-shrink-0">
                            <StarSolidIcon className="w-3 h-3" /> {rating.toFixed(1)}
                        </span>
                    )}
                </div>

                <p className="mt-0.5 text-xs font-bold tracking-wide text-brand-primary uppercase">
                    {serviceLabel(artisan.artisanService)}
                    <span className="text-light-text-secondary dark:text-dark-text-secondary font-medium normal-case tracking-normal">
                        {' '}&middot; {reviews} review{reviews === 1 ? '' : 's'}
                    </span>
                </p>

                {artisan.artisanLocation && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        <MapIcon className="w-4 h-4 flex-shrink-0" /> {artisan.artisanLocation}
                    </p>
                )}

                {artisan.phone && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        <PhoneIcon className="w-4 h-4 flex-shrink-0" /> {artisan.phone}
                    </p>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                        href={artisan.phone ? `tel:${artisan.phone}` : undefined}
                        aria-disabled={!artisan.phone}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-colors ${
                            artisan.phone
                                ? 'bg-light-text-primary dark:bg-dark-overlay text-white hover:opacity-90'
                                : 'bg-light-border dark:bg-dark-border text-light-text-muted pointer-events-none'
                        }`}
                    >
                        <PhoneIcon className="w-4 h-4" /> CALL NOW
                    </a>
                    <button
                        onClick={onReviews}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold tracking-wide border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                    >
                        <CommentBubbleIcon className="w-4 h-4" /> REVIEWS
                    </button>
                </div>

                {waNumber && (
                    <a
                        href={`https://wa.me/${waNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 text-white text-xs font-bold tracking-wide hover:bg-emerald-600 transition-colors"
                    >
                        <WhatsAppIcon className="w-4 h-4" /> CHAT ON WHATSAPP
                    </a>
                )}
            </div>
        </div>
    );
};

// ── Page ─────────────────────────────────────────────────────────────────────

const ArtisansPage: React.FC<{
    isAuthenticated?: boolean;
    onJoinAsArtisan?: () => void;
}> = ({ isAuthenticated = false, onJoinAsArtisan }) => {
    const [artisans, setArtisans] = useState<Artisan[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [service, setService] = useState<string>('');
    const [active, setActive] = useState<Artisan | null>(null);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<PageMeta | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res: any = await artisanAPI.list({
                search: search || undefined,
                service: service || undefined,
                page,
            });
            setArtisans(res?.success ? (res.data.artisans || []) : []);
            setMeta(res?.success ? (res.data.pagination ?? null) : null);
        } catch {
            setArtisans([]);
            setMeta(null);
        } finally {
            setLoading(false);
        }
    }, [search, service, page]);

    // Debounced so typing in the search box does not fire a request per keystroke.
    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    // A narrower filter can make the current page not exist any more.
    useEffect(() => { setPage(1); }, [search, service]);

    // Chips are driven by the trades actually present, so the filter row never
    // offers a category that returns nothing.
    const chips = useMemo(() => {
        const present = new Set(artisans.map(a => a.artisanService).filter(Boolean) as string[]);
        const ordered = ARTISAN_CATEGORIES.filter(c => present.has(c.value));
        // Keep the active filter visible even when its results are empty.
        if (service && !ordered.some(c => c.value === service)) {
            const found = ARTISAN_CATEGORIES.find(c => c.value === service);
            if (found) ordered.unshift(found);
        }
        return ordered.slice(0, FILTER_LIMIT);
    }, [artisans, service]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
            <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold tracking-wide">
                    <CheckCircleIcon className="w-4 h-4" /> VERIFIED LOCAL ARTISANS
                </span>
                <h1 className="mt-4 text-3xl md:text-5xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    Expert Services at Your Doorstep
                </h1>
                <p className="mt-3 max-w-2xl mx-auto text-light-text-secondary dark:text-dark-text-secondary">
                    Connect with verified, skilled artisans in your local area. From repairs to
                    personal care, we&rsquo;ve vetted the best for you.
                </p>
                <button
                    onClick={onJoinAsArtisan}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-light-text-primary dark:bg-dark-overlay text-white font-semibold hover:opacity-90 transition-opacity"
                >
                    <PlusIcon className="w-5 h-5" /> Join as an Artisan
                </button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[12rem]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, trade or location"
                        className="w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-full pl-9 pr-4 py-2.5 text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                </div>

                <button
                    onClick={() => setService('')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        service === ''
                            ? 'bg-light-text-primary dark:bg-brand-primary text-white'
                            : 'bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary'
                    }`}
                >
                    All
                </button>
                {chips.map(c => (
                    <button
                        key={c.value}
                        onClick={() => setService(c.value)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                            service === c.value
                                ? 'bg-light-text-primary dark:bg-brand-primary text-white'
                                : 'bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary'
                        }`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="h-44 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border animate-pulse" />
                        ))}
                    </div>
                ) : artisans.length === 0 ? (
                    <div className="text-center py-16">
                        <ShieldCheckIcon className="w-12 h-12 mx-auto text-light-text-muted dark:text-dark-text-muted" />
                        <p className="mt-3 font-semibold text-light-text-primary dark:text-dark-text-primary">
                            No artisans found
                        </p>
                        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            {search || service
                                ? 'Try a different trade or search term.'
                                : 'Verified artisans will appear here as they join.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {artisans.map(a => (
                            <ArtisanCard key={a.id} artisan={a} onReviews={() => setActive(a)} />
                        ))}
                    </div>
                )}
            </div>

            {meta && !loading && <Pagination meta={meta} onChange={setPage} />}

            {active && (
                <ReviewsModal
                    artisan={active}
                    isAuthenticated={isAuthenticated}
                    onClose={() => setActive(null)}
                    onRated={(average, count) => {
                        setArtisans(prev => prev.map(a =>
                            a.id === active.id
                                ? { ...a, artisanRating: average, artisanReviewsCount: count }
                                : a));
                    }}
                />
            )}
        </div>
    );
};

export default ArtisansPage;
