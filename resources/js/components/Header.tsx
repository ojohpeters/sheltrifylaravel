import React, { useState, useEffect, useRef } from 'react';
import { LogoIcon, MenuIcon, CloseIcon, SunIcon, MoonIcon, UserIcon, ShoppingCartIcon } from './icons';
import { useTheme } from '../SheltrifyApp';
import NotificationBell from './NotificationBell';

interface HeaderProps {
    isAuthenticated: boolean;
    currentUser?: any;
    isAdmin?: boolean;
    cartCount?: number;
    currentPage?: string;
    onLogoClick: () => void;
    onChatClick: () => void;
    onCommunityClick: () => void;
    onWalletClick: () => void;
    onMarketplaceClick: () => void;
    onFeelsClick: () => void;
    onRentalWahalaClick: () => void;
    onGlobalTalesClick?: () => void;
    onAboutClick?: () => void;
    onContactClick?: () => void;
    onPremiumClick?: () => void;
    onProfileClick: () => void;
    onDashboardClick?: () => void;
    onNotificationsClick?: () => void;
    onAdminClick: () => void;
    onCartClick?: () => void;
    onLoginClick?: () => void;
    onSignupClick?: () => void;
    onLogoutClick?: () => void;
}

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-xl text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-primary hover:bg-brand-muted dark:hover:bg-brand-primary/10 transition-all"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <span className="sr-only">Toggle theme</span>
            {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
        </button>
    );
};

