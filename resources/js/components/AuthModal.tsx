import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, LogoIcon, BookmarkSolidIcon, UserIcon, XIcon, PhotoIcon, EyeIcon } from './icons';
import { Property } from '../types';
import { authAPI, uploadAPI } from '../services/api';

interface AuthModalProps {
    onClose: () => void;
    onLoginSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
    // Check sessionStorage for which tab to show (set by SheltrifyApp when opening modal)
    const getInitialTab = () => {
        if (typeof window !== 'undefined') {
            const tab = sessionStorage.getItem('authModalTab');
            return tab !== 'signup'; // default to login (true), signup = false
        }
        return true;
    };
    
    const [isLogin, setIsLogin] = useState(getInitialTab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const showError = (msg: string) => {
        setError(msg);
        // Give React one tick to render the error div, then scroll it into view
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    };
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetToken, setResetToken] = useState('');
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [resetPasswordData, setResetPasswordData] = useState({ newPassword: '', confirmPassword: '' });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const errorRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        whatsapp: '',
        role: 'SEEKER' as string,
        artisanService: '' as string,
        artisanLocation: '',
        artisanBio: ''
    });

    // Check for reset token in URL on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            setResetToken(token);
            setShowResetPassword(true);
            setIsLogin(true);
        }
    }, []);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError('Profile picture size must be less than 5MB. Please choose a smaller image.');
                setAvatarFile(null);
                setAvatarPreview(null);
                if (avatarInputRef.current) avatarInputRef.current.value = '';
                return;
            }

            if (!file.type.startsWith('image/')) {
                showError('Please select an image file (JPG, PNG, etc.)');
                setAvatarFile(null);
                setAvatarPreview(null);
                if (avatarInputRef.current) avatarInputRef.current.value = '';
                return;
            }
            
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const response = await authAPI.login(formData.email, formData.password);
                if (response.success) {
                    onLoginSuccess(response.data.user);
                    onClose();
                } else {
                    setError(response.message || 'Login failed');
                }
            } else {
                // Validate required fields
                if (!formData.fullName) {
                    showError('Full name is required');
                    setLoading(false);
                    return;
                }

                if (!avatarFile) {
                    showError('Profile picture is required. Please upload your photo.');
                    setLoading(false);
                    return;
                }

                // Upload avatar first (no auth token needed for signup)
                let avatarUrl: string | undefined;
                try {
                    const uploadResponse = await uploadAPI.uploadImage(avatarFile, false);
                    if (uploadResponse.success && uploadResponse.data?.url) {
                        avatarUrl = uploadResponse.data.url;
                    } else {
                        throw new Error(uploadResponse.message || 'Upload failed');
                    }
                } catch (uploadErr: any) {
                    console.error('Upload error:', uploadErr);
                    if (uploadErr.name === 'TypeError' && uploadErr.message.includes('fetch')) {
                        showError('Network error: Could not reach the server. Please try again.');
                    } else {
                        showError(uploadErr.message || 'Failed to upload profile picture. Please try again.');
                    }
                    setLoading(false);
                    return;
                }

                // Prepare signup data
                const signupData: any = {
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName,
                    phone: formData.phone || undefined,
                    whatsapp: formData.whatsapp || undefined,
                    role: formData.role,
                    avatarUrl
                };

                // Add artisan-specific fields
                if (formData.role === 'ARTISAN') {
                    if (formData.artisanService) {
                        signupData.artisanService = formData.artisanService;
                    }
                    if (formData.artisanLocation) {
                        signupData.artisanLocation = formData.artisanLocation;
                    }
                    if (formData.artisanBio) {
                        signupData.artisanBio = formData.artisanBio;
                    }
                }

                const response = await authAPI.signup(signupData);
                if (response.success) {
                    onLoginSuccess(response.data.user);
                    onClose();
                } else {
                    setError(response.message || 'Signup failed');
                }
            }
        } catch (err: any) {
            showError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Clear sessionStorage when modal closes
    const handleClose = () => {
        sessionStorage.removeItem('authModalTab');
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
            style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)'
            }}
        >
            <div
                className="relative bg-gradient-to-br from-light-card to-light-bg dark:from-dark-card dark:to-dark-bg border border-light-border dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-8 text-light-text-primary dark:text-dark-text-primary my-auto max-h-[90vh] overflow-y-auto animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={handleClose} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <div className="text-center mb-6">
                    <LogoIcon className="w-10 h-10 mx-auto text-brand-primary" />
                    <h2 className="text-2xl font-bold mt-2">Welcome to ShelTrify</h2>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{isLogin ? 'Sign in to continue' : 'Create an account to get started'}</p>
                </div>
                
                <div className="flex bg-light-bg dark:bg-dark-bg rounded-lg p-1 mb-6">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2.5 font-semibold text-sm rounded-md transition-all duration-300 ${isLogin ? 'bg-light-card dark:bg-dark-card text-brand-primary shadow-md' : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2.5 font-semibold text-sm rounded-md transition-all duration-300 ${!isLogin ? 'bg-light-card dark:bg-dark-card text-brand-primary shadow-md' : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'}`}
                    >
                        Sign Up
                    </button>
                </div>

                {error && (
                    <div ref={errorRef} className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                {!showForgotPassword && !showResetPassword && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            {/* Profile Picture Upload */}
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                                    Profile Picture <span className="text-red-500">*</span> (Face visibility required)
                                </label>
                                <input 
                                    type="file" 
                                    ref={avatarInputRef}
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                    required={!isLogin}
                                />
                                <div className="flex items-center gap-4">
                                    {avatarPreview ? (
                                        <div className="relative">
                                            <img src={avatarPreview} alt="Avatar preview" className="w-20 h-20 rounded-full object-cover border-2 border-brand-primary" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAvatarFile(null);
                                                    setAvatarPreview(null);
                                                    if (avatarInputRef.current) avatarInputRef.current.value = '';
                                                }}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-light-bg dark:bg-dark-bg border-2 border-dashed border-light-border dark:border-dark-border flex items-center justify-center">
                                            <PhotoIcon className="w-8 h-8 text-light-text-secondary dark:text-dark-text-secondary" />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg hover:bg-light-border dark:hover:bg-dark-border transition text-sm"
                                    >
                                        {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                                    </button>
                                </div>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                    Please upload a clear photo of your face for verification
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Full Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="John Doe" 
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" 
                                />
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Account Type <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    required
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                                >
                                    <option value="SEEKER">Seeker/Tenant</option>
                                    <option value="LANDLORD">Landlord</option>
                                    <option value="AGENT">CC/Agent</option>
                                    <option value="REFERRER">Referrer</option>
                                    <option value="INVESTOR">Investor</option>
                                    <option value="ARTISAN">Local Artisan</option>
                                    <option value="TIPPER_DRIVER">Tipper Driver</option>
                                </select>
                            </div>

                            {/* Artisan-specific fields */}
                            {formData.role === 'ARTISAN' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Service Type</label>
                                        <select
                                            value={formData.artisanService}
                                            onChange={(e) => setFormData({ ...formData, artisanService: e.target.value })}
                                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                                        >
                                            <option value="">Select service</option>
                                            <option value="MECHANIC">Mechanic</option>
                                            <option value="ELECTRICIAN">Electrician</option>
                                            <option value="PLUMBER">Plumber</option>
                                            <option value="PAINTER">Painter</option>
                                            <option value="CARPENTER">Carpenter</option>
                                            <option value="MASON">Mason</option>
                                            <option value="TILER">Tiler</option>
                                            <option value="WELDER">Welder</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Location</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g., Lagos, Ikeja" 
                                            value={formData.artisanLocation}
                                            onChange={(e) => setFormData({ ...formData, artisanLocation: e.target.value })}
                                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Bio/Description</label>
                                        <textarea 
                                            placeholder="Tell us about your services..." 
                                            value={formData.artisanBio}
                                            onChange={(e) => setFormData({ ...formData, artisanBio: e.target.value })}
                                            rows={3}
                                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" 
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Mobile Number</label>
                                <input 
                                    type="tel" 
                                    placeholder="+234 800 000 0000" 
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">WhatsApp Number</label>
                                <input 
                                    type="tel" 
                                    placeholder="+234 800 000 0000" 
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" 
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Email</label>
                        <input 
                            type="email" 
                            placeholder="you@example.com" 
                            required 
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" 
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-4 pr-11 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(s => !s)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                            >
                                <EyeIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    {isLogin && !showForgotPassword && !showResetPassword && (
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForgotPassword(true);
                                    setError(null);
                                }}
                                className="text-sm text-brand-primary hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}
                    {showForgotPassword && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Email</label>
                                <input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    required 
                                    value={forgotPasswordEmail}
                                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" 
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!forgotPasswordEmail) {
                                            setError('Please enter your email');
                                            return;
                                        }
                                        setForgotPasswordLoading(true);
                                        setError(null);
                                        try {
                                            const response = await authAPI.forgotPassword(forgotPasswordEmail);
                                            if (response.success) {
                                                alert('Password reset instructions have been sent to your email. Please check your inbox.');
                                                setShowForgotPassword(false);
                                                setForgotPasswordEmail('');
                                            } else {
                                                setError(response.message || 'Failed to send reset email');
                                            }
                                        } catch (err: any) {
                                            setError(err.message || 'Failed to send reset email');
                                        } finally {
                                            setForgotPasswordLoading(false);
                                        }
                                    }}
                                    disabled={forgotPasswordLoading}
                                    className="flex-1 bg-brand-primary text-white rounded-lg py-3 font-bold hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setForgotPasswordEmail('');
                                        setError(null);
                                    }}
                                    className="px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg hover:bg-light-border dark:hover:bg-dark-border transition"
                                >
                                    Cancel
                                </button>
                            </div>
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary text-center">
                                Don't have access to email? <button type="button" onClick={() => window.location.href = 'mailto:support@sheltrify.com'} className="text-brand-primary hover:underline">Contact support</button>
                            </p>
                        </div>
                    )}
                    {showResetPassword && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        placeholder="Enter new password"
                                        required
                                        value={resetPasswordData.newPassword}
                                        onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-4 pr-11 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(s => !s)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                        tabIndex={-1}
                                    >
                                        <EyeIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Confirm new password"
                                        required
                                        value={resetPasswordData.confirmPassword}
                                        onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-4 pr-11 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(s => !s)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        tabIndex={-1}
                                    >
                                        <EyeIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!resetPasswordData.newPassword || !resetPasswordData.confirmPassword) {
                                            setError('Please fill in all fields');
                                            return;
                                        }
                                        if (resetPasswordData.newPassword.length < 6) {
                                            setError('Password must be at least 6 characters');
                                            return;
                                        }
                                        if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
                                            setError('Passwords do not match');
                                            return;
                                        }
                                        setLoading(true);
                                        setError(null);
                                        try {
                                            // Get token from URL or prompt
                                            const urlParams = new URLSearchParams(window.location.search);
                                            const token = urlParams.get('token') || resetToken || prompt('Please enter your reset token:');
                                            if (!token) {
                                                setError('Reset token is required');
                                                setLoading(false);
                                                return;
                                            }
                                            const response = await authAPI.resetPassword(token, resetPasswordData.newPassword);
                                            if (response.success) {
                                                alert('Password reset successfully! Please login with your new password.');
                                                setShowResetPassword(false);
                                                setResetPasswordData({ newPassword: '', confirmPassword: '' });
                                                setIsLogin(true);
                                            } else {
                                                setError(response.message || 'Failed to reset password');
                                            }
                                        } catch (err: any) {
                                            setError(err.message || 'Failed to reset password');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="flex-1 bg-brand-primary text-white rounded-lg py-3 font-bold hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResetPassword(false);
                                        setResetPasswordData({ newPassword: '', confirmPassword: '' });
                                        setResetToken('');
                                        setError(null);
                                    }}
                                    className="px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg hover:bg-light-border dark:hover:bg-dark-border transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-primary text-white rounded-lg py-3 font-bold hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
                    </button>
                </form>
                )}

                 <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary text-center mt-6">
                    By continuing, you agree to ShelTrify's <button type="button" onClick={(e) => { e.preventDefault(); alert('Terms of Service: By using ShelTrify, you agree to our terms. This is a demo version.'); }} className="underline hover:text-brand-primary">Terms of Service</button> and <button type="button" onClick={(e) => { e.preventDefault(); alert('Privacy Policy: We respect your privacy. Your data is securely stored and encrypted.'); }} className="underline hover:text-brand-primary">Privacy Policy</button>.
                </p>
            </div>
        </div>
    );
};

