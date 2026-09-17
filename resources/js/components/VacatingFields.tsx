import React from 'react';
import { CloseIcon, PlusIcon } from './icons';

/**
 * Form fields shared by the two Vacating Soon forms.
 *
 * Declared at module scope, not inside the forms: a component defined in
 * another component's body is a new type on every render, so React remounts it
 * and the input loses focus after each keystroke.
 */

export const FIELD =
    'w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border ' +
    'rounded-xl px-4 py-2.5 text-sm text-light-text-primary dark:text-dark-text-primary ' +
    'focus:ring-2 focus:ring-brand-primary focus:outline-none';

export const Field: React.FC<{
    label: string;
    hint?: string;
    required?: boolean;
    children: React.ReactNode;
}> = ({ label, hint, required, children }) => (
    <label className="block">
        <span className="block text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-1">
            {label}
            {required && <span className="text-red-500"> *</span>}
        </span>
        {children}
        {hint && (
            <span className="block mt-1 text-[11px] text-light-text-muted dark:text-dark-text-muted">{hint}</span>
        )}
    </label>
);

export const TextInput: React.FC<{
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    min?: string;
    list?: string;
    required?: boolean;
}> = ({ value, onChange, placeholder, type = 'text', min, list, required }) => (
    <input
        type={type}
        value={value}
        min={min}
        list={list}
        required={required}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={FIELD}
    />
);

export const Select: React.FC<{
    value: string;
    onChange: (v: string) => void;
    options: readonly string[];
    placeholder?: string;
}> = ({ value, onChange, options, placeholder }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className={FIELD}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
);

/** +234 as a fixed prefix, so the number is stored in the form WhatsApp resolves. */
export const PhoneInput: React.FC<{
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}> = ({ value, onChange, placeholder = '807 588 7105' }) => (
    <div className="flex">
        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">
            +234
        </span>
        <input
            type="tel"
            inputMode="numeric"
            value={value}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 11))}
            className={`${FIELD} rounded-l-none`}
        />
    </div>
);

/**
 * Several areas per seeker, as removable chips.
 *
 * "High Level or Wurukum" is one person waiting, not two waitlist entries, and
 * splitting them would double-count the demand board the team reads.
 */
export const AreaChips: React.FC<{
    values: string[];
    onChange: (next: string[]) => void;
    /**
     * The half-typed area, held by the form rather than in here.
     *
     * Someone who types "High Level" and taps Submit has, as far as they are
     * concerned, filled the field in — but the chip was never added, so the
     * form saw an empty list and refused. The form owns the draft so it can
     * commit it on submit instead of blaming the person for it.
     */
    draft: string;
    onDraftChange: (v: string) => void;
    suggestions?: string[];
    max?: number;
}> = ({ values, onChange, draft, onDraftChange, suggestions = [], max = 5 }) => {
    const setDraft = onDraftChange;

    const add = (raw: string) => {
        const area = raw.trim();
        if (!area || values.length >= max) return;
        // The same place typed differently is still the same place.
        const seen = values.some(v => v.toLowerCase().trim() === area.toLowerCase());
        if (!seen) onChange([...values, area]);
        setDraft('');
    };

    const unused = suggestions
        .filter(s => !values.some(v => v.toLowerCase().trim() === s.toLowerCase().trim()))
        .slice(0, 8);

    return (
        <div>
            <div className="flex gap-2">
                <input
                    value={draft}
                    list="vacating-area-suggestions"
                    placeholder="e.g. High Level"
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') {
                            // Enter would otherwise submit the whole form.
                            e.preventDefault();
                            add(draft);
                        }
                    }}
                    className={FIELD}
                />
                <button
                    type="button"
                    onClick={() => add(draft)}
                    disabled={!draft.trim() || values.length >= max}
                    aria-label="Add area"
                    className="shrink-0 px-4 rounded-xl bg-brand-primary text-white text-sm font-semibold disabled:opacity-40"
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
            </div>

            {draft.trim() !== '' && !values.some(v => v.toLowerCase().trim() === draft.toLowerCase().trim()) && (
                <p className="mt-1.5 text-[11px] text-brand-primary font-semibold">
                    Press + to add &ldquo;{draft.trim()}&rdquo;
                </p>
            )}

            {values.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {values.map(v => (
                        <span
                            key={v}
                            className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold"
                        >
                            {v}
                            <button
                                type="button"
                                aria-label={`Remove ${v}`}
                                onClick={() => onChange(values.filter(x => x !== v))}
                                className="p-0.5 rounded-full hover:bg-brand-primary/20"
                            >
                                <CloseIcon className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {unused.length > 0 && values.length < max && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {unused.map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => add(s)}
                            className="px-2.5 py-1 rounded-full border border-dashed border-light-border dark:border-dark-border text-[11px] text-light-text-secondary dark:text-dark-text-secondary hover:border-brand-primary hover:text-brand-primary"
                        >
                            + {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
