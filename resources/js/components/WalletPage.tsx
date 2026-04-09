import React, { useState, useEffect, useRef } from 'react';
import { 
    WalletIcon, 
    CoinIcon, 
    ShieldCheckIcon, 
    UsersIcon, 
    CheckCircleIcon,
    BuildingStorefrontIcon, 
    CalculatorIcon,
    StarIcon,
    TrendingUpIcon,
    ArrowUpCircleIcon,
    PiggyBankIcon,
    GlobeAltIcon,
    ArrowPathIcon,
    LinkIcon,
    CloseIcon,
    ChartBarIcon
} from './icons';
import { dashboardAPI, authAPI, paymentAPI, listingsAPI, investmentAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

// --- CONSTANTS & RATES ---
const SWC_TO_NGN_RATE = 90; // 1 SWC = 90 NGN
const SWC_TO_USD_RATE = 0.06; // Based on 11 SWC = $0.66

interface WalletPageProps {
    isAuthenticated?: boolean;
    currentUser?: any;
}

const agentTiers = {
    bronze: { name: 'Bronze', color: 'text-yellow-600', referrals: 5, benefit: "Activate wallet for withdrawal" },
    silver: { name: 'Silver', color: 'text-gray-400', referrals: 10, points: 250, benefit: '+10% higher ranking in search' },
    gold: { name: 'Gold', color: 'text-yellow-400', referrals: 20, points: 500, benefit: '+20% higher ranking in search' },
    platinum: { name: 'Platinum', color: 'text-cyan-400', referrals: 50, points: 750, benefit: '+40% priority leads & partnership' },
};


// --- SUB-COMPONENTS ---

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
    <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-2.5">
        <div 
            className="bg-gradient-to-r from-brand-secondary to-brand-primary h-2.5 rounded-full" 
            style={{ width: `${value}%` }}
        ></div>
    </div>
);

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="bg-light-card dark:bg-dark-card p-5 sm:p-6 rounded-2xl border border-light-border dark:border-dark-border shadow-sm text-light-text-primary dark:text-dark-text-primary">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary flex-shrink-0">{icon}</div>
            <h4 className="font-bold text-lg">{title}</h4>
        </div>
        {children}
    </div>
);

const WalletActionButton: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    onClick: () => void;
    disabled?: boolean;
}> = ({ icon, label, onClick, disabled }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className="flex flex-col items-center p-3 bg-light-card dark:bg-dark-card rounded-lg hover:bg-light-border dark:hover:bg-dark-border transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {icon}
        <span className="text-xs font-semibold text-light-text-primary dark:text-dark-text-primary">{label}</span>
    </button>
);

const AgentDashboard: React.FC<{ 
    onOpenBadgeModal: () => void; 
    walletData: any; 
    userData: any;
    onDeposit: () => void;
    onWithdraw: () => void;
}> = ({ onOpenBadgeModal, walletData, userData, onDeposit, onWithdraw }) => {
    const { showInfo } = useToast();
    const totalSwcBalance = walletData?.swcBalance || 0;
    const referrals = walletData?.referrals || 0;
    const isDormant = referrals < 2;
    const currentTierName = walletData?.tier || 'bronze';
    const currentTier = agentTiers[currentTierName as keyof typeof agentTiers] || agentTiers.bronze;
    const nextTier = currentTierName === 'bronze' ? agentTiers.silver : 
                     currentTierName === 'silver' ? agentTiers.gold : 
                     currentTierName === 'gold' ? agentTiers.platinum : agentTiers.platinum;
    const progressToNextTier = nextTier ? (referrals / nextTier.referrals) * 100 : 100;
    const referralLink = `sheltrify.com/join/${userData?.email?.split('@')[0] || 'user'}`;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-light-text-primary dark:text-dark-text-primary">
            <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            
            <div className="lg:col-span-2 space-y-6">
                <InfoCard icon={<WalletIcon className="w-8 h-8"/>} title="Agent Wallet">
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="text-4xl font-bold">{totalSwcBalance.toFixed(2)} <span className="text-2xl text-brand-primary">SWC</span></p>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                ≈ ₦{(totalSwcBalance * SWC_TO_NGN_RATE).toLocaleString()} / ${(totalSwcBalance * SWC_TO_USD_RATE).toFixed(2)}
                            </p>
                        </div>
                        <img src={userData?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256'} alt={userData?.fullName || 'User'} className="w-16 h-16 rounded-full object-cover border-4 border-light-card dark:border-dark-card shadow-lg" />
                    </div>
                </InfoCard>

                <InfoCard icon={<TrendingUpIcon className="w-8 h-8"/>} title="Agent Earning Packages">
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">As a verified agent, you have access to exclusive earning packages for your referrals.</p>
                    <ul className="space-y-2 text-sm text-light-text-primary dark:text-dark-text-primary">
                        <li className="flex justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-xl border border-light-border dark:border-dark-border"><span><span className="font-bold">Package 1:</span> Refer Landlord (Property Listed)</span> <span className="font-bold text-green-500">+5 SWC</span></li>
                        <li className="flex justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-xl border border-light-border dark:border-dark-border"><span><span className="font-bold">Package 2:</span> Property Rented Out</span> <span className="font-bold text-green-500">+30 SWC</span></li>
                        <li className="flex justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-xl border border-light-border dark:border-dark-border"><span><span className="font-bold">Package 3:</span> Refer Seeker (Standard Rent)</span> <span className="font-bold text-green-500">+5 SWC</span></li>
                        <li className="flex justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-xl border border-light-border dark:border-dark-border"><span><span className="font-bold">Package 4:</span> Refer Seeker (Premium Plan)</span> <span className="font-bold text-green-500">+15 SWC</span></li>
                    </ul>
                </InfoCard>
                
                 <InfoCard icon={<WalletIcon className="w-8 h-8"/>} title="Wallet Actions">
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">Manage your SWC balance with ease.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <WalletActionButton 
                            icon={<CheckCircleIcon className="w-6 h-6 text-green-500 mb-1"/>}
                            label="Withdraw"
                            disabled={isDormant}
                            onClick={onWithdraw}
                        />
                        <WalletActionButton 
                            icon={<ArrowPathIcon className="w-6 h-6 text-blue-500 mb-1"/>}
                            label="Transfer"
                            onClick={() => showInfo('Transfer feature coming soon!')}
                        />
                        <WalletActionButton 
                            icon={<CoinIcon className="w-6 h-6 text-yellow-500 mb-1"/>}
                            label="Request Cash"
                            onClick={() => showInfo('Request cash feature coming soon!')}
                        />
                        <WalletActionButton 
                            icon={<ArrowUpCircleIcon className="w-6 h-6 text-purple-500 mb-1"/>}
                            label="Deposit"
                            onClick={onDeposit}
                        />
                    </div>
                </InfoCard>
            </div>

            <div className="space-y-6">
                 <InfoCard icon={<StarIcon className="w-8 h-8"/>} title="Badge & Tier">
                     <div className="text-center">
                        <p className={`font-extrabold text-3xl ${currentTier.color}`}>{currentTier.name}</p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Current Badge</p>
                    </div>
                     <div className="mt-4">
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Progress to <span className="font-bold">{nextTier.name}</span>:</p>
                        <ProgressBar value={progressToNextTier} />
                        <p className="text-xs mt-2 text-right text-light-text-secondary dark:text-dark-text-secondary">{referrals} / {nextTier?.referrals || 0} Referrals</p>
                     </div>
                     <button 
                        onClick={onOpenBadgeModal}
                        className="w-full mt-4 text-sm font-semibold bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary py-2 rounded-lg hover:bg-brand-primary/20 dark:hover:bg-brand-primary/30 transition-colors"
                     >
                         View Tier Benefits
                     </button>
                </InfoCard>
            </div>
        </div>
    );
};

