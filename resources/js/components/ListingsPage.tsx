import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listingsAPI } from '../services/api';
import { PROPERTY_TYPES } from '../constants/property';
import { listingPrice, formatNaira, plural } from '../utils/format';
import { whatsAppLink, telLink, formatPhone } from '../utils/phone';
import Pagination, { PageMeta } from './Pagination';
import Lightbox, { useLightbox } from './Lightbox';
import Portal from './Portal';
import {
    ActiveFilters, ActiveChip, CardSkeletons, EmptyResults, Facet, FacetPills,
    FilterButton, FilterSection, FilterSheet, MinimumPills, PriceRangeFields,
    SearchBar, SortSelect, SwitchRow,
} from './FilterControls';
import {
    MapIcon, HeartIcon, EyeIcon, PhoneIcon, WhatsAppIcon, CloseIcon, LinkIcon,
    ResidentialHouseIcon, CheckCircleIcon, PhotoIcon, TrendingUpIcon,
} from './icons';

/**
 * The property search.
 *
 * GET /api/listings had supported search, filtering and boosted-first ordering
 * for a long time with nothing calling it — every listing a landlord published
 * was only reachable through the AI chat. This is the page that browses them.
 */

export interface Listing {
    id: number;
    title: string;
    description?: string | null;
    price?: string | null;
    priceAmount?: number | null;
    pricePeriod?: string | null;
    location?: string | null;
    state?: string | null;
    city?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    propertyType?: string | null;
    listingType?: string | null;
    imageUrl?: string | null;
    images?: string[] | null;
    videoUrl?: string | null;
    amenities?: string[] | null;
    tags?: string[] | null;
    furnished?: boolean | null;
    parking?: boolean | null;
    landlordName?: string | null;
    isBoosted?: boolean | null;
    boostedUntil?: string | null;
    viewsCount?: number | null;
    createdAt?: string | null;
    user?: { id: number; fullName?: string | null; avatarUrl?: string | null } | null;
}

interface Facets {
    propertyTypes: Facet[];
    listingTypes: Facet[];
    states: Facet[];
    priceRange: { min: number | null; max: number | null };
}

interface Filters {
    search: string;
    propertyType: string[];
    listingType: string[];
    state: string[];
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
    minBathrooms?: number;
    furnished: boolean;
    parking: boolean;
    sort: string;
}

const EMPTY: Filters = {
    search: '', propertyType: [], listingType: [], state: [],
    furnished: false, parking: false, sort: 'newest',
};

const SORTS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'priceAsc', label: 'Price: low to high' },
    { value: 'priceDesc', label: 'Price: high to low' },
    { value: 'bedrooms', label: 'Most bedrooms' },
    { value: 'popular', label: 'Most viewed' },
    { value: 'oldest', label: 'Oldest first' },
] as const;

// Round numbers that match how rent is actually quoted, rather than an even
// split of the range.
const PRICE_PRESETS = [
    { label: 'Under ₦500k', max: 500_000 },
    { label: '₦500k – ₦1m', min: 500_000, max: 1_000_000 },
    { label: '₦1m – ₦3m', min: 1_000_000, max: 3_000_000 },
    { label: '₦3m – ₦10m', min: 3_000_000, max: 10_000_000 },
    { label: '₦10m+', min: 10_000_000 },
];

const LISTING_TYPE_LABELS: Record<string, string> = {
    rent: 'For rent',
    sale: 'For sale',
    shortlet: 'Shortlet',
    lease: 'For lease',
};

function listingTypeLabel(value: string): string {
    return LISTING_TYPE_LABELS[value.toLowerCase()] ?? value;
}

/** Every photo on a listing, oldest field first, with blanks dropped. */
function galleryOf(l: Listing): string[] {
    const all = [l.imageUrl, ...(Array.isArray(l.images) ? l.images : [])];
    return Array.from(new Set(all.filter((s): s is string => typeof s === 'string' && s.trim() !== '')));
}

function placeOf(l: Listing): string {
    return [l.location, l.city, l.state].filter(Boolean).join(', ') || 'Nigeria';
}

