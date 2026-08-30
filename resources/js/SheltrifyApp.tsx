import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { router, usePage } from '@inertiajs/react';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthModal, ProfileModal } from './components/AuthModal';
import ChatPage from './components/ChatPage';
// VideoAssistant disabled — Live API requires direct WebSocket; re-enable when a server-side proxy is available
// import VideoAssistant from './components/VideoAssistant';
import CommunityPage from './components/CommunityPage';
import WalletPage from './components/WalletPage';
import MarketplacePage from './components/MarketplacePage';
import ArtisansPage from './components/ArtisansPage';
import FeelsPage from './components/FeelsPage';
import RentalWahalaPage from './components/RentalWahalaPage';
import AdminDashboard from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import NotificationsPage from './components/NotificationsPage';
import ProductDetailPage from './components/ProductDetailPage';
import ListingDashboardPage from './components/ListingDashboardPage';
import ProfessionalProfilePage from './components/ProfessionalProfilePage';
import PaymentVerifyPage from './components/PaymentVerifyPage';
import CartPage from './components/CartPage';
import GlobalTalesPage from './components/GlobalTalesPage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import PremiumPage from './components/PremiumPage';
import ProfilePage from './components/ProfilePage';
import BottomNav from './components/BottomNav';
import { Property } from './types';
import { authAPI } from './services/api';
import { ToastProvider } from './contexts/ToastContext';
import { digitalPurchasesAllowed } from './platform';

const FAVORITES_STORAGE_KEY = 'sheltrify_favorites';

// --- Theme Context ---

type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark'; // Default theme
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
// --- End Theme Context ---

export type Page = 'landing' | 'chat' | 'community' | 'wallet' | 'marketplace' | 'artisans' | 'productDetail' | 'feels' | 'rentalWahala' | 'paymentVerify' | 'cart' | 'globalTales' | 'about' | 'contact' | 'premium' | 'adminDashboard' | 'userDashboard' | 'profile' | 'listingDashboard' | 'professionalProfile' | 'notifications';

type ShellPageProps = {
  view: Page;
  auth: { user: any };
  cartCount: number;
};

const URL_BY_PAGE: Record<Page, string> = {
  landing: '/',
  chat: '/chat',
  community: '/community',
  wallet: '/wallet',
  marketplace: '/marketplace',
  artisans: '/artisans',
  feels: '/feels',
  rentalWahala: '/rental-wahala',
  paymentVerify: '/payments/verify',
  cart: '/cart',
  globalTales: '/global-tales',
  about: '/about',
  contact: '/contact',
  premium: '/premium',
  adminDashboard: '/admin-dashboard',
  userDashboard: '/user-dashboard',
  profile: '/profile',
  listingDashboard: '/listing-dashboard',
  professionalProfile: '/professional-profile',
  notifications: '/notifications',
  productDetail: '/product',
};

const HASH_TO_PATH: Record<string, string> = {
  landing: '/',
  chat: '/chat',
  community: '/community',
  wallet: '/wallet',
  marketplace: '/marketplace',
  artisans: '/artisans',
  feels: '/feels',
  rentalWahala: '/rental-wahala',
  paymentVerify: '/payments/verify',
  cart: '/cart',
  globalTales: '/global-tales',
  about: '/about',
  contact: '/contact',
  premium: '/premium',
  adminDashboard: '/admin-dashboard',
  userDashboard: '/user-dashboard',
  profile: '/profile',
  listingDashboard: '/listing-dashboard',
  professionalProfile: '/professional-profile',
  notifications: '/notifications',
  productDetail: '/product',
};

