import React, { useState, useEffect } from 'react';
import type { Page } from '../SheltrifyApp';

interface BottomNavProps {
    currentPage: Page;
    isAuthenticated: boolean;
    cartCount?: number;
    onNavigate: (page: Page) => void;
    onLoginClick: () => void;
}

/* ── Icons (inline SVG for zero-dep) ─────────────────────────────────────── */
const HomeIcon   = ({ active }: { active: boolean }) => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        {active
            ? <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-1.31-1.31V5.25a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v2.406L12 3.53l-8.72 8.69a.75.75 0 001.06 1.06l1.31-1.31V19.5a.75.75 0 00.75.75H9a.75.75 0 00.75-.75v-4.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V19.5a.75.75 0 00.75.75h4.125a.75.75 0 00.75-.75v-7.5a.75.75 0 00-.75-.75h-.375L12 4.594 3.378 11.25H3a.75.75 0 00-.75.75v7.5c0 .414.336.75.75.75H7.5a.75.75 0 00.75-.75V15a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v4.5a.75.75 0 00.75.75h3.375a.75.75 0 00.75-.75v-7.5z" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        }
    </svg>
);
const ChatIcon   = ({ active }: { active: boolean }) => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        {active
            ? <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        }
    </svg>
);
const StoreIcon  = ({ active }: { active: boolean }) => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        {active
            ? <path d="M5.223 2.25c-.497 0-.974.198-1.325.55l-1.3 1.298A3.75 3.75 0 007.5 9.75c.627.47 1.406.75 2.25.75.844 0 1.624-.28 2.25-.75.626.47 1.406.75 2.25.75.844 0 1.623-.28 2.25-.75a3.75 3.75 0 004.902-5.652l-1.3-1.299a1.875 1.875 0 00-1.325-.549H5.223zM18 9.943a5.25 5.25 0 01-4.5 0 5.25 5.25 0 01-3 .694 5.25 5.25 0 01-3-.694 5.25 5.25 0 01-4.5 0V17.25a.75.75 0 00.75.75h5.25v-4.5h3v4.5H18.75a.75.75 0 00.75-.75V9.943z" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21V12h-3v9M3 9h18M3 9l2.25-6.75h13.5L21 9M3 9v10.5a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5V9" />
        }
    </svg>
);
const WalletIcon = ({ active }: { active: boolean }) => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        {active
            ? <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.625A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.625zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H15a.75.75 0 000 1.5h.008v.015h-.008a1.5 1.5 0 000 3H18a.75.75 0 000-1.5h-2.992a.015.015 0 01-.008-.015V10.5H5.25z" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h3.75M7.5 4.125c0 1.036.84 1.875 1.875 1.875h.375a3.75 3.75 0 013.75 3.75v1.875M7.5 4.125A3.375 3.375 0 014.125 7.5H3a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0020.25 18.75V9a2.25 2.25 0 00-2.25-2.25h-.75" />
        }
    </svg>
);
const GridIcon   = ({ active }: { active: boolean }) => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        {active
            ? <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        }
    </svg>
);