/* Desktop nav link */
const NavLink: React.FC<{ label: string; onClick: () => void; active?: boolean }> = ({ label, onClick, active }) => (
    <button
        onClick={onClick}
        className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap
            ${active
                ? 'text-brand-primary bg-brand-primary/10'
                : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-primary hover:bg-brand-primary/8 dark:hover:bg-brand-primary/8'
            }`}
    >
        {label}
        {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-primary" />}
    </button>
);

const Header: React.FC<HeaderProps> = ({
    isAuthenticated, currentUser, isAdmin, cartCount = 0, currentPage,
    onLogoClick, onChatClick, onCommunityClick, onWalletClick, onMarketplaceClick,
    onFeelsClick, onRentalWahalaClick, onGlobalTalesClick, onAboutClick, onContactClick,
    onPremiumClick, onProfileClick, onDashboardClick, onNotificationsClick, onAdminClick, onCartClick,
    onLoginClick, onSignupClick, onLogoutClick,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close menu on escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMenuOpen(false); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    const close = () => setIsMenuOpen(false);

    /* Secondary items only in the hamburger dropdown (desktop) */
    const secondaryItems = [
        ...(onAboutClick    ? [{ label: 'About Us',      fn: () => { close(); onAboutClick(); } }]    : []),
        ...(onContactClick  ? [{ label: 'Contact',        fn: () => { close(); onContactClick(); } }]  : []),
        ...(onPremiumClick  ? [{ label: '⭐ Premium',     fn: () => { close(); onPremiumClick(); } }]  : []),
        { label: 'Global Tales',   fn: () => { close(); onGlobalTalesClick?.(); } },
        { label: 'Rental Wahala',  fn: () => { close(); onRentalWahalaClick(); } },
        { label: 'Feels',          fn: () => { close(); onFeelsClick(); } },
    ];

    const authItems = isAuthenticated
        ? [
            { label: 'My Dashboard', fn: () => { close(); onDashboardClick?.(); }, danger: false },
            { label: 'Sign Out',     fn: () => { close(); onLogoutClick?.(); },    danger: true  },
          ]
        : [
            { label: 'Log In',   fn: () => { close(); onLoginClick?.(); } },
            { label: 'Sign Up',  fn: () => { close(); onSignupClick?.(); } },
        ];

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300
                ${scrolled
                    ? 'bg-light-card/85 dark:bg-dark-surface/85 backdrop-blur-xl shadow-card border-b border-light-border dark:border-dark-border'
                    : 'bg-light-card/70 dark:bg-dark-bg/70 backdrop-blur-md border-b border-transparent'
                }`}
        >
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16 gap-3">

                    {/* ── Logo ─────────────────────────────────────────── */}
                    <button
                        onClick={onLogoClick}
                        className="flex items-center gap-2.5 flex-shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-xl"
                    >
                        <div className="relative">
                            <LogoIcon className="h-8 w-8 text-brand-primary transition-transform duration-500 group-hover:rotate-180" />
                            <span className="absolute inset-0 rounded-full bg-brand-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[1.05rem] font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary group-hover:text-brand-primary transition-colors">
                                ShelTrify
                            </span>
                            <span className="hidden sm:block text-[10px] text-light-text-muted dark:text-dark-text-muted font-medium tracking-wide">
                                Real Estate Ecosystem
                            </span>
                        </div>
                    </button>

                    {/* ── Desktop Nav ──────────────────────────────────── */}
                    <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center" aria-label="Main navigation">
                        <NavLink label="Chat" onClick={onChatClick} active={currentPage === 'chat'} />
                        <NavLink label="Community" onClick={onCommunityClick} active={currentPage === 'community'} />
                        <NavLink label="Marketplace" onClick={onMarketplaceClick} active={currentPage === 'marketplace'} />
                        <NavLink label="Wallet" onClick={onWalletClick} active={currentPage === 'wallet'} />
                        <NavLink label="Feels" onClick={onFeelsClick} active={currentPage === 'feels'} />
                    </nav>

                    {/* ── Right Actions ─────────────────────────────────── */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <ThemeToggle />

                        {/* Notifications */}
                        {isAuthenticated && onNotificationsClick && (
                            <NotificationBell onSeeAll={onNotificationsClick} />
                        )}

                        {/* Cart */}
                        {isAuthenticated && onCartClick && (
                            <button
                                onClick={onCartClick}
                                className="relative p-2 rounded-xl text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-primary hover:bg-brand-primary/10 transition-all"
                                aria-label="Shopping cart"
                            >
                                <ShoppingCartIcon className="h-5 w-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-brand-primary text-white text-[10px] font-bold rounded-full leading-none animate-scale-in">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Profile / Login */}
                        {isAuthenticated ? (
                            <button
                                onClick={onProfileClick}
                                className="flex items-center gap-2 p-1 rounded-xl hover:bg-brand-primary/10 transition-all"
                                aria-label="Profile"
                            >
                                {currentUser?.avatarUrl ? (
                                    <img
                                        src={currentUser.avatarUrl}
                                        alt={currentUser.fullName || 'Profile'}
                                        className="h-8 w-8 rounded-full object-cover border-2 border-brand-primary/30"
                                    />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-brand-primary/20 flex items-center justify-center border-2 border-brand-primary/30">
                                        <UserIcon className="h-4 w-4 text-brand-primary" />
                                    </div>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="hidden sm:flex items-center px-4 py-1.5 text-sm font-semibold text-brand-primary border border-brand-primary/40 rounded-xl hover:bg-brand-primary/10 transition-all"
                            >
                                Log In
                            </button>
                        )}

                        {/* Start Chat CTA — desktop only */}
                        <button
                            onClick={onChatClick}
                            className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-brand-primary text-white rounded-xl shadow-brand-sm hover:bg-brand-secondary transition-all hover:shadow-brand-md hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Start Chat
                        </button>

                        {/* Admin badge */}
                        {isAdmin && (
                            <button
                                onClick={onAdminClick}
                                className="hidden sm:flex px-3 py-1.5 text-xs font-bold bg-purple-600/90 text-white rounded-xl hover:bg-purple-600 transition-all"
                            >
                                Admin
                            </button>
                        )}

                        {/* Hamburger — secondary items */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(v => !v)}
                                className="p-2 rounded-xl text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-primary hover:bg-brand-primary/10 transition-all"
                                aria-label="More options"
                                aria-expanded={isMenuOpen}
                            >
                                {isMenuOpen
                                    ? <CloseIcon className="h-5 w-5" />
                                    : <MenuIcon className="h-5 w-5" />
                                }
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-52 origin-top-right animate-slide-down">
                                    <div className="glass dark:glass rounded-2xl shadow-card-lg overflow-hidden">
                                        {/* Mobile-only quick links */}
                                        <div className="lg:hidden px-3 pt-3 pb-1.5 space-y-0.5">
                                            <p className="px-2 py-1 text-[10px] font-semibold tracking-widest uppercase text-light-text-muted dark:text-dark-text-muted">Navigate</p>
                                            {[
                                                { label: 'Chat',        fn: () => { close(); onChatClick(); } },
                                                { label: 'Community',   fn: () => { close(); onCommunityClick(); } },
                                                { label: 'Marketplace', fn: () => { close(); onMarketplaceClick(); } },
                                                { label: 'Wallet',      fn: () => { close(); onWalletClick(); } },
                                            ].map(item => (
                                                <button key={item.label} onClick={item.fn}
                                                    className="w-full text-left px-3 py-2 text-sm font-medium rounded-xl text-light-text-primary dark:text-dark-text-primary hover:bg-brand-primary/10 hover:text-brand-primary transition-all"
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Secondary nav */}
                                        <div className="px-3 pt-1.5 pb-1.5 space-y-0.5">
                                            <p className="px-2 py-1 text-[10px] font-semibold tracking-widest uppercase text-light-text-muted dark:text-dark-text-muted">More</p>
                                            {secondaryItems.map(item => (
                                                <button key={item.label} onClick={item.fn}
                                                    className="w-full text-left px-3 py-2 text-sm font-medium rounded-xl text-light-text-primary dark:text-dark-text-primary hover:bg-brand-primary/10 hover:text-brand-primary transition-all"
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Auth actions */}
                                        <div className="px-3 pb-3 pt-1 border-t border-light-border dark:border-dark-border space-y-0.5 mt-1">
                                            {isAdmin && (
                                                <button onClick={() => { close(); onAdminClick(); }}
                                                    className="w-full text-left px-3 py-2 text-sm font-medium rounded-xl text-purple-500 hover:bg-purple-500/10 transition-all"
                                                >
                                                    Admin Dashboard
                                                </button>
                                            )}
                                            {authItems.map(item => (
                                                <button key={item.label} onClick={item.fn}
                                                    className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-xl transition-all
                                                        ${(item as any).danger
                                                            ? 'text-red-500 hover:bg-red-500/10'
                                                            : 'text-brand-primary hover:bg-brand-primary/10'
                                                        }`}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
