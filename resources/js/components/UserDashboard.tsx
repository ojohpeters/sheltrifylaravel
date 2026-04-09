import React, { useState, useEffect } from 'react';
import { CloseIcon, UserIcon, WalletIcon, BuildingStorefrontIcon, ShoppingCartIcon, StarIcon, TrendingUpIcon } from './icons';
import { dashboardAPI } from '../services/api';

interface UserDashboardProps {
    onClose?: () => void;
    user: any;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onClose, user }) => {
    const [stats, setStats] = useState<any>(null);
    const [earnings, setEarnings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'earnings' | 'marketplace'>('overview');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsResponse, earningsResponse] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getEarnings()
            ]);

            if (statsResponse.success) {
                setStats(statsResponse.data);
            }
            if (earningsResponse.success) {
                setEarnings(earningsResponse.data);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) {
            return `₦${(amount / 1000000).toFixed(2)}M`;
        }
        return `₦${amount.toLocaleString()}`;
    };

    const getRoleDisplayName = (role: string) => {
        const roleMap: { [key: string]: string } = {
            'SEEKER': 'Seeker/Tenant',
            'LANDLORD': 'Landlord',
            'AGENT': 'CC/Agent',
            'REFERRER': 'Referrer',
            'TENANT': 'Tenant',
            'INVESTOR': 'Investor',
            'ARTISAN': 'Local Artisan',
            'ADMIN': 'Administrator'
        };
        return roleMap[role] || role;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
                    <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
            {/* Mobile Header */}
            <div className="sticky top-0 z-10 bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-sm border-b border-light-border dark:border-dark-border lg:hidden">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">
                        My Dashboard
                    </h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary"
                            aria-label="Close"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 md:py-12 max-w-6xl">
                {/* Desktop Header */}
                <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-light-border dark:border-dark-border">
                    <h2 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                        My Dashboard
                    </h2>
                    {onClose && (
                        <button 
                            onClick={onClose} 
                            className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary"
                        >
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>

                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-lg p-4 md:p-6 text-light-text-primary dark:text-dark-text-primary">

                {/* Header */}
                <div className="border-b border-light-border dark:border-dark-border p-6">
                    <div className="flex items-center gap-4">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center">
                                <UserIcon className="w-8 h-8 text-brand-primary" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold">{user?.fullName || 'User Dashboard'}</h2>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary">
                                {getRoleDisplayName(user?.role || 'SEEKER')} • {user?.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-light-border dark:border-dark-border">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-3 font-semibold text-sm ${activeTab === 'overview' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('listings')}
                        className={`px-6 py-3 font-semibold text-sm ${activeTab === 'listings' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}
                    >
                        Listings
                    </button>
                    <button
                        onClick={() => setActiveTab('marketplace')}
                        className={`px-6 py-3 font-semibold text-sm ${activeTab === 'marketplace' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}
                    >
                        Marketplace
                    </button>
                    <button
                        onClick={() => setActiveTab('earnings')}
                        className={`px-6 py-3 font-semibold text-sm ${activeTab === 'earnings' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}
                    >
                        Earnings
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'overview' && stats && (
                        <div className="space-y-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-green-500/10 rounded-lg">
                                            <TrendingUpIcon className="w-6 h-6 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Total Earnings</p>
                                            <p className="text-xl font-bold">{formatCurrency(stats.stats.totalEarnings)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-500/10 rounded-lg">
                                            <BuildingStorefrontIcon className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Active Listings</p>
                                            <p className="text-xl font-bold">{stats.stats.activeListings}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-purple-500/10 rounded-lg">
                                            <WalletIcon className="w-6 h-6 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Wallet Balance</p>
                                            <p className="text-xl font-bold">{stats.stats.walletBalance} SWC</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold">{stats.stats.totalSales}</p>
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">Total Sales</p>
                                </div>
                                <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold">{stats.stats.referrals}</p>
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">Referrals</p>
                                </div>
                                <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold">{stats.stats.credibilityScore}</p>
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">Credibility</p>
                                </div>
                                <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold capitalize">{stats.stats.tier}</p>
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">Tier</p>
                                </div>
                            </div>

                            {/* Artisan-specific info */}
                            {user?.role === 'ARTISAN' && stats.user.artisanService && (
                                <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4">
                                    <h3 className="font-bold mb-2">Artisan Profile</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="font-semibold">Service:</span> {stats.user.artisanService}</p>
                                        {stats.user.artisanLocation && (
                                            <p><span className="font-semibold">Location:</span> {stats.user.artisanLocation}</p>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <StarIcon className="w-4 h-4 text-yellow-500" />
                                            <span className="font-semibold">Rating:</span> {stats.user.artisanRating.toFixed(1)}/5.0
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'listings' && stats && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold">Your Property Listings</h3>
                            {stats.listings.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.listings.map((listing: any) => (
                                        <div key={listing.id} className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold">{listing.title}</h4>
                                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{listing.location}</p>
                                                    <p className="text-brand-primary font-semibold mt-1">{listing.price}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs ${listing.isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                                    {listing.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                                    <BuildingStorefrontIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No listings yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'marketplace' && stats && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold">Your Marketplace Products</h3>
                            {stats.marketplaceProducts.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.marketplaceProducts.map((product: any) => (
                                        <div key={product.id} className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold">{product.name}</h4>
                                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary capitalize">{product.category.replace('_', ' ')}</p>
                                                    <p className="text-brand-primary font-semibold mt-1">₦{product.price.toLocaleString()}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs ${product.isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                                    {product.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                                    <ShoppingCartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No marketplace products yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'earnings' && earnings && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold">Earnings History</h3>
                            <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4">
                                <p className="text-2xl font-bold mb-4">Total: {formatCurrency(earnings.totalEarnings)}</p>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                                    Wallet Balance: {earnings.walletBalance} SWC
                                </p>
                            </div>
                            {earnings.earningsHistory.length > 0 ? (
                                <div className="space-y-2">
                                    {earnings.earningsHistory.map((earning: any) => (
                                        <div key={earning.id} className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{earning.description}</p>
                                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                                        {new Date(earning.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <p className="font-bold text-green-500">+{formatCurrency(earning.amount)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                                    <TrendingUpIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No earnings history yet</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
};

