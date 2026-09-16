import React, { useEffect, useRef, useState } from 'react';
import { SearchIcon, CloseIcon, FilterIcon, ChevronRightIcon, XMarkIcon } from './icons';
import { compactNaira } from '../utils/format';

/**
 * The filter and search controls shared by the browse pages.
 *
 * Both listings and the marketplace ask the same shape of question — free text,
 * multi-select, a range, a sort — so the controls live here rather than being
 * written twice with two sets of spacing. Each one is a plain component
 * declared at module scope: a component defined inside another's body gets a
 * new identity on every render, which remounts it and drops focus mid-keystroke.
 */

export interface Facet {
    value: string;
    count: number;
}

export interface SortOption {
    value: string;
    label: string;
}

const PILL_BASE =
    'px-3.5 py-2 rounded-full text-sm font-semibold transition-colors border';
const PILL_ON =
    'bg-light-text-primary dark:bg-brand-primary text-white border-transparent';
const PILL_OFF =
    'bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border ' +
    'text-light-text-primary dark:text-dark-text-primary hover:border-brand-primary';

const FIELD =
    'w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border ' +
    'rounded-xl px-3 py-2.5 text-sm text-light-text-primary dark:text-dark-text-primary ' +
    'focus:ring-2 focus:ring-brand-primary focus:outline-none';

/** Search box with a clear button, so a stale query is one tap to undo. */
export const SearchBar: React.FC<{
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    label?: string;
}> = ({ value, onChange, placeholder = 'Search', label = 'Search' }) => (
    <div className="relative flex-1">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none" />
        <input
            type="search"
            value={value}
            aria-label={label}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-full pl-10 pr-10 py-3 text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
        />
        {value !== '' && (
            <button
                type="button"
                onClick={() => onChange('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-bg"
            >
                <CloseIcon className="w-4 h-4" />
            </button>
        )}
    </div>
);

export const SortSelect: React.FC<{
    value: string;
    onChange: (v: string) => void;
    options: readonly SortOption[];
}> = ({ value, onChange, options }) => (
    <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Sort results"
        className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-full px-4 py-3 text-sm font-medium text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
    >
        {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
        ))}
    </select>
);

/** Opens the filter sheet on narrow screens; carries the count so it is clear filters are on. */
export const FilterButton: React.FC<{ count: number; onClick: () => void }> = ({ count, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="lg:hidden inline-flex items-center gap-2 px-4 py-3 rounded-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-sm font-semibold text-light-text-primary dark:text-dark-text-primary"
    >
        <FilterIcon className="w-4 h-4" />
        Filters
        {count > 0 && (
            <span className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-brand-primary text-white text-xs">
                {count}
            </span>
        )}
    </button>
);

/** A titled, collapsible group inside the filter panel. */
export const FilterSection: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-light-border dark:border-dark-border py-4 last:border-b-0">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className="w-full flex items-center justify-between text-left"
            >
                <span className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
                    {title}
                </span>
                <ChevronRightIcon
                    className={`w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary transition-transform ${open ? 'rotate-90' : ''}`}
                />
            </button>
            {open && <div className="mt-3">{children}</div>}
        </div>
    );
};

/**
 * Multi-select pills driven by facets from the API, so the panel never offers a
 * value that would return nothing. Counts tell a seeker where the stock is
 * before they spend a tap.
 */
