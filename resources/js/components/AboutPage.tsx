import React from 'react';
import { LogoIcon, CloseIcon } from './icons';

interface AboutPageProps {
  onClose?: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-sm border-b border-light-border dark:border-dark-border lg:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-6 w-6 text-brand-primary" />
            <h1 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">About Us</h1>
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
      <div className="container mx-auto px-4 py-6 md:py-12 max-w-4xl">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center gap-4 mb-8">
          <LogoIcon className="h-12 w-12 text-brand-primary" />
          <div>
            <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">About ShelTrify</h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">First global one-stop superstore real estate ecosystem</p>
          </div>
        </div>

        {/* Mobile Header Alternative */}
        <div className="lg:hidden mb-6 text-center">
          <LogoIcon className="h-10 w-10 text-brand-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">About ShelTrify</h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">First global one-stop superstore real estate ecosystem</p>
        </div>

        {/* Main Content */}
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-6 md:p-8 shadow-lg">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
                Our Mission
              </h2>
              <p className="text-base md:text-lg text-light-text-secondary dark:text-dark-text-secondary leading-relaxed mb-4">
                ShelTrify is a pioneering real estate technology company dedicated to creating a seamless, intelligent, and secure rental ecosystem. Our mission is to eliminate the friction and uncertainty of finding a home by leveraging advanced AI.
              </p>
              <p className="text-base md:text-lg text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                We provide users with a personalized AI assistant, verified listings, and a suite of tools that cover every aspect of the rental journey, from discovery to payment.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
                What We Offer
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-light-bg dark:bg-dark-bg p-4 md:p-6 rounded-lg border border-light-border dark:border-dark-border">
                  <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    🤖 AI-Powered Search
                  </h3>
                  <p className="text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary">
                    Our intelligent assistant helps you find the perfect property based on your preferences, budget, and lifestyle.
                  </p>
                </div>
                <div className="bg-light-bg dark:bg-dark-bg p-4 md:p-6 rounded-lg border border-light-border dark:border-dark-border">
                  <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    ✅ Verified Listings
                  </h3>
                  <p className="text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary">
                    Every property is verified to ensure authenticity and quality, giving you peace of mind.
                  </p>
                </div>
                <div className="bg-light-bg dark:bg-dark-bg p-4 md:p-6 rounded-lg border border-light-border dark:border-dark-border">
                  <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    💳 Secure Payments
                  </h3>
                  <p className="text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary">
                    Integrated payment system with escrow services to protect both tenants and landlords.
                  </p>
                </div>
                <div className="bg-light-bg dark:bg-dark-bg p-4 md:p-6 rounded-lg border border-light-border dark:border-dark-border">
                  <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    👥 Community Forum
                  </h3>
                  <p className="text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary">
                    Connect with other users, share experiences, and get advice from the community.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
                Our Vision
              </h2>
              <p className="text-base md:text-lg text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                To become the world's most trusted and comprehensive real estate platform, where finding a home is as simple as having a conversation. We envision a future where technology bridges the gap between property seekers and providers, making real estate transactions transparent, efficient, and accessible to everyone.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
                Why Choose ShelTrify?
              </h2>
              <ul className="space-y-3 text-base md:text-lg text-light-text-secondary dark:text-dark-text-secondary">
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>AI-driven property matching that understands your needs</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Comprehensive marketplace for all your home needs</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Secure payment processing with escrow protection</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Active community of real estate enthusiasts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary font-bold mt-1">•</span>
                  <span>Mobile-first design for on-the-go access</span>
                </li>
              </ul>
            </section>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-8 text-center">
          <p className="text-base md:text-lg text-light-text-secondary dark:text-dark-text-secondary mb-4">
            Ready to find your perfect home?
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors font-semibold text-base md:text-lg"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