const AppContent: React.FC = () => {
  const { view, auth, cartCount } = usePage<ShellPageProps>().props;

  const currentPage = view;
  const currentUser = auth.user;
  const isAuthenticated = !!currentUser;
  const isPremium = !!(
    currentUser?.isPremium &&
    (!currentUser.premiumExpiryDate ||
      new Date(currentUser.premiumExpiryDate) > new Date())
  );

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isVideoAssistantOpen, setIsVideoAssistantOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(() => {
    // Inertia navigation re-mounts components, so persist the selected product
    // across the /marketplace → /product navigation via sessionStorage.
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('sheltrify:selectedProduct');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [intendedPage, setIntendedPage] = useState<Page | null>(null);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const h = window.location.hash.replace(/^#/, '');
    if (!h) return;
    const path = HASH_TO_PATH[h];
    if (path) {
      router.visit(path, { replace: true });
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
    }
  }, []);

  useEffect(() => {
    if (view === 'adminDashboard' && auth.user && auth.user.role !== 'ADMIN') {
      router.visit('/user-dashboard', { replace: true });
    }
  }, [view, auth.user]);

  useEffect(() => {
    const uid = auth.user?.id;
    if (!uid) return;
    (async () => {
      try {
        const { favoritesAPI } = await import('./services/api');
        const response = await favoritesAPI.getAll();
        if (response.success) {
          setFavorites(response.data);
        }
      } catch {
        /* guest or network */
      }
    })();
  }, [auth.user?.id]);

  useEffect(() => {
    const onAuthLogout = async () => {
      showToast('Your session has expired. Please log in again.');
      await authAPI.logout();
      setFavorites([]);
      router.visit('/');
    };
    window.addEventListener('auth:logout', onAuthLogout as EventListener);
    return () =>
      window.removeEventListener('auth:logout', onAuthLogout as EventListener);
  }, []);

  // Load favorites from localStorage on initial render
  useEffect(() => {
    try {
        const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
    } catch (error) {
        console.error("Failed to parse favorites from localStorage", error);
    }
  }, []);

  const toggleFavorite = (property: Property) => {
    setFavorites(prevFavorites => {
        const isFavorited = prevFavorites.some(fav => fav.id === property.id);
        let updatedFavorites;
        if (isFavorited) {
            updatedFavorites = prevFavorites.filter(fav => fav.id !== property.id);
            showToast('🗑️ Property removed from favorites.');
        } else {
            updatedFavorites = [...prevFavorites, property];
            const saveMessage = isPremium
                ? '✅ Property saved! You will receive alerts on this property.'
                : '✅ Property saved! Upgrade to Premium to get price drop alerts.';
            showToast(saveMessage);
        }
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
        return updatedFavorites;
    });
  };
  
  const handleViewPropertyDetails = (property: Property) => {
      navigateTo('chat');
      // This will be picked up by ChatPage to send a programmatic message
      // A small timeout ensures the page transition happens first.
      setTimeout(() => {
        const event = new CustomEvent('viewPropertyDetails', { detail: property });
        window.dispatchEvent(event);
      }, 100);
      setIsProfileModalOpen(false);
  };

  const navigateTo = (page: Page) => {
    const go = (p: Page) => {
      router.visit(URL_BY_PAGE[p], { preserveScroll: false });
      window.scrollTo(0, 0);
    };

    if (
      page === 'chat' ||
      page === 'community' ||
      page === 'wallet' ||
      page === 'marketplace' ||
      page === 'feels' ||
      page === 'rentalWahala' ||
      page === 'cart' ||
      page === 'globalTales'
    ) {
      if (isAuthenticated || page === 'globalTales') {
        go(page);
      } else {
        setIntendedPage(page);
        setIsAuthModalOpen(true);
      }
    } else if (page === 'about' || page === 'contact' || page === 'premium') {
      go(page);
    } else if (page === 'adminDashboard' || page === 'userDashboard') {
      if (isAuthenticated) {
        if (page === 'adminDashboard' && currentUser?.role !== 'ADMIN') {
          go('userDashboard');
        } else {
          go(page);
        }
      } else {
        setIntendedPage(page);
        setIsAuthModalOpen(true);
      }
    } else if (page === 'profile' || page === 'notifications') {
      if (isAuthenticated) {
        go(page);
      } else {
        setIntendedPage(page);
        setIsAuthModalOpen(true);
      }
    } else if (page === 'productDetail') {
      // Anyone can view a product; auth gate is on the "I'm Interested" action.
      go(page);
    } else if (page === 'paymentVerify') {
      router.visit(URL_BY_PAGE[page], { preserveScroll: false });
      window.scrollTo(0, 0);
    } else if (page === 'landing') {
      router.visit('/', { preserveScroll: false });
      window.scrollTo(0, 0);
    } else {
      router.visit('/', { preserveScroll: false });
      window.scrollTo(0, 0);
    }
  };

  const refreshCart = () => {
    router.reload({ only: ['cartCount'] });
  };

  const handleLoginSuccess = async (_user: any) => {
    setIsAuthModalOpen(false);
    const dest = intendedPage;
    setIntendedPage(null);
    const path = dest ? URL_BY_PAGE[dest] : '/chat';
    // Reload the page to get fresh auth state from server
    window.location.href = path;
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setFavorites([]);
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('chatHistory_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
    router.visit('/');
  };

  const handlePremiumUpgrade = async () => {
    // Premium is digital content. Google Play requires Play Billing for it, so
    // the SWC-debiting upgrade is not offered in the Play build.
    if (!digitalPurchasesAllowed()) {
      showToast('Premium upgrades aren\'t available in the Android app.');
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      setIntendedPage('premium');
      setIsAuthModalOpen(true);
      showToast('Please log in to upgrade to premium.');
      return;
    }

    try {
      const { userAPI } = await import('./services/api');
      const response = await userAPI.upgradePremium();
      
      if (response.success) {
        showToast('🚀 Premium upgrade successful! Your premium access is now active for 1 month.');
        router.reload({ only: ['auth'] });
      } else {
        showToast(response.message || 'Failed to upgrade to premium. Please try again.');
      }
    } catch (error: any) {
      console.error('Premium upgrade error:', error);
      
      // Check if it's an insufficient balance error
      if (error.response?.data?.code === 'INSUFFICIENT_BALANCE' || error.message?.includes('Insufficient wallet balance')) {
        const errorData = error.response?.data || {};
        const shortage = errorData.shortage || 2000;
        showToast(`💰 Insufficient wallet balance. Please fund your wallet with ₦${shortage.toLocaleString()} or more to upgrade.`);
        // Navigate to wallet page after a short delay
        setTimeout(() => {
          navigateTo('wallet');
        }, 2000);
      } else {
        showToast(error.response?.data?.message || error.message || 'Failed to upgrade to premium. Please try again.');
      }
    }
  };

  const isModalOpen = isAuthModalOpen || isVideoAssistantOpen || isProfileModalOpen;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-light-bg dark:bg-dark-bg">
      {isModalOpen && <div className="fixed inset-0 bg-black/60 z-40" />}
      <div className={isModalOpen ? 'blur-sm pointer-events-none' : ''}>
        <Header
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          isAdmin={currentUser?.role === 'ADMIN'}
          cartCount={cartCount}
          currentPage={currentPage}
          onLogoClick={() => navigateTo('landing')}
          onChatClick={() => navigateTo('chat')}
          onCommunityClick={() => navigateTo('community')}
          onWalletClick={() => navigateTo('wallet')}
          onMarketplaceClick={() => navigateTo('marketplace')}
          onArtisansClick={() => navigateTo('artisans')}
          onFeelsClick={() => navigateTo('feels')}
          onRentalWahalaClick={() => navigateTo('rentalWahala')}
          onGlobalTalesClick={() => navigateTo('globalTales')}
          onAboutClick={() => navigateTo('about')}
          onContactClick={() => navigateTo('contact')}
          onPremiumClick={() => navigateTo('premium')}
          onProfileClick={() => {
            if (isAuthenticated) {
              navigateTo('profile');
            } else {
              setIsProfileModalOpen(true);
            }
          }}
          onDashboardClick={() => navigateTo('userDashboard')}
          onNotificationsClick={() => navigateTo('notifications')}
          onAdminClick={() => navigateTo('adminDashboard')}
          onCartClick={() => navigateTo('cart')}
          onLoginClick={() => {
            setIsAuthModalOpen(true);
            sessionStorage.setItem('authModalTab', 'login');
          }}
          onSignupClick={() => {
            setIsAuthModalOpen(true);
            sessionStorage.setItem('authModalTab', 'signup');
          }}
          onLogoutClick={() => void handleLogout()}
        />
        <main className="flex-grow max-w-screen-xl mx-auto px-4 sm:px-6 py-6 md:py-10 overflow-x-hidden w-full pb-nav page-enter">
          {currentPage === 'landing' && <LandingPage onStartChatting={() => navigateTo('chat')} onTalkToAnna={() => setIsVideoAssistantOpen(true)} onPremiumUpgrade={handlePremiumUpgrade} />}
          {currentPage === 'chat' && (
            <ChatPage 
              isPremium={isPremium}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onPremiumUpgrade={handlePremiumUpgrade}
              toastMessage={toastMessage}
              onNavigateHome={() => navigateTo('landing')}
              currentUser={currentUser}
            />
          )}
          {currentPage === 'community' && <CommunityPage currentUser={currentUser} />}
          {currentPage === 'wallet' && (
            <WalletPage 
              isAuthenticated={isAuthenticated}
              currentUser={currentUser}
            />
          )}
          {currentPage === 'artisans' && (
            <ArtisansPage
              isAuthenticated={isAuthenticated}
              onJoinAsArtisan={() => {
                if (!isAuthenticated) {
                  setIntendedPage('artisans');
                  setIsAuthModalOpen(true);
                  showToast('Create an account to join the verified network.');
                  return;
                }
                navigateTo('professionalProfile');
              }}
            />
          )}
          {currentPage === 'marketplace' && (
            <MarketplacePage
              onCartUpdate={refreshCart}
              isAuthenticated={isAuthenticated}
              onViewProduct={(p) => {
                setSelectedProduct(p);
                try { sessionStorage.setItem('sheltrify:selectedProduct', JSON.stringify(p)); } catch { /* ignore */ }
                navigateTo('productDetail');
              }}
            />
          )}
          {currentPage === 'productDetail' && (
            <ProductDetailPage
              product={selectedProduct}
              isAuthenticated={isAuthenticated}
              onBack={() => {
                try { sessionStorage.removeItem('sheltrify:selectedProduct'); } catch { /* ignore */ }
                setSelectedProduct(null);
                navigateTo('marketplace');
              }}
            />
          )}
          {currentPage === 'cart' && <CartPage currentUser={currentUser} onCartUpdate={refreshCart} />}
          {currentPage === 'feels' && (
            <FeelsPage 
              isAuthenticated={isAuthenticated}
              isAdmin={currentUser?.role === 'ADMIN'}
              currentUser={currentUser}
            />
          )}
          {currentPage === 'rentalWahala' && (
            <RentalWahalaPage 
              isAuthenticated={isAuthenticated}
              isAdmin={currentUser?.role === 'ADMIN'}
              currentUser={currentUser}
            />
          )}
          {currentPage === 'globalTales' && (
            <GlobalTalesPage
              isAuthenticated={isAuthenticated}
              currentUser={currentUser}
            />
          )}
          {currentPage === 'about' && (
            <AboutPage onClose={() => navigateTo('landing')} />
          )}
          {currentPage === 'contact' && (
            <ContactPage onClose={() => navigateTo('landing')} />
          )}
          {currentPage === 'premium' && (
            <PremiumPage 
              onClose={() => navigateTo('landing')} 
              onPremiumUpgrade={handlePremiumUpgrade}
            />
          )}
          {currentPage === 'adminDashboard' && isAuthenticated && currentUser?.role === 'ADMIN' && (
            <AdminDashboard onClose={() => navigateTo('landing')} />
          )}
          {currentPage === 'userDashboard' && isAuthenticated && currentUser && (
            <UserDashboard
              onClose={() => navigateTo('landing')}
              user={currentUser}
            />
          )}
          {currentPage === 'notifications' && isAuthenticated && (
            <NotificationsPage onClose={() => navigateTo('landing')} />
          )}
          {currentPage === 'profile' && isAuthenticated && currentUser && (
            <ProfilePage 
              onClose={() => navigateTo('landing')} 
              currentUser={currentUser}
              onUserUpdate={() => {
                router.reload({ only: ['auth'] });
              }}
            />
          )}
          {currentPage === 'listingDashboard' && isAuthenticated && currentUser && (
            <ListingDashboardPage currentUser={currentUser} />
          )}
          {currentPage === 'professionalProfile' && isAuthenticated && currentUser && (
            <ProfessionalProfilePage currentUser={currentUser} />
          )}
          {currentPage === 'paymentVerify' && <PaymentVerifyPage />}
        </main>
        <Footer page={currentPage} />
      </div>

      {/* Mobile bottom navigation — outside blur wrapper so it stays interactive */}
      <BottomNav
        currentPage={currentPage}
        isAuthenticated={isAuthenticated}
        cartCount={cartCount}
        onNavigate={navigateTo}
        onLoginClick={() => {
          setIsAuthModalOpen(true);
          sessionStorage.setItem('authModalTab', 'login');
        }}
      />

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => {
            setIsAuthModalOpen(false);
            setIntendedPage(null);
          }} 
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {isProfileModalOpen && (
        <ProfileModal 
          onClose={() => setIsProfileModalOpen(false)}
          favorites={favorites}
          onRemoveFavorite={toggleFavorite}
          onViewDetails={handleViewPropertyDetails}
        />
      )}
      {/* VideoAssistant disabled — re-enable when server-side Live API proxy is ready */}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;