export const FacetPills: React.FC<{
    options: readonly Facet[];
    selected: readonly string[];
    onToggle: (value: string) => void;
    labelFor?: (value: string) => string;
    showCounts?: boolean;
    limit?: number;
}> = ({ options, selected, onToggle, labelFor, showCounts = true, limit }) => {
    const [expanded, setExpanded] = useState(false);
    const visible = limit && !expanded ? options.slice(0, limit) : options;
    const hidden = limit ? options.length - visible.length : 0;

    if (options.length === 0) {
        return (
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                Nothing to filter by yet.
            </p>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {visible.map(o => {
                const on = selected.includes(o.value);
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onToggle(o.value)}
                        className={`${PILL_BASE} ${on ? PILL_ON : PILL_OFF}`}
                    >
                        {labelFor ? labelFor(o.value) : o.value}
                        {showCounts && (
                            <span className={`ml-1.5 text-xs ${on ? 'text-white/70' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>
                                {o.count}
                            </span>
                        )}
                    </button>
                );
            })}
            {hidden > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="px-3.5 py-2 rounded-full text-sm font-semibold text-brand-primary hover:underline"
                >
                    +{hidden} more
                </button>
            )}
        </div>
    );
};

/** "Any / 1+ / 2+ …" — the way people actually think about bedrooms. */
export const MinimumPills: React.FC<{
    value?: number;
    onChange: (v: number | undefined) => void;
    options?: readonly number[];
    label?: string;
}> = ({ value, onChange, options = [1, 2, 3, 4, 5], label = 'minimum' }) => (
    <div className="flex flex-wrap gap-2">
        <button
            type="button"
            aria-pressed={value === undefined}
            onClick={() => onChange(undefined)}
            className={`${PILL_BASE} ${value === undefined ? PILL_ON : PILL_OFF}`}
        >
            Any
        </button>
        {options.map(n => (
            <button
                key={n}
                type="button"
                aria-label={`${n} or more ${label}`}
                aria-pressed={value === n}
                onClick={() => onChange(value === n ? undefined : n)}
                className={`${PILL_BASE} ${value === n ? PILL_ON : PILL_OFF}`}
            >
                {n}+
            </button>
        ))}
    </div>
);

/**
 * Min/max money inputs with presets.
 *
 * Kept as two numbers rather than a slider: a slider cannot express "under
 * ₦500k" on a range that runs to ₦250m without unusable precision, and it is
 * fiddly on a phone.
 */
export const PriceRangeFields: React.FC<{
    min?: number;
    max?: number;
    onChange: (next: { min?: number; max?: number }) => void;
    bounds?: { min: number | null; max: number | null };
    presets?: readonly { label: string; min?: number; max?: number }[];
}> = ({ min, max, onChange, bounds, presets }) => {
    const parse = (raw: string): number | undefined => {
        const n = Number(raw.replace(/[^\d.]/g, ''));
        return raw.trim() === '' || !Number.isFinite(n) ? undefined : n;
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <input
                    inputMode="numeric"
                    value={min ?? ''}
                    onChange={e => onChange({ min: parse(e.target.value), max })}
                    placeholder="Min"
                    aria-label="Minimum price"
                    className={FIELD}
                />
                <span className="text-light-text-secondary dark:text-dark-text-secondary">–</span>
                <input
                    inputMode="numeric"
                    value={max ?? ''}
                    onChange={e => onChange({ min, max: parse(e.target.value) })}
                    placeholder="Max"
                    aria-label="Maximum price"
                    className={FIELD}
                />
            </div>

            {(min !== undefined || max !== undefined) && (
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    {min !== undefined && max !== undefined
                        ? `${compactNaira(min)} to ${compactNaira(max)}`
                        : min !== undefined
                            ? `From ${compactNaira(min)}`
                            : `Up to ${compactNaira(max)}`}
                </p>
            )}

            {presets && presets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {presets.map(p => {
                        const on = p.min === min && p.max === max;
                        return (
                            <button
                                key={p.label}
                                type="button"
                                onClick={() => onChange(on ? {} : { min: p.min, max: p.max })}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${on ? PILL_ON : PILL_OFF}`}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {bounds && bounds.min !== null && bounds.max !== null && bounds.max > bounds.min && (
                <p className="text-xs text-light-text-muted dark:text-dark-text-muted">
                    Available: {compactNaira(bounds.min)} – {compactNaira(bounds.max)}
                </p>
            )}
        </div>
    );
};

/** A labelled on/off row, for the yes-or-no filters. */
export const SwitchRow: React.FC<{
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    hint?: string;
}> = ({ label, checked, onChange, hint }) => (
    <label className="flex items-start gap-3 cursor-pointer py-1.5">
        <input
            type="checkbox"
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-light-border dark:border-dark-border text-brand-primary focus:ring-brand-primary"
        />
        <span>
            <span className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                {label}
            </span>
            {hint && (
                <span className="block text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    {hint}
                </span>
            )}
        </span>
    </label>
);

export interface ActiveChip {
    key: string;
    label: string;
}

/**
 * What is currently narrowing the results, each removable on its own.
 *
 * Without this, a filter set in a collapsed sheet is invisible, and an empty
 * page looks like an empty catalogue rather than a filter that went too far.
 */
export const ActiveFilters: React.FC<{
    chips: readonly ActiveChip[];
    onRemove: (key: string) => void;
    onClear: () => void;
}> = ({ chips, onRemove, onClear }) => {
    if (chips.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {chips.map(c => (
                <span
                    key={c.key}
                    className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold"
                >
                    {c.label}
                    <button
                        type="button"
                        onClick={() => onRemove(c.key)}
                        aria-label={`Remove filter: ${c.label}`}
                        className="p-0.5 rounded-full hover:bg-brand-primary/20"
                    >
                        <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                </span>
            ))}
            <button
                type="button"
                onClick={onClear}
                className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary underline"
            >
                Clear all
            </button>
        </div>
    );
};

/**
 * The filter panel on a phone: a bottom sheet over the results.
 *
 * Sized in dvh because a fixed viewport height sits under the mobile browser
 * chrome, which would bury the apply button. Body scroll is locked while it is
 * open and the previous value restored on close, so a page that was already
 * locked by something else is not left scrollable.
 */
export const FilterSheet: React.FC<{
    open: boolean;
    onClose: () => void;
    onClear: () => void;
    count: number;
    resultLabel: string;
    children: React.ReactNode;
}> = ({ open, onClose, onClear, count, resultLabel, children }) => {
    const previousOverflow = useRef<string>('');

    useEffect(() => {
        if (!open) return;

        previousOverflow.current = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = previousOverflow.current;
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Filters">
            <button
                type="button"
                aria-label="Close filters"
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <div className="relative bg-light-bg dark:bg-dark-bg rounded-t-3xl max-h-[85dvh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border">
                    <h2 className="text-base font-bold text-light-text-primary dark:text-dark-text-primary">
                        Filters {count > 0 && <span className="text-brand-primary">({count})</span>}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close filters"
                        className="p-2 -mr-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-card dark:hover:bg-dark-card"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 overflow-y-auto flex-1">{children}</div>

                <div className="flex items-center gap-3 px-5 py-4 border-t border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg">
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={count === 0}
                        className="px-5 py-3 rounded-full border border-light-border dark:border-dark-border text-sm font-semibold text-light-text-primary dark:text-dark-text-primary disabled:opacity-40"
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-5 py-3 rounded-full bg-brand-primary text-white text-sm font-bold hover:bg-brand-secondary transition-colors"
                    >
                        Show {resultLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

/** Placeholder cards while a page of results is in flight. */
export const CardSkeletons: React.FC<{ count?: number; className?: string }> = ({
    count = 6,
    className = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5',
}) => (
    <div className={className} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
            <div
                key={i}
                className="rounded-2xl overflow-hidden bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border"
            >
                <div className="aspect-[4/3] bg-light-border/60 dark:bg-dark-border/60 animate-pulse" />
                <div className="p-4 space-y-2.5">
                    <div className="h-4 w-3/4 rounded bg-light-border/60 dark:bg-dark-border/60 animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-light-border/60 dark:bg-dark-border/60 animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-light-border/60 dark:bg-dark-border/60 animate-pulse" />
                </div>
            </div>
        ))}
    </div>
);

/** Nothing matched — and whether that is the catalogue or the filters. */
export const EmptyResults: React.FC<{
    icon?: React.ReactNode;
    title: string;
    hint: string;
    onClear?: () => void;
}> = ({ icon, title, hint, onClear }) => (
    <div className="text-center py-16 px-4">
        {icon && <div className="flex justify-center text-light-text-muted dark:text-dark-text-muted">{icon}</div>}
        <p className="mt-3 font-semibold text-light-text-primary dark:text-dark-text-primary">{title}</p>
        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary max-w-sm mx-auto">{hint}</p>
        {onClear && (
            <button
                type="button"
                onClick={onClear}
                className="mt-5 px-5 py-2.5 rounded-full bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary transition-colors"
            >
                Clear filters
            </button>
        )}
    </div>
);