interface ProfileModalProps {
    onClose: () => void;
    favorites: Property[];
    onRemoveFavorite: (property: Property) => void;
    onViewDetails: (property: Property) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, favorites, onRemoveFavorite, onViewDetails }) => {
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-2xl p-6 text-light-text-primary dark:text-dark-text-primary flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <div className="text-center mb-4">
                     <UserIcon className="w-12 h-12 mx-auto text-brand-primary p-2 bg-brand-primary/10 rounded-full" />
                    <h2 className="text-2xl font-bold mt-2">Your Profile</h2>
                </div>
                
                <div className="border-b border-light-border dark:border-dark-border">
                    <button className="py-3 font-semibold text-sm text-brand-primary border-b-2 border-brand-primary flex items-center gap-2">
                        <BookmarkSolidIcon /> Saved Properties ({favorites.length})
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto mt-4 pr-2 space-y-3">
                    {favorites.length > 0 ? (
                        favorites.map(prop => (
                            <div key={prop.id} className="flex items-center gap-4 bg-light-bg dark:bg-dark-bg p-3 rounded-lg">
                                <img src={prop.imageUrl} alt={prop.title} className="w-20 h-20 rounded-md object-cover flex-shrink-0" />
                                <div className="flex-grow">
                                    <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{prop.title}</p>
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{prop.location}</p>
                                    <p className="text-sm font-bold text-brand-primary mt-1">{prop.price}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => onRemoveFavorite(prop)} className="p-2 bg-light-card dark:bg-dark-card rounded-md hover:bg-light-border dark:hover:bg-dark-border">
                                        <XIcon className="w-4 h-4 text-red-500" />
                                    </button>
                                     <button onClick={() => onViewDetails(prop)} className="px-3 py-1.5 text-xs font-semibold bg-brand-secondary text-white rounded-md hover:opacity-90">
                                        View
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-light-text-secondary dark:text-dark-text-secondary">
                            <p>You haven't saved any properties yet.</p>
                            <p className="text-xs mt-1">Click the bookmark icon on a property to save it.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
