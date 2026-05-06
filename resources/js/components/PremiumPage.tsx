import React, { useState } from 'react';
import { LogoIcon, CloseIcon, StarIcon, ShieldCheckIcon, TrendingUpIcon, UsersIcon, CreditCardIcon, ArrowPathIcon, CheckCircleIcon, ChevronLeftIcon } from './icons';
import { userAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface PremiumPageProps {
  onClose?: () => void;
  onPremiumUpgrade?: () => void;
}

const PremiumPage: React.FC<PremiumPageProps> = ({ onClose, onPremiumUpgrade }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Transfer'>('Card');
  const [isPaying, setIsPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const features = [
    {
      icon: <TrendingUpIcon className="w-6 h-6" />,
      title: 'Priority Property Alerts',
      description: 'Be the first to know about new listings that match your preferences. Get instant notifications before properties go public.'
    },
    {
      icon: <StarIcon className="w-6 h-6" />,
      title: 'Advanced Search Filters',
      description: 'Access exclusive filters including price history, neighborhood insights, and property analytics to make informed decisions.'
    },
    {
      icon: <UsersIcon className="w-6 h-6" />,
      title: 'Direct Landlord Contact',
      description: 'Skip the wait and contact landlords directly. Get verified contact information for faster communication.'
    },
    {
      icon: <ShieldCheckIcon className="w-6 h-6" />,
      title: 'Property Price Drop Notifications',
      description: 'Get alerts when properties you\'re interested in reduce their prices. Never miss a great deal.'
    },
    {
      icon: <StarIcon className="w-6 h-6" />,
      title: 'Exclusive Listings Access',
      description: 'Access premium-only listings that aren\'t available to free users. Find hidden gems in the market.'
    },
    {
      icon: <TrendingUpIcon className="w-6 h-6" />,
      title: 'Dedicated Support',
      description: 'Get priority customer support with faster response times and dedicated assistance for your property search.'
    }
  ];

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-sm border-b border-light-border dark:border-dark-border lg:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-6 w-6 text-brand-primary" />
            <h1 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">Premium Service</h1>
          </div>
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

      {/* Content */}
      <div className="container mx-auto px-4 py-6 md:py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <div className="hidden lg:flex items-center justify-center gap-4 mb-6">
            <LogoIcon className="h-16 w-16 text-brand-primary" />
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-light-text-primary dark:text-dark-text-primary">
                ✨ Premium Service
              </h1>
              <p className="text-lg md:text-xl text-light-text-secondary dark:text-dark-text-secondary mt-2">
                Unlock the ultimate rental advantage
              </p>
            </div>
          </div>

          {/* Mobile Hero */}
          <div className="lg:hidden mb-6">
            <LogoIcon className="h-12 w-12 text-brand-primary mx-auto mb-3" />
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
              ✨ Premium Service
            </h1>
            <p className="text-base text-light-text-secondary dark:text-dark-text-secondary">
              Unlock the ultimate rental advantage
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-brand-primary mb-3 md:mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2 md:mb-3">
                {feature.title}
              </h3>
              <p className="text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Pricing Section */}
        <div className="bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 dark:from-brand-primary/20 dark:to-brand-secondary/20 border border-brand-primary/20 rounded-lg p-6 md:p-8 mb-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
              Simple, Transparent Pricing
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-brand-primary mb-2">
                  ₦5,000
                </div>
                <div className="text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary">
                  for 10 months
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-6 md:p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
            Ready to Upgrade?
          </h2>
          <p className="text-base md:text-lg text-light-text-secondary dark:text-dark-text-secondary mb-6 md:mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who have found their perfect home faster with Premium. Upgrade now for just ₦5,000 for 10 months!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-6 md:px-8 py-3 md:py-4 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors font-semibold text-base md:text-lg"
            >
              Upgrade to Premium
            </button>
            <button
              onClick={onClose}
              className="px-6 md:px-8 py-3 md:py-4 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border transition-colors font-semibold text-base md:text-lg"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 md:mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 md:p-6">
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-2 text-base md:text-lg">
                Can I cancel anytime?
              </h3>
              <p className="text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary">
                Yes, you can cancel your Premium subscription at any time. Your access will continue until the end of your billing period.
              </p>
            </div>
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 md:p-6">
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-2 text-base md:text-lg">
                Is there a free trial?
              </h3>
              <p className="text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary">
                Premium is ₦5,000 for 10 months. Pay once and enjoy full access for the entire period.
              </p>
            </div>
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 md:p-6">
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-2 text-base md:text-lg">
                What payment methods do you accept?
              </h3>
              <p className="text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary">
                We accept all major credit/debit cards, bank transfers, and payments through the ShelTrify Wallet.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-md p-8 text-light-text-primary dark:text-dark-text-primary">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
              <CloseIcon className="w-6 h-6"/>
            </button>
            
            {isPaid ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
                <h3 className="text-xl font-bold mt-4">Payment Successful!</h3>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">Your premium access is now active for 10 months.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <StarIcon className="w-12 h-12 mx-auto text-yellow-400 p-2 bg-yellow-400/10 rounded-full" />
                  <h2 className="text-2xl font-bold mt-3">Upgrade to Premium</h2>
                  <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">Get priority access and exclusive features.</p>
                </div>
                
                <div className="mb-6 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold">₦5,000<span className="text-base font-medium text-light-text-secondary dark:text-dark-text-secondary">/10 months</span></p>
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">One-time payment for 10 months access.</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => setPaymentMethod('Card')} className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-md transition-colors ${paymentMethod === 'Card' ? 'bg-brand-primary text-white' : 'bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary'}`}>
                      <CreditCardIcon className="w-4 h-4" /> Card
                    </button>
                    <button onClick={() => setPaymentMethod('Transfer')} className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-md transition-colors ${paymentMethod === 'Transfer' ? 'bg-brand-primary text-white' : 'bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary'}`}>
                      <ArrowPathIcon className="w-4 h-4" /> Transfer
                    </button>
                  </div>
                </div>

                {paymentMethod === 'Card' && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsPaying(true);
                    setError(null);
                    try {
                      const response = await userAPI.upgradePremium();
                      if (response.success) {
                        setIsPaid(true);
                        showSuccess('Premium upgrade successful!');
                        setTimeout(() => {
                          setShowPaymentModal(false);
                          if (onPremiumUpgrade) onPremiumUpgrade();
                        }, 2000);
                      } else {
                        throw new Error(response.message || 'Payment failed');
                      }
                    } catch (err: any) {
                      setError(err.message || 'Failed to process payment');
                      setIsPaying(false);
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Card Number</label>
                      <input type="text" placeholder="0000 0000 0000 0000" required className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Card Holder Name</label>
                      <input type="text" placeholder="John Doe" required className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Expiry Date</label>
                        <input type="text" placeholder="MM/YY" required className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">CVV</label>
                        <input type="text" placeholder="123" required className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                      </div>
                    </div>
                    {error && (
                      <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isPaying}
                      className="w-full mt-6 bg-brand-primary text-white rounded-lg py-3 font-bold hover:bg-brand-secondary transition-all flex items-center justify-center disabled:bg-brand-secondary"
                    >
                      {isPaying ? 'Processing...' : `Pay ₦5,000 Now`}
                    </button>
                  </form>
                )}

                {paymentMethod === 'Transfer' && (
                  <div>
                    <div className="p-4 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg space-y-2 text-sm mb-4">
                      <p className="font-semibold">Bank Transfer Details</p>
                      <div className="flex justify-between"><span>Bank:</span> <strong>UBA</strong></div>
                      <div className="flex justify-between"><span>Account Number:</span> <strong>1030211527</strong></div>
                      <div className="flex justify-between"><span>Account Name:</span> <strong>SHELTRIFY COMPANY LIMITED</strong></div>
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary pt-2">Please use your email as payment reference. Your account will be upgraded upon confirmation.</p>
                    </div>
                    {error && (
                      <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm mb-4">
                        {error}
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        setIsPaying(true);
                        setError(null);
                        try {
                          const response = await userAPI.upgradePremium();
                          if (response.success) {
                            setIsPaid(true);
                            showSuccess('Premium upgrade successful!');
                            setTimeout(() => {
                              setShowPaymentModal(false);
                              if (onPremiumUpgrade) onPremiumUpgrade();
                            }, 2000);
                          } else {
                            throw new Error(response.message || 'Payment failed');
                          }
                        } catch (err: any) {
                          setError(err.message || 'Failed to process payment');
                          setIsPaying(false);
                        }
                      }}
                      disabled={isPaying}
                      className="w-full bg-brand-primary text-white rounded-lg py-3 font-bold hover:bg-brand-secondary transition-all flex items-center justify-center disabled:bg-brand-secondary"
                    >
                      {isPaying ? 'Processing...' : 'Confirm Payment'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumPage;

