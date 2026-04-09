import React, { useEffect, useState } from 'react';
import { paymentAPI, cartAPI } from '../services/api';
import { CheckCircleIcon, XCircleIcon } from './icons';

const PaymentVerifyPage: React.FC = () => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      // Get reference from URL query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference') || urlParams.get('trxref');
      
      if (!reference) {
        setStatus('error');
        setMessage('No payment reference found');
        setTimeout(() => {
          window.location.href = '/#wallet';
        }, 3000);
        return;
      }

      try {
        console.log('Verifying payment with reference:', reference);
        const response = await paymentAPI.verify(reference);
        console.log('Payment verification response:', response);
        
        if (response.success) {
          setStatus('success');
          
          // Check if this is a marketplace checkout payment
          const paymentType = response.data.type || (response.data.paystackData ? JSON.parse(response.data.paystackData).metadata?.type : null);
          
          if (paymentType === 'marketplace_checkout') {
            // Clear cart for marketplace checkout
            try {
              await cartAPI.clear();
              setMessage('Payment verified successfully! Your order has been placed.');
              // Trigger cart update event
              window.dispatchEvent(new CustomEvent('cartUpdated'));
              // Redirect to cart/marketplace after 2 seconds
              setTimeout(() => {
                window.location.hash = '#marketplace';
                window.scrollTo(0, 0);
              }, 2000);
            } catch (error) {
              console.error('Failed to clear cart:', error);
              setMessage('Payment verified successfully! Please clear your cart manually.');
              setTimeout(() => {
                window.location.hash = '#cart';
                window.scrollTo(0, 0);
              }, 2000);
            }
          } else {
            // Regular wallet deposit
            setMessage('Payment verified successfully! Your wallet has been updated.');
            // Trigger wallet refresh event
            window.dispatchEvent(new CustomEvent('walletUpdated', { detail: response.data }));
            // Redirect to wallet page after 2 seconds
            setTimeout(() => {
              window.location.hash = '#wallet';
              window.scrollTo(0, 0);
            }, 2000);
          }
          
          setPaymentData(response.data);
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setStatus('error');
          setMessage(response.message || 'Payment verification failed');
          setTimeout(() => {
            window.location.hash = '#wallet';
            window.scrollTo(0, 0);
          }, 2000);
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to verify payment. Please contact support.');
        setTimeout(() => {
          window.location.hash = '#wallet';
          window.scrollTo(0, 0);
        }, 2000);
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg p-4">
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-md p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
              Verifying Payment
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-500 mb-2">Payment Successful!</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              {message}
            </p>
            {paymentData && (
              <div className="bg-light-bg dark:bg-dark-bg rounded-lg p-4 mb-4 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">Amount:</span>
                  <span className="font-semibold">₦{paymentData.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">SWC Added:</span>
                  <span className="font-semibold text-brand-primary">{paymentData.swcAdded?.toFixed(2)} SWC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">New Balance:</span>
                  <span className="font-semibold">{paymentData.newBalance?.toFixed(2)} SWC</span>
                </div>
              </div>
            )}
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Redirecting to wallet...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-500 mb-2">Verification Failed</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              {message}
            </p>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Redirecting to wallet...
            </p>
          </>
        )}

        <button
          onClick={() => {
            const paymentType = paymentData?.type || (paymentData?.paystackData ? JSON.parse(paymentData.paystackData).metadata?.type : null);
            if (paymentType === 'marketplace_checkout') {
              window.location.hash = '#marketplace';
            } else {
              window.location.hash = '#wallet';
            }
            window.scrollTo(0, 0);
          }}
          className="mt-6 w-full bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-secondary transition-colors"
        >
          {paymentData?.type === 'marketplace_checkout' ? 'Go to Marketplace' : 'Go to Wallet'}
        </button>
      </div>
    </div>
  );
};

export default PaymentVerifyPage;

