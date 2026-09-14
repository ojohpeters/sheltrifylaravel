import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    SearchIcon, PlusIcon, StarSolidIcon, MapIcon, PhoneIcon, UserIcon,
    WhatsAppIcon, CommentBubbleIcon, CloseIcon, CheckCircleIcon, ShieldCheckIcon,
} from './icons';
import { artisanAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ARTISAN_CATEGORIES, serviceLabel } from '../constants/services';
import Pagination, { PageMeta } from './Pagination';
import Lightbox, { useLightbox } from './Lightbox';
import { whatsAppLink, telLink, formatPhone } from '../utils/phone';

interface Artisan {
    id: number;
    fullName: string;
    phone?: string | null;
    whatsapp?: string | null;
    avatarUrl?: string | null;
    artisanLocation?: string | null;
    artisanState?: string | null;
    artisanLga?: string | null;
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

/** "Makurdi, Benue" from the structured fields, falling back to the free-text location. */
function locationOf(a: Artisan): string {
    return [a.artisanLga, a.artisanState].filter(Boolean).join(', ') || a.artisanLocation || '';
}

function firstName(a: Artisan): string {
    return (a.fullName || '').trim().split(' ')[0] || 'this artisan';
}

/** Prefilled WhatsApp message, so the artisan knows where the lead came from. */
function hireMessage(a: Artisan): string {
    const trade = serviceLabel(a.artisanService).toLowerCase();
    return `Hi ${firstName(a)}, I found you on ShelTrify and I'd like to hire you${trade ? ` for ${trade} work` : ''}.`;
}

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

const Detail: React.FC<{ icon?: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-light-bg dark:bg-dark-bg">
        {icon && <span className="mt-0.5 text-brand-primary flex-shrink-0">{icon}</span>}
        <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide uppercase text-light-text-secondary dark:text-dark-text-secondary">{label}</p>
            <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary break-words">{value}</p>
        </div>
    </div>
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
                        No reviews yet. Be the first to rate {firstName(artisan)}.
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

// ── Profile ──────────────────────────────────────────────────────────────────

/**
 * Full artisan profile: a large, face-forward photo, the bio, where they work,
 * experience, and direct contact. The card only has room for a line of bio, and
 * seekers deciding who to let into their home want to read the rest.
 */
const ArtisanProfileModal: React.FC<{
    artisan: Artisan;
    onClose: () => void;
    onReviews: () => void;
}> = ({ artisan, onClose, onReviews }) => {
    const { lightbox, openLightbox, closeLightbox } = useLightbox();
    const rating = artisan.artisanRating ?? 0;
    const reviews = artisan.artisanReviewsCount ?? 0;
    const location = locationOf(artisan);
    const wa = whatsAppLink(artisan.whatsapp || artisan.phone, hireMessage(artisan));
    const tel = telLink(artisan.phone || artisan.whatsapp);

    // Escape closes the profile — but not while the photo viewer is open on
    // top of it, which handles its own Escape.
    useEffect(() => {
        if (lightbox) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [lightbox, onClose]);

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${artisan.fullName}'s profile`}
                    onClick={e => e.stopPropagation()}
                    className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-t-3xl sm:rounded-3xl shadow-2xl"
                >
                    <button
                        onClick={onClose}
                        aria-label="Close profile"
                        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>

                    {artisan.avatarUrl ? (
                        <button
                            type="button"
                            onClick={() => openLightbox([artisan.avatarUrl], 0, artisan.fullName)}
                            aria-label="View photo full size"
                            className="block w-full cursor-zoom-in bg-light-bg dark:bg-dark-bg"
                        >
                            {/* object-top: portraits keep the face in frame when cropped. */}
                            <img
                                src={artisan.avatarUrl}
                                alt={artisan.fullName}
                                className="w-full aspect-[4/5] max-h-[52vh] object-cover object-top"
                            />
                        </button>
                    ) : (
                        <div className="w-full h-48 bg-light-bg dark:bg-dark-bg flex items-center justify-center">
                            <UserIcon className="w-16 h-16 text-brand-primary/40" />
                        </div>
                    )}

                    <div className="p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary leading-tight break-words">
                                    {artisan.fullName}
                                </h2>
                                <p className="mt-1 text-sm font-bold tracking-wide text-brand-primary uppercase">
                                    {serviceLabel(artisan.artisanService)}
                                </p>
                            </div>
                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                <CheckCircleIcon className="w-4 h-4" /> Verified
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={onReviews}
                            className="mt-2 inline-flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary transition-colors"
                        >
                            <Stars value={rating} />
                            <span>{reviews > 0 ? `${rating.toFixed(1)} · ${reviews} review${reviews === 1 ? '' : 's'}` : 'No reviews yet'}</span>
                        </button>

                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {location && <Detail icon={<MapIcon className="w-4 h-4" />} label="Location" value={location} />}
                            {artisan.artisanExperienceYears ? (
                                <Detail
                                    icon={<ShieldCheckIcon className="w-4 h-4" />}
                                    label="Experience"
                                    value={`${artisan.artisanExperienceYears} year${artisan.artisanExperienceYears === 1 ? '' : 's'}`}
                                />
                            ) : null}
                            {artisan.phone && <Detail icon={<PhoneIcon className="w-4 h-4" />} label="Phone" value={formatPhone(artisan.phone)} />}
                            {artisan.whatsapp && <Detail icon={<WhatsAppIcon className="w-4 h-4" />} label="WhatsApp" value={formatPhone(artisan.whatsapp)} />}
                        </div>

                        <div className="mt-5">
                            <h3 className="text-xs font-semibold tracking-wide uppercase text-light-text-secondary dark:text-dark-text-secondary">
                                About {firstName(artisan)}
                            </h3>
                            {artisan.artisanBio ? (
                                <p className="mt-2 text-sm leading-relaxed text-light-text-primary dark:text-dark-text-primary whitespace-pre-line break-words">
                                    {artisan.artisanBio}
                                </p>
                            ) : (
                                <p className="mt-2 text-sm italic text-light-text-secondary dark:text-dark-text-secondary">
                                    {firstName(artisan)} hasn&rsquo;t added a bio yet.
                                </p>
                            )}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-2">
                            {tel ? (
                                <a href={tel} className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-light-text-primary dark:bg-dark-overlay text-white text-sm font-bold hover:opacity-90 transition-opacity">
                                    <PhoneIcon className="w-4 h-4" /> Call
                                </a>
                            ) : (
                                <span className="flex items-center justify-center py-3 rounded-xl bg-light-border dark:bg-dark-border text-light-text-muted text-sm font-bold">No phone</span>
                            )}
                            {wa ? (
                                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors">
                                    <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                                </a>
                            ) : (
                                <span className="flex items-center justify-center py-3 rounded-xl bg-light-border dark:bg-dark-border text-light-text-muted text-sm font-bold">No WhatsApp</span>
                            )}
                        </div>
                        <button
                            onClick={onReviews}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm font-bold hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                        >
                            <CommentBubbleIcon className="w-4 h-4" /> Reviews
                        </button>
                    </div>
                </div>
            </div>

            {/* A sibling rather than a child of the backdrop: nested inside it,
                a tap that closes the photo viewer would bubble up and close the
                profile too. */}
            {lightbox && (
                <Lightbox images={lightbox.images} startIndex={lightbox.index} alt={lightbox.alt} onClose={closeLightbox} />
            )}
        </>
    );
};

// ── Artisan card ─────────────────────────────────────────────────────────────

const ArtisanCard: React.FC<{ artisan: Artisan; onReviews: () => void; onProfile: () => void }> = ({ artisan, onReviews, onProfile }) => {
    const rating = artisan.artisanRating ?? 0;
    const reviews = artisan.artisanReviewsCount ?? 0;
    const location = locationOf(artisan);
    const wa = whatsAppLink(artisan.whatsapp || artisan.phone, hireMessage(artisan));
    const tel = telLink(artisan.phone || artisan.whatsapp);

    return (
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-shadow">
            <button
                type="button"
                onClick={onProfile}
                aria-label={`View ${artisan.fullName}'s profile`}
                className="relative sm:w-44 sm:min-h-[15rem] flex-shrink-0 bg-light-bg dark:bg-dark-bg"
            >
                {artisan.avatarUrl ? (
                    // object-top keeps the face in frame. Cropped around the
                    // centre, a portrait in this short, wide mobile frame showed
                    // a torso and cut the head off entirely.
                    <img src={artisan.avatarUrl} alt={artisan.fullName} className="w-full h-64 sm:h-full object-cover object-top" />
                ) : (
                    <div className="w-full h-64 sm:h-full flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-brand-primary/40" />
                    </div>
                )}
                {artisan.artisanExperienceYears ? (
                    <span className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/70 text-white text-[10px] font-bold tracking-wide">
                        {artisan.artisanExperienceYears} YEARS EXP.
                    </span>
                ) : null}
            </button>

            <div className="flex-1 p-4 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                    <button type="button" onClick={onProfile} className="text-left min-w-0">
                        <h3 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary leading-tight hover:text-brand-primary transition-colors break-words">
                            {artisan.fullName}
                        </h3>
                    </button>
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

                {artisan.artisanBio && (
                    <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary line-clamp-2 break-words">
                        {artisan.artisanBio}
                    </p>
                )}

                {location && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        <MapIcon className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{location}</span>
                    </p>
                )}

                {artisan.phone && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        <PhoneIcon className="w-4 h-4 flex-shrink-0" /> {formatPhone(artisan.phone)}
                    </p>
                )}

                <div className="mt-auto pt-3 grid grid-cols-2 gap-2">
                    <a
                        href={tel || undefined}
                        aria-disabled={!tel}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-colors ${
                            tel
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
                    <button
                        onClick={onProfile}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold tracking-wide border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 transition-colors ${wa ? '' : 'col-span-2'}`}
                    >
                        <UserIcon className="w-4 h-4" /> VIEW PROFILE
                    </button>
                    {wa && (
                        <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-500 text-white text-xs font-bold tracking-wide hover:bg-emerald-600 transition-colors"
                        >
                            <WhatsAppIcon className="w-4 h-4" /> WHATSAPP
                        </a>
                    )}
                </div>
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
    const [stateFilter, setStateFilter] = useState<string>('');
    const [states, setStates] = useState<string[]>([]);
    const [active, setActive] = useState<Artisan | null>(null);
    const [profile, setProfile] = useState<Artisan | null>(null);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<PageMeta | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res: any = await artisanAPI.list({
                search: search || undefined,
                service: service || undefined,
                state: stateFilter || undefined,
                page,
            });
            setArtisans(res?.success ? (res.data.artisans || []) : []);
            setMeta(res?.success ? (res.data.pagination ?? null) : null);
            if (res?.success && Array.isArray(res.data.states)) setStates(res.data.states);
        } catch {
            setArtisans([]);
            setMeta(null);
        } finally {
            setLoading(false);
        }
    }, [search, service, stateFilter, page]);

    // Debounced so typing in the search box does not fire a request per keystroke.
    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    // A narrower filter can make the current page not exist any more.
    useEffect(() => { setPage(1); }, [search, service, stateFilter]);

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

    const stateOptions = useMemo(
        () => Array.from(new Set([...(stateFilter ? [stateFilter] : []), ...states])).sort(),
        [states, stateFilter],
    );

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

            <div className="mt-10 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, trade, LGA or state"
                        className="w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-full pl-9 pr-4 py-2.5 text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                </div>
                {stateOptions.length > 0 && (
                    <select
                        value={stateFilter}
                        onChange={e => setStateFilter(e.target.value)}
                        aria-label="Filter by state"
                        className="sm:w-56 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-full px-4 py-2.5 text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    >
                        <option value="">All states</option>
                        {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
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
                            <div key={i} className="h-60 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border animate-pulse" />
                        ))}
                    </div>
                ) : artisans.length === 0 ? (
                    <div className="text-center py-16">
                        <ShieldCheckIcon className="w-12 h-12 mx-auto text-light-text-muted dark:text-dark-text-muted" />
                        <p className="mt-3 font-semibold text-light-text-primary dark:text-dark-text-primary">
                            No artisans found
                        </p>
                        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            {search || service || stateFilter
                                ? 'Try a different trade, state or search term.'
                                : 'Verified artisans will appear here as they join.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {artisans.map(a => (
                            <ArtisanCard
                                key={a.id}
                                artisan={a}
                                onReviews={() => setActive(a)}
                                onProfile={() => setProfile(a)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {meta && !loading && <Pagination meta={meta} onChange={setPage} />}

            {profile && (
                <ArtisanProfileModal
                    artisan={profile}
                    onClose={() => setProfile(null)}
                    onReviews={() => { setActive(profile); setProfile(null); }}
                />
            )}

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
