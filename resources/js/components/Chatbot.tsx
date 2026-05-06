import React, { useState, useRef, useEffect, useCallback, FormEvent, useMemo } from 'react';
import { Message, Property, Artisan } from '../types';
import { startNewChatSession, generatePropertyImage } from '../services/geminiService';
import { aiAPI, userAPI } from '../services/api';
import type { ProxyChat } from '../services/geminiService';
import { SendIcon, UserIcon, MicIcon, ImageIcon, HeartIcon, CheckCircleIcon, StarSolidIcon, MapIcon, CalendarIcon, CreditCardIcon, ArrowPathIcon, StarIcon, WalletIcon, CloseIcon, ChevronLeftIcon, PencilIcon, VideoCameraIcon, PlayCircleIcon, PhoneIcon, MailIcon } from './icons';

// Helper to clean up potential JSON formatting issues from the model, like trailing commas.
const sanitizeJsonString = (jsonString: string): string => {
    // Remove trailing commas from arrays and objects
    // e.g., ["a", "b",] -> ["a", "b"]
    // e.g., {"a": 1, "b": 2,} -> {"a": 1, "b": 2}
    return jsonString.replace(/,(\s*\]|\s*\})/g, '$1');
};

// --- ARTISAN DATA & TYPES ---
const artisans: Artisan[] = [
    { id: 1, name: 'Tunde Adebayo', service: 'Plumber', email: 't.adebayo@email.com', phone: '08012345678', avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=256' },
    { id: 2, name: 'Amina Salisu', service: 'Electrician', email: 'a.salisu@email.com', phone: '08023456789', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256' },
    { id: 3, name: 'Chike Obi', service: 'Carpenter', email: 'c.obi@email.com', phone: '08034567890', avatarUrl: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?q=80&w=256' },
    { id: 4, name: 'Fatima Bello', service: 'Painter', email: 'f.bello@email.com', phone: '08045678901', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256' },
    { id: 5, name: 'Samuel Kalu', service: 'AC Repair', email: 's.kalu@email.com', phone: '08056789012', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256' },
    { id: 6, name: 'Ngozi Eze', service: 'Mover', email: 'n.eze@email.com', phone: '08067890123', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256' },
    { id: 7, name: 'Musa Ibrahim', service: 'Cleaner', email: 'm.ibrahim@email.com', phone: '08078901234', avatarUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=256' },
    { id: 8, name: 'Bola Ahmed', service: 'Tutor', email: 'b.ahmed@email.com', phone: '08089012345', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256' }
];

// A simple markdown-like renderer to handle basic formatting
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const cleanedText = text
        .replace(/`?\[PROPERTIES:.*?\]`?/gs, '')
        .replace(/`?\[SUGGESTIONS:.*?\]`?/gs, '')
        .trim();

    const lines = cleanedText.split('\n');

    return (
        <div className="prose prose-sm max-w-none dark:prose-invert text-inherit">
            {lines.map((line, i) => {
                if (line.startsWith('* ')) {
                    return <p key={i} className="my-1 pl-4">&bull; {line.substring(2)}</p>;
                }
                if (/^\d+\.\s/.test(line)) {
                    return <p key={i} className="my-1 pl-4">{line}</p>;
                }
                if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-lg font-semibold mt-2 mb-1">{line.substring(4)}</h3>;
                }
                if (!line.trim()) {
                    return <p key={i} className="my-1">&nbsp;</p>;
                }
                
                // Regex to split by bold (**...**) or italic (_..._ or *...*)
                const parts = line.split(/(\*\*.*?\*\*|\_.*?\_|\*.*?\*)/g);

                return (
                    <p key={i} className="my-1">
                        {parts.filter(part => part).map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j}>{part.slice(2, -2)}</strong>;
                            }
                            if (part.startsWith('_') && part.endsWith('_')) {
                                return <em key={j}>{part.slice(1, -1)}</em>;
                            }
                            if (part.startsWith('*') && part.endsWith('*')) {
                                return <em key={j}>{part.slice(1, -1)}</em>;
                            }
                            return part;
                        })}
                    </p>
                );
            })}
        </div>
    );
};

// Map Modal Component
const MapModal: React.FC<{ property: Property; onClose: () => void }> = ({ property, onClose }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="relative bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] p-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <div>
                    <h3 className="font-bold text-lg">{property.title}</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{property.location}</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <iframe
                className="w-full h-full border-0 rounded-md flex-grow"
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(property.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            ></iframe>
        </div>
    </div>
);

const getYouTubeEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId: string | null = null;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.split('/').pop() || null;
        } else if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v');
        }
    } catch (e) {
        console.error("Could not parse video URL:", url, e);
        return null;
    }
    
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&controls=1`;
    }
    return null;
};

const PropertyCard: React.FC<{
    property: Property;
    onToggleFavorite: (property: Property) => void;
    onBookNow: (title: string) => void;
    onViewDetails: (title: string) => void;
    onRequestVirtualTour: (title: string) => void;
}> = ({ property, onToggleFavorite, onBookNow, onViewDetails, onRequestVirtualTour }) => {
    const [showVideo, setShowVideo] = useState(false);
    const [isMapVisible, setMapVisible] = useState(false);
    
    // Stop propagation on button clicks
    const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    const embedUrl = getYouTubeEmbedUrl(property.videoUrl);

    const handlePlayVideo = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (embedUrl) {
            setShowVideo(true);
        }
    };

    return (
        <div
            onClick={() => onViewDetails(property.title)}
            className="cursor-pointer mt-2 w-full max-w-[280px] sm:max-w-xs bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl overflow-hidden shadow-md group transition-all duration-300 hover:shadow-xl hover:border-brand-primary/50">
            <div className="relative">
                 {showVideo && embedUrl ? (
                    <div className="w-full h-48 bg-black">
                        <iframe
                            src={embedUrl}
                            title={property.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>
                ) : (
                    <div className="relative w-full h-48">
                        {property.isLoadingImage ? (
                            <div className="w-full h-full bg-light-bg dark:bg-dark-bg animate-pulse flex items-center justify-center">
                                <ImageIcon className="w-10 h-10 text-light-border dark:text-dark-border" />
                            </div>
                        ) : (
                            <>
                                <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                {embedUrl && (
                                    <div 
                                        onClick={handlePlayVideo}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    >
                                        <PlayCircleIcon className="w-16 h-16 text-white/80" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
                
                {/* Top right buttons */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                     <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setMapVisible(true);
                        }}
                        className="p-2 bg-black/50 rounded-full text-white hover:bg-brand-primary/80 transition-all transform hover:scale-110 block"
                        aria-label="View on Map"
                        title="View on Map"
                    >
                        <MapIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Bottom details */}
            <div className="p-4">
                <h4 className="font-bold text-light-text-primary dark:text-dark-text-primary text-base truncate">{property.title}</h4>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{property.location}</p>
                
                {(property.propertyType || property.bedrooms || (property.amenities && property.amenities.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {property.propertyType && (
                            <span className="text-xs bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary font-semibold px-2 py-1 rounded-full">
                                {property.propertyType}
                            </span>
                        )}
                        {property.bedrooms ? <span className="text-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border px-2 py-1 rounded-full">{property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</span> : null}
                        {property.amenities?.slice(0, 2).map(amenity => (
                            <span key={amenity} className="text-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border px-2 py-1 rounded-full truncate">{amenity}</span>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center mt-3">
                    <p className="text-lg font-bold text-brand-primary">{property.price}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                    {property.propertyType?.toLowerCase() !== 'hotel' && (
                        <button 
                            onClick={(e) => handleButtonClick(e, () => onRequestVirtualTour(property.title))}
                            className="bg-light-border dark:bg-dark-border text-light-text-primary dark:text-dark-text-primary text-xs font-semibold py-2 px-2 rounded-lg hover:bg-opacity-80 dark:hover:bg-opacity-80 transition-all flex items-center justify-center gap-1"
                        >
                            <VideoCameraIcon className="w-4 h-4" />
                            Virtual Tour
                        </button>
                    )}
                    <button 
                        onClick={(e) => handleButtonClick(e, () => onToggleFavorite(property))}
                        className={`text-xs font-semibold py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${property.isFavorite ? 'bg-red-500/10 text-red-500' : 'bg-light-border dark:bg-dark-border text-light-text-primary dark:text-dark-text-primary hover:bg-opacity-80 dark:hover:bg-opacity-80'}`}
                    >
                        <HeartIcon className={`w-4 h-4 ${property.isFavorite ? 'fill-current' : ''}`}/>
                        Interested
                    </button>
                     <button 
                        onClick={(e) => handleButtonClick(e, () => onBookNow(property.title))}
                        className="bg-brand-primary text-white text-xs font-semibold py-2 px-2 rounded-lg hover:bg-brand-secondary transition-all flex items-center justify-center gap-1"
                    >
                        <CalendarIcon className="w-4 h-4" />
                        Book Now
                    </button>
                </div>
            </div>
            {isMapVisible && <MapModal property={property} onClose={() => setMapVisible(false)} />}
        </div>
    );
};

const FunctionCallMessage: React.FC<{ functionCall: any }> = ({ functionCall }) => {
    const { name, args } = functionCall;
    let text = `Function call executed: ${name}`;

    if (name === 'scheduleAppointment') {
        const { action, propertyTitle, dateTime } = args;
        if (action === 'schedule' || action === 'reschedule') {
            text = `Okay, your appointment for "${propertyTitle}" has been ${action}d for ${new Date(dateTime).toLocaleString()}. A reminder will be sent to you 24 hours before.`;
        } else if (action === 'cancel') {
             text = `Okay, your appointment for "${propertyTitle}" has been successfully canceled.`;
        } else {
            text = `Okay, your appointment for "${propertyTitle}" has been successfully ${action}d.`
        }
    }
    
    return (
        <div className="mt-2 text-xs italic text-green-600 dark:text-green-400 flex items-center gap-2 p-2 bg-green-500/10 rounded-md">
            <CheckCircleIcon className="w-4 h-4" />
            <span>{text}</span>
        </div>
    );
}

const InteractivePaymentCard: React.FC<{
    paymentDetails: { propertyTitle: string; accommodationType: string; amount: number; currency: string; };
    onPaymentConfirmed: (paymentDetails: any) => void;
}> = ({ paymentDetails, onPaymentConfirmed }) => {
    const [step, setStep] = useState<'method' | 'card' | 'transfer' | 'confirmed'>('method');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCardPaymentSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            onPaymentConfirmed(paymentDetails);
            setStep('confirmed');
        }, 1500);
    };
    
    const handleTransferConfirm = () => {
        onPaymentConfirmed(paymentDetails);
        setStep('confirmed');
    };

    const formatPrice = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency }).format(amount);
    };

    const renderMethodSelection = () => (
        <>
            <h4 className="font-bold text-base mb-2">Confirm Your Payment</h4>
            <div className="space-y-1 text-xs border-b border-light-border dark:border-dark-border pb-3 mb-3">
                <div className="flex justify-between"><span>Property:</span><span className="font-semibold text-right">{paymentDetails.propertyTitle}</span></div>
                <div className="flex justify-between"><span>Details:</span><span className="font-semibold">{paymentDetails.accommodationType}</span></div>
                <div className="flex justify-between items-baseline pt-2"><span>Amount:</span><span className="font-bold text-lg text-brand-primary">{formatPrice(paymentDetails.amount, paymentDetails.currency)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setStep('card')} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold py-2 rounded-md hover:bg-brand-secondary transition-colors"><CreditCardIcon className="w-4 h-4" /> Card</button>
                <button onClick={() => setStep('transfer')} className="w-full flex items-center justify-center gap-2 bg-brand-secondary text-white font-semibold py-2 rounded-md hover:opacity-90 transition-colors"><ArrowPathIcon className="w-4 h-4" /> Transfer</button>
            </div>
        </>
    );

    const renderCardForm = () => (
        <form onSubmit={handleCardPaymentSubmit}>
            <button type="button" onClick={() => setStep('method')} className="flex items-center gap-1 text-xs text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary mb-2"><ChevronLeftIcon className="w-3 h-3" /> Back</button>
            <h4 className="font-bold text-base mb-3">Enter Card Details</h4>
            <div className="space-y-3">
                <input type="text" placeholder="Card Number" required className="w-full text-xs bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" />
                <input type="text" placeholder="Card Holder Name" required className="w-full text-xs bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" />
                <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="MM/YY" required className="w-full text-xs bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" />
                    <input type="text" placeholder="CVV" required className="w-full text-xs bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" />
                </div>
            </div>
            <button type="submit" disabled={isProcessing} className="w-full mt-4 bg-brand-primary text-white rounded-md py-2 font-bold hover:bg-brand-secondary transition-all disabled:bg-brand-secondary">{isProcessing ? 'Processing...' : `Pay ${formatPrice(paymentDetails.amount, paymentDetails.currency)}`}</button>
        </form>
    );

    const renderTransferInfo = () => (
        <div>
             <button type="button" onClick={() => setStep('method')} className="flex items-center gap-1 text-xs text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary mb-2"><ChevronLeftIcon className="w-3 h-3" /> Back</button>
            <h4 className="font-bold text-base mb-2">Bank Transfer Details</h4>
            <div className="p-3 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg space-y-1 text-xs">
                <div className="flex justify-between"><span>Bank:</span> <strong>ShelTrify Bank PLC</strong></div>
                <div className="flex justify-between"><span>Account No:</span> <strong>0123456789</strong></div>
                <div className="flex justify-between"><span>Account Name:</span> <strong>ShelTrify Technologies</strong></div>
                <p className="text-light-text-secondary dark:text-dark-text-secondary pt-1">Please use property title as reference.</p>
            </div>
            <button onClick={handleTransferConfirm} className="w-full mt-3 bg-brand-primary text-white rounded-md py-2 font-bold hover:bg-brand-secondary transition-all">I've Completed the Transfer</button>
        </div>
    );

    const renderConfirmed = () => (
        <div className="text-center">
            <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto animate-bounce" />
            <h4 className="font-bold mt-2">Payment Confirmed!</h4>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">Anna will be with you shortly to collect your details for the receipt.</p>
        </div>
    );

    return (
        <div className="mt-2 text-sm text-light-text-primary dark:text-dark-text-primary p-4 bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border">
            {step === 'method' && renderMethodSelection()}
            {step === 'card' && renderCardForm()}
            {step === 'transfer' && renderTransferInfo()}
            {step === 'confirmed' && renderConfirmed()}
        </div>
    );
};

const ArtisanCard: React.FC<{ artisan: Artisan }> = ({ artisan }) => (
    <div className="flex-shrink-0 w-52 sm:w-64 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-3 sm:p-4 text-center group transition-all duration-300 hover:shadow-lg hover:border-brand-primary/50 snap-start">
        <img src={artisan.avatarUrl} alt={artisan.name} className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-light-bg dark:border-dark-bg" />
        <h4 className="font-bold text-light-text-primary dark:text-dark-text-primary mt-3">{artisan.name}</h4>
        <p className="text-sm font-semibold text-brand-primary">{artisan.service}</p>
        <div className="mt-4 space-y-2 text-left text-xs">
             <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary">
                <MailIcon className="w-4 h-4 flex-shrink-0" />
                <a href={`mailto:${artisan.email}`} className="truncate hover:underline">{artisan.email}</a>
            </div>
             <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary">
                <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                <a href={`tel:${artisan.phone}`} className="truncate hover:underline">{artisan.phone}</a>
            </div>
        </div>
    </div>
);


const SuggestedReplies: React.FC<{ suggestions: string[], onSelect: (reply: string) => void }> = ({ suggestions, onSelect }) => (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
        {suggestions.map((reply, i) => (
            <button key={i} onClick={() => onSelect(reply)} className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20 border border-brand-primary/20 rounded-full hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-150 active:scale-95">
                {reply}
            </button>
        ))}
    </div>
);

const TypingIndicator: React.FC = () => (
    <div className="flex items-start gap-2 sm:gap-3">
        <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop" alt="Anna" className="flex-shrink-0 w-8 h-8 rounded-full object-cover ring-2 ring-brand-primary/30" referrerPolicy="no-referrer" crossOrigin="anonymous" />
        <div className="max-w-[85vw] sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl rounded-bl-lg bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-brand-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="h-2.5 w-2.5 bg-brand-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="h-2.5 w-2.5 bg-brand-primary/60 rounded-full animate-bounce"></span>
        </div>
    </div>
);

const PaymentForm: React.FC<{
    paymentMethod: 'Card' | 'Transfer';
    onBack: () => void;
    onPaymentSuccess: () => void;
}> = ({ paymentMethod, onBack, onPaymentSuccess }) => {
    const [isPaying, setIsPaying] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { userAPI } = require('../services/api');

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPaying(true);
        setError(null);
        
        try {
            // Call the chat upgrade API
            const { userAPI } = await import('../services/api');
            const response = await userAPI.upgradeChat();
            
            if (response.success) {
                setIsPaying(false);
                setIsPaid(true);
                setTimeout(() => {
                    onPaymentSuccess();
                }, 1500);
            } else {
                throw new Error(response.message || 'Payment failed');
            }
        } catch (err: any) {
            console.error('Chat upgrade error:', err);
            setError(err.message || 'Failed to process payment. Please try again.');
            setIsPaying(false);
        }
    };

    if (isPaid) {
        return (
            <div className="text-center py-8">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
                <h3 className="text-xl font-bold mt-4">Payment Successful!</h3>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">Chat upgrade successful! You can now continue chatting.</p>
            </div>
        );
    }
    
    return (
        <form onSubmit={handlePay}>
            <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary mb-4">
                <ChevronLeftIcon className="w-4 h-4" /> Back
            </button>
            <h3 className="text-xl font-bold mb-1">Confirm Payment</h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">You are paying <span className="font-bold text-brand-primary">₦2,000</span> to upgrade your chat and continue finding accommodation.</p>
            
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
                    {error}
                </div>
            )}
            
            {paymentMethod === 'Card' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Card Number</label>
                        <input type="text" placeholder="0000 0000 0000 0000" required className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Card Holder Name</label>
                        <input type="text" placeholder="John Doe" required className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Expiry Date</label>
                            <input type="text" placeholder="MM/YY" required className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">CVV</label>
                            <input type="text" placeholder="123" required className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" />
                        </div>
                    </div>
                </div>
            )}

            {paymentMethod === 'Transfer' && (
                <div className="p-4 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg space-y-2 text-sm">
                    <p className="font-semibold">Bank Transfer Details</p>
                    <div className="flex justify-between"><span>Bank:</span> <strong>ShelTrify Bank PLC</strong></div>
                    <div className="flex justify-between"><span>Account Number:</span> <strong>0123456789</strong></div>
                    <div className="flex justify-between"><span>Account Name:</span> <strong>ShelTrify Technologies</strong></div>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary pt-2">Please use your email as payment reference. Your account will be upgraded upon confirmation.</p>
                </div>
            )}
            
            <button
                type="submit"
                disabled={isPaying}
                className="w-full mt-6 bg-brand-primary text-white rounded-lg py-3 font-bold hover:bg-brand-secondary transition-all flex items-center justify-center disabled:bg-brand-secondary"
            >
                {isPaying ? 'Processing...' : `Pay ₦2,000 Now`}
            </button>
        </form>
    );
};


// New Premium Modal Component
const PremiumModal: React.FC<{ onClose: () => void; onConfirm: () => void }> = ({ onClose, onConfirm }) => {
    const [view, setView] = useState<'details' | 'payment'>('details');
    const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Transfer'>('Card');
    
    const features = [
        'Priority access to new listings', 'Personalized property recommendations', 'Dedicated accommodation consultant',
        'Expedited booking process', 'VIP property tours', 'Exclusive discounts and offers'
    ];

    const handlePaymentSelect = (method: 'Card' | 'Transfer') => {
        setPaymentMethod(method);
        setView('payment');
    };
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-md p-8 text-light-text-primary dark:text-dark-text-primary transition-all duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                    <CloseIcon className="w-6 h-6"/>
                </button>
                
                {view === 'details' ? (
                    <>
                        <div className="text-center">
                            <StarIcon className="w-12 h-12 mx-auto text-yellow-400 p-2 bg-yellow-400/10 rounded-full" />
                            <h2 className="text-2xl font-bold mt-3">Upgrade Chat to Continue</h2>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">Upgrade your chat for ₦2,000 to continue finding accommodation.</p>
                        </div>
                        <ul className="mt-6 space-y-3">
                            {features.map((f, i) => (
                                <li key={i} className="flex items-start">
                                    <CheckCircleIcon className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                                    <span className="ml-3 text-sm">{f}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-8 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border p-4 rounded-lg text-center">
                            <p className="text-3xl font-bold">₦2,000</p>
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">One-time payment to continue chatting</p>
                             <div className="mt-4 grid grid-cols-2 gap-2">
                                <button onClick={() => handlePaymentSelect('Card')} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold py-2.5 rounded-md hover:bg-brand-secondary transition-colors">
                                     <CreditCardIcon className="w-4 h-4" /> Pay with Card
                                </button>
                                <button onClick={() => handlePaymentSelect('Transfer')} className="w-full flex items-center justify-center gap-2 bg-brand-secondary text-white font-semibold py-2.5 rounded-md hover:opacity-90 transition-colors">
                                     <ArrowPathIcon className="w-4 h-4" /> Bank Transfer
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <PaymentForm 
                        paymentMethod={paymentMethod}
                        onBack={() => setView('details')}
                        onPaymentSuccess={onConfirm}
                    />
                )}
            </div>
        </div>
    );
};


interface ChatbotProps {
    onToggleFavorite: (property: Property) => void;
    favorites: Property[];
    programmaticMessage?: string;
    isPremium: boolean;
    onPremiumUpgrade: () => void;
    chatId: number;
}

const Chatbot: React.FC<ChatbotProps> = ({ onToggleFavorite, favorites, programmaticMessage, isPremium, onPremiumUpgrade, chatId }) => {
  // Track free message count
  const getFreeMessageCount = (): number => {
    const stored = localStorage.getItem(`freeMessages_${chatId}`);
    return stored ? parseInt(stored, 10) : 0;
  };
  
  const [freeMessageCount, setFreeMessageCount] = useState(getFreeMessageCount());
  const FREE_MESSAGE_LIMIT = 10;
  
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
        const savedMessages = localStorage.getItem(`chatHistory_${chatId}`);
        if(savedMessages) {
            return JSON.parse(savedMessages);
        }
    } catch (e) {
        console.error("Could not load messages from localStorage", e);
    }
    return [{id: 'init', sender: 'bot', text: "Hello! I'm Anna, your ShelTrify AI assistant. I can help you find the perfect rental. First, what should I call you?"}];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');

  const chatRef = useRef<ProxyChat | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [siteData, setSiteData] = useState<any>(null);
  const [siteDataLoaded, setSiteDataLoaded] = useState(false);
    
  const lastUserMessage = useMemo(() => {
    const userMessages = messages.filter(m => m.sender === 'user');
    return userMessages[userMessages.length - 1];
  }, [messages]);

  // Load site data on mount for AI context
  useEffect(() => {
    const loadSiteData = async () => {
      try {
        const response = await aiAPI.getSiteData();
        if (response.success) {
          setSiteData(response.data);
          setSiteDataLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load site data for AI:', error);
        // Continue without site data - AI will still work but without context
      }
    };
    loadSiteData();
  }, []);

  useEffect(() => {
    try {
      chatRef.current = startNewChatSession();
    } catch (err) {
      console.error('Chat session init failed:', err);
    }
  }, [chatId]);

  // Effect to handle incoming programmatic messages from the parent
  useEffect(() => {
    if (programmaticMessage) {
      handleSendMessage(undefined, programmaticMessage);
    }
  }, [programmaticMessage]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
    // Persist messages to localStorage
    try {
        localStorage.setItem(`chatHistory_${chatId}`, JSON.stringify(messages));
    } catch (e) {
        console.error("Could not save messages to localStorage", e);
    }
  }, [messages, isLoading, chatId]);
  
  const handleSuggestionClick = (reply: string) => {
      setInput(reply);
      setTimeout(() => {
          formRef.current?.requestSubmit();
      }, 0);
  };
    
  const handlePaymentConfirmed = useCallback((paymentDetails: any) => {
    const programmaticMsg = `[SYSTEM: Payment for '${paymentDetails.propertyTitle}' is complete.]`;
    handleSendMessage(undefined, programmaticMsg);
  }, []);

  const handleConfirmUpgrade = async () => {
    try {
      const { userAPI } = await import('../services/api');
      const response = await userAPI.upgradeChat();
      
      if (response.success) {
        setIsPremiumModalOpen(false);
        // Reset free message count so user can continue chatting
        setFreeMessageCount(0);
        localStorage.setItem(`freeMessages_${chatId}`, '0');
        
        const confirmationMessage: Message = {
          id: `chat-upgrade-conf-${Date.now()}`,
          sender: 'bot',
          text: "🚀 Great! Your chat has been upgraded. You can now continue chatting to find your perfect accommodation. What are we looking for today?"
        };
        setMessages(prev => [...prev, confirmationMessage]);
      } else {
        throw new Error(response.message || 'Chat upgrade failed');
      }
    } catch (error: any) {
      console.error('Chat upgrade error:', error);
      // Show error but keep modal open
      const errorMessage: Message = {
        id: `chat-upgrade-error-${Date.now()}`,
        sender: 'bot',
        text: `❌ ${error.message || 'Failed to upgrade chat. Please try again or fund your wallet.'}`
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };
    
  const processAndSend = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);

    let context = '';
    
    // Add user favorites
    if (favorites.length > 0) {
        const favoriteTitles = favorites.map(f => `"${f.title}"`).join(', ');
        context += `[USER FAVORITES: ${favoriteTitles}] `;
    }

    // Add site data context - this gives AI access to all listings
    if (siteData && siteData.listings && siteData.listings.length > 0) {
      // Format listings for AI context
      const listingsContext = siteData.listings
        .slice(0, 100) // Limit to first 100 to avoid token limits
        .map((listing: any) => ({
          id: listing.id,
          title: listing.title,
          description: listing.description || '',
          price: listing.price,
          location: listing.location,
          bedrooms: listing.bedrooms,
          propertyType: listing.propertyType,
          amenities: listing.amenities || [],
          imageUrl: listing.imageUrl,
          videoUrl: listing.videoUrl,
          isBoosted: listing.isBoosted,
          favoritesCount: listing._count?.favorites || 0
        }));
      
      context += `[SITE DATA: ${JSON.stringify({
        totalListings: siteData.statistics?.totalListings || listingsContext.length,
        listings: listingsContext,
        statistics: siteData.statistics,
        note: 'Use ONLY these actual listings from the site when answering questions. Do NOT make up properties. If a user asks about properties in a specific location, search through these listings and recommend only matching ones.'
      })}] `;
    }

    try {
      const stream = await chatRef.current!.sendMessageStream({ message: `${context} ${prompt}`.trim() });
      
      let botResponseText = '';
      const botMessageId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, { id: botMessageId, sender: 'bot', text: '' }]);

      const propertiesRegex = /\[PROPERTIES:.*?\]/gs;
      const suggestionsRegex = /\[SUGGESTIONS:.*?\]/gs;

      for await (const chunk of stream) {
        botResponseText += chunk.text;
        
        if(chunk.functionCalls) {
            for(const fc of chunk.functionCalls) {
                 if (fc.name === 'processPayment') {
                    setMessages(prev => [...prev, {
                        id: `ipc-${Date.now()}`,
                        sender: 'bot',
                        text: 'Please confirm the details and proceed with your payment to secure the property.',
                        property: { type: 'interactivePayment', details: fc.args } as any
                    }]);
                 } else if (fc.name === 'scheduleAppointment') {
                    setMessages(prev => [...prev, { id: `fc-${Date.now()}`, sender: 'bot', text: '', property: {functionCall: fc, type: 'functionCall'} as any }]);
                    if(fc.args.action === 'schedule' || fc.args.action === 'reschedule') {
                        // Simulate confirmation and add tips
                        setTimeout(() => {
                            alert("Confirmation email sent to your registered address!");
                            const tipsMessage: Message = {
                                id: `tips-${Date.now()}`,
                                sender: 'bot',
                                text: `**Maintenance Tips for Your Stay:**
