import React, { useState, useEffect } from 'react';
import { ShoppingCartIcon, TrashIcon, XMarkIcon, PlusIcon, MinusIcon, CloseIcon } from './icons';
import { cartAPI, paymentAPI, largeTransactionAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface CartPageProps {
    currentUser?: any;
    onCartUpdate?: () => void;
}

interface CartItem {
    id: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        price: number;
        imageUrl?: string;
        description?: string;
        user?: {
            fullName: string;
            email: string;
            phone: string;
        };
    };
}

const formatPrice = (price: number) => {
    if (price >= 1000000) {
        return `₦${(price / 1000000).toFixed(2)}M`;
    }
    if (price >= 1000) {
        return `₦${(price / 1000).toFixed(0)}k`;
    }
    return `₦${price.toLocaleString()}`;
};

export const CartPage: React.FC<CartPageProps> = ({ currentUser, onCartUpdate }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isManualProcessingOpen, setIsManualProcessingOpen] = useState(false);
    const [manualFormData, setManualFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: ''
    });
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            setLoading(true);
            const response = await cartAPI.getAll();
            if (response.success) {
                setCartItems(response.data.items || []);
                setTotal(response.data.total || 0);
            }
        } catch (error: any) {
            console.error('Failed to load cart:', error);
            showError('Failed to load cart items');
            setCartItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            handleRemoveItem(productId);
            return;
        }

        try {
            setUpdating(productId);
            const response = await cartAPI.update(productId, newQuantity);
            if (response.success) {
                await loadCart(); // Reload cart to get updated totals
                if (onCartUpdate) onCartUpdate();
                showSuccess('Cart updated');
            } else {
                showError(response.message || 'Failed to update cart');
            }
        } catch (error: any) {
            showError(error.message || 'Failed to update cart');
        } finally {
            setUpdating(null);
        }
    };

    const handleRemoveItem = async (productId: string) => {
        try {
            setUpdating(productId);
            const response = await cartAPI.remove(productId);
            if (response.success) {
                await loadCart();
                if (onCartUpdate) onCartUpdate();
                showSuccess('Item removed from cart');
            } else {
                showError(response.message || 'Failed to remove item');
            }
        } catch (error: any) {
            showError(error.message || 'Failed to remove item');
        } finally {
            setUpdating(null);
        }
    };

    const handleClearCart = async () => {
        if (!confirm('Are you sure you want to clear your cart?')) {
            return;
        }

        try {
            const response = await cartAPI.clear();
            if (response.success) {
                await loadCart();
                if (onCartUpdate) onCartUpdate();
                showSuccess('Cart cleared');
            } else {
                showError(response.message || 'Failed to clear cart');
            }
        } catch (error: any) {
            showError(error.message || 'Failed to clear cart');
        }
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            showError('Your cart is empty');
            return;
        }

        try {
            setIsProcessing(true);
            
            // Initialize payment with Paystack (same as deposit flow)
            const response = await paymentAPI.initialize(total, {
                type: 'marketplace_checkout',
                cartItems: cartItems.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price
                }))
            });

            console.log('Payment initialization response:', response);

            if (response.success && response.data && response.data.authorizationUrl) {
                showSuccess('Redirecting to payment gateway...');
                // Small delay to show the success message
                setTimeout(() => {
                    // Redirect to Paystack payment page
                    window.location.href = response.data.authorizationUrl;
                }, 500);
            } else {
                console.error('Payment initialization failed:', response);
                showError(response.message || 'Failed to initialize payment. Please try again.');
                setIsProcessing(false);
            }
        } catch (error: any) {
            console.error('Payment initialization error:', error);
            
            // Check if error is due to amount limit
            const errorMessage = error.message || '';
            if (errorMessage.includes('Amount cannot be processed online') || 
                errorMessage.includes('Watch your spending') ||
                errorMessage.includes('amount limit') ||
                errorMessage.includes('too large')) {
                // Show manual processing form
                setIsManualProcessingOpen(true);
                setIsProcessing(false);
            } else {
                showError(error.message || 'Failed to initialize payment. Please try again.');
                setIsProcessing(false);
            }
        }
    };

    const handleManualProcessingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!manualFormData.customerName || !manualFormData.customerEmail) {
            showError('Please fill in all required fields');
            return;
        }

        try {
            setIsProcessing(true);
            
            const response = await largeTransactionAPI.createRequest({
                amount: total,
                cartItems: cartItems.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price
                })),
                customerName: manualFormData.customerName,
                customerEmail: manualFormData.customerEmail,
                customerPhone: manualFormData.customerPhone || undefined,
                customerAddress: manualFormData.customerAddress || undefined
            });

            if (response.success) {
                showSuccess('Your request has been submitted! Our admin team will contact you shortly to process your transaction.');
                setIsManualProcessingOpen(false);
                // Clear form
                setManualFormData({
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    customerAddress: ''
                });
            } else {
                showError(response.message || 'Failed to submit request');
            }
        } catch (error: any) {
            showError(error.message || 'Failed to submit request');
        } finally {
            setIsProcessing(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-light-bg dark:bg-dark-bg py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                        <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">Loading cart...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-light-bg dark:bg-dark-bg py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-8">Shopping Cart</h1>
                    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-12 text-center">
                        <ShoppingCartIcon className="w-24 h-24 mx-auto mb-4 text-light-text-secondary dark:text-dark-text-secondary opacity-50" />
                        <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Your cart is empty</h2>
                        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">Start adding items from the marketplace!</p>
                        <a
                            href="#marketplace"
                            className="inline-block bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-secondary transition-colors"
                        >
                            Browse Marketplace
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Shopping Cart</h1>
                    <button
                        onClick={handleClearCart}
                        className="text-red-500 hover:text-red-600 font-semibold flex items-center gap-2 transition-colors"
                    >
                        <TrashIcon className="w-5 h-5" />
                        Clear Cart
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map((item) => (
                            <div
                                key={item.id}
                                className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 flex gap-4"
                            >
                                {/* Product Image */}
                                <div className="flex-shrink-0">
                                    <img
                                        src={item.product.imageUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=256'}
                                        alt={item.product.name}
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                </div>

                                {/* Product Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary truncate">
                                                {item.product.name}
                                            </h3>
                                            {item.product.description && (
                                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1 line-clamp-2">
                                                    {item.product.description}
                                                </p>
                                            )}
                                            {item.product.user && (
                                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
                                                    Seller: {item.product.user.fullName}
                                                </p>
                                            )}
                                            <p className="text-xl font-bold text-brand-primary mt-2">
                                                {formatPrice(item.product.price)}
                                            </p>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => handleRemoveItem(item.product.id)}
                                            disabled={updating === item.product.id}
                                            className="flex-shrink-0 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500 transition-colors disabled:opacity-50"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-3 mt-4">
                                        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Quantity:</span>
                                        <div className="flex items-center gap-2 border border-light-border dark:border-dark-border rounded-lg">
                                            <button
                                                onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                                                disabled={updating === item.product.id || item.quantity <= 1}
                                                className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <MinusIcon className="w-4 h-4" />
                                            </button>
                                            <span className="px-4 py-2 text-light-text-primary dark:text-dark-text-primary font-semibold min-w-[3rem] text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                                disabled={updating === item.product.id}
                                                className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <span className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary ml-auto">
                                            {formatPrice(item.product.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-6 sticky top-4">
                            <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">Order Summary</h2>
                            
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-light-text-secondary dark:text-dark-text-secondary">
                                    <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                                <div className="flex justify-between text-light-text-secondary dark:text-dark-text-secondary">
                                    <span>Shipping</span>
                                    <span>To be calculated</span>
                                </div>
                                <div className="border-t border-light-border dark:border-dark-border pt-3 flex justify-between">
                                    <span className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">Total</span>
                                    <span className="text-lg font-bold text-brand-primary">{formatPrice(total)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing}
                                className="w-full bg-brand-primary text-white font-semibold py-3 rounded-lg hover:bg-brand-secondary transition-colors mb-4 disabled:bg-brand-secondary/50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                            </button>

                            <a
                                href="#marketplace"
                                className="block text-center text-brand-primary hover:text-brand-secondary font-semibold transition-colors"
                            >
                                Continue Shopping
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Manual Processing Modal */}
            {isManualProcessingOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <button 
                            onClick={() => setIsManualProcessingOpen(false)} 
                            className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary"
                        >
                            <CloseIcon className="w-6 h-6" />
                        </button>

                        <h2 className="text-2xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">
                            Manual Processing Required
                        </h2>
                        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
                            This transaction amount ({formatPrice(total)}) exceeds online payment limits. 
                            Please provide your details below and our admin team will contact you to process this transaction manually.
                        </p>

                        <form onSubmit={handleManualProcessingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={manualFormData.customerName}
                                    onChange={(e) => setManualFormData({ ...manualFormData, customerName: e.target.value })}
                                    required
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={manualFormData.customerEmail}
                                    onChange={(e) => setManualFormData({ ...manualFormData, customerEmail: e.target.value })}
                                    required
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                                    placeholder="Enter your email address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={manualFormData.customerPhone}
                                    onChange={(e) => setManualFormData({ ...manualFormData, customerPhone: e.target.value })}
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                                    placeholder="Enter your phone number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                                    Delivery Address
                                </label>
                                <textarea
                                    value={manualFormData.customerAddress}
                                    onChange={(e) => setManualFormData({ ...manualFormData, customerAddress: e.target.value })}
                                    rows={3}
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                                    placeholder="Enter your delivery address (if applicable)"
                                />
                            </div>

                            <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-border dark:border-dark-border">
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                                    <strong>Transaction Summary:</strong>
                                </p>
                                <p className="text-sm text-light-text-primary dark:text-dark-text-primary">
                                    Total Amount: <span className="font-bold text-brand-primary">{formatPrice(total)}</span>
                                </p>
                                <p className="text-sm text-light-text-primary dark:text-dark-text-primary">
                                    Items: {cartItems.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="flex-1 bg-brand-primary text-white font-semibold py-3 rounded-lg hover:bg-brand-secondary transition-colors disabled:bg-brand-secondary/50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? 'Submitting...' : 'Submit Request'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsManualProcessingOpen(false)}
                                    className="px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;

