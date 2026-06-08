import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeftIcon, ChevronRightIcon, PhotoIcon, PhoneIcon,
    BuildingStorefrontIcon, CloseIcon,
} from './icons';
import { marketplaceAPI, subscribeAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface ProductDetailPageProps {
    product: any;
    onBack: () => void;
    isAuthenticated: boolean;
}

const formatPrice = (price: number): string => {
    if (price >= 1000000) return `₦${(price / 1000000).toFixed(2)}M`;
    return `₦${(price ?? 0).toLocaleString()}`;
};

const FALLBACK_IMAGES: Record<string, string> = {
    RESIDENTIAL_HOUSE:   'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=70',
    LAND_FOR_SALE:       'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=70',
    SHORTLET:            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=70',
    STUDENT_HOSTEL:      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=70',
    OFFICE_SPACE:        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=70',
    BUSINESS_SPACE:      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=70',
    EVENT_VENUE:         'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=70',
    WEDDING_MATERIALS:   'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=70',
    RENT_TO_OWN:         'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=70',
    BUY_PROPERTIES:      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=70',
    SALES_PROPERTIES:    'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=70',
    PROPERTY_MANAGEMENT: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=70',
    BUILDING_MATERIALS:  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=70',
    HOME_ELECTRONICS:    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=70',
    INTERIOR_DESIGN:     'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=70',
    TIPPER_DRIVERS:      'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=70',
    LOCAL_ARTISANS:      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&q=70',
};

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, onBack, isAuthenticated }) => {
    const { showSuccess, showError } = useToast();
    const [currentImg, setCurrentImg] = useState(0);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    const [subscribed, setSubscribed] = useState(false);
    const [email, setEmail] = useState('');
    const [interestSending, setInterestSending] = useState(false);
    const [interestSent, setInterestSent] = useState(false);

    const realImages: string[] = product?.images?.length
        ? product.images
        : product?.image || product?.imageUrl
            ? [product.image || product.imageUrl]
            : [];
    const fallback = FALLBACK_IMAGES[product?.category as string] || 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=70';
    const allImages: string[] = realImages.length > 0 ? realImages : [fallback];

    const phoneNumber = product?.landlordPhone || product?.user?.phone || '';
    const whatsapp = (phoneNumber || '').replace(/[^\d+]/g, '');
    const sellerName = product?.landlordName || product?.user?.fullName || product?.user?.email || 'Seller';

    const prevImage = () => setCurrentImg(i => (i === 0 ? allImages.length - 1 : i - 1));
    const nextImage = () => setCurrentImg(i => (i === allImages.length - 1 ? 0 : i + 1));

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft')  prevImage();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'Escape')     onBack();
    }, [allImages.length, onBack]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleExpressInterest = async () => {
        if (!isAuthenticated) {
            showError('Please log in to express interest.');
            return;
        }
        setInterestSending(true);
        try {
            const r = await marketplaceAPI.expressInterest(String(product.id));
            if (r.success) {
                setInterestSent(true);
                showSuccess(r.message || 'Your interest has been sent to the seller.');
            } else {
                showError(r.message || 'Failed to send interest.');
            }
        } catch (err: any) { showError(err.message || 'Failed to send interest.'); }
        finally { setInterestSending(false); }
    };

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) { showError('Enter a valid email'); return; }
        try {
            const res = await subscribeAPI.subscribe({
                email,
                productName: product.name,
                productCategory: product.category,
                productId: product.id,
            });
            if (res.success) {
                setSubscribed(true);
                showSuccess('Subscribed! We\'ll notify you of new listings like this.');
            } else { showError(res.message || 'Subscription failed'); }
        } catch (err: any) { showError(err.message || 'Subscription failed'); }
    };

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-light-bg dark:bg-dark-bg">
                <div className="text-center">
                    <p className="text-lg text-light-text-primary dark:text-dark-text-primary mb-4">No product selected.</p>
                    <button onClick={onBack} className="px-5 py-2 bg-brand-primary text-white rounded-lg font-semibold">
                        ← Back to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
            {/* Sticky back bar */}
            <div className="sticky top-0 z-20 bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-sm border-b border-light-border dark:border-dark-border">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
                    <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary hover:text-brand-primary">
                        <ChevronLeftIcon className="w-5 h-5" /> Back
                    </button>
                    <h1 className="font-semibold text-light-text-primary dark:text-dark-text-primary truncate max-w-[60%]">{product.name}</h1>
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-light-bg dark:hover:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary" aria-label="Close">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                    {/* Image carousel */}
                    <div className="relative aspect-[4/3] bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl overflow-hidden">
                        {allImages.length > 0 ? (
                            <>
                                {allImages.map((src: string, idx: number) => (
                                    <img
                                        key={idx}
                                        src={src}
                                        alt={`${product.name} ${idx + 1}`}
                                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${idx === currentImg ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                        onError={() => setImageErrors(p => ({ ...p, [idx]: true }))}
                                        style={{ display: imageErrors[idx] ? 'none' : 'block' }}
                                    />
                                ))}
                                {imageErrors[currentImg] && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <PhotoIcon className="w-20 h-20 text-light-text-muted dark:text-dark-text-muted" />
                                    </div>
                                )}
                                {allImages.length > 1 && (
                                    <>
                                        <button type="button" onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10">
                                            <ChevronLeftIcon className="w-6 h-6" />
                                        </button>
                                        <button type="button" onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10">
                                            <ChevronRightIcon className="w-6 h-6" />
                                        </button>
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                            {allImages.map((_: string, idx: number) => (
                                                <button key={idx} type="button" onClick={() => setCurrentImg(idx)}
                                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentImg ? 'bg-white w-5' : 'bg-white/50 hover:bg-white/70'}`} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <PhotoIcon className="w-20 h-20 text-light-text-muted dark:text-dark-text-muted" />
                            </div>
                        )}
                        {product.category && (
                            <div className="absolute top-3 left-3 px-3 py-1 bg-brand-primary text-white text-xs font-semibold rounded-full z-10">
                                {product.category.replace(/_/g, ' ')}
                            </div>
                        )}
                    </div>

                    {/* Details panel */}
                    <div className="space-y-5">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{product.name}</h2>
                            <div className="flex items-baseline gap-3 mt-2">
                                <p className="text-3xl font-extrabold text-brand-primary">{formatPrice(product.price)}</p>
                                {product.oldPrice && (
                                    <p className="text-base text-light-text-muted dark:text-dark-text-muted line-through">{formatPrice(product.oldPrice)}</p>
                                )}
                            </div>
                        </div>

                        {product.description && (
                            <div>
                                <p className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wide mb-1">Description</p>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary leading-relaxed whitespace-pre-wrap">{product.description}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {product.location && (
                                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-3">
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">📍 Location</p>
                                    <p className="font-semibold text-light-text-primary dark:text-dark-text-primary truncate">{product.location}</p>
                                </div>
                            )}
                            {product.bedrooms && (
                                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-3">
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">🛏 Bedrooms</p>
                                    <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{product.bedrooms} {product.bathrooms ? `· 🚿 ${product.bathrooms} bath` : ''}</p>
                                </div>
                            )}
                        </div>

                        {/* Seller card */}
                        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4">
                            <p className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wide mb-2">Listed by</p>
                            <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{sellerName}</p>
                            {product.user?.role && (
                                <p className="text-xs text-brand-primary mt-0.5">{product.user.role.replace(/_/g, ' ')}</p>
                            )}
                        </div>

                        {/* I'm Interested */}
                        <button
                            onClick={handleExpressInterest}
                            disabled={interestSending || interestSent}
                            className={`w-full flex items-center justify-center gap-2 py-4 font-semibold rounded-xl text-base transition-colors ${
                                interestSent
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 cursor-default'
                                    : 'bg-brand-primary text-white hover:bg-brand-secondary disabled:opacity-60'
                            }`}
                        >
                            {interestSent
                                ? '✓ Interest sent — seller has been notified'
                                : interestSending
                                    ? 'Sending...'
                                    : "👋 I'm Interested — Notify Seller"}
                        </button>

                        {/* Contact buttons */}
                        {phoneNumber && (
                            <div className="grid grid-cols-2 gap-3">
                                <a href={`tel:${phoneNumber}`}
                                    className="flex items-center justify-center gap-2 py-3 bg-brand-primary text-white font-semibold rounded-xl text-sm hover:bg-brand-secondary transition-colors">
                                    <PhoneIcon className="w-4 h-4" />Call
                                </a>
                                <a href={`https://wa.me/${whatsapp}?text=Hi, I saw your listing "${product.name}" on ShelTrify and I'm interested.`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-semibold rounded-xl text-sm hover:bg-green-600 transition-colors">
                                    💬 WhatsApp
                                </a>
                            </div>
                        )}

                        {/* Subscribe */}
                        <div className="border-t border-light-border dark:border-dark-border pt-4">
                            <p className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2">
                                🔔 Get alerts for similar listings
                            </p>
                            {subscribed ? (
                                <p className="text-sm text-green-500 font-medium">✓ You're subscribed!</p>
                            ) : (
                                <form onSubmit={handleSubscribe} className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex-1 text-sm bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                                    />
                                    <button type="submit" className="px-4 py-2 bg-brand-primary/10 text-brand-primary font-semibold text-sm rounded-lg hover:bg-brand-primary/20 transition-colors">
                                        Subscribe
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Back to browsing */}
                        <button onClick={onBack} className="w-full flex items-center justify-center gap-2 py-3 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-xl text-sm font-semibold hover:bg-light-bg dark:hover:bg-dark-bg transition-colors">
                            <BuildingStorefrontIcon className="w-4 h-4" />
                            Browse more listings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