function isBoostedNow(l: Listing): boolean {
    return Boolean(l.isBoosted && l.boostedUntil && new Date(l.boostedUntil).getTime() > Date.now());
}

/** The shape the existing saved-properties list keeps in localStorage. */
function toProperty(l: Listing) {
    return {
        id: l.id,
        title: l.title,
        imageUrl: galleryOf(l)[0] ?? '',
        price: listingPrice(l),
        location: placeOf(l),
        bedrooms: l.bedrooms ?? undefined,
        amenities: l.amenities ?? undefined,
        propertyType: l.propertyType ?? undefined,
        videoUrl: l.videoUrl ?? undefined,
    };
}

// ── cards ────────────────────────────────────────────────────────────────────

const Fact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-xl bg-light-bg dark:bg-dark-bg px-3 py-2.5">
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{label}</p>
        <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mt-0.5">{value}</p>
    </div>
);

const ListingCard: React.FC<{
    listing: Listing;
    saved: boolean;
    onOpen: () => void;
    onToggleSave: () => void;
}> = ({ listing, saved, onOpen, onToggleSave }) => {
    const photos = galleryOf(listing);
    const boosted = isBoostedNow(listing);

    return (
        <article className="group relative rounded-2xl overflow-hidden bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-brand-primary hover:shadow-lg transition-all flex flex-col">
            <button
                type="button"
                onClick={onOpen}
                aria-label={`View ${listing.title}`}
                className="relative block aspect-[4/3] w-full overflow-hidden bg-light-bg dark:bg-dark-bg"
            >
                {photos[0] ? (
                    <img
                        src={photos[0]}
                        alt={listing.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <span className="w-full h-full flex items-center justify-center text-light-text-muted dark:text-dark-text-muted">
                        <ResidentialHouseIcon className="w-10 h-10" />
                    </span>
                )}

                {boosted && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-primary text-white text-[11px] font-bold shadow">
                        <TrendingUpIcon className="w-3 h-3" /> Featured
                    </span>
                )}

                {photos.length > 1 && (
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[11px] font-semibold">
                        <PhotoIcon className="w-3 h-3" /> {photos.length}
                    </span>
                )}
            </button>

            <button
                type="button"
                onClick={onToggleSave}
                aria-label={saved ? 'Remove from saved' : 'Save this property'}
                aria-pressed={saved}
                className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur transition-colors ${
                    saved ? 'bg-brand-primary text-white' : 'bg-black/50 text-white hover:bg-black/70'
                }`}
            >
                <HeartIcon className="w-4 h-4" />
            </button>

            <div className="p-4 flex flex-col flex-1">
                <p className="text-lg font-bold text-brand-primary">{listingPrice(listing)}</p>

                <button type="button" onClick={onOpen} className="text-left mt-1">
                    <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary line-clamp-2 hover:text-brand-primary transition-colors">
                        {listing.title}
                    </h3>
                </button>

                <p className="mt-1 flex items-start gap-1.5 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    <MapIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{placeOf(listing)}</span>
                </p>

                <div className="mt-3 pt-3 border-t border-light-border dark:border-dark-border flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    {listing.bedrooms ? <span>{plural(listing.bedrooms, 'bed')}</span> : null}
                    {listing.bathrooms ? <span>{plural(listing.bathrooms, 'bath')}</span> : null}
                    {listing.propertyType ? <span className="capitalize">{listing.propertyType.toLowerCase()}</span> : null}
                    {listing.furnished ? <span className="text-brand-primary font-semibold">Furnished</span> : null}
                    {listing.viewsCount ? (
                        <span className="inline-flex items-center gap-1 ml-auto">
                            <EyeIcon className="w-3.5 h-3.5" /> {listing.viewsCount}
                        </span>
                    ) : null}
                </div>
            </div>
        </article>
    );
};

// ── detail ───────────────────────────────────────────────────────────────────

const ListingDetailModal: React.FC<{
    listing: Listing;
    saved: boolean;
    onToggleSave: () => void;
    onClose: () => void;
}> = ({ listing, saved, onToggleSave, onClose }) => {
    const [full, setFull] = useState<Listing>(listing);
    const [contact, setContact] = useState<{ name?: string; phone?: string; email?: string } | null>(null);
    const [loadingContact, setLoadingContact] = useState(false);
    const [copied, setCopied] = useState(false);
    const { lightbox, openLightbox, closeLightbox } = useLightbox();
    const previousOverflow = useRef('');

    const photos = galleryOf(full);

    // The detail call is what records the view, so it runs even though the card
    // already has most of these fields.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res: any = await listingsAPI.getById(listing.id);
                if (!cancelled && res?.success && res.data) setFull(res.data);
            } catch { /* the card's copy is enough to read */ }
        })();
        return () => { cancelled = true; };
    }, [listing.id]);

    useEffect(() => {
        previousOverflow.current = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previousOverflow.current;
            document.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    const revealContact = async () => {
        setLoadingContact(true);
        try {
            const res: any = await listingsAPI.getContact(listing.id);
            setContact(res?.success ? res.data : { });
        } catch {
            setContact({});
        } finally {
            setLoadingContact(false);
        }
    };

    const shareUrl = `${window.location.origin}/listings?listing=${listing.id}`;

    const share = async () => {
        const data = { title: full.title, text: `${listingPrice(full)} — ${placeOf(full)}`, url: shareUrl };
        try {
            if (navigator.share) { await navigator.share(data); return; }
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* dismissed, or no clipboard permission */ }
    };

    const phone = contact?.phone ?? '';
    const whatsapp = whatsAppLink(phone, `Hi, I saw "${full.title}" (${listingPrice(full)}) on ShelTrify. Is it still available?`);

    return (
        <Portal>
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={full.title}>
            <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <div className="relative w-full sm:max-w-3xl bg-light-bg dark:bg-dark-bg sm:rounded-2xl rounded-t-3xl max-h-[92dvh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-light-bg/95 dark:bg-dark-bg/95 backdrop-blur border-b border-light-border dark:border-dark-border">
                    <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary truncate pr-3">
                        {full.title}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={share} aria-label="Share this property"
                            className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-card dark:hover:bg-dark-card">
                            <LinkIcon className="w-5 h-5" />
                        </button>
                        <button type="button" onClick={onToggleSave} aria-label={saved ? 'Remove from saved' : 'Save this property'}
                            className={`p-2 rounded-full ${saved ? 'text-brand-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'} hover:bg-light-card dark:hover:bg-dark-card`}>
                            <HeartIcon className="w-5 h-5" />
                        </button>
                        <button type="button" onClick={onClose} aria-label="Close"
                            className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-card dark:hover:bg-dark-card">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {copied && (
                    <p className="px-5 pt-3 text-xs font-semibold text-brand-primary">Link copied to clipboard</p>
                )}

                {photos.length > 0 && (
                    <div className="px-5 pt-4">
                        <button
                            type="button"
                            onClick={() => openLightbox(photos, 0, full.title)}
                            className="block w-full aspect-[16/10] rounded-2xl overflow-hidden bg-light-card dark:bg-dark-card"
                        >
                            <img src={photos[0]} alt={full.title} className="w-full h-full object-cover" />
                        </button>
                        {photos.length > 1 && (
                            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                                {photos.slice(1).map((src, i) => (
                                    <button
                                        key={src}
                                        type="button"
                                        onClick={() => openLightbox(photos, i + 1, full.title)}
                                        className="shrink-0 w-24 h-20 rounded-xl overflow-hidden bg-light-card dark:bg-dark-card"
                                    >
                                        <img src={src} alt={`${full.title} photo ${i + 2}`} loading="lazy" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="px-5 py-5 space-y-5">
                    <div>
                        <p className="text-2xl font-bold text-brand-primary">{listingPrice(full)}</p>
                        <h2 className="mt-1 text-lg font-bold text-light-text-primary dark:text-dark-text-primary">{full.title}</h2>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            <MapIcon className="w-4 h-4" /> {placeOf(full)}
                        </p>
                        {isBoostedNow(full) && (
                            <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
                                <TrendingUpIcon className="w-3 h-3" /> Featured listing
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {full.bedrooms ? <Fact label="Bedrooms" value={String(full.bedrooms)} /> : null}
                        {full.bathrooms ? <Fact label="Bathrooms" value={String(full.bathrooms)} /> : null}
                        {full.propertyType ? <Fact label="Type" value={full.propertyType} /> : null}
                        {full.listingType ? <Fact label="Offer" value={listingTypeLabel(full.listingType)} /> : null}
                        <Fact label="Furnished" value={full.furnished ? 'Yes' : 'No'} />
                        <Fact label="Parking" value={full.parking ? 'Yes' : 'No'} />
                        {full.viewsCount ? <Fact label="Views" value={String(full.viewsCount)} /> : null}
                    </div>

                    {Array.isArray(full.amenities) && full.amenities.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">Amenities</h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {full.amenities.map(a => (
                                    <span key={a} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-xs font-medium text-light-text-primary dark:text-dark-text-primary">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-brand-primary" /> {a}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {full.description && (
                        <div>
                            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">About this property</h3>
                            <p className="mt-2 text-sm leading-relaxed text-light-text-secondary dark:text-dark-text-secondary whitespace-pre-line">
                                {full.description}
                            </p>
                        </div>
                    )}

                    <div className="rounded-2xl border border-light-border dark:border-dark-border p-4">
                        <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
                            Contact {full.landlordName || full.user?.fullName || 'the landlord'}
                        </h3>

                        {!contact ? (
                            <>
                                <p className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                    Mention ShelTrify when you call — never pay an inspection fee before seeing the property.
                                </p>
                                <button
                                    type="button"
                                    onClick={revealContact}
                                    disabled={loadingContact}
                                    className="mt-3 w-full px-5 py-3 rounded-full bg-brand-primary text-white text-sm font-bold hover:bg-brand-secondary transition-colors disabled:opacity-60"
                                >
                                    {loadingContact ? 'Getting details…' : 'Show contact details'}
                                </button>
                            </>
                        ) : phone ? (
                            <div className="mt-3 space-y-2">
                                <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                                    {formatPhone(phone)}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <a
                                        href={telLink(phone)}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-light-text-primary dark:bg-dark-overlay text-white text-sm font-bold"
                                    >
                                        <PhoneIcon className="w-4 h-4" /> Call
                                    </a>
                                    {whatsapp && (
                                        <a
                                            href={whatsapp}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#25D366] text-white text-sm font-bold"
                                        >
                                            <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                                        </a>
                                    )}
                                </div>
                                {contact.email && (
                                    <a href={`mailto:${contact.email}`} className="block text-xs text-brand-primary hover:underline">
                                        {contact.email}
                                    </a>
                                )}
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                This landlord has not added a phone number. Try the chat assistant for help reaching them.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {lightbox && (
                <Lightbox
                    images={lightbox.images}
                    startIndex={lightbox.index}
                    alt={lightbox.alt}
                    onClose={closeLightbox}
                />
            )}
        </div>
        </Portal>
    );
};

// ── filter panel ─────────────────────────────────────────────────────────────

const FiltersBody: React.FC<{
    filters: Filters;
    facets: Facets | null;
    onPatch: (patch: Partial<Filters>) => void;
    onToggleList: (key: 'propertyType' | 'listingType' | 'state', value: string) => void;
}> = ({ filters, facets, onPatch, onToggleList }) => {
    // Fall back to the shared property-type list only while the first page of
    // facets is in flight, so the panel is never momentarily empty.
    const typeFacets: Facet[] = facets?.propertyTypes.length
        ? facets.propertyTypes
        : PROPERTY_TYPES.map(t => ({ value: t, count: 0 }));

    return (
        <div>
            <FilterSection title="Price">
                <PriceRangeFields
                    min={filters.minPrice}
                    max={filters.maxPrice}
                    bounds={facets?.priceRange}
                    presets={PRICE_PRESETS}
                    onChange={next => onPatch({ minPrice: next.min, maxPrice: next.max })}
                />
            </FilterSection>

            <FilterSection title="Property type">
                <FacetPills
                    options={typeFacets}
                    selected={filters.propertyType}
                    showCounts={Boolean(facets?.propertyTypes.length)}
                    onToggle={v => onToggleList('propertyType', v)}
                    limit={8}
                />
            </FilterSection>

            {(facets?.listingTypes.length ?? 0) > 1 && (
                <FilterSection title="Rent or buy">
                    <FacetPills
                        options={facets!.listingTypes}
                        selected={filters.listingType}
                        labelFor={listingTypeLabel}
                        onToggle={v => onToggleList('listingType', v)}
                    />
                </FilterSection>
            )}

            <FilterSection title="Bedrooms">
                <MinimumPills
                    value={filters.minBedrooms}
                    label="bedrooms"
                    onChange={v => onPatch({ minBedrooms: v })}
                />
            </FilterSection>

            <FilterSection title="Bathrooms" defaultOpen={false}>
                <MinimumPills
                    value={filters.minBathrooms}
                    label="bathrooms"
                    options={[1, 2, 3, 4]}
                    onChange={v => onPatch({ minBathrooms: v })}
                />
            </FilterSection>

            {(facets?.states.length ?? 0) > 0 && (
                <FilterSection title="State">
                    <FacetPills
                        options={facets!.states}
                        selected={filters.state}
                        onToggle={v => onToggleList('state', v)}
                        limit={10}
                    />
                </FilterSection>
            )}

            <FilterSection title="Features" defaultOpen={false}>
                <SwitchRow
                    label="Furnished"
                    checked={filters.furnished}
                    onChange={v => onPatch({ furnished: v })}
                />
                <SwitchRow
                    label="Parking space"
                    checked={filters.parking}
                    onChange={v => onPatch({ parking: v })}
                />
            </FilterSection>
        </div>
    );
};

// ── page ─────────────────────────────────────────────────────────────────────

/** Filters as a query string, so a search can be bookmarked or sent to someone. */
function toQuery(f: Filters, page: number): string {
    const q = new URLSearchParams();
    if (f.search) q.set('search', f.search);
    if (f.propertyType.length) q.set('type', f.propertyType.join(','));
    if (f.listingType.length) q.set('offer', f.listingType.join(','));
    if (f.state.length) q.set('state', f.state.join(','));
    if (f.minPrice !== undefined) q.set('min', String(f.minPrice));
    if (f.maxPrice !== undefined) q.set('max', String(f.maxPrice));
    if (f.minBedrooms !== undefined) q.set('beds', String(f.minBedrooms));
    if (f.minBathrooms !== undefined) q.set('baths', String(f.minBathrooms));
    if (f.furnished) q.set('furnished', '1');
    if (f.parking) q.set('parking', '1');
    if (f.sort !== 'newest') q.set('sort', f.sort);
    if (page > 1) q.set('page', String(page));
    return q.toString();
}

function fromQuery(search: string): { filters: Filters; page: number; listing?: number } {
    const q = new URLSearchParams(search);
    const list = (key: string) => (q.get(key) ? q.get(key)!.split(',').filter(Boolean) : []);
    const num = (key: string) => {
        const raw = q.get(key);
        const n = raw === null ? NaN : Number(raw);
        return Number.isFinite(n) ? n : undefined;
    };
    const sort = q.get('sort') ?? 'newest';

    return {
        filters: {
            search: q.get('search') ?? '',
            propertyType: list('type'),
            listingType: list('offer'),
            state: list('state'),
            minPrice: num('min'),
            maxPrice: num('max'),
            minBedrooms: num('beds'),
            minBathrooms: num('baths'),
            furnished: q.get('furnished') === '1',
            parking: q.get('parking') === '1',
            sort: SORTS.some(s => s.value === sort) ? sort : 'newest',
        },
        page: Math.max(1, num('page') ?? 1),
        listing: num('listing'),
    };
}

const ListingsPage: React.FC<{
    favorites?: { id: number }[];
    onToggleFavorite?: (property: any) => void;
    onListProperty?: () => void;
}> = ({ favorites = [], onToggleFavorite, onListProperty }) => {
    const initial = useMemo(
        () => fromQuery(typeof window === 'undefined' ? '' : window.location.search),
        [],
    );

    const [filters, setFilters] = useState<Filters>(initial.filters);
    const [page, setPage] = useState(initial.page);
    const [listings, setListings] = useState<Listing[]>([]);
    const [facets, setFacets] = useState<Facets | null>(null);
    const [meta, setMeta] = useState<PageMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [active, setActive] = useState<Listing | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res: any = await listingsAPI.getAll({
                page,
                limit: 12,
                search: filters.search || undefined,
                propertyType: filters.propertyType.join(',') || undefined,
                listingType: filters.listingType.join(',') || undefined,
                state: filters.state.join(',') || undefined,
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                minBedrooms: filters.minBedrooms,
                minBathrooms: filters.minBathrooms,
                // Sent only when on: `furnished=false` would mean "show me the
                // unfurnished ones", which is not what an unticked box says.
                furnished: filters.furnished || undefined,
                parking: filters.parking || undefined,
                sort: filters.sort,
            });

            if (res?.success) {
                setListings(res.data.listings ?? []);
                setMeta(res.data.pagination ?? null);
                if (res.data.facets) setFacets(res.data.facets);
            } else {
                setListings([]);
                setMeta(null);
            }
        } catch {
            setListings([]);
            setMeta(null);
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    // Debounced: typing in the search box should not fire a request per keystroke.
    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    // Keep the address bar in step so the current search can be shared, without
    // replacing Inertia's history state (which would break the back button).
    useEffect(() => {
        const query = toQuery(filters, page);
        const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
        window.history.replaceState(window.history.state, '', url);
    }, [filters, page]);

    // A shared link can point at one property. It is usually in the first page
    // of results, but not when the sender had filters applied — so fall back to
    // fetching it by id rather than silently opening nothing.
    const deepLinked = useRef(initial.listing);
    useEffect(() => {
        const id = deepLinked.current;
        if (!id || loading) return;

        deepLinked.current = undefined;

        const found = listings.find(l => l.id === id);
        if (found) {
            setActive(found);
            return;
        }

        (async () => {
            try {
                const res: any = await listingsAPI.getById(id);
                if (res?.success && res.data) setActive(res.data);
            } catch { /* the listing was removed, or the link was mistyped */ }
        })();
    }, [listings, loading]);

    const patch = useCallback((next: Partial<Filters>) => {
        setFilters(prev => ({ ...prev, ...next }));
        setPage(1);
    }, []);

    const toggleList = useCallback((key: 'propertyType' | 'listingType' | 'state', value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value],
        }));
        setPage(1);
    }, []);

    const clearAll = useCallback(() => {
        setFilters(prev => ({ ...EMPTY, sort: prev.sort }));
        setPage(1);
    }, []);

    const chips: ActiveChip[] = useMemo(() => {
        const out: ActiveChip[] = [];
        filters.propertyType.forEach(v => out.push({ key: `type:${v}`, label: v }));
        filters.listingType.forEach(v => out.push({ key: `offer:${v}`, label: listingTypeLabel(v) }));
        filters.state.forEach(v => out.push({ key: `state:${v}`, label: v }));
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            out.push({
                key: 'price',
                label: filters.minPrice !== undefined && filters.maxPrice !== undefined
                    ? `${formatNaira(filters.minPrice)} – ${formatNaira(filters.maxPrice)}`
                    : filters.minPrice !== undefined
                        ? `From ${formatNaira(filters.minPrice)}`
                        : `Up to ${formatNaira(filters.maxPrice)}`,
            });
        }
        if (filters.minBedrooms !== undefined) out.push({ key: 'beds', label: `${filters.minBedrooms}+ beds` });
        if (filters.minBathrooms !== undefined) out.push({ key: 'baths', label: `${filters.minBathrooms}+ baths` });
        if (filters.furnished) out.push({ key: 'furnished', label: 'Furnished' });
        if (filters.parking) out.push({ key: 'parking', label: 'Parking' });
        return out;
    }, [filters]);

    const removeChip = useCallback((key: string) => {
        const [kind, value] = key.split(':');
        if (kind === 'type') return toggleList('propertyType', value);
        if (kind === 'offer') return toggleList('listingType', value);
        if (kind === 'state') return toggleList('state', value);
        if (kind === 'price') return patch({ minPrice: undefined, maxPrice: undefined });
        if (kind === 'beds') return patch({ minBedrooms: undefined });
        if (kind === 'baths') return patch({ minBathrooms: undefined });
        if (kind === 'furnished') return patch({ furnished: false });
        if (kind === 'parking') return patch({ parking: false });
    }, [patch, toggleList]);

    const savedIds = useMemo(() => new Set(favorites.map(f => f.id)), [favorites]);
    const total = meta?.total ?? 0;
    const resultLabel = loading ? 'results' : plural(total, 'home');

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <div className="text-center">
                <h1 className="text-3xl md:text-5xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    Find a place to call home
                </h1>
                <p className="mt-3 max-w-2xl mx-auto text-light-text-secondary dark:text-dark-text-secondary">
                    Browse verified rentals and properties for sale across Nigeria. Filter by price,
                    bedrooms and location, then talk to the landlord directly.
                </p>
                {onListProperty && (
                    <button
                        onClick={onListProperty}
                        className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-light-text-primary dark:bg-dark-overlay text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                        List your property
                    </button>
                )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-2">
                <SearchBar
                    value={filters.search}
                    onChange={v => patch({ search: v })}
                    placeholder="Search by title, area, city or state"
                    label="Search properties"
                />
                <div className="flex gap-2">
                    <SortSelect value={filters.sort} onChange={v => patch({ sort: v })} options={SORTS} />
                    <FilterButton count={chips.length} onClick={() => setSheetOpen(true)} />
                </div>
            </div>

            {chips.length > 0 && (
                <div className="mt-3">
                    <ActiveFilters chips={chips} onRemove={removeChip} onClear={clearAll} />
                </div>
            )}

            <div className="mt-6 flex gap-8 items-start">
                <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
                    <div className="rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border px-5 py-2 max-h-[calc(100dvh-8rem)] overflow-y-auto">
                        <FiltersBody filters={filters} facets={facets} onPatch={patch} onToggleList={toggleList} />
                    </div>
                </aside>

                <div className="flex-1 min-w-0">
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4" aria-live="polite">
                        {loading ? 'Searching…' : `${total.toLocaleString('en-NG')} ${total === 1 ? 'property' : 'properties'} found`}
                    </p>

                    {loading ? (
                        <CardSkeletons count={6} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" />
                    ) : listings.length === 0 ? (
                        <EmptyResults
                            icon={<ResidentialHouseIcon className="w-12 h-12" />}
                            title="No properties match that search"
                            hint={chips.length > 0 || filters.search
                                ? 'Try widening the price range, or clearing a filter or two.'
                                : 'New properties are added as landlords list them. Check back soon.'}
                            onClear={chips.length > 0 || filters.search ? clearAll : undefined}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                            {listings.map(l => (
                                <ListingCard
                                    key={l.id}
                                    listing={l}
                                    saved={savedIds.has(l.id)}
                                    onOpen={() => setActive(l)}
                                    onToggleSave={() => onToggleFavorite?.(toProperty(l))}
                                />
                            ))}
                        </div>
                    )}

                    {meta && !loading && <Pagination meta={meta} onChange={setPage} />}
                </div>
            </div>

            <FilterSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                onClear={clearAll}
                count={chips.length}
                resultLabel={resultLabel}
            >
                <FiltersBody filters={filters} facets={facets} onPatch={patch} onToggleList={toggleList} />
            </FilterSheet>

            {active && (
                <ListingDetailModal
                    listing={active}
                    saved={savedIds.has(active.id)}
                    onToggleSave={() => onToggleFavorite?.(toProperty(active))}
                    onClose={() => setActive(null)}
                />
            )}
        </div>
    );
};

export default ListingsPage;
