import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

/**
 * Full-screen image viewer.
 *
 * Opened by clicking any thumbnail. Supports galleries (arrows, keyboard,
 * swipe, thumbnail strip) and collapses to a plain viewer for a single image.
 */
const Lightbox: React.FC<{
    images: string[];
    startIndex?: number;
    alt?: string;
    onClose: () => void;
}> = ({ images, startIndex = 0, alt = 'Image', onClose }) => {
    const [index, setIndex] = useState(() =>
        Math.min(Math.max(startIndex, 0), Math.max(images.length - 1, 0)));
    const [loaded, setLoaded] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    const many = images.length > 1;

    const go = useCallback((delta: number) => {
        if (!many) return;
        setLoaded(false);
        // Wrap around: reaching the end and being unable to continue feels broken
        // in a gallery of a handful of photos.
        setIndex(i => (i + delta + images.length) % images.length);
    }, [many, images.length]);

    // Keyboard: Escape closes, arrows page. Bound to the document because focus
    // may sit on the close button rather than the container.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowRight') go(1);
            else if (e.key === 'ArrowLeft') go(-1);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [go, onClose]);

    // Lock background scroll, restoring whatever was there before rather than
    // assuming it was the default — another overlay may already have set it.
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, []);

    // Move focus in so Escape and arrows work without a click first, and so
    // screen readers announce the dialog.
    useEffect(() => { dialogRef.current?.focus(); }, []);

    // Warm the neighbours so paging does not flash an empty frame.
    useEffect(() => {
        if (!many) return;
        [1, -1].forEach(d => {
            const img = new Image();
            img.src = images[(index + d + images.length) % images.length];
        });
    }, [index, images, many]);

    if (images.length === 0) return null;

    return (
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${alt}${many ? `, image ${index + 1} of ${images.length}` : ''}`}
            tabIndex={-1}
            // Height comes from the global `.fixed.inset-0` dvh rule in
            // sheltrify.css — see the note there on the mobile layout viewport.
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col outline-none overscroll-contain"
            onClick={onClose}
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
                if (touchStartX.current === null) return;
                const dx = e.changedTouches[0].clientX - touchStartX.current;
                // 50px keeps a tap from registering as a swipe.
                if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
                touchStartX.current = null;
            }}
        >
            <div className="flex items-center justify-between p-4 text-white/80 flex-shrink-0">
                <span className="text-sm font-medium">
                    {many ? `${index + 1} / ${images.length}` : ''}
                </span>
                <button
                    onClick={onClose}
                    aria-label="Close image viewer"
                    className="p-2 -m-2 rounded-full hover:bg-white/10 hover:text-white transition-colors"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="relative flex-1 flex items-center justify-center min-h-0 px-2 sm:px-14">
                {many && (
                    <button
                        onClick={e => { e.stopPropagation(); go(-1); }}
                        aria-label="Previous image"
                        className="absolute left-1 sm:left-3 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:bg-black/70 hover:text-white transition-colors"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                )}

                {!loaded && (
                    <div className="absolute w-8 h-8 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                )}

                <img
                    key={images[index]}
                    src={images[index]}
                    alt={alt}
                    onLoad={() => setLoaded(true)}
                    onError={() => setLoaded(true)}
                    // Stop the click bubbling to the backdrop, or tapping the
                    // photo itself would dismiss the viewer.
                    onClick={e => e.stopPropagation()}
                    className={`max-h-full max-w-full object-contain select-none transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                />

                {many && (
                    <button
                        onClick={e => { e.stopPropagation(); go(1); }}
                        aria-label="Next image"
                        className="absolute right-1 sm:right-3 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:bg-black/70 hover:text-white transition-colors"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                )}
            </div>

            {many && (
                <div
                    className="flex gap-2 overflow-x-auto p-4 scrollbar-hide flex-shrink-0 justify-start sm:justify-center"
                    onClick={e => e.stopPropagation()}
                >
                    {images.map((src, i) => (
                        <button
                            key={src + i}
                            onClick={() => { if (i !== index) { setLoaded(false); setIndex(i); } }}
                            aria-label={`View image ${i + 1}`}
                            aria-current={i === index ? 'true' : undefined}
                            className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                                i === index ? 'border-brand-primary' : 'border-transparent opacity-50 hover:opacity-90'
                            }`}
                        >
                            <img src={src} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Lightbox;

/**
 * Convenience hook: keeps the open/closed state and the image set together so
 * a page can wire a gallery with two lines instead of four pieces of state.
 */
export function useLightbox() {
    const [state, setState] = useState<{ images: string[]; index: number; alt?: string } | null>(null);

    const open = useCallback((images: (string | null | undefined)[], index = 0, alt?: string) => {
        const clean = images.filter((s): s is string => typeof s === 'string' && s.trim() !== '');
        if (clean.length === 0) return;
        setState({ images: clean, index: Math.min(Math.max(index, 0), clean.length - 1), alt });
    }, []);

    const close = useCallback(() => setState(null), []);

    return { lightbox: state, openLightbox: open, closeLightbox: close };
}