const ReferrerDashboard: React.FC<{ 
    onOpenBadgeModal: () => void; 
    walletData: any; 
    userData: any;
    onDeposit: () => void;
    onWithdraw: () => void;
}> = ({ onOpenBadgeModal, walletData, userData, onDeposit, onWithdraw }) => {
    const { showInfo, showSuccess } = useToast();
    const totalSwcBalance = walletData?.swcBalance || 0;
    const referrals = walletData?.referrals || 0;
    const isDormant = referrals < 2;
    const currentTierName = walletData?.tier || 'bronze';
    const currentTier = agentTiers[currentTierName as keyof typeof agentTiers] || agentTiers.bronze;
    const nextTier = currentTierName === 'bronze' ? agentTiers.silver : 
                     currentTierName === 'silver' ? agentTiers.gold : 
                     currentTierName === 'gold' ? agentTiers.platinum : agentTiers.platinum;
    const progressToNextTier = nextTier ? (referrals / nextTier.referrals) * 100 : 100;
    const referralLink = `sheltrify.com/join/${userData?.email?.split('@')[0] || 'user'}`;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-light-text-primary dark:text-dark-text-primary">
            <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            
            <div className="lg:col-span-2 space-y-6">
                <InfoCard icon={<WalletIcon className="w-8 h-8"/>} title="Referrer Wallet">
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="text-4xl font-bold">{totalSwcBalance.toFixed(2)} <span className="text-2xl text-brand-primary">SWC</span></p>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                ≈ ₦{(totalSwcBalance * SWC_TO_NGN_RATE).toLocaleString()} / ${(totalSwcBalance * SWC_TO_USD_RATE).toFixed(2)}
                            </p>
                        </div>
                        <img src={userData?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256'} alt={userData?.fullName || 'User'} className="w-16 h-16 rounded-full object-cover border-4 border-light-card dark:border-dark-card shadow-lg" />
                    </div>
                    {isDormant && (
                        <div className="mt-4 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-semibold p-2 rounded-md border border-yellow-500/20 text-center">
                            Your 11 SWC Sign-Up Bonus is dormant. Refer {Math.max(0, 2 - referrals)} more successful user(s) to activate your entire wallet for withdrawal.
                        </div>
                    )}
                </InfoCard>

                <InfoCard icon={<TrendingUpIcon className="w-8 h-8"/>} title="Referrer Benefits">
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">Earn SWC for every successful referral. The more you refer, the more you earn and the higher your tier becomes!</p>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/> <div><span className="font-bold">Refer a Landlord:</span> Earn SWC when they list a property that gets successfully rented.</div></li>
                        <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/> <div><span className="font-bold">Refer a Seeker:</span> Earn SWC when they successfully sign up and rent through ShelTrify.</div></li>
                        <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/> <div><span className="font-bold">Tier Up:</span> Unlock higher earnings, search ranking boosts, and exclusive partnership opportunities as you move up from Bronze to Platinum.</div></li>
                    </ul>
                </InfoCard>
                
                 <InfoCard icon={<WalletIcon className="w-8 h-8"/>} title="Wallet Actions">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <WalletActionButton 
                            icon={<CheckCircleIcon className="w-6 h-6 text-green-500 mb-1"/>}
                            label="Withdraw"
                            disabled={isDormant}
                            onClick={onWithdraw}
                        />
                        <WalletActionButton 
                            icon={<ArrowPathIcon className="w-6 h-6 text-blue-500 mb-1"/>}
                            label="Transfer"
                            onClick={() => showInfo('Transfer feature coming soon!')}
                        />
                        <WalletActionButton 
                            icon={<ArrowUpCircleIcon className="w-6 h-6 text-purple-500 mb-1"/>}
                            label="Deposit"
                            onClick={onDeposit}
                        />
                    </div>
                </InfoCard>
            </div>

            <div className="space-y-6">
                 <InfoCard icon={<StarIcon className="w-8 h-8"/>} title="Badge & Tier">
                     <div className="text-center">
                        <p className={`font-extrabold text-3xl ${currentTier.color}`}>{currentTier.name}</p>
                     </div>
                     <div className="mt-4">
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Progress to <span className="font-bold">{nextTier?.name || 'Max'}</span>:</p>
                        <ProgressBar value={Math.min(100, progressToNextTier)} />
                        <p className="text-xs mt-2 text-right text-light-text-secondary dark:text-dark-text-secondary">{referrals} / {nextTier?.referrals || 0} Referrals</p>
                     </div>
                      <button 
                        onClick={onOpenBadgeModal}
                        className="w-full mt-4 text-sm font-semibold bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary py-2 rounded-lg hover:bg-brand-primary/20 dark:hover:bg-brand-primary/30 transition-colors"
                     >
                         View Tier Benefits
                     </button>
                </InfoCard>

                 <InfoCard icon={<UsersIcon className="w-8 h-8"/>} title="How to Refer">
                     <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">Share your unique link to earn bonuses.</p>
                     <div className="flex items-center gap-2">
                        <input type="text" readOnly value={referralLink} className="w-full text-sm bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md px-3 py-2 focus:outline-none"/>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(referralLink);
                                showSuccess('Referral link copied to clipboard!');
                            }}
                            className="p-2 bg-light-card dark:bg-dark-card rounded-md hover:bg-light-border dark:hover:bg-dark-border"
                        >
                            <LinkIcon className="w-5 h-5"/>
                        </button>
                     </div>
                </InfoCard>
            </div>
        </div>
    );
};

