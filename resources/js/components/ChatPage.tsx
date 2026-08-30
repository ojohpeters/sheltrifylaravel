import React, { useState, useEffect } from 'react';
import Chatbot from './Chatbot';
import AdvancedFilters from './AdvancedFilters';
import { MarketInsightsModal } from './MarketInsightsModal';
import { 
    UserIcon, 
    BookmarkSolidIcon, 
    FilterIcon,
    ChartBarIcon,
    ResidentialHouseIcon, 
    OfficeIcon, 
    BusinessIcon, 
    ShortLetIcon, 
    TransportIcon, 
    EventVenueIcon, 
    StudentHostelIcon, 
    SmartHomeIcon, 
    RentToOwnIcon,
    TripPlannerIcon,
    RoadNavigationIcon
} from './icons';
import { Property, FilterValues } from '../types';

const services = [
    { title: 'House', fullTitle: 'Residential House', icon: <ResidentialHouseIcon className="w-7 h-7" /> },
    { title: 'Office', fullTitle: 'Office Space', icon: <OfficeIcon className="w-7 h-7" /> },
    { title: 'Business', fullTitle: 'Business Premises', icon: <BusinessIcon className="w-7 h-7" /> },
    { title: 'Venue', fullTitle: 'Event Venue', icon: <EventVenueIcon className="w-7 h-7" /> },
    { title: 'Hostel', fullTitle: 'Student Hostels', icon: <StudentHostelIcon className="w-7 h-7" /> },
    { title: 'Smart Home', fullTitle: 'Smart Home Rent', icon: <SmartHomeIcon className="w-7 h-7" /> },
    { title: 'Rent-to-Own', fullTitle: 'Rent-to-Own', icon: <RentToOwnIcon className="w-7 h-7" /> },
    { title: 'Trip Planner', fullTitle: 'Trip Planner', icon: <TripPlannerIcon className="w-7 h-7" /> },
    { title: 'Navigation', fullTitle: 'Road Navigation', icon: <RoadNavigationIcon className="w-7 h-7" /> },
    { title: 'Rent Loan', fullTitle: 'Rent Loan', icon: <RentToOwnIcon className="w-7 h-7" /> },
];

interface ChatPageProps {
    isPremium: boolean;
    favorites: Property[];
    onToggleFavorite: (property: Property) => void;
    onPremiumUpgrade: () => void;
    toastMessage: string | null;
    onNavigateHome: () => void;
    currentUser: any;
}

const Toast: React.FC<{ message: string | null }> = ({ message }) => {
    if (!message) return null;
    return (
        <div className="fixed top-20 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-toast">
            {message}
        </div>
    );
};

