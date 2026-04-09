import React, { useState } from 'react';
import {
    CheckCircleIcon, UserIcon, ChevronRightIcon,
    VideoCameraIcon, ChevronLeftIcon,
    ResidentialHouseIcon, HotelIcon, OfficeIcon, BusinessIcon,
    EventVenueIcon, StudentHostelIcon, SmartHomeIcon,
    RentToOwnIcon, TripPlannerIcon, RoadNavigationIcon,
    BuildingStorefrontIcon, DocumentTextIcon, UsersIcon, GlobeAltIcon,
    MegaphoneIcon,
} from './icons';

interface LandingPageProps {
  onStartChatting: () => void;
  onTalkToAnna: () => void;
  onPremiumUpgrade?: () => void;
}

// --- ARTISAN DATA & TYPES ---
interface Artisan {
  id: number;
  name: string;
  service: string;
  email: string;
  phone: string;
  avatarUrl: string;
}

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

const Hero: React.FC<Pick<LandingPageProps, 'onStartChatting'>> = ({ onStartChatting }) => (
  <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24">
    {/* Ambient glow */}
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-brand-primary/10 blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full bg-blue-500/8 blur-[80px]" />
    </div>

    {/* Badge */}
    <div className="flex justify-center mb-6">
      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-semibold animate-fade-in">
        <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
        Nigeria's #1 AI Real Estate Platform
      </span>
    </div>

    {/* Headline */}
    <h1 className="text-center text-[2.6rem] sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 px-4 animate-fade-up">
      <span className="text-light-text-primary dark:text-dark-text-primary">Find Your Home</span>
      <br />
      <span className="text-gradient">With AI Intelligence</span>
    </h1>

    <p className="text-center max-w-2xl mx-auto text-lg md:text-xl text-light-text-secondary dark:text-dark-text-secondary mb-10 px-4 leading-relaxed">
      One conversation is all it takes. Our AI searches thousands of verified listings across Nigeria — then books, pays, and manages it all for you.
    </p>

    {/* CTAs */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4 mb-14">
      <button
        onClick={onStartChatting}
        className="btn-primary w-full sm:w-auto text-base px-8 py-3.5 rounded-2xl"
      >
        Start Searching Free
        <ChevronRightIcon className="w-5 h-5" />
      </button>
      <button
        onClick={onStartChatting}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-base font-medium text-light-text-primary dark:text-dark-text-primary bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-brand-primary/40 hover:text-brand-primary transition-all"
      >
        <svg className="w-5 h-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Watch Demo
      </button>
    </div>

    {/* Stats bar */}
    <div className="max-w-3xl mx-auto px-4">
      <div className="grid grid-cols-3 gap-px bg-light-border dark:bg-dark-border rounded-2xl overflow-hidden">
        {[
          { value: '50K+', label: 'Listings' },
          { value: '12K+', label: 'Happy Tenants' },
          { value: '98%',  label: 'Verified Listings' },
        ].map(stat => (
          <div key={stat.label} className="flex flex-col items-center py-4 bg-light-card dark:bg-dark-card">
            <span className="text-2xl md:text-3xl font-extrabold text-brand-primary">{stat.value}</span>
            <span className="text-xs md:text-sm text-light-text-secondary dark:text-dark-text-secondary mt-0.5">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Hero image */}
    <div className="relative max-w-5xl mx-auto mt-12 px-4">
      <div className="relative rounded-3xl overflow-hidden shadow-card-lg ring-1 ring-light-border dark:ring-dark-border">
        <img
          src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=2070"
          alt="Modern Nigerian architecture"
          className="w-full h-64 sm:h-80 md:h-[420px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 via-dark-bg/20 to-transparent" />
        {/* Floating card overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="glass-dark rounded-2xl px-4 py-3 flex-1 max-w-xs">
            <p className="text-white/60 text-xs mb-0.5">Featured Listing</p>
            <p className="text-white font-semibold text-sm">3-Bed Apartment, Lekki Phase 1</p>
            <p className="text-brand-primary font-bold text-base">₦850,000/yr</p>
          </div>
          <div className="glass-dark rounded-2xl px-4 py-3 hidden sm:block">
            <p className="text-white/60 text-xs mb-1">AI Match Score</p>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full w-[94%] bg-brand-primary rounded-full" />
              </div>
              <span className="text-white font-bold text-sm">94%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ServiceShowcase: React.FC = () => {
    const services = [
        { title: 'Residential House', description: 'Find your long-term home, from duplexes to flats.', icon: <ResidentialHouseIcon className="w-12 h-12" /> },
        { title: 'Hotels & Guest Houses', description: 'Book short-term stays for travel or leisure.', icon: <HotelIcon className="w-12 h-12" /> },
        { title: 'Office Space', description: 'Secure the perfect workspace for your business.', icon: <OfficeIcon className="w-12 h-12" /> },
        { title: 'Business Premises', description: 'Retail, warehouse, or commercial spaces.', icon: <BusinessIcon className="w-12 h-12" /> },
        { title: 'Event Venue', description: 'Find the ideal space for any occasion.', icon: <EventVenueIcon className="w-12 h-12" /> },
        { title: 'Student Hostels', description: 'Affordable and convenient student living.', icon: <StudentHostelIcon className="w-12 h-12" /> },
        { title: 'Smart Home Rent', description: 'Live in the future with tech-enabled homes.', icon: <SmartHomeIcon className="w-12 h-12" /> },
        { title: 'Rent-to-Own', description: 'A clear path to homeownership.', icon: <RentToOwnIcon className="w-12 h-12" /> },
        { title: 'Trip Planner', description: 'Organize your entire journey with our tools.', icon: <TripPlannerIcon className="w-12 h-12" /> },
        { title: 'Road Navigation', description: 'Logistics and navigation for seamless travel.', icon: <RoadNavigationIcon className="w-12 h-12" /> },
    ];

    return (
        <section className="py-16 md:py-24 px-4">
            <div className="text-center mb-12 max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">Find Exactly What You Need</h2>
                <p className="max-w-3xl mx-auto mt-4 text-light-text-secondary dark:text-dark-text-secondary">
                    From long-term homes to specialized services, our AI-powered platform caters to every accommodation and travel requirement.
                </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 max-w-7xl mx-auto">
                {services.map((service, index) => (
                    <div
                        key={index}
                        className="group p-4 md:p-5 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl text-center flex flex-col items-center cursor-pointer
                                   transition-all duration-200
                                   hover:border-brand-primary/50 hover:shadow-brand-sm hover:-translate-y-1 active:scale-95"
                    >
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-brand-primary/10 group-hover:bg-brand-primary/20 flex items-center justify-center text-brand-primary mb-3 transition-colors">
                            {service.icon}
                        </div>
                        <h3 className="text-xs md:text-sm font-semibold text-light-text-primary dark:text-dark-text-primary leading-tight">{service.title}</h3>
                    </div>
                ))}
            </div>
        </section>
    );
};

const HowItWorks: React.FC = () => {
    const steps = [
        { number: '1', title: 'Chat with our AI', description: 'Start a conversation with our AI assistant, telling it what you are looking for in your ideal accommodation.' },
        { number: '2', title: 'Discover Options', description: 'Our AI will search through thousands of verified listings to find the perfect matches for your criteria.' },
        { number: '3', title: 'View Properties', description: 'Explore detailed information, photos, and even request video tours of properties that interest you.' },
        { number: '4', title: 'Book and Pay – Securely', description: 'When you find the perfect place, book it instantly with our secure payment system.' },
        { number: '5', title: '24/7 Available', description: 'ShelTrify AI assistant never sleeps – get property recommendations anytime, day or night.' },
        { number: '6', title: 'Voice Support', description: 'The System offers unique services that enable those with difficulty in writing to speak and have a result.' },
    ];
    return (
        <section className="py-16 md:py-24 px-4">
            <div className="text-center mb-12 max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">How ShelTrify AI Works</h2>
                <p className="max-w-2xl mx-auto mt-4 text-light-text-secondary dark:text-dark-text-secondary">
                    Finding your perfect accommodation is simple and efficient with our AI-powered platform.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
                {steps.map((step) => (
                    <div key={step.number} className="relative p-5 md:p-6 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl overflow-hidden group hover:border-brand-primary/30 transition-all hover:shadow-brand-sm">
                        {/* Step number watermark */}
                        <span className="absolute top-3 right-4 text-6xl font-black text-light-border dark:text-dark-border select-none">{step.number}</span>
                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-brand-primary/15 text-brand-primary flex items-center justify-center font-bold text-sm mb-3 group-hover:bg-brand-primary group-hover:text-white transition-all">
                                {step.number}
                            </div>
                            <h3 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">{step.title}</h3>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

const VideoShowcase: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const videos = [
        { src: '/vid1.mp4', title: 'Finding Your Perfect Apartment with ShelTrify AI', isLocal: true },
    ];

    const prevSlide = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? videos.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const nextSlide = () => {
        const isLastSlide = currentIndex === videos.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    return (
        <section className="py-16 md:py-24 px-4">
            <div className="text-center mb-12 max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">See ShelTrify in Action</h2>
                <p className="max-w-2xl mx-auto mt-4 text-light-text-secondary dark:text-dark-text-secondary">
                    Discover how easy it is to navigate our platform and find exactly what you need.
                </p>
            </div>
            <div className="max-w-4xl mx-auto relative group">
                <div className="relative h-0 pb-[56.25%] overflow-hidden rounded-2xl shadow-2xl shadow-brand-primary/10 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border">
                     {videos.map((video, index) => (
                        <div key={index} className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0'}`}>
                            {index === currentIndex && video.isLocal ? (
                                <video
                                    src={video.src}
                                    controls
                                    muted
                                    loop
                                    className="w-full h-full object-cover"
                                    title={video.title}
                                />
                            ) : index === currentIndex && !video.isLocal ? (
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${(video as any).id}?autoplay=0&mute=1&controls=1&loop=1&playlist=${(video as any).id}`}
                                    title={video.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : null}
                        </div>
                    ))}
                </div>
                <button onClick={prevSlide} className="absolute top-1/2 -left-5 md:-left-12 transform -translate-y-1/2 p-3 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:text-white hover:bg-brand-primary transition-all opacity-0 group-hover:opacity-100">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button onClick={nextSlide} className="absolute top-1/2 -right-5 md:-right-12 transform -translate-y-1/2 p-3 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:text-white hover:bg-brand-primary transition-all opacity-0 group-hover:opacity-100">
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
                <div className="text-center mt-4">
                    <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{videos[currentIndex].title}</p>
                    <div className="flex justify-center gap-2 mt-2">
                        {videos.map((_, index) => (
                            <div key={index} onClick={() => setCurrentIndex(index)} className={`w-3 h-3 rounded-full cursor-pointer transition-all ${currentIndex === index ? 'bg-brand-primary w-6' : 'bg-light-border dark:bg-dark-border'}`}></div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};


const ArtisanServicesMarquee: React.FC = () => {
    const uniqueServices = [...new Set(artisans.map(artisan => artisan.service))];
    const servicesForMarquee = [...uniqueServices, ...uniqueServices];

    return (
        <section className="py-8 md:py-0 px-4">
            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">And That's Not All...</h2>
                <p className="max-w-3xl mx-auto mt-4 text-light-text-secondary dark:text-dark-text-secondary">
                    Beyond finding your next home, ShelTrify connects you with a network of trusted local artisans and essential day-to-day services to make your life easier.
                </p>
            </div>
            <div className="relative w-full max-w-6xl mx-auto mt-10 px-4 overflow-hidden group [mask-image:_linear_gradient(to_right,transparent_0,_black_10%,_black_90%,transparent_100%)]">
                <div className="py-3 animate-marquee whitespace-nowrap flex items-center">
                    {servicesForMarquee.map((service, index) => (
                        <React.Fragment key={index}>
                            <span className="mx-4 text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary">{service}</span>
                            {index < servicesForMarquee.length - 1 && <div className="w-2 h-2 rounded-full bg-brand-primary/50"></div>}
                        </React.Fragment>
                    ))}
                </div>
                 {/* This style block is for the animation. */}
                <style>{`
                    @keyframes marquee {
                        0% { transform: translateX(0%); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        animation: marquee 60s linear infinite;
                    }
                    .group:hover .animate-marquee {
                        animation-play-state: paused;
                    }
                `}</style>
            </div>
        </section>
    );
};

const MeetAnna: React.FC<Pick<LandingPageProps, 'onTalkToAnna'>> = ({ onTalkToAnna }) => (
    <section className="py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Image side */}
            <div className="relative order-2 lg:order-1">
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-card-lg">
                    <img
                        src="https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=2070&auto=format&fit=crop"
                        alt="AI Video Assistant Anna"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 via-dark-bg/30 to-transparent" />
                    {/* Floating avatar */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-brand-primary shadow-brand-md">
                            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop"
                                alt="Anna" className="w-full h-full object-cover" />
                        </div>
                        <div className="glass-dark px-4 py-1.5 rounded-full">
                            <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                Anna is online
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Text side */}
            <div className="order-1 lg:order-2">
                <span className="badge badge-brand mb-4">AI Video Assistant</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4">Meet Anna, Your AI Assistant</h2>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6 leading-relaxed">
                    Have a real face-to-face, voice-powered conversation with our AI. Anna understands Nigerian context,
                    knows every listing, and gives you instant personalized recommendations.
                </p>
                <ul className="space-y-3 mb-8">
                    {['24/7 availability across all time zones.', 'Instant, intelligent property suggestions.', 'Natural, voice-based conversations.'].map(item => (
                        <li key={item} className="flex items-center gap-3 text-sm text-light-text-primary dark:text-dark-text-primary">
                            <CheckCircleIcon className="w-5 h-5 text-brand-primary flex-shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
                <button
                    onClick={onTalkToAnna}
                    className="btn-primary rounded-2xl px-7 py-3.5 text-base"
                >
                    <VideoCameraIcon className="w-5 h-5" />
                    Talk to Anna Now
                </button>
            </div>
        </div>
    </section>
);


const Features: React.FC = () => {
    const featureList = [
        { title: "AI Chatbot Assistance", description: "Intelligent conversational assistant that understands your needs and helps find perfect accommodation." },
        { title: "Interactive Map Integration", description: "Visual exploration of properties with Google Maps integration to visualize location and nearby amenities." },
        { title: "Multi-lingual Language Support", description: "Service available in English and other languages for better accessibility." },
        { title: "USSD Access", description: "Offline access via USSD code for users without a smartphone or internet connectivity." },
        { title: "AI Authenticity Check", description: "Advanced verification system to detect fake listings and ensure property authenticity about 98.2%." },
        { title: "Detailed Property Search", description: "Comprehensive search criteria including location amenities, proximity to facilities, and more." },
        { title: "Video Tour Request", description: "Request video tours of properties to get a better feel before scheduling physical visits." },
        { title: "Secure Payments", description: "Integrated payment system for Booking and securing properties instantly online." },
    ];

    const icons = ['🤖','🗺️','🌐','📲','🛡️','🔍','🎥','🔒'];
    return (
      <section className="py-16 md:py-24">
        <div className="text-center mb-10">
          <span className="badge badge-brand mb-3">Platform Features</span>
          <h2 className="text-3xl md:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Everything You Need, Built In
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {featureList.map((feature, index) => (
            <div key={index}
              className="group relative p-5 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl
                         hover:border-brand-primary/40 hover:-translate-y-1 hover:shadow-brand-sm transition-all duration-200 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-brand-primary/5 rounded-bl-3xl" />
              <div className="text-3xl mb-3">{icons[index]}</div>
              <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1.5 leading-snug">{feature.title}</h3>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    );
};

const FAQ: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const faqs = [
        {
            question: "How do I start a search with the AI?",
            answer: "Simply click the 'Get Started Now' or 'Start Chat' button. Our AI assistant, Anna, will greet you and ask for your preferences like location, budget, and property type to begin finding your perfect match."
        },
        {
            question: "Are the listings on ShelTrify verified?",
            answer: "Yes. We use an advanced AI-powered authenticity check system to verify listings, ensuring about 98.2% accuracy. We strive to provide a safe and trustworthy platform for all users."
        },
        {
            question: "How does the booking process work?",
            answer: "Once you find a property you like, you can request more details or book a viewing directly through the chat with Anna. She will guide you through scheduling an appointment with the landlord or agent."
        },
        {
            question: "Can I save properties to view later?",
            answer: "Absolutely! When our AI shows you a property card, click the bookmark icon ( interested ) to save it. You can access all your saved properties from your profile."
        },
        {
            question: "How does the Community Forum operate?",
            answer: "The forum is a space for users to connect, share experiences, ask questions, and get advice on everything related to renting. It's a community-driven platform to help everyone make more informed decisions."
        },
        {
            question: "What are 'Feels'?",
            answer: "'Feels' is our short-form video feed for real estate inspiration. It features quick, engaging video tours, design ideas, and relatable rental moments to make your property search more enjoyable."
        },
        {
            question: "What is the 'Rental Wahala Feeds' section?",
            answer: "This is our curated feed of funny and relatable short videos capturing the unique challenges and humorous side of renting, often referred to as 'wahala' in Nigeria. It's a place to share a laugh and know you're not alone!"
        },
        {
            question: "How does the ShelTrify Marketplace work?",
            answer: "The Marketplace is a one-stop shop for home-related goods and services, including electronics, furniture, building materials, and connections to local artisans. You can buy or list items for sale."
        },
        {
            question: "How do ShelTrify Wallet Coins (SWC) work?",
            answer: "SWC are reward points you earn for activities like referring new users or listing properties. They can be used to boost listings, pay for services, or even be converted to cash, providing tangible value within our ecosystem."
        },
        {
            question: "What if I have a problem with my booking?",
            answer: "Our support team is here to help. You can contact us through the 'Contact Us' link in the footer. For immediate assistance, you can also use our live AI video assistant, Anna, on the homepage."
        }
    ];

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-16 md:py-24">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                    <span className="badge badge-brand mb-3">FAQ</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">Help Center</h2>
                    <p className="mt-3 text-light-text-secondary dark:text-dark-text-secondary">Common questions, answered.</p>
                </div>
                <div className="space-y-2">
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div key={index}
                                className={`bg-light-card dark:bg-dark-card border rounded-2xl overflow-hidden transition-all duration-200
                                    ${isOpen ? 'border-brand-primary/40 shadow-brand-sm' : 'border-light-border dark:border-dark-border'}`}
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex justify-between items-center text-left px-5 py-4 gap-4"
                                >
                                    <span className={`text-sm font-semibold leading-snug transition-colors ${isOpen ? 'text-brand-primary' : 'text-light-text-primary dark:text-dark-text-primary'}`}>
                                        {faq.question}
                                    </span>
                                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200
                                        ${isOpen ? 'bg-brand-primary text-white rotate-45' : 'bg-light-border dark:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary'}`}>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-4 text-sm text-light-text-secondary dark:text-dark-text-secondary leading-relaxed animate-fade-up">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const SustainabilitySection: React.FC = () => {
  const points = [
    {
      icon: <GlobeAltIcon className="w-8 h-8 text-brand-primary" />,
      title: "Eco-Friendly Listings",
      description: "We highlight properties with green features like solar panels, energy-efficient appliances, and sustainable materials."
    },
    {
      icon: <BuildingStorefrontIcon className="w-8 h-8 text-brand-primary" />,
      title: "Sustainable Marketplace",
      description: "Our marketplace promotes eco-friendly furniture, home goods, and building materials from local artisans."
    },
    {
      icon: <DocumentTextIcon className="w-8 h-8 text-brand-primary" />,
      title: "Paperless Transactions",
      description: "From applications to lease signing, our fully digital process reduces paper waste and simplifies your journey."
    },
    {
      icon: <UsersIcon className="w-8 h-8 text-brand-primary" />,
      title: "Community Initiatives",
      description: "Join discussions in our community forum on green living, recycling programs, and local eco-initiatives."
    }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="text-center mb-10">
        <span className="badge badge-success mb-3">Sustainability</span>
        <h2 className="text-3xl md:text-4xl font-bold" style={{background:'linear-gradient(135deg,#10B981,#00B8B8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          Building a Greener Future
        </h2>
        <p className="mt-3 text-light-text-secondary dark:text-dark-text-secondary max-w-xl mx-auto">
          We're committed to eco-friendly renting for a better Nigeria.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {points.map((point, index) => (
          <div key={index} className="flex items-start gap-4 p-5 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl hover:border-green-500/30 transition-all">
            <div className="flex-shrink-0 p-2.5 rounded-xl bg-green-500/10">{point.icon}</div>
            <div>
              <h4 className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary mb-1">{point.title}</h4>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">{point.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};


const Testimonials: React.FC = () => {
    const testimonials = [
        { name: 'Adebayo T.', location: 'Lagos, Nigeria', text: 'ShelTrify made my apartment hunt in Lagos so much easier. The AI understood exactly what I wanted and saved me weeks of searching!' },
        { name: 'Emily R.', location: 'New York, USA', text: 'As a student moving to a new city, the roommate matching feature was a lifesaver. Found a great place and a great roommate.' },
        { name: 'Kwame A.', location: 'Accra, Ghana', text: 'Booking a short-let for my business trip was seamless. The payment was secure, and the property was exactly as described.' },
    ];
    return (
        <section className="py-16 md:py-24">
            <div className="text-center mb-10">
                <span className="badge badge-brand mb-3">Testimonials</span>
                <h2 className="text-3xl md:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">What Our Users Say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {testimonials.map((t, i) => (
                    <div key={i} className="relative p-6 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl flex flex-col gap-4 hover:border-brand-primary/30 hover:shadow-brand-sm transition-all">
                        {/* Stars */}
                        <div className="flex gap-0.5">
                            {[...Array(5)].map((_, s) => (
                                <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <p className="text-light-text-primary dark:text-dark-text-primary text-sm leading-relaxed flex-1">"{t.text}"</p>
                        <div className="flex items-center gap-3 pt-2 border-t border-light-border dark:border-dark-border">
                            <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-5 h-5 text-brand-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">{t.name}</p>
                                <p className="text-xs text-light-text-muted dark:text-dark-text-muted">{t.location}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

const Premium: React.FC<Pick<LandingPageProps, 'onStartChatting' | 'onPremiumUpgrade'>> = ({ onStartChatting, onPremiumUpgrade }) => {
    const features = [
        'Priority access to new listings', 'Personalized property recommendations', 'Dedicated accommodation consultant',
        'Expedited booking process', 'VIP property tours', 'Exclusive discounts and offers'
    ];
    return (
        <section className="py-16 md:py-24">
            {/* Glow background */}
            <div className="relative rounded-3xl overflow-hidden bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border p-8 md:p-12">
                <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand-primary/10 blur-[60px]" />
                <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-blue-500/8 blur-[60px]" />

                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <span className="badge badge-brand mb-4">Premium</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4">Get Ahead with Premium</h2>
                        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-7">Unlock priority access, a dedicated consultant, and exclusive features to find your perfect home faster.</p>
                        <ul className="space-y-2.5">
                            {features.map((f, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-primary/15 flex items-center justify-center">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-brand-primary" />
                                    </span>
                                    <span className="text-sm text-light-text-primary dark:text-dark-text-primary">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pricing card */}
                    <div className="relative p-7 rounded-2xl bg-brand-gradient text-white text-center overflow-hidden">
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                        <div className="relative">
                            <p className="text-white/70 text-sm font-medium mb-1">Monthly Plan</p>
                            <p className="text-5xl font-black mb-1">$10<span className="text-xl font-medium text-white/70">/mo</span></p>
                            <p className="text-white/60 text-sm mb-6">≈ 15,000 SWC · Cancel anytime</p>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPremiumUpgrade ? onPremiumUpgrade() : onStartChatting(); }}
                                className="w-full py-3.5 rounded-xl bg-white text-brand-primary font-bold text-base hover:bg-white/90 active:scale-95 transition-all shadow-lg"
                            >
                                Upgrade to Premium
                            </button>
                            <p className="text-white/50 text-xs mt-4">No hidden fees · Instant activation</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

const AdSpace: React.FC = () => (
    <div className="my-16 md:my-24">
        <div className="max-w-5xl mx-auto">
            <div className="relative rounded-2xl p-8 md:p-12 overflow-hidden bg-gradient-to-br from-brand-primary/10 to-cyan-400/10 dark:from-brand-primary/20 dark:to-cyan-400/20 border border-light-border dark:border-dark-border">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">
                            Advertise with ShelTrify
                        </h2>
                        <p className="mt-4 text-lg text-light-text-secondary dark:text-dark-text-secondary">
                            Connect your brand with thousands of active home seekers, renters, and property investors daily.
                        </p>
                        <ul className="mt-6 space-y-2 text-left text-light-text-primary dark:text-dark-text-primary list-none pl-0">
                             <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-brand-primary mr-2" /> Target a dedicated real estate audience.</li>
                             <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-brand-primary mr-2" /> High-visibility placements across our platform.</li>
                             <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-brand-primary mr-2" /> Flexible and affordable advertising packages.</li>
                        </ul>
                    </div>
                    <div className="flex flex-col items-center justify-center p-8 bg-light-card/50 dark:bg-dark-card/50 rounded-lg">
                        <MegaphoneIcon className="w-16 h-16 text-brand-primary" />
                        <p className="mt-4 font-semibold text-center">Ready to grow your business?</p>
                        <a 
                            href="mailto:ads@sheltrify.com?subject=Advertising Inquiry on ShelTrify"
                            className="mt-4 inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-white bg-brand-primary rounded-lg shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                        >
                            Contact Our Team
                            <ChevronRightIcon className="ml-2 w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
);


const LandingPage: React.FC<LandingPageProps> = ({ onStartChatting, onTalkToAnna, onPremiumUpgrade }) => {
  return (
    <div className="space-y-16 md:space-y-24 overflow-x-hidden w-full">
      <Hero onStartChatting={onStartChatting} />
      <ServiceShowcase />
      <HowItWorks />
      <VideoShowcase />
      <ArtisanServicesMarquee />
      <MeetAnna onTalkToAnna={onTalkToAnna} />
      <Features />
      <FAQ />
      <SustainabilitySection />
      <Testimonials />
      <Premium onStartChatting={onStartChatting} onPremiumUpgrade={onPremiumUpgrade} />
      <AdSpace />
    </div>
  );
};

export default LandingPage;