import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

export interface PageMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * Build a compact page list with ellipses, e.g. 1 … 4 5 6 … 20.
 *
 * Always the same number of slots so the control does not reflow as the user
 * pages through, and always includes the first and last page so jumping to
 * either end never needs repeated clicks.
 */
function pageWindow(current: number, total: number): (number | 'gap')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const out: (number | 'gap')[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) out.push('gap');
    for (let i = start; i <= end; i++) out.push(i);
    if (end < total - 1) out.push('gap');

    out.push(total);
    return out;
}

const Pagination: React.FC<{
    meta: PageMeta;
    onChange: (page: number) => void;
    /** Hidden entirely when there is only one page — a lone "1" is noise. */
    className?: string;
}> = ({ meta, onChange, className = '' }) => {
    const { page, limit, total, totalPages } = meta;
    if (!totalPages || totalPages <= 1) return null;

    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    const go = (p: number) => {
        if (p < 1 || p > totalPages || p === page) return;
        onChange(p);
        // Paging that leaves you halfway down the previous page is disorienting.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const btn = 'min-w-9 h-9 px-3 inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
    const idle = 'bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary hover:border-brand-primary';

    return (
        <nav className={`mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`} aria-label="Pagination">
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary order-2 sm:order-1">
                Showing <span className="font-semibold">{from.toLocaleString()}</span>–
                <span className="font-semibold">{to.toLocaleString()}</span> of{' '}
                <span className="font-semibold">{total.toLocaleString()}</span>
            </p>

            <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <button onClick={() => go(page - 1)} disabled={page <= 1} className={`${btn} ${idle}`} aria-label="Previous page">
                    <ChevronLeftIcon className="w-4 h-4" />
                </button>

                {/* Numbered pages are hidden on narrow screens, where prev/next
                    plus the counter is enough and the row would otherwise wrap. */}
                <div className="hidden sm:flex items-center gap-1.5">
                    {pageWindow(page, totalPages).map((p, i) =>
                        p === 'gap' ? (
                            <span key={`gap-${i}`} className="px-1 text-light-text-muted dark:text-dark-text-muted">…</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => go(p)}
                                aria-current={p === page ? 'page' : undefined}
                                className={`${btn} ${p === page
                                    ? 'bg-brand-primary text-white'
                                    : idle}`}
                            >
                                {p}
                            </button>
                        ))}
                </div>

                <span className="sm:hidden text-sm font-semibold text-light-text-primary dark:text-dark-text-primary px-2">
                    {page} / {totalPages}
                </span>

                <button onClick={() => go(page + 1)} disabled={page >= totalPages} className={`${btn} ${idle}`} aria-label="Next page">
                    <ChevronRightIcon className="w-4 h-4" />
                </button>
            </div>
        </nav>
    );
};

export default Pagination;