const ChatPage: React.FC<ChatPageProps> = ({ isPremium, favorites, onToggleFavorite, onPremiumUpgrade, toastMessage, onNavigateHome, currentUser }) => {
    const [activeChatId, setActiveChatId] = useState(() => Date.now());
    const [activeTab, setActiveTab] = useState<'conversations' | 'favorites'>('conversations');
    const [showFilters, setShowFilters] = useState(false);
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
    const [programmaticMessage, setProgrammaticMessage] = useState('');

    // Effect to reset programmatic message after it's been sent to the chatbot
    useEffect(() => {
        if (programmaticMessage) {
            const timer = setTimeout(() => setProgrammaticMessage(''), 100);
            return () => clearTimeout(timer);
        }
    }, [programmaticMessage]);
    
    // Listen for custom event from ProfileModal
    useEffect(() => {
        const handleViewDetails = (event: Event) => {
            const property = (event as CustomEvent).detail as Property;
            setProgrammaticMessage(`Tell me more details about the property called "${property.title}".`);
        };

        window.addEventListener('viewPropertyDetails', handleViewDetails);
        return () => {
            window.removeEventListener('viewPropertyDetails', handleViewDetails);
        };
    }, []);

    const startNewChat = () => {
        localStorage.removeItem(`chatHistory_${activeChatId}`);
        setActiveChatId(Date.now());
        setActiveTab('conversations');
    };

    const handleApplyFilters = (filters: FilterValues) => {
        let message = '[USER FILTERS: ';
        const filterParts = [];
        if (filters.priceRange.max < 10000000) {
            filterParts.push(`Price up to ₦${(filters.priceRange.max / 1000).toFixed(0)}k`);
        }
        if (filters.bedrooms !== 'any') {
            filterParts.push(`${filters.bedrooms} bedroom${filters.bedrooms > 1 ? 's' : ''}`);
        }
        if (filters.propertyType !== 'any') {
            filterParts.push(filters.propertyType);
        }
        if (filters.amenities.length > 0) {
            filterParts.push(filters.amenities.join(', '));
        }
        message += filterParts.join(', ') + ']';

        setProgrammaticMessage(message);
        setShowFilters(false);
    };

    const handleServiceSelect = (serviceFullTitle: string) => {
        setProgrammaticMessage(`I'm interested in finding a ${serviceFullTitle}. Can you help?`);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[85vh]">
            <Toast message={toastMessage} />
            {isInsightsModalOpen && <MarketInsightsModal onClose={() => setIsInsightsModalOpen(false)} />}
             <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Left Column: Filters and User Info */}
            <div className="hidden lg:flex flex-col gap-6">
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 flex-grow flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">Advanced Search</h2>
                        <button
                            onClick={() => setIsInsightsModalOpen(true)}
                            title="Market Insights"
                            className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border"
                        >
                            <ChartBarIcon className="w-5 h-5 text-brand-primary" />
                        </button>
                    </div>
                    <AdvancedFilters onApplyFilters={handleApplyFilters} />
                </div>
                 <div className="p-3 border border-light-border dark:border-dark-border rounded-lg bg-light-card dark:bg-dark-card flex-shrink-0 flex items-center gap-3">
                    {currentUser?.avatarUrl ? (
                        <img 
                            src={currentUser.avatarUrl} 
                            alt={currentUser.fullName || 'User'} 
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-light-border dark:bg-dark-border flex items-center justify-center">
                            <UserIcon className="w-6 h-6"/>
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-sm">{currentUser?.fullName || 'Guest User'}</p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                            {currentUser?.role ? currentUser.role.replace('_', ' ') : 'Guest Profile'}
                        </p>
                    </div>
                 </div>
            </div>

            {/* Middle Column: Chat Interface */}
            <main className="lg:col-span-2 flex flex-col bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-light-border dark:border-dark-border flex-shrink-0 bg-light-card dark:bg-dark-card text-center relative">
                    <h3 className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">AI Property Assistant</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">I can help you find the perfect property.</p>
                     <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2">
                        <div className="lg:hidden flex gap-2">
                            <button onClick={() => setIsInsightsModalOpen(true)} className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border">
                                <ChartBarIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => setShowFilters(!showFilters)} className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border">
                                <FilterIcon />
                            </button>
                        </div>
                         <button onClick={startNewChat} className="bg-brand-primary text-white text-sm font-semibold py-2 px-3 rounded-lg hover:bg-brand-secondary transition-colors">
                            + Clear Chat
                        </button>
                    </div>
                </div>

                {/* --- Service Selector --- */}
                <div className="p-3 border-b border-light-border dark:border-dark-border flex-shrink-0 bg-light-card dark:bg-dark-card">
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                        {services.map(service => (
                             <button
                                key={service.title}
                                onClick={() => handleServiceSelect(service.fullTitle)}
                                className="flex flex-col items-center justify-start text-center p-2 rounded-lg w-20 h-24 flex-shrink-0 group hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                            >
                                <div className="w-12 h-12 flex items-center justify-center bg-light-bg dark:bg-dark-bg rounded-full border border-light-border dark:border-dark-border text-brand-primary group-hover:border-brand-primary/50 transition-colors">
                                    {service.icon}
                                </div>
                                <span className="text-xs mt-2 font-semibold text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text-primary dark:group-hover:text-dark-text-primary transition-colors line-clamp-2">
                                    {service.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>


                {showFilters && (
                    <div className="lg:hidden p-4 bg-light-bg dark:bg-dark-bg border-b border-light-border dark:border-dark-border">
                         <AdvancedFilters onApplyFilters={handleApplyFilters} />
                    </div>
                )}
                <div className="flex-grow overflow-hidden">
                    <Chatbot 
                        key={activeChatId}
                        chatId={activeChatId}
                        isPremium={isPremium}
                        favorites={favorites} 
                        onToggleFavorite={onToggleFavorite}
                        onPremiumUpgrade={onPremiumUpgrade}
                        programmaticMessage={programmaticMessage}
                    />
                </div>
            </main>

            {/* Right Column: Conversations and Favorites */}
            <aside className="hidden lg:flex flex-col bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg">
                <div className="p-4 border-b border-light-border dark:border-dark-border flex-shrink-0 flex justify-between items-center">
                    <div className="border-b border-light-border dark:border-dark-border flex">
                        <button onClick={() => setActiveTab('conversations')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'conversations' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>
                            Chats
                        </button>
                         <button onClick={() => setActiveTab('favorites')} className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${activeTab === 'favorites' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>
                           <BookmarkSolidIcon /> Favorites
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onNavigateHome} className="text-sm font-semibold py-2 px-3 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors">Home</button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {activeTab === 'conversations' && (
                        <div className="p-4 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
                           Conversation history will be shown here.
                        </div>
                    )}
                    {activeTab === 'favorites' && (
                        <div className="p-2 space-y-2">
                            {favorites.length > 0 ? favorites.map(prop => (
                                <div key={prop.id} className="flex gap-3 p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg">
                                    <img src={prop.imageUrl} alt={prop.title} className="w-16 h-16 rounded-md object-cover flex-shrink-0"/>
                                    <div>
                                        <p className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary line-clamp-2">{prop.title}</p>
                                        <p className="text-xs text-brand-primary font-bold">{prop.price}</p>
                                    </div>
                                </div>
                            )) : (
                                 <div className="p-4 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                    You haven't saved any properties yet.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}

export default ChatPage;