const LandlordDashboard: React.FC<{ 
    walletData: any; 
    userData: any; 
    stats: any;
    onBoostListing: () => void;
}> = ({ walletData, userData, stats, onBoostListing }) => {
    const swcBalance = walletData?.swcBalance || 0;
    const credibilityScore = walletData?.credibilityScore || 0;
    const hasActiveListings = stats?.activeListings > 0;
    
    return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        <div className="lg:col-span-2 space-y-6">
            <InfoCard icon={<WalletIcon className="w-8 h-8"/>} title="Landlord Wallet">
                 <div className="flex justify-between items-center">
                    <div>
                        <p className="text-4xl font-bold">{swcBalance.toFixed(2)} <span className="text-2xl text-brand-primary">SWC</span></p>
                        <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">
                            Credibility Score: {credibilityScore} | ≈ ₦{(swcBalance * SWC_TO_NGN_RATE).toLocaleString()} / ${(swcBalance * SWC_TO_USD_RATE).toFixed(2)}
                        </p>
                    </div>
                     <img src={userData?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256'} alt={userData?.fullName || 'User'} className="w-16 h-16 rounded-full object-cover border-4 border-light-card dark:border-dark-card shadow-lg" />
                 </div>
                {hasActiveListings && swcBalance < 30 && (
                     <div className="mt-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-semibold p-2 rounded-md border border-yellow-500/20">
                        Your listing bonus will be activated for withdrawal once your property is successfully rented out.
                    </div>
                )}
            </InfoCard>
             <InfoCard icon={<BuildingStorefrontIcon className="w-8 h-8"/>} title="Landlord Benefits">
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">Leverage the ShelTrify ecosystem to maximize your property's potential and rewards.</p>
                <ul className="space-y-3 text-light-text-primary dark:text-dark-text-primary text-sm">
                    <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/><div><span className="font-semibold">Listing Bonus:</span> Get an instant 30 SWC in your wallet upon your first successful property listing.</div></li>
                    <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/><div><span className="font-semibold">Boost Listings:</span> Use your SWC balance to boost your property's visibility and appear at the top of search results.</div></li>
                    <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/><div><span className="font-semibold">Rental Bonus:</span> Receive an additional 30 SWC when a boosted property is successfully rented out.</div></li>
                    <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/><div><span className="font-semibold">Exclusive Access:</span> Get alerts for property maintenance, invitations to ShelTrify Rental Fairs, and access to our community forum.</div></li>
                </ul>
                <button 
                    onClick={onBoostListing}
                    className="mt-6 bg-brand-secondary text-white font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                    Boost a Listing
                </button>
            </InfoCard>
        </div>
         <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-2xl border border-light-border dark:border-dark-border text-center text-light-text-primary dark:text-dark-text-primary">
            <img src={userData?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256'} alt={userData?.fullName || 'User'} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-light-card dark:border-dark-card shadow-lg" />
            <h3 className="text-xl font-bold mt-3">{userData?.fullName || 'User'}</h3>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Verified Landlord</p>
        </div>
    </div>
);
};

const TenantDashboard: React.FC<{ walletData: any; userData: any }> = ({ walletData, userData }) => {
    const totalRent = 300000; // This would come from user's rental agreement
    const savings = 0; // Placeholder - would need savings model
    const progress = savings > 0 ? (savings / totalRent) * 100 : 0;
    const weeklySwcProfit = 0; // Placeholder
    const totalSwcProfit = walletData?.swcBalance || 0;
    const rentDueDate = new Date(new Date().setMonth(new Date().getMonth() + 3)); // Placeholder
    const daysLeft = Math.ceil((rentDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 space-y-6">
                 <InfoCard icon={<PiggyBankIcon className="w-8 h-8"/>} title="Save for Rent">
                     <div className="p-4 bg-light-card dark:bg-dark-card rounded-lg border border-light-border dark:border-dark-border">
                        <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">Your Savings</p>
                        <p className="text-3xl font-bold">₦{savings.toLocaleString()}</p>
                        <ProgressBar value={progress}/>
                        <p className="text-xs text-right mt-1 text-light-text-secondary dark:text-dark-text-secondary">of ₦{totalRent.toLocaleString()} goal</p>
                     </div>
                     <div className="flex gap-4 mt-4">
                        <button className="w-full bg-brand-primary text-white font-semibold py-3 rounded-lg hover:bg-brand-secondary">Save Weekly</button>
                        <button className="w-full bg-brand-secondary text-white font-semibold py-3 rounded-lg hover:opacity-90">Save Monthly</button>
                     </div>
                 </InfoCard>

                 <InfoCard icon={<TrendingUpIcon className="w-8 h-8"/>} title="Benefits of Saving with ShelTrify">
                     <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">Your savings do more than just sit in an account. We put them to work for you.</p>
                     <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/><div><span className="font-semibold">Earn While You Save:</span> Your savings are used in trusted trades, and the profits are credited to your wallet as SWC.</div></li>
                        <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/><div><span className="font-semibold">Reduce Rent Burden:</span> The SWC you earn is converted to cash and added to your savings one month before rent is due, lowering your out-of-pocket expense.</div></li>
                        <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/><div><span className="font-semibold">Peace of Mind:</span> Avoid the stress and harassment that can come with rent deadlines. We help you stay ahead.</div></li>
                     </ul>
                 </InfoCard>

                 <InfoCard icon={<CoinIcon className="w-8 h-8"/>} title="Trading Profits">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">This Week's Profit</p>
                            <p className="text-2xl font-bold text-green-500">+{weeklySwcProfit.toFixed(2)} SWC</p>
                        </div>
                        <div>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">Total Profit</p>
                            <p className="text-2xl font-bold">{totalSwcProfit.toFixed(2)} SWC</p>
                        </div>
                    </div>
                     <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-3">This will be converted to cash one month before your rent is due ({daysLeft} days).</p>
                 </InfoCard>
            </div>
             <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border text-center">
                <img src={userData?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256'} alt={userData?.fullName || 'User'} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-light-card dark:border-dark-card shadow-lg" />
                <h3 className="text-xl font-bold mt-3">{userData?.fullName || 'User'}</h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Verified Tenant</p>
            </div>
        </div>
    );
};

const InvestmentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    opportunity: any;
    walletBalance: number;
    onSuccess: () => void;
}> = ({ isOpen, onClose, opportunity, walletBalance, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const { showError, showSuccess } = useToast();

    useEffect(() => {
        if (isOpen && opportunity) {
            setAmount(opportunity.minInvestment.toString());
        }
    }, [isOpen, opportunity]);

    if (!isOpen || !opportunity) return null;

    const handleInvest = async () => {
        const investAmount = parseFloat(amount);
        if (!amount || investAmount <= 0) {
            showError('Please enter a valid amount');
            return;
        }
        if (investAmount < opportunity.minInvestment) {
            showError(`Minimum investment is ₦${opportunity.minInvestment.toLocaleString()}`);
            return;
        }
        if (opportunity.maxInvestment && investAmount > opportunity.maxInvestment) {
            showError(`Maximum investment is ₦${opportunity.maxInvestment.toLocaleString()}`);
            return;
        }

        const swcRequired = investAmount / SWC_TO_NGN_RATE;
        if (walletBalance < swcRequired) {
            showError(`Insufficient balance. You need ${swcRequired.toFixed(2)} SWC (₦${investAmount.toLocaleString()}) to invest`);
            return;
        }

        try {
            setLoading(true);
            const response = await investmentAPI.invest(opportunity.id, investAmount);
            if (response.success) {
                showSuccess(`Successfully invested ₦${investAmount.toLocaleString()}!`);
                onSuccess();
                onClose();
            } else {
                showError(response.message || 'Failed to create investment');
            }
        } catch (error: any) {
            showError(error.message || 'Failed to create investment');
        } finally {
            setLoading(false);
        }
    };

    const swcRequired = parseFloat(amount) / SWC_TO_NGN_RATE || 0;
    const canInvest = parseFloat(amount) >= opportunity.minInvestment && walletBalance >= swcRequired;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-md p-6">
                <button onClick={onClose} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                    <CloseIcon className="w-6 h-6" />
            </button>
                <h2 className="text-2xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Invest in {opportunity.title}</h2>
                <div className="space-y-4">
                    <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-border dark:border-dark-border">
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Investment Details</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-light-text-secondary dark:text-dark-text-secondary">Type:</span>
                                <span className="font-semibold">{opportunity.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-light-text-secondary dark:text-dark-text-secondary">Expected ROI:</span>
                                <span className="font-semibold text-green-500">{opportunity.expectedROI}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-light-text-secondary dark:text-dark-text-secondary">Duration:</span>
                                <span className="font-semibold">{opportunity.duration}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-light-text-secondary dark:text-dark-text-secondary">Min Investment:</span>
                                <span className="font-semibold">₦{opportunity.minInvestment.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Investment Amount (NGN)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min={opportunity.minInvestment}
                            max={opportunity.maxInvestment || undefined}
                            step="1000"
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        />
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                            Required: {swcRequired.toFixed(2)} SWC | Available: {walletBalance.toFixed(2)} SWC
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleInvest}
                            disabled={!canInvest || loading}
                            className="flex-1 bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-secondary disabled:bg-brand-secondary/50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Processing...' : 'Confirm Investment'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InvestorDashboard: React.FC<{ 
    walletData: any; 
    userData: any; 
    stats: any;
    onDeposit: () => void;
    onWithdraw: () => void;
    onInvest: (opportunity: any) => void;
}> = ({ walletData, userData, stats, onDeposit, onWithdraw, onInvest }) => {
    const [investmentStats, setInvestmentStats] = useState<any>(null);
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showError } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsRes, oppsRes] = await Promise.all([
                investmentAPI.getStats(),
                investmentAPI.getOpportunities()
            ]);
            
            if (statsRes.success) {
                setInvestmentStats(statsRes.data);
            }
            if (oppsRes.success) {
                setOpportunities(oppsRes.data);
            }
        } catch (error: any) {
            console.error('Failed to load investment data:', error);
            showError('Failed to load investment data');
        } finally {
            setLoading(false);
        }
    };

    const totalSavingsBalance = walletData?.swcBalance || 0;
    const totalInvestmentCapital = investmentStats?.totalInvestmentCapital || 0;
    const totalProfitGenerated = investmentStats?.totalProfitGenerated || 0;
    const monthlyRentalReturns = investmentStats?.monthlyRentalReturns || 0;
    const activePropertiesInvestedIn = investmentStats?.activePropertiesInvestedIn || 0;
    const projectedAnnualROI = investmentStats?.projectedAnnualROI || 0;
    const nextPayoutDate = new Date(new Date().setDate(new Date().getDate() + 15));
    
    // Monthly profit summaries (mock for now - would need actual monthly data)
    const monthlyProfits = [
        { month: 'Jan 2024', profit: 95000, roi: 1.9 },
        { month: 'Feb 2024', profit: 110000, roi: 2.2 },
        { month: 'Mar 2024', profit: 105000, roi: 2.1 },
        { month: 'Apr 2024', profit: 120000, roi: 2.4 },
        { month: 'May 2024', profit: 115000, roi: 2.3 },
        { month: 'Jun 2024', profit: 125000, roi: 2.5 },
    ];
    
    const daysUntilPayout = Math.ceil((nextPayoutDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoCard icon={<PiggyBankIcon className="w-8 h-8"/>} title="Total Savings Balance">
                        <div>
                            <p className="text-3xl font-bold text-brand-primary">{totalSavingsBalance.toFixed(2)} <span className="text-xl">SWC</span></p>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                ≈ ₦{(totalSavingsBalance * SWC_TO_NGN_RATE).toLocaleString()} / ${(totalSavingsBalance * SWC_TO_USD_RATE).toFixed(2)}
                            </p>
        </div>
     </InfoCard>
                    
                    <InfoCard icon={<TrendingUpIcon className="w-8 h-8"/>} title="Total Investment Capital">
                        <div>
                            <p className="text-3xl font-bold">₦{totalInvestmentCapital.toLocaleString()}</p>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                Active investments
                            </p>
                        </div>
                    </InfoCard>
                    
                    <InfoCard icon={<CoinIcon className="w-8 h-8"/>} title="Total Profit Generated">
                        <div>
                            <p className="text-3xl font-bold text-green-500">₦{totalProfitGenerated.toLocaleString()}</p>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                All-time returns
                            </p>
                        </div>
                    </InfoCard>
                    
                    <InfoCard icon={<BuildingStorefrontIcon className="w-8 h-8"/>} title="Monthly Rental Returns">
                        <div>
                            <p className="text-3xl font-bold text-brand-primary">₦{monthlyRentalReturns.toLocaleString()}</p>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                Average monthly income
                            </p>
                        </div>
                    </InfoCard>
                </div>
                
                {/* Investment Overview */}
                <InfoCard icon={<GlobeAltIcon className="w-8 h-8"/>} title="Investment Overview">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-border dark:border-dark-border">
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Active Properties</p>
                            <p className="text-2xl font-bold">{activePropertiesInvestedIn}</p>
                        </div>
                        <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-border dark:border-dark-border">
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Projected Annual ROI</p>
                            <p className="text-2xl font-bold text-green-500">{projectedAnnualROI}%</p>
                        </div>
                        <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-border dark:border-dark-border col-span-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Next Payout Date</p>
                                    <p className="text-xl font-bold">{nextPayoutDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Days Remaining</p>
                                    <p className="text-xl font-bold text-brand-primary">{daysUntilPayout} days</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </InfoCard>
                
                {/* Monthly Profit Summaries */}
                <InfoCard icon={<ChartBarIcon className="w-8 h-8"/>} title="Monthly Profit Summaries">
                    <div className="space-y-3">
                        {monthlyProfits.map((month, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border">
                                <div>
                                    <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{month.month}</p>
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">ROI: {month.roi}%</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-500">₦{month.profit.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </InfoCard>
                
                {/* New Investment Opportunities */}
                <InfoCard icon={<TrendingUpIcon className="w-8 h-8"/>} title="New Investment Opportunities">
                    {loading ? (
                        <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">Loading opportunities...</div>
                    ) : opportunities.length === 0 ? (
                        <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">No investment opportunities available at the moment.</div>
                    ) : (
                        <div className="space-y-4">
                            {opportunities.map(opportunity => (
                            <div key={opportunity.id} className="p-4 bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="font-bold text-light-text-primary dark:text-dark-text-primary">{opportunity.title}</h4>
                                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{opportunity.type}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                        opportunity.status === 'Open' 
                                            ? 'bg-green-500/20 text-green-500' 
                                            : 'bg-yellow-500/20 text-yellow-500'
                                    }`}>
                                        {opportunity.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                                    <div>
                                        <p className="text-light-text-secondary dark:text-dark-text-secondary">Min Investment</p>
                                        <p className="font-semibold">₦{opportunity.minInvestment.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-light-text-secondary dark:text-dark-text-secondary">Expected ROI</p>
                                        <p className="font-semibold text-green-500">{opportunity.expectedROI}%</p>
                                    </div>
                                    <div>
                                        <p className="text-light-text-secondary dark:text-dark-text-secondary">Duration</p>
                                        <p className="font-semibold">{opportunity.duration}</p>
                                    </div>
                                </div>
                                {opportunity.status === 'Open' && (
                                    <button 
                                        onClick={() => onInvest(opportunity)}
                                        className="mt-3 w-full bg-brand-primary text-white font-semibold py-2 rounded-lg hover:bg-brand-secondary transition-colors"
                                    >
                                        Invest Now
                                    </button>
                                )}
                            </div>
                            ))}
                        </div>
                    )}
                </InfoCard>
                
                {/* Wallet Actions */}
                <InfoCard icon={<WalletIcon className="w-8 h-8"/>} title="Wallet Actions">
                    <div className="grid grid-cols-2 gap-3">
                        <WalletActionButton 
                            icon={<ArrowUpCircleIcon className="w-6 h-6 text-green-500 mb-1"/>}
                            label="Deposit"
                            onClick={onDeposit}
                        />
                        <WalletActionButton 
                            icon={<ArrowPathIcon className="w-6 h-6 text-blue-500 mb-1"/>}
                            label="Withdraw"
                            onClick={onWithdraw}
                        />
                    </div>
                </InfoCard>
            </div>
            
            {/* Sidebar - Profile & Info */}
            <div className="space-y-6">
                {/* Individual Profile */}
                <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-2xl border border-light-border dark:border-dark-border text-center text-light-text-primary dark:text-dark-text-primary">
                    <img
                        src={userData?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256'}
                        alt={userData?.fullName || 'Investor'}
                        className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-light-card dark:border-dark-card shadow-lg"
                    />
                    <h3 className="text-xl font-bold mt-3">{userData?.fullName || 'Investor'}</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Verified Investor</p>
                    {userData?.isPremium && (
                        <span className="inline-block mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-semibold rounded-full">
                            Premium Member
                        </span>
                    )}
                </div>
                
                {/* Investment Benefits */}
                <InfoCard icon={<CheckCircleIcon className="w-8 h-8"/>} title="Investment Benefits">
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-3">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/>
                            <div>
                                <span className="font-semibold">Property Acquisition & Resale:</span> Strategic investments in undervalued properties with high resale potential.
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/>
                            <div>
                                <span className="font-semibold">Land Trading:</span> High-potential land acquisitions in prime locations.
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/>
                            <div>
                                <span className="font-semibold">Monthly Returns:</span> Regular rental income from invested properties.
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"/>
                            <div>
                                <span className="font-semibold">Transparent Reporting:</span> Detailed monthly profit summaries and ROI tracking.
                            </div>
                        </li>
                    </ul>
                </InfoCard>
                
                {/* Performance Summary */}
                <InfoCard icon={<TrendingUpIcon className="w-8 h-8"/>} title="Performance Summary">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total ROI</span>
                            <span className="font-bold text-green-500">{((totalProfitGenerated / totalInvestmentCapital) * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Avg Monthly Return</span>
                            <span className="font-bold">₦{monthlyRentalReturns.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Properties</span>
                            <span className="font-bold">{activePropertiesInvestedIn}</span>
                        </div>
                    </div>
                </InfoCard>
            </div>
        </div>
    );
};

const SWCCalculator: React.FC = () => {
    const [swc, setSwc] = useState(11);
    const rates = {
        NGN: swc * SWC_TO_NGN_RATE,
        USD: swc * SWC_TO_USD_RATE,
        EUR: (swc * SWC_TO_USD_RATE) * 0.92,
        GBP: (swc * SWC_TO_USD_RATE) * 0.79,
    };

    return (
        <section className="my-16">
            <InfoCard icon={<CalculatorIcon className="w-8 h-8"/>} title="SWC Converter">
                 <div className="grid md:grid-cols-2 gap-8 items-center mt-4">
                    <div>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                value={swc}
                                onChange={(e) => setSwc(parseFloat(e.target.value) || 0)}
                                className="w-full text-2xl font-bold bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            />
                            <span className="text-xl font-bold text-brand-primary">SWC</span>
                        </div>
                    </div>
                     <div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-light-card dark:bg-dark-card p-3 rounded-md border border-light-border dark:border-dark-border">
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">NGN (₦)</p>
                                <p className="font-semibold">{rates.NGN.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                             <div className="bg-light-card dark:bg-dark-card p-3 rounded-md border border-light-border dark:border-dark-border">
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">USD ($)</p>
                                <p className="font-semibold">{rates.USD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-light-card dark:bg-dark-card p-3 rounded-md border border-light-border dark:border-dark-border">
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">EUR (€)</p>
                                <p className="font-semibold">{rates.EUR.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-light-card dark:bg-dark-card p-3 rounded-md border border-light-border dark:border-dark-border">
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">GBP (£)</p>
                                <p className="font-semibold">{rates.GBP.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </InfoCard>
        </section>
    );
};

// Payment Modals
const DepositModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const { showError, showSuccess } = useToast();

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            showError('Please enter a valid amount');
            return;
        }

        try {
            setLoading(true);
            const response = await paymentAPI.initialize(parseFloat(amount), { type: 'wallet_deposit' });
            if (response.success && response.data.authorizationUrl) {
                showSuccess('Redirecting to payment gateway...');
                window.location.href = response.data.authorizationUrl;
            } else {
                showError('Failed to initialize payment');
            }
        } catch (error: any) {
            showError(error.message || 'Failed to initialize payment');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-md p-6">
                <button onClick={onClose} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-light-text-primary">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Deposit Funds</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Amount (NGN)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        />
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">1 NGN = 1 SWC</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDeposit}
                            disabled={loading || !amount}
                            className="flex-1 bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-secondary disabled:bg-brand-secondary/50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WithdrawModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void; walletBalance: number }> = ({ isOpen, onClose, onSuccess, walletBalance }) => {
    const [amount, setAmount] = useState('');
    const [bankCode, setBankCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [banks, setBanks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const { showError, showSuccess, showInfo } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadBanks();
        }
    }, [isOpen]);

    const loadBanks = async () => {
        try {
            setLoadingBanks(true);
            const response = await paymentAPI.getBanks();
            if (response.success) {
                setBanks(response.data || []);
            }
        } catch (error) {
            console.error('Failed to load banks:', error);
        } finally {
            setLoadingBanks(false);
        }
    };

    const handleWithdraw = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            showError('Please enter a valid amount');
            return;
        }

        if (parseFloat(amount) > walletBalance) {
            showError('Insufficient balance');
            return;
        }

        if (!bankCode || !accountNumber || !accountName) {
            showError('Please fill all bank details');
            return;
        }

        try {
            setLoading(true);
            const response = await paymentAPI.withdraw({
                amount: parseFloat(amount),
                bankCode,
                accountNumber,
                accountName
            });

            if (response.success) {
                showSuccess(`Withdrawal request submitted successfully! ₦${(parseFloat(amount) * 90).toLocaleString()} will be transferred to your account after processing.`);
                onSuccess();
                onClose();
            } else {
                showError(response.message || 'Withdrawal failed');
            }
        } catch (error: any) {
            showError(error.message || 'Withdrawal failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Withdraw Funds</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Amount (SWC)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            max={walletBalance}
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        />
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                            Available: {walletBalance.toFixed(2)} SWC (≈ ₦{(walletBalance * 90).toLocaleString()})
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Bank</label>
                        {loadingBanks ? (
                            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Loading banks...</div>
                        ) : (
                            <select
                                value={bankCode}
                                onChange={(e) => setBankCode(e.target.value)}
                                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            >
                                <option value="">Select Bank</option>
                                {banks.map(bank => (
                                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Account Number</label>
                        <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="Enter account number"
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Account Name</label>
                        <input
                            type="text"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="Enter account name"
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleWithdraw}
                            disabled={loading || !amount || !bankCode || !accountNumber || !accountName}
                            className="flex-1 bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-secondary disabled:bg-brand-secondary/50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : 'Withdraw'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Boost Listing Modal
const BoostListingModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSuccess: () => void;
    walletBalance: number;
    userId: string;
}> = ({ isOpen, onClose, onSuccess, walletBalance, userId }) => {
    const [listings, setListings] = useState<any[]>([]);
    const [selectedListingId, setSelectedListingId] = useState('');
    const [duration, setDuration] = useState(30);
    const [loading, setLoading] = useState(false);
    const [loadingListings, setLoadingListings] = useState(false);
    const BOOST_COST = 10; // 10 SWC per boost
    const { showError, showSuccess } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadListings();
        }
    }, [isOpen, userId]);

    const loadListings = async () => {
        try {
            setLoadingListings(true);
            const response = await listingsAPI.getMyListings();
            if (response.success) {
                // Filter only active listings
                const activeListings = (response.data || []).filter((l: any) => l.isActive);
                setListings(activeListings);
            }
        } catch (error) {
            console.error('Failed to load listings:', error);
        } finally {
            setLoadingListings(false);
        }
    };

    const handleBoost = async () => {
        if (!selectedListingId) {
            showError('Please select a listing to boost');
            return;
        }

        if (walletBalance < BOOST_COST) {
            showError(`Insufficient SWC balance. You need ${BOOST_COST} SWC to boost a listing.`);
            return;
        }

        try {
            setLoading(true);
            const response = await listingsAPI.boost(selectedListingId, duration);
            if (response.success) {
                showSuccess(`Listing boosted successfully for ${duration} days!`);
                onSuccess();
                onClose();
            } else {
                showError(response.message || 'Failed to boost listing');
            }
        } catch (error: any) {
            showError(error.message || 'Failed to boost listing');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Boost a Listing</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Select Listing</label>
                        {loadingListings ? (
                            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Loading listings...</div>
                        ) : listings.length === 0 ? (
                            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                                No active listings found. Create a listing first.
                            </div>
                        ) : (
                            <select
                                value={selectedListingId}
                                onChange={(e) => setSelectedListingId(e.target.value)}
                                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            >
                                <option value="">Select a listing</option>
                                {listings.map(listing => (
                                    <option key={listing.id} value={listing.id}>
                                        {listing.title} - {listing.location} {listing.isBoosted ? '(Already Boosted)' : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Duration (days)</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                            min={1}
                            max={90}
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        />
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">Boost duration: 1-90 days (default: 30 days)</p>
                    </div>
                    <div className="p-4 bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Boost Cost:</span>
                            <span className="font-bold text-brand-primary">{BOOST_COST} SWC</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Your Balance:</span>
                            <span className={`font-semibold ${walletBalance >= BOOST_COST ? 'text-green-500' : 'text-red-500'}`}>
                                {walletBalance.toFixed(2)} SWC
                            </span>
                        </div>
                        {walletBalance < BOOST_COST && (
                            <p className="text-xs text-red-500 mt-2">Insufficient balance. Please deposit more SWC.</p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleBoost}
                            disabled={loading || !selectedListingId || walletBalance < BOOST_COST || listings.length === 0}
                            className="flex-1 bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-secondary disabled:bg-brand-secondary/50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Boosting...' : `Boost for ${duration} days`}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BadgeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const tiers = [
        {
            name: "Bronze",
            color: "border-yellow-600/50",
            iconColor: "text-yellow-600",
            requirements: ["2+ successful referrals"],
            benefits: ["Activate your full wallet, including your sign-up bonus, making it available for withdrawal."]
        },
        {
            name: "Silver",
            color: "border-gray-400/50",
            iconColor: "text-gray-400",
            requirements: ["10+ referrals", "250 Credibility Score"],
            benefits: [
                "Your profile/listings get a 10% higher ranking in search results, increasing your visibility.",
                "Receive a special Silver badge on your profile to build trust with users."
            ]
        },
        {
            name: "Gold",
            color: "border-yellow-400/50",
            iconColor: "text-yellow-400",
            requirements: ["20+ referrals", "500 Credibility Score"],
            benefits: [
                "Enjoy a 20% higher search ranking, putting you ahead of the competition.",
                "Gain priority access to property leads and inquiries from seekers.",
                "Unlock access to advanced wallet features and analytics."
            ]
        },
        {
            name: "Platinum",
            color: "border-cyan-400/50",
            iconColor: "text-cyan-400",
            requirements: ["50+ referrals", "750 Credibility Score"],
            benefits: [
                "Achieve top-tier, 40% priority placement in all search results.",
                "Unlock exclusive Partnership Opportunities with the ShelTrify team.",
                "Receive an elite Platinum badge, signifying you as a top-tier trusted partner on the platform."
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in-fast">
            <style>{`.animate-fade-in-fast { animation: fadeIn 0.3s ease-out; }`}</style>
            <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] p-6 md:p-8 text-light-text-primary dark:text-dark-text-primary flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold">Tier Benefits & Migration</h2>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">Understand your growth path and the rewards for your contributions.</p>
                </div>
                <div className="overflow-y-auto pr-4 -mr-4">
                    <div className="relative flex flex-col gap-4">
                        {tiers.map((tier, index) => (
                             <React.Fragment key={tier.name}>
                                <div className={`bg-light-bg dark:bg-dark-bg border-l-4 ${tier.color} p-5 rounded-lg text-light-text-primary dark:text-dark-text-primary`}>
                                    <div className="flex items-center gap-3">
                                        <StarIcon className={`w-8 h-8 ${tier.iconColor}`} />
                                        <h3 className={`text-2xl font-bold ${tier.iconColor}`}>{tier.name} Tier</h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Requirements to Reach</h4>
                                            <ul className="space-y-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                                {tier.requirements.map(req => <li key={req}>• {req}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                             <h4 className="font-semibold mb-2">Benefits Unlocked</h4>
                                            <ul className="space-y-2 text-sm">
                                                {tier.benefits.map(ben => (
                                                    <li key={ben} className="flex items-start gap-2">
                                                        <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                        <span>{ben}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                {index < tiers.length - 1 && (
                                     <div className="h-8 flex justify-center items-center">
                                        <div className="w-px h-full bg-light-border dark:bg-dark-border"></div>
                                        <ArrowUpCircleIcon className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary absolute bg-light-card dark:bg-dark-card" />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export const WalletPage: React.FC<WalletPageProps> = ({ isAuthenticated, currentUser }) => {
    const [activeTab, setActiveTab] = useState<'agent' | 'referrer' | 'landlord' | 'tenant' | 'investor'>('agent');
    const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
    const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
    const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
    const [walletData, setWalletData] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!isAuthenticated || !currentUser) {
            setLoading(false);
            return;
        }

        const loadWalletData = async () => {
            try {
                setLoading(true);
                console.log('Loading wallet data for user:', currentUser?.id);
                const response = await dashboardAPI.getStats();
                console.log('Dashboard API response:', response);
                if (response.success) {
                    console.log('Wallet stats:', response.data.stats);
                    console.log('SWC Balance:', response.data.stats.swcBalance || response.data.stats.walletBalance);
                    setWalletData(response.data.stats);
                    setStats(response.data.stats);
                    
                    // Set active tab based on user role
                    const roleMap: Record<string, 'agent' | 'referrer' | 'landlord' | 'tenant' | 'investor'> = {
                        'AGENT': 'agent',
                        'REFERRER': 'referrer',
                        'LANDLORD': 'landlord',
                        'SEEKER': 'tenant',
                        'TENANT': 'tenant',
                        'INVESTOR': 'investor'
                    };
                    const defaultTab = roleMap[currentUser.role] || 'agent';
                    setActiveTab(defaultTab);
                } else {
                    console.error('Failed to load wallet data:', response.message);
                    setError(response.message || 'Failed to load wallet data');
                }
            } catch (err: any) {
                console.error('Error loading wallet data:', err);
                setError(err.message || 'Failed to load wallet data');
            } finally {
                setLoading(false);
            }
        };

        loadWalletData();

        // Listen for wallet update events (from payment verification)
        const handleWalletUpdate = () => {
            console.log('Wallet update event received, reloading data...');
            loadWalletData();
        };

        // Reload wallet data when page becomes visible (e.g., after payment redirect)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadWalletData();
            }
        };

        // Check if we're coming from payment verification
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('reference') || urlParams.get('trxref')) {
            // Small delay to ensure payment verification completed
            setTimeout(() => {
                loadWalletData();
            }, 2000);
        }

        window.addEventListener('walletUpdated', handleWalletUpdate);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', loadWalletData);

        return () => {
            window.removeEventListener('walletUpdated', handleWalletUpdate);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', loadWalletData);
        };
    }, [isAuthenticated, currentUser]);
    
    // Get tabs based on user role
    const getTabs = () => {
        const allTabs = [
            { id: 'agent', label: 'Agent', roles: ['AGENT'] },
            { id: 'referrer', label: 'Referrer', roles: ['REFERRER'] },
            { id: 'landlord', label: 'Landlord', roles: ['LANDLORD'] },
            { id: 'tenant', label: 'Tenant', roles: ['SEEKER', 'TENANT'] },
            { id: 'investor', label: 'Investor', roles: ['INVESTOR'] },
        ];
        
        if (!currentUser) return allTabs;
        
        return allTabs.map(tab => ({
            ...tab,
            isActive: tab.roles.includes(currentUser.role),
            disabled: !tab.roles.includes(currentUser.role)
        }));
    };
    
    const tabs = getTabs();
    
    const renderDashboard = () => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                    <div className="lg:col-span-2 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-light-card dark:bg-dark-card rounded-2xl border border-light-border dark:border-dark-border p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-light-border dark:bg-dark-border" />
                                    <div className="h-5 w-32 rounded-lg bg-light-border dark:bg-dark-border" />
                                </div>
                                <div className="space-y-3">
                                    <div className="h-10 w-48 rounded-lg bg-light-border dark:bg-dark-border" />
                                    <div className="h-4 w-64 rounded bg-light-border dark:bg-dark-border" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <div className="bg-light-card dark:bg-dark-card rounded-2xl border border-light-border dark:border-dark-border p-6 h-48" />
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-16 px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                        <CloseIcon className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-base font-semibold text-red-500 mb-2">Failed to load wallet</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{error}</p>
                </div>
            );
        }

        if (!isAuthenticated || !currentUser) {
            return (
                <div className="text-center py-16 px-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-primary/10 mb-5">
                        <WalletIcon className="w-10 h-10 text-brand-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Sign in to view your wallet</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary max-w-sm mx-auto">
                        Access your SWC balance, earnings, savings, and rewards by signing in.
                    </p>
                </div>
            );
        }
        
        switch (activeTab) {
            case 'agent': return <AgentDashboard 
                onOpenBadgeModal={() => setIsBadgeModalOpen(true)} 
                walletData={walletData} 
                userData={currentUser}
                onDeposit={() => setIsDepositModalOpen(true)}
                onWithdraw={() => setIsWithdrawModalOpen(true)}
            />;
            case 'referrer': return <ReferrerDashboard 
                onOpenBadgeModal={() => setIsBadgeModalOpen(true)} 
                walletData={walletData} 
                userData={currentUser}
                onDeposit={() => setIsDepositModalOpen(true)}
                onWithdraw={() => setIsWithdrawModalOpen(true)}
            />;
            case 'landlord': return <LandlordDashboard 
                walletData={walletData} 
                userData={currentUser} 
                stats={stats}
                onBoostListing={() => setIsBoostModalOpen(true)}
            />;
            case 'tenant': return <TenantDashboard walletData={walletData} userData={currentUser} />;
            case 'investor': return <InvestorDashboard 
                walletData={walletData} 
                userData={currentUser} 
                stats={stats}
                onDeposit={() => setIsDepositModalOpen(true)}
                onWithdraw={() => setIsWithdrawModalOpen(true)}
                onInvest={(opportunity) => {
                    setSelectedOpportunity(opportunity);
                    setIsInvestmentModalOpen(true);
                }}
            />;
            default: return null;
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>
            {/* Hero Header */}
            <div className="relative mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-primary via-brand-secondary to-purple-600 p-6 sm:p-8 shadow-brand-md">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12)_0%,_transparent_60%)] pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <span className="inline-block px-2.5 py-1 mb-2 text-[10px] font-bold tracking-widest uppercase bg-white/15 text-white/90 rounded-full border border-white/20">
                            SWC Ecosystem
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">ShelTrify Wallet</h1>
                        <p className="mt-1 text-sm sm:text-base text-white/75 max-w-sm">Your hub for earnings, savings, and rewards.</p>
                    </div>
                    {walletData && (
                        <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-4 text-right flex-shrink-0">
                            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Balance</p>
                            <p className="text-3xl font-extrabold text-white leading-none mt-0.5">
                                {(walletData.swcBalance || 0).toFixed(2)}
                                <span className="text-lg font-bold text-white/70 ml-1">SWC</span>
                            </p>
                            <p className="text-xs text-white/60 mt-1">
                                ≈ ₦{((walletData.swcBalance || 0) * SWC_TO_NGN_RATE).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Pill Tabs */}
            <div className="mb-8">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {tabs.map(tab => {
                        const isDisabled = (tab as any).disabled || false;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { if (!isDisabled) setActiveTab(tab.id as any); }}
                                disabled={isDisabled}
                                title={isDisabled ? `Available for ${(tab as any).roles?.join(', ')} only` : ''}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${
                                    isActive
                                        ? 'bg-brand-primary text-white shadow-brand-sm'
                                        : isDisabled
                                        ? 'bg-light-border dark:bg-dark-border text-light-text-secondary/40 dark:text-dark-text-secondary/40 cursor-not-allowed'
                                        : 'bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary hover:border-brand-primary/40 cursor-pointer'
                                }`}
                            >
                                {tab.label}{isDisabled && ' 🔒'}
                            </button>
                        );
                    })}
                </div>
            </div>

            {renderDashboard()}

            <SWCCalculator />

            {isBadgeModalOpen && <BadgeModal onClose={() => setIsBadgeModalOpen(false)} />}
            {isDepositModalOpen && (
                <DepositModal 
                    isOpen={isDepositModalOpen} 
                    onClose={() => setIsDepositModalOpen(false)}
                    onSuccess={() => {
                        // Reload wallet data
                        if (currentUser) {
                            dashboardAPI.getStats().then(response => {
                                if (response.success) {
                                    setWalletData(response.data.stats);
                                    setStats(response.data.stats);
                                }
                            });
                        }
                    }}
                />
            )}
            {isWithdrawModalOpen && (
                <WithdrawModal 
                    isOpen={isWithdrawModalOpen} 
                    onClose={() => setIsWithdrawModalOpen(false)}
                    walletBalance={walletData?.swcBalance || 0}
                    onSuccess={() => {
                        // Reload wallet data
                        if (currentUser) {
                            dashboardAPI.getStats().then(response => {
                                if (response.success) {
                                    setWalletData(response.data.stats);
                                    setStats(response.data.stats);
                                }
                            });
                        }
                    }}
                />
            )}
            {isBoostModalOpen && currentUser && (
                <BoostListingModal 
                    isOpen={isBoostModalOpen} 
                    onClose={() => setIsBoostModalOpen(false)}
                    walletBalance={walletData?.swcBalance || 0}
                    userId={currentUser.id}
                    onSuccess={() => {
                        // Reload wallet data
                        if (currentUser) {
                            dashboardAPI.getStats().then(response => {
                                if (response.success) {
                                    setWalletData(response.data.stats);
                                    setStats(response.data.stats);
                                }
                            });
                        }
                    }}
                />
            )}
            {isInvestmentModalOpen && selectedOpportunity && (
                <InvestmentModal
                    isOpen={isInvestmentModalOpen}
                    onClose={() => {
                        setIsInvestmentModalOpen(false);
                        setSelectedOpportunity(null);
                    }}
                    opportunity={selectedOpportunity}
                    walletBalance={walletData?.swcBalance || 0}
                    onSuccess={() => {
                        // Reload wallet data
                        if (currentUser) {
                            dashboardAPI.getStats().then(response => {
                                if (response.success) {
                                    setWalletData(response.data.stats);
                                    setStats(response.data.stats);
                                }
                            });
                        }
                    }}
                />
            )}
        </div>
    );
};

export default WalletPage;