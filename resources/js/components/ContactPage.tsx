import React, { useState } from 'react';
import { LogoIcon, CloseIcon, MailIcon, PhoneIcon, MapIcon } from './icons';

interface ContactPageProps {
  onClose?: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Send email via backend API
      const response = await fetch('https://sheltrify.vercel.app/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitStatus('idle'), 3000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-sm border-b border-light-border dark:border-dark-border lg:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-6 w-6 text-brand-primary" />
            <h1 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">Contact Us</h1>
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
            <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">Contact Us</h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">We're here to help!</p>
          </div>
        </div>

        {/* Mobile Header Alternative */}
        <div className="lg:hidden mb-6 text-center">
          <LogoIcon className="h-10 w-10 text-brand-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">Contact Us</h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">We're here to help!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Contact Information */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4 md:mb-6">
                Get in Touch
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 md:p-3 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg">
                    <MailIcon className="w-5 h-5 md:w-6 md:h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1 text-sm md:text-base">
                      Email
                    </h3>
                    <a
                      href="mailto:support@sheltrify.com"
                      className="text-brand-primary hover:underline break-all text-sm md:text-base"
                    >
                      support@sheltrify.com
                    </a>
                    <p className="text-xs md:text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                      General Support
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 md:p-3 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg">
                    <PhoneIcon className="w-5 h-5 md:w-6 md:h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1 text-sm md:text-base">
                      Phone
                    </h3>
                    <a
                      href="tel:+2348081793776"
                      className="text-brand-primary hover:underline text-sm md:text-base"
                    >
                      +234 808 179 3776
                    </a>
                    <p className="text-xs md:text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                      Available 24/7
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 md:p-3 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg">
                    <MapIcon className="w-5 h-5 md:w-6 md:h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1 text-sm md:text-base">
                      Address
                    </h3>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm md:text-base">
                      MAKURDI, BENUE STATE NIGERIA
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 md:p-6">
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-3 text-base md:text-lg">
                Other Contact Channels
              </h3>
              <div className="space-y-2 text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary">
                <p>
                  <strong className="text-light-text-primary dark:text-dark-text-primary">Partnerships:</strong>{' '}
                  <a href="mailto:partnerships@sheltrify.com" className="text-brand-primary hover:underline">
                    partnerships@sheltrify.com
                  </a>
                </p>
                <p>
                  <strong className="text-light-text-primary dark:text-dark-text-primary">Feedback:</strong>{' '}
                  <a href="mailto:feedback@sheltrify.com" className="text-brand-primary hover:underline">
                    feedback@sheltrify.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4 md:mb-6">
              Send us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 md:py-3 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm md:text-base"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 md:py-3 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm md:text-base"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 md:py-3 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm md:text-base"
                  placeholder="What's this about?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                  Message *
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 md:py-3 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none text-sm md:text-base"
                  placeholder="Tell us how we can help..."
                />
              </div>
              {submitStatus === 'success' && (
                <div className="p-3 bg-green-500/10 text-green-500 rounded-lg text-sm">
                  Message sent successfully! We'll get back to you soon.
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
                  Failed to send message. Please try again.
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-primary text-white rounded-lg py-2 md:py-3 font-semibold hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