/* ── More sheet items ─────────────────────────────────────────────────────── */
interface MoreItem {
    label: string;
    emoji: string;
    page?: Page;
    danger?: boolean;
    fn?: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({
    currentPage, isAuthenticated, cartCount = 0, onNavigate, onLoginClick,
}) => {
    const [showMore, setShowMore] = useState(false);

    // Hide bottom nav when virtual keyboard might be open (viewport shrinks significantly)
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const initial = window.innerHeight;
        const check = () => setVisible(window.innerHeight > initial * 0.75);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const go = (page: Page) => {
        if (!isAuthenticated && ['chat','community','wallet','marketplace','feels','rentalWahala','cart'].includes(page)) {
            onLoginClick();
        } else {
            onNavigate(page);
        }
        setShowMore(false);
    };

    const tabs = [
        { id: 'landing',     label: 'Home',      Icon: HomeIcon,   active: currentPage === 'landing' },
        { id: 'chat',        label: 'Chat',       Icon: ChatIcon,   active: currentPage === 'chat' },
        { id: 'marketplace', label: 'Store',      Icon: StoreIcon,  active: currentPage === 'marketplace' },
        { id: 'wallet',      label: 'Wallet',     Icon: WalletIcon, active: currentPage === 'wallet' },
        { id: 'more',        label: 'Explore',    Icon: GridIcon,   active: showMore || ['artisans','community','feels','rentalWahala','globalTales','premium','about','contact','userDashboard','adminDashboard','profile'].includes(currentPage) },
    ] as const;

    const moreItems: MoreItem[] = [
        { label: 'Local Artisans',  emoji: '🔧', page: 'artisans' },
        { label: 'Community',       emoji: '💬', page: 'community' },
        { label: 'Feels',           emoji: '🎬', page: 'feels' },
        { label: 'Rental Wahala',   emoji: '😤', page: 'rentalWahala' },
        { label: 'Global Tales',    emoji: '📖', page: 'globalTales' },
        { label: 'Premium',         emoji: '⭐', page: 'premium' },
        { label: 'My Dashboard',    emoji: '📊', page: 'userDashboard' },
        { label: 'My Profile',      emoji: '👤', page: 'profile' },
        { label: 'About',           emoji: 'ℹ️',  page: 'about' },
        { label: 'Contact',         emoji: '✉️',  page: 'contact' },
        ...(!isAuthenticated
            ? [{ label: 'Log In', emoji: '🔑', fn: () => { setShowMore(false); onLoginClick(); } }]
            : [{ label: 'Sign Out', emoji: '🚪', danger: true, fn: () => { setShowMore(false); onNavigate('landing'); } }]
        ),
    ];

    if (!visible) return null;

    return (
        <>
            {/* More bottom sheet */}
            {showMore && (
                <>
                    <div
                        className="bottom-sheet-overlay"
                        onClick={() => setShowMore(false)}
                        aria-label="Close menu"
                    />
                    <div className="bottom-sheet glass dark:glass-dark">
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-light-border dark:bg-dark-border" />
                        </div>
                        <div className="px-4 pb-2">
                            <p className="text-xs font-semibold tracking-widest uppercase text-light-text-muted dark:text-dark-text-muted mb-3 px-1">Explore</p>
                            <div className="grid grid-cols-3 gap-2">
                                {moreItems.map(item => (
                                    <button
                                        key={item.label}
                                        onClick={() => item.fn ? item.fn() : go(item.page!)}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95
                                            ${item.danger
                                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                : item.page && currentPage === item.page
                                                    ? 'bg-brand-primary/15 text-brand-primary'
                                                    : 'bg-light-surface dark:bg-dark-card text-light-text-primary dark:text-dark-text-primary hover:bg-brand-primary/10 hover:text-brand-primary'
                                            }`}
                                    >
                                        <span className="text-2xl leading-none">{item.emoji}</span>
                                        <span className="text-xs font-medium leading-tight text-center">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Bottom Nav bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                aria-label="Mobile navigation"
            >
                <div className="glass dark:glass-dark border-t border-light-border/60 dark:border-dark-border/60"
                     style={{ boxShadow: '0 -1px 0 rgba(255,255,255,0.05), 0 -8px 32px rgba(0,0,0,0.28)' }}>
                    <div className="flex items-stretch h-16">
                        {tabs.map(tab => {
                            const isMore = tab.id === 'more';
                            const isActive = tab.active;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        if (isMore) {
                                            setShowMore(v => !v);
                                        } else {
                                            setShowMore(false);
                                            go(tab.id as Page);
                                        }
                                    }}
                                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 relative
                                        ${isActive
                                            ? 'text-brand-primary'
                                            : 'text-light-text-muted dark:text-dark-text-muted hover:text-brand-primary dark:hover:text-brand-primary'
                                        }`}
                                    aria-label={tab.label}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {/* Active indicator pill */}
                                    {isActive && (
                                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-brand-primary" />
                                    )}

                                    {/* Cart count badge on Store */}
                                    {tab.id === 'marketplace' && cartCount > 0 && (
                                        <span className="absolute top-2 right-1/4 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-brand-primary text-white text-[9px] font-bold rounded-full">
                                            {cartCount > 9 ? '9+' : cartCount}
                                        </span>
                                    )}

                                    <tab.Icon active={isActive} />
                                    <span className={`text-[10px] font-medium leading-none ${isActive ? 'font-semibold' : ''}`}>
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default BottomNav;