* **Handle with Care:** Use furniture and appliances gently.
* **Follow Rules:** Respect check-in/out times and noise limits.
* **Keep Clean:** Dispose of waste properly.
* **Report Issues Early:** Notify management of any problems immediately.
* **Be Energy Conscious:** Turn off lights, AC, and water when not in use.
* **Secure Property:** Always lock doors and windows when leaving.`
                            };
                            setMessages(prev => [...prev, tipsMessage]);
                        }, 500);
                    }
                 } else if (fc.name === 'recommendArtisans') {
                    const { service, location } = fc.args;
                    const recommendedArtisans = artisans
                        .filter(a => a.service.toLowerCase() === service.toLowerCase())
                        .slice(0, 5);
                    
                    if (recommendedArtisans.length > 0) {
                         setMessages(prev => [...prev, {
                            id: `artisans-${Date.now()}`,
                            sender: 'bot',
                            text: `Certainly! Here are some top-rated ${service}s available in ${location}:`,
                            artisans: recommendedArtisans
                        }]);
                    } else {
                         setMessages(prev => [...prev, {
                            id: `no-artisans-${Date.now()}`,
                            sender: 'bot',
                            text: `I'm sorry, I couldn't find any ${service}s right now. You can check the Marketplace or Community Forum for more options.`
                        }]);
                    }
                }
            }
        }

        const cleanedForDisplay = botResponseText
            .replace(propertiesRegex, '')
            .replace(suggestionsRegex, '');

        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId ? { ...msg, text: cleanedForDisplay } : msg
        ));
      }

      const finalPropertiesRegex = /\[PROPERTIES: (\[.*?\])\]/s;
      const finalSuggestionsRegex = /\[SUGGESTIONS: (\[.*?\])\]/s;

      const propertiesMatch = botResponseText.match(finalPropertiesRegex);
      const suggestionsMatch = botResponseText.match(finalSuggestionsRegex);

      const propertiesToRender: Property[] = [];
      if (propertiesMatch && propertiesMatch[1]) {
        try {
            const sanitizedJson = sanitizeJsonString(propertiesMatch[1]);
            propertiesToRender.push(...JSON.parse(sanitizedJson));
        } catch (err) {
            console.error("Failed to parse properties JSON array:", err, "JSON:", propertiesMatch[1]);
        }
      }

      let suggestionsToRender: string[] | undefined;
      if (suggestionsMatch && suggestionsMatch[1]) {
        try {
            const sanitizedJson = sanitizeJsonString(suggestionsMatch[1]);
            suggestionsToRender = JSON.parse(sanitizedJson);
        } catch (err) {
            console.error("Failed to parse suggestions JSON array:", err, "JSON:", suggestionsMatch[1]);
        }
      }

      const cleanText = botResponseText
        .replace(finalPropertiesRegex, '')
        .replace(finalSuggestionsRegex, '')
        .trim();

      const propertyMessages: Message[] = [];
      propertiesToRender.forEach((prop, index) => {
          const propMsgId = `prop-${prop.id}-${botMessageId}-${index}`;
          propertyMessages.push({
              id: propMsgId,
              sender: 'bot',
              text: '',
              property: {
                  ...prop,
                  isFavorite: favorites.some(f => f.id === prop.id),
                  isLoadingImage: true,
              },
          });
      });

      if (suggestionsToRender && propertyMessages.length > 0) {
          propertyMessages[propertyMessages.length - 1].suggestions = suggestionsToRender;
      }
      
      setMessages(prev => {
          const finalMessages = [...prev];
          const streamMsgIndex = finalMessages.findIndex(m => m.id === botMessageId);

          if (streamMsgIndex !== -1) {
              if (cleanText) {
                  finalMessages[streamMsgIndex] = { ...finalMessages[streamMsgIndex], text: cleanText };
                  if (suggestionsToRender && propertyMessages.length === 0) {
                      finalMessages[streamMsgIndex].suggestions = suggestionsToRender;
                  }
              } else {
                  finalMessages.splice(streamMsgIndex, 1);
              }
          }
          finalMessages.push(...propertyMessages);
          return finalMessages;
      });

      propertiesToRender.forEach((prop, index) => {
        const propMsgId = `prop-${prop.id}-${botMessageId}-${index}`;
        generatePropertyImage({
            title: prop.title,
            propertyType: prop.propertyType,
            amenities: prop.amenities
        }).then(generatedImageUrl => {
            setMessages(prev => prev.map(msg => {
                if (msg.id === propMsgId && msg.property) {
                    const updatedProperty = {
                        ...msg.property,
                        imageUrl: generatedImageUrl || msg.property.imageUrl,
                        isLoadingImage: false
                    };
                    return { ...msg, property: updatedProperty };
                }
                return msg;
            }));
        });
      });

    } catch (err: any) {
      console.error('Chat error:', err);
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      // Provide more specific error messages
      if (err?.message?.includes('API is not initialized') || err?.message?.includes('API key')) {
        errorMessage = 'Chat service is not configured. Please check your API key settings.';
      } else if (err?.message?.includes('fetch') || err?.name === 'TypeError') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setMessages(prev => [...prev, {id: 'error', sender: 'bot', text: errorMessage}]);
    } finally {
      setIsLoading(false);
    }
  }, [favorites, chatId, handlePaymentConfirmed]);


  const handleSendMessage = useCallback(async (e?: FormEvent, programmaticMsg?: string) => {
    if (e) e.preventDefault();
    if (editingMessageId) setEditingMessageId(null);
    const currentInput = programmaticMsg || input;
    if (!currentInput.trim() || isLoading || !chatRef.current) return;
    
    // Check free message limit for non-premium users
    if (!isPremium && freeMessageCount >= FREE_MESSAGE_LIMIT) {
      const upgradeMessage: Message = {
        id: `upgrade-${Date.now()}`,
        sender: 'bot',
        text: "I have found the best options for you. Upgrade to continue chatting and have what you need."
      };
      setMessages(prev => [...prev, upgradeMessage]);
      setIsPremiumModalOpen(true);
      return;
    }
    
    const isProgrammatic = !!programmaticMsg;

    if (!isProgrammatic) {
        const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: currentInput };
        setMessages(prev => [...prev.map(m => ({ ...m, suggestions: undefined })), userMessage]);
        
        // Increment free message count for non-premium users
        if (!isPremium) {
          const newCount = freeMessageCount + 1;
          setFreeMessageCount(newCount);
          localStorage.setItem(`freeMessages_${chatId}`, newCount.toString());
        }
    }
    
    setInput('');
    await processAndSend(currentInput);
  }, [input, isLoading, favorites, chatId, handlePaymentConfirmed, editingMessageId, processAndSend, isPremium, freeMessageCount]);

    const handleEditClick = (message: Message) => {
        setEditingMessageId(message.id);
        setEditedText(message.text);
    };

    const handleSaveEdit = () => {
        if (!editingMessageId) return;

        const messageIndex = messages.findIndex(m => m.id === editingMessageId);
        if (messageIndex === -1) return;

        const newMessagesHistory = messages.slice(0, messageIndex);
        const updatedUserMessage = { ...messages[messageIndex], text: editedText };
        setMessages([...newMessagesHistory, updatedUserMessage]);
        
        const textToResend = editedText;

        setEditingMessageId(null);
        setEditedText('');

        processAndSend(textToResend);
    };

    const handleBookNow = (title: string) => {
        handleSendMessage(undefined, `I would like to book a viewing for "${title}".`);
    };

    const handleRequestVirtualTour = (title: string) => {
        handleSendMessage(undefined, `I would like to request a virtual tour for "${title}".`);
    };

    const handleViewDetails = (title: string) => {
        handleSendMessage(undefined, `Tell me more details about "${title}".`);
    };

  const uniqueServices = [...new Set(artisans.map(artisan => artisan.service))];
  const servicesForMarquee = [...uniqueServices, ...uniqueServices];

  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
       <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } .chat-bg { background-image: radial-gradient(circle at 20% 20%, rgba(var(--color-brand-primary-rgb, 99,102,241),0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139,92,246,0.06) 0%, transparent 50%); }`}</style>
      {isPremiumModalOpen && <PremiumModal onClose={() => setIsPremiumModalOpen(false)} onConfirm={handleConfirmUpgrade} />}

      {/* Gradient Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-brand-primary via-brand-secondary to-purple-600 flex items-center gap-3 shadow-brand-md">
        <div className="relative flex-shrink-0">
          <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop" alt="Anna" className="w-10 h-10 rounded-full object-cover border-2 border-white/40" referrerPolicy="no-referrer" crossOrigin="anonymous" />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-tight">Anna</p>
          <p className="text-white/70 text-xs">ShelTrify AI · Online</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline-flex px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full">AI Assistant</span>
          {!isPremium && (
            <button onClick={() => setIsPremiumModalOpen(true)} className="flex items-center gap-1 px-2.5 py-1 bg-yellow-400/90 text-yellow-900 text-xs font-bold rounded-full hover:bg-yellow-300 transition-colors">
              <StarSolidIcon className="w-3.5 h-3.5" /> Upgrade
            </button>
          )}
          {isPremium && <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-400/90 text-yellow-900 text-xs font-bold rounded-full"><StarSolidIcon className="w-3.5 h-3.5" /> Premium</span>}
        </div>
      </div>

      <div ref={chatHistoryRef} className="flex-grow p-3 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 chat-bg">
        {messages.map((message) => {
            const isLastUserMessage = message.id === lastUserMessage?.id;
            return (
              <div key={message.id} className="animate-new-message">
                <div className={`group flex items-start gap-2 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                    {message.sender === 'bot' && (
                        <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop" alt="Anna" className="flex-shrink-0 w-8 h-8 rounded-full object-cover ring-2 ring-brand-primary/20" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                    )}

                    <div className={`flex items-center gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`max-w-[82vw] sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                            message.sender === 'user'
                            ? 'bg-gradient-to-br from-brand-primary to-purple-600 text-white rounded-br-lg shadow-brand-sm'
                            : 'bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-bl-lg'
                        }`}>
                            {editingMessageId === message.id ? (
                                <div>
                                    <textarea
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                                            if (e.key === 'Escape') { setEditingMessageId(null); }
                                        }}
                                        className="w-full bg-light-bg dark:bg-dark-bg border border-brand-primary rounded-lg p-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition resize-y"
                                        rows={3}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={() => setEditingMessageId(null)} className="px-3 py-1 text-xs font-semibold bg-light-border dark:bg-dark-border rounded-md hover:bg-opacity-80">Cancel</button>
                                        <button onClick={handleSaveEdit} className="px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded-md hover:bg-green-600">Save & Resend</button>
                                    </div>
                                </div>
                            ) : (
                                message.text && <SimpleMarkdown text={message.text} />
                            )}
                            {message.property && (message.property as any).type === 'functionCall' 
                                ? <FunctionCallMessage functionCall={(message.property as any).functionCall} />
                                : message.property && (message.property as any).type === 'interactivePayment'
                                ? <InteractivePaymentCard 
                                    paymentDetails={(message.property as any).details}
                                    onPaymentConfirmed={handlePaymentConfirmed}
                                  />
                                : message.property && <PropertyCard 
                                                        property={{...message.property, isFavorite: favorites.some(f => f.id === message.property?.id)}} 
                                                        onToggleFavorite={onToggleFavorite} 
                                                        onBookNow={handleBookNow}
                                                        onViewDetails={handleViewDetails}
                                                        onRequestVirtualTour={handleRequestVirtualTour}
                                                      />
                            }
                            {message.artisans && (
                                <div className="mt-3">
                                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                                        {message.artisans.map(artisan => (
                                            <ArtisanCard key={artisan.id} artisan={artisan} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {message.sender === 'user' && isLastUserMessage && !isLoading && !editingMessageId && (
                            <button onClick={() => handleEditClick(message)} aria-label="Edit message" className="self-center p-1 rounded-full text-light-text-secondary dark:text-dark-text-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                <PencilIcon />
                            </button>
                        )}
                    </div>

                    {message.sender === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary/80 to-purple-600/80 flex items-center justify-center relative shadow-sm">
                            <UserIcon className="w-4 h-4 text-white" />
                            {isPremium && <StarSolidIcon className="absolute -bottom-1 -right-1 w-4 h-4 text-yellow-400 drop-shadow" />}
                        </div>
                    )}
                </div>
                {message.sender === 'bot' && message.suggestions && (
                    <div className="pl-10">
                      <SuggestedReplies suggestions={message.suggestions} onSelect={handleSuggestionClick} />
                    </div>
                )}
              </div>
            )
        })}
        {isLoading && <div className="animate-new-message"><TypingIndicator /></div>}
      </div>
      <div className="flex-shrink-0 px-3 sm:px-4 pt-3 pb-3 sm:pb-4 bg-light-card dark:bg-dark-card border-t border-light-border dark:border-dark-border">
        {error && (
          <div className="mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs text-center">{error}</div>
        )}

        {/* Free messages remaining indicator */}
        {!isPremium && freeMessageCount > 0 && freeMessageCount < FREE_MESSAGE_LIMIT && (
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              {FREE_MESSAGE_LIMIT - freeMessageCount} free message{FREE_MESSAGE_LIMIT - freeMessageCount !== 1 ? 's' : ''} left
            </p>
            <div className="flex gap-0.5">
              {Array.from({ length: FREE_MESSAGE_LIMIT }).map((_, i) => (
                <div key={i} className={`h-1 w-3 rounded-full ${i < freeMessageCount ? 'bg-brand-primary/40' : 'bg-brand-primary'}`} />
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <form ref={formRef} onSubmit={handleSendMessage} className="flex items-center gap-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-2xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-brand-primary/50 focus-within:border-brand-primary/50 transition-all duration-200 shadow-sm">
          <button type="button" className="flex-shrink-0 p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary rounded-xl transition-colors" aria-label="Voice input">
            <MicIcon className="w-5 h-5"/>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask ShelTrify anything..."
            className="flex-1 min-w-0 bg-transparent text-sm text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary focus:outline-none py-1"
            disabled={isLoading}
          />
          <button type="button" className="flex-shrink-0 p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary rounded-xl transition-colors" aria-label="Image upload">
            <ImageIcon className="w-5 h-5"/>
          </button>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 bg-gradient-to-br from-brand-primary to-purple-600 text-white rounded-xl p-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all transform hover:scale-105 active:scale-95 disabled:scale-100 shadow-sm"
            aria-label="Send"
          >
            <SendIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>

        <p className="text-[10px] sm:text-xs text-center text-light-text-secondary dark:text-dark-text-secondary mt-2 opacity-70">
          ShelTrify AI may make mistakes. Verify important information.
        </p>

        {/* Artisan services marquee */}
        <div className="mt-2 pt-2 border-t border-light-border dark:border-dark-border">
          <div className="relative w-full flex overflow-x-hidden group [mask-image:_linear_gradient(to_right,transparent_0,_black_10%,_black_90%,transparent_100%)]">
            <div className="py-1.5 animate-marquee whitespace-nowrap flex items-center">
              {servicesForMarquee.map((service, index) => (
                <React.Fragment key={index}>
                  <span className="mx-3 text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary">{service}</span>
                  {index < servicesForMarquee.length - 1 && <div className="w-1 h-1 rounded-full bg-brand-primary/50"></div>}
                </React.Fragment>
              ))}
            </div>
            <style>{`
              @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
              .animate-marquee { animation: marquee 40s linear infinite; }
              .group:hover .animate-marquee { animation-play-state: paused; }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;