import React, { useState, useEffect } from 'react';
import { XIcon, FacebookIcon, LinkedInIcon, YouTubeIcon, CloseIcon } from './icons';
import type { Page } from '../SheltrifyApp';
import { subscribeAPI } from '../services/api';

// Modal Component for displaying link information
const InfoModal: React.FC<{ title: string; content: string; onClose: () => void }> = ({ title, content, onClose }) => {
    // Add effect to handle Escape key press to close modal
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose} // Close on overlay click
        >
            <div
                className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-lg p-6 md:p-8 text-light-text-primary dark:text-dark-text-primary"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary"
                    aria-label="Close"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 id="modal-title" className="text-xl font-bold text-brand-primary mb-4">{title}</h2>
                <div className="text-light-text-secondary dark:text-dark-text-secondary whitespace-pre-wrap max-h-[60vh] overflow-y-auto pr-2">{content}</div>
            </div>
        </div>
    );
};

interface FooterProps {
    page: Page;
}

const Footer: React.FC<FooterProps> = ({ page }) => {
    const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);

    // Newsletter signup. Previously this fired a browser alert() and threw the
    // address away — the email was never stored anywhere.
    const [subEmail, setSubEmail] = useState('');
    const [subState, setSubState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
    const [subMessage, setSubMessage] = useState<string | null>(null);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subEmail.trim()) return;
        setSubState('sending');
        setSubMessage(null);
        try {
            const res: any = await subscribeAPI.subscribe({ email: subEmail.trim() });
            setSubState('done');
            // The API reports an already-subscribed address as a success, and
            // its message says so — surface it rather than overwriting it.
            setSubMessage(res?.message || 'Subscribed. Watch your inbox for new listings.');
            setSubEmail('');
        } catch (err: any) {
            setSubState('error');
            setSubMessage(err?.message || 'Could not subscribe. Please try again.');
        }
    };

    const links = {
        quickLinks: [
            { name: 'About Us', href: '#', description: `ShelTrify is a pioneering real estate technology company dedicated to creating a seamless, intelligent, and secure rental ecosystem. Our mission is to eliminate the friction and uncertainty of finding a home by leveraging advanced AI. We provide users with a personalized AI assistant, verified listings, and a suite of tools that cover every aspect of the rental journey, from discovery to payment.` },
            { name: 'Contact', href: '#', description: `We're here to help! Reach out to our team through the following channels:\n\n- General Support: For questions about listings, bookings, or platform issues, email us at support@sheltrify.com.\n- Partnerships: For business and advertising inquiries, contact our team at partnerships@sheltrify.com.\n- Feedback: Have an idea to improve ShelTrify? We'd love to hear it at feedback@sheltrify.com.` },
            { name: 'Landlord Dashboard', href: '#', description: `Empower your property management with the Landlord Dashboard. This powerful tool allows you to list properties, manage tenant applications, securely collect rent, and access performance analytics. Our AI-driven insights help you price your properties competitively and find reliable tenants faster.` },
            { name: 'Premium Services', href: '#', description: `Unlock the ultimate rental advantage. Our Premium service gives you priority access to the newest listings, personalized support from a dedicated consultant, exclusive discounts on marketplace items, and advanced search filters, ensuring you find your perfect home faster and with ease.` },
        ],
        policies: [
            { name: 'Payment Policy', href: '#', description: `Our payment system is built on security and trust. We use industry-standard encryption to protect your financial data. All transactions are processed through a secure gateway. We accept major credit/debit cards, bank transfers, and payments through the ShelTrify Wallet. Payments for rent are held in escrow and released to the landlord 24 hours after a successful check-in to ensure your satisfaction and security.` },
            { name: 'Terms of Service', href: '#', url: '/terms', description: `By using ShelTrify, you agree to our Terms of Service. This agreement outlines your rights and responsibilities as a user, our role as a platform provider, and the rules governing listings, bookings, and community interactions. We encourage you to read the full terms to understand the legal framework of our services.` },
            { name: 'Privacy Policy', href: '#', url: '/privacy', description: `Your privacy is our priority. Our Privacy Policy explains what personal data we collect, how we use it to improve your experience, and the measures we take to protect it. We are committed to transparency and giving you control over your information. We do not sell your personal data to third parties.` },
            { name: 'Refund Policy', href: '#', description: `We offer a transparent refund policy to protect our users. You may be eligible for a full or partial refund if a property is significantly misrepresented, if a booking is canceled by the landlord, or in other specific circumstances outlined in the policy. All refund requests must be submitted within 24 hours of check-in through our support channel.` },
            { name: 'Legal Agreement', href: '#', description: `This document constitutes a binding legal agreement between you and ShelTrify. It governs your use of the platform and all associated services. It includes our Terms of Service, Privacy Policy, and other guidelines that ensure a safe, fair, and reliable environment for all users.` },
            { name: 'Delete My Account', href: '#', url: '/account-deletion', description: `You can permanently delete your ShelTrify account and personal data at any time.` },
            { name: 'Report Scam', href: '#', description: `Help us keep the community safe. If you encounter a suspicious listing, user, or payment request, please report it immediately. When reporting, include the property link, user's name, and a description of the suspicious activity. Our trust and safety team will investigate promptly and take appropriate action. Your vigilance protects everyone.` },
        ],
    };

    const socialLinks = [
        { name: 'YouTube', icon: <YouTubeIcon />, href: 'https://m.youtube.com/@ShelTrifyAI-j3v', target: '_blank', rel: 'noopener noreferrer' },
        { name: 'Facebook', icon: <FacebookIcon />, href: 'https://web.facebook.com/profile.php?id=61585776505464', target: '_blank', rel: 'noopener noreferrer' },
        { name: 'LinkedIn', icon: <LinkedInIcon />, href: 'https://www.linkedin.com/company/sheltrify-ai/', target: '_blank', rel: 'noopener noreferrer' },
        { name: 'X', icon: <XIcon />, href: 'https://x.com/sheltrifyai', target: '_blank', rel: 'noopener noreferrer' },
    ];

  return (
    <>
      <footer className="bg-light-card dark:bg-dark-surface border-t border-light-border dark:border-dark-border mt-16 md:mb-0 mb-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 md:py-12">

          {/* Newsletter — landing only */}
          {page === 'landing' && (
            <div className="mb-10 p-5 md:p-6 rounded-2xl bg-brand-primary/6 border border-brand-primary/15">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">Stay in the loop</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-0.5">Get the latest listings and platform updates.</p>
                </div>
                <div className="w-full sm:w-auto">
                  <form onSubmit={handleSubscribe} className="flex gap-2 w-full sm:w-auto">
                    <input
                      type="email"
                      required
                      value={subEmail}
                      onChange={e => { setSubEmail(e.target.value); setSubState('idle'); }}
                      placeholder="your@email.com"
                      className="input-base flex-1 sm:w-56 text-sm py-2.5"
                    />
                    <button
                      type="submit"
                      disabled={subState === 'sending'}
                      className="btn-primary text-sm py-2.5 px-5 rounded-xl flex-shrink-0 disabled:opacity-60"
                    >
                      {subState === 'sending' ? 'Subscribing…' : 'Subscribe'}
                    </button>
                  </form>
                  {subMessage && (
                    <p className={`text-xs mt-2 ${subState === 'error' ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                      {subMessage}
                    </p>
                  )}
                  <p className="text-xs text-light-text-muted dark:text-dark-text-muted mt-2">
                    Or email us at{' '}
                    <a href="mailto:support@sheltrify.com" className="text-brand-primary hover:underline">
                      support@sheltrify.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main footer grid */}
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-8">
            {/* Brand */}
            <div className="flex-shrink-0 max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-1.31-1.31V5.25a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v2.406L12 3.53l-8.72 8.69a.75.75 0 001.06 1.06l.75-.75V19.5a.75.75 0 00.75.75H9a.75.75 0 00.75-.75v-4.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V19.5a.75.75 0 00.75.75h4.125a.75.75 0 00.75-.75V12l.75.75a.75.75 0 001.06-1.06L12 3.84z" />
                  </svg>
                </div>
                <span className="font-bold text-light-text-primary dark:text-dark-text-primary">ShelTrify</span>
              </div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                Nigeria's first AI-powered real estate super-ecosystem — from finding a home to investing, all in one platform.
              </p>
            </div>

            {/* Links */}
            {page !== 'chat' && (
              <div className="grid grid-cols-2 gap-x-10 sm:gap-x-16 gap-y-6">
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-light-text-muted dark:text-dark-text-muted mb-3">Company</p>
                  <ul className="space-y-2">
                    {links.quickLinks.map(link => (
                      <li key={link.name}>
                        <button
                          onClick={() => setModalContent({ title: link.name, content: link.description })}
                          className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary transition-colors text-left"
                        >
                          {link.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-light-text-muted dark:text-dark-text-muted mb-3">Legal</p>
                  <ul className="space-y-2">
                    {links.policies.map(link => (
                      <li key={link.name}>
                        {'url' in link && link.url ? (
                          // Server-rendered Blade pages, so a real navigation
                          // rather than an Inertia visit.
                          <a
                            href={link.url}
                            className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary transition-colors text-left"
                          >
                            {link.name}
                          </a>
                        ) : (
                          <button
                            onClick={() => setModalContent({ title: link.name, content: link.description })}
                            className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary transition-colors text-left"
                          >
                            {link.name}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-light-border dark:border-dark-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-light-text-muted dark:text-dark-text-muted">
              &copy; {new Date().getFullYear()} ShelTrify AI Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map(link => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.target}
                  rel={link.rel}
                  className="text-light-text-muted dark:text-dark-text-muted hover:text-brand-primary transition-colors"
                  aria-label={link.name}
                >
                  {React.cloneElement(link.icon, { className: 'w-5 h-5' })}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {modalContent && (
        <InfoModal
          title={modalContent.title}
          content={modalContent.content}
          onClose={() => setModalContent(null)}
        />
      )}
    </>
  );
};

export default Footer;