import React, { useState, useEffect } from 'react';
import { CloseIcon, StarSolidIcon } from './icons';
import { testimonialAPI } from '../services/api';

/**
 * Lets a signed-in user submit the feedback shown on the landing page.
 *
 * Everything lands as pending. This is public marketing copy on the front door
 * of the business, so it is opt-in by an admin rather than opt-out.
 */
const FeedbackModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [rating, setRating] = useState(0);
    const [body, setBody] = useState('');
    const [location, setLocation] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Prefill from an existing submission so editing does not start blank.
    useEffect(() => {
        testimonialAPI.mine()
            .then((res: any) => {
                const t = res?.data?.testimonial;
                if (t) {
                    setRating(t.rating ?? 0);
                    setBody(t.body ?? '');
                    setLocation(t.location ?? '');
                    setStatus(t.status ?? null);
                }
            })
            .catch(() => { /* first-time submission */ });
    }, []);

    const submit = async () => {
        if (rating < 1) { setError('Please choose a star rating.'); return; }
        if (body.trim().length < 10) { setError('Please write at least a sentence.'); return; }

        setSaving(true);
        setError(null);
        try {
            const res: any = await testimonialAPI.submit({
                rating,
                body: body.trim(),
                location: location.trim() || undefined,
            });
            if (!res?.success) throw new Error(res?.message || 'Could not save your feedback.');
            setDone(true);
        } catch (e: any) {
            setError(e?.message || 'Could not save your feedback.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full sm:max-w-md bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-t-3xl sm:rounded-3xl shadow-2xl p-6">
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>

                {done ? (
                    <div className="text-center py-6">
                        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Thank you</h2>
                        <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            Your feedback will appear on the site once our team reviews it.
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-5 w-full bg-brand-primary text-white py-3 rounded-xl font-semibold hover:bg-brand-secondary transition-colors"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary pr-8">
                            Share your experience
                        </h2>
                        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            Tell other people how ShelTrify worked for you.
                        </p>

                        {status === 'pending' && (
                            <p className="mt-3 text-xs px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                Your previous feedback is awaiting review. Saving again replaces it.
                            </p>
                        )}
                        {status === 'approved' && (
                            <p className="mt-3 text-xs px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                Your feedback is live. Editing it sends it back for review.
                            </p>
                        )}

                        <div className="mt-4 flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setRating(i)}
                                    aria-label={`Rate ${i} star${i === 1 ? '' : 's'}`}
                                    className="p-0.5"
                                >
                                    <StarSolidIcon
                                        className={`w-8 h-8 transition-colors ${i <= rating ? 'text-yellow-400' : 'text-light-border dark:text-dark-border hover:text-yellow-300'}`}
                                    />
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            rows={4}
                            maxLength={1000}
                            placeholder="What did you use ShelTrify for, and how did it go?"
                            className="mt-4 w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none"
                        />

                        <input
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            maxLength={120}
                            placeholder="Where are you based? (optional)"
                            className="mt-2 w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        />

                        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

                        <button
                            onClick={submit}
                            disabled={saving}
                            className="mt-4 w-full bg-brand-primary text-white py-3 rounded-xl font-semibold hover:bg-brand-secondary disabled:opacity-50 transition-colors"
                        >
                            {saving ? 'Sending…' : 'Send feedback'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;
