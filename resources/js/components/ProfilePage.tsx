import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, UserIcon, CameraIcon, CheckCircleIcon, XCircleIcon, DocumentCheckIcon, ShieldCheckIcon } from './icons';
import { userAPI, uploadAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface ProfilePageProps {
  onClose?: () => void;
  currentUser: any;
  onUserUpdate?: (user: any) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onClose, currentUser, onUserUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    avatarUrl: currentUser?.avatarUrl || ''
  });
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  // Verification state for landlords/agents
  const [verificationPhotoFile, setVerificationPhotoFile] = useState<File | null>(null);
  const [verificationPhotoPreview, setVerificationPhotoPreview] = useState<string | null>(currentUser?.verificationPhotoUrl || null);
  const [verificationIdFile, setVerificationIdFile] = useState<File | null>(null);
  const [verificationIdPreview, setVerificationIdPreview] = useState<string | null>(currentUser?.verificationIdUrl || null);
  const [verificationIdType, setVerificationIdType] = useState<string>(currentUser?.verificationIdType || 'NIN');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const verificationPhotoInputRef = useRef<HTMLInputElement>(null);
  const verificationIdInputRef = useRef<HTMLInputElement>(null);
  const isLandlordOrAgent = currentUser?.role === 'LANDLORD' || currentUser?.role === 'AGENT';

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        fullName: currentUser.fullName || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        avatarUrl: currentUser.avatarUrl || ''
      });
      setAvatarPreview(currentUser.avatarUrl || '');
      setVerificationPhotoPreview(currentUser.verificationPhotoUrl || null);
      setVerificationIdPreview(currentUser.verificationIdUrl || null);
      setVerificationIdType(currentUser.verificationIdType || 'NIN');
    }
  }, [currentUser]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      
      // Create instant local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload via /upload/image (sends to cPanel when configured)
      const uploadResponse = await uploadAPI.uploadImage(file, true);
      
      if (uploadResponse.success && uploadResponse.data?.url) {
        const url = uploadResponse.data.url;
        setProfileData((prev) => ({ ...prev, avatarUrl: url }));
        setAvatarPreview(url); // Use the returned URL so it loads from cPanel
        showSuccess('Image uploaded! Click Save to update your profile.');
      } else {
        showError(uploadResponse.message || 'Failed to upload image');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showError(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profileData.fullName.trim()) {
      showError('Full name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await userAPI.updateProfile({
        fullName: profileData.fullName,
        phone: profileData.phone || undefined,
        avatarUrl: profileData.avatarUrl || undefined
      });

      if (response.success) {
        showSuccess('Profile updated successfully!');
        if (onUserUpdate) {
          onUserUpdate(response.data);
        }
        // Update current user in parent component
        if (onClose) {
          setTimeout(() => onClose(), 1000);
        }
      } else {
        showError(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      showError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerificationPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const uploadResponse = await uploadAPI.uploadImage(file, true);
      if (uploadResponse.success && uploadResponse.data?.url) {
        setVerificationPhotoFile(file);
        setVerificationPhotoPreview(uploadResponse.data.url);
        showSuccess('Verification photo uploaded! Click Submit Verification to complete.');
      } else {
        showError(uploadResponse.message || 'Failed to upload photo');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleVerificationIdSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerificationIdPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const uploadResponse = await uploadAPI.uploadImage(file, true);
      if (uploadResponse.success && uploadResponse.data?.url) {
        setVerificationIdFile(file);
        setVerificationIdPreview(uploadResponse.data.url);
        showSuccess('ID document uploaded! Click Submit Verification to complete.');
      } else {
        showError(uploadResponse.message || 'Failed to upload document');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!verificationPhotoPreview || !verificationIdPreview) {
      showError('Please upload both your profile photo and ID document');
      return;
    }

    if (!verificationIdType) {
      showError('Please select the type of ID document');
      return;
    }

    try {
      setSubmittingVerification(true);
      const response = await userAPI.submitVerification({
        verificationPhotoUrl: verificationPhotoPreview,
        verificationIdUrl: verificationIdPreview,
        verificationIdType: verificationIdType
      });

      if (response.success) {
        showSuccess('Verification documents submitted successfully! Please wait for admin review.');
        if (onUserUpdate) {
          // Reload user data to get updated verification status
          const profileResponse = await userAPI.getProfile();
          if (profileResponse.success) {
            onUserUpdate(profileResponse.data);
          }
        }
      } else {
        showError(response.message || 'Failed to submit verification');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to submit verification');
    } finally {
      setSubmittingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary">
      {/* Mobile Header */}
      <div className="sticky top-0 z-20 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-sm border-b border-light-border dark:border-dark-border p-4 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">My Profile</h1>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-md hover:bg-light-border dark:hover:bg-dark-border">
            <CloseIcon className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary" />
          </button>
        )}
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <h1 className="hidden md:block text-4xl font-bold text-brand-primary mb-6">My Profile</h1>

        <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-lg border border-light-border dark:border-dark-border p-6 md:p-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-light-bg dark:bg-dark-bg border-4 border-brand-primary overflow-hidden">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/256?text=Photo'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-3 bg-brand-primary text-white rounded-full hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                title="Upload profile picture"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CameraIcon className="w-5 h-5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <p className="mt-4 text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
              Click the camera icon to upload a new profile picture
            </p>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary text-center mt-1">
              Max size: 5MB | Formats: JPG, PNG, GIF
            </p>
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                placeholder="Enter your full name"
                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-3 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full bg-light-bg/50 dark:bg-dark-bg/50 border border-light-border dark:border-dark-border rounded-lg px-4 py-3 text-light-text-secondary dark:text-dark-text-secondary cursor-not-allowed"
              />
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="Enter your phone number"
                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-3 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            {/* Verification Section for Landlords/Agents */}
            {isLandlordOrAgent && (
              <div className="pt-6 border-t border-light-border dark:border-dark-border">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-brand-primary" />
                  <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                    Verification Required
                  </h3>
                </div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6">
                  As a {currentUser?.role === 'LANDLORD' ? 'landlord' : 'agent'}, you must submit verification documents before uploading accommodations. This helps prevent fake listings and ensures trust on our platform.
                </p>

                {/* Verification Status */}
                {currentUser?.verificationStatus && (
                  <div className={`mb-6 p-4 rounded-lg border ${
                    currentUser.verificationStatus === 'approved'
                      ? 'bg-green-500/10 border-green-500/20'
                      : currentUser.verificationStatus === 'rejected'
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      {currentUser.verificationStatus === 'approved' ? (
                        <>
                          <CheckCircleIcon className="w-6 h-6 text-green-500" />
                          <span className="font-semibold text-green-500">Verified</span>
                        </>
                      ) : currentUser.verificationStatus === 'rejected' ? (
                        <>
                          <XCircleIcon className="w-6 h-6 text-red-500" />
                          <span className="font-semibold text-red-500">Verification Rejected</span>
                        </>
                      ) : (
                        <>
                          <DocumentCheckIcon className="w-6 h-6 text-yellow-500" />
                          <span className="font-semibold text-yellow-500">Pending Review</span>
                        </>
                      )}
                    </div>
                    {currentUser.verificationStatus === 'rejected' && currentUser.verificationRejectionReason && (
                      <p className="text-sm text-red-500 mt-2">
                        Reason: {currentUser.verificationRejectionReason}
                      </p>
                    )}
                    {currentUser.verificationStatus === 'pending' && (
                      <p className="text-sm text-yellow-500 mt-2">
                        Your verification is under review. You'll be notified once it's approved.
                      </p>
                    )}
                  </div>
                )}

                {/* Verification Form */}
                {currentUser?.verificationStatus !== 'approved' && (
                  <div className="space-y-6">
                    {/* Profile Photo for Verification */}
                    <div>
                      <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                        Your Profile Photo <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3">
                        Upload a clear photo of yourself for identity verification
                      </p>
                      {verificationPhotoPreview ? (
                        <div className="relative w-full max-w-xs">
                          <img 
                            src={verificationPhotoPreview} 
                            alt="Verification Photo" 
                            className="w-full h-64 object-cover rounded-lg border-2 border-brand-primary"
                          />
                          <button
                            onClick={() => {
                              setVerificationPhotoPreview(null);
                              setVerificationPhotoFile(null);
                              if (verificationPhotoInputRef.current) verificationPhotoInputRef.current.value = '';
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => verificationPhotoInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full max-w-xs h-64 border-2 border-dashed border-light-border dark:border-dark-border rounded-lg flex flex-col items-center justify-center gap-3 hover:border-brand-primary transition-colors disabled:opacity-50"
                        >
                          <CameraIcon className="w-12 h-12 text-light-text-secondary dark:text-dark-text-secondary" />
                          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            {uploading ? 'Uploading...' : 'Click to upload profile photo'}
                          </span>
                        </button>
                      )}
                      <input
                        ref={verificationPhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleVerificationPhotoSelect}
                        className="hidden"
                      />
                    </div>

                    {/* ID Document */}
                    <div>
                      <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                        ID Document <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3">
                        Upload a clear photo of your NIN, Driver's License, Passport, or other valid ID
                      </p>
                      
                      <div className="mb-3">
                        <select
                          value={verificationIdType}
                          onChange={(e) => setVerificationIdType(e.target.value)}
                          className="w-full max-w-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        >
                          <option value="NIN">National Identification Number (NIN)</option>
                          <option value="DRIVERS_LICENSE">Driver's License</option>
                          <option value="PASSPORT">Passport</option>
                          <option value="OTHER">Other Valid ID</option>
                        </select>
                      </div>

                      {verificationIdPreview ? (
                        <div className="relative w-full max-w-xs">
                          <img 
                            src={verificationIdPreview} 
                            alt="ID Document" 
                            className="w-full h-64 object-contain bg-light-bg dark:bg-dark-bg rounded-lg border-2 border-brand-primary p-2"
                          />
                          <button
                            onClick={() => {
                              setVerificationIdPreview(null);
                              setVerificationIdFile(null);
                              if (verificationIdInputRef.current) verificationIdInputRef.current.value = '';
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => verificationIdInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full max-w-xs h-64 border-2 border-dashed border-light-border dark:border-dark-border rounded-lg flex flex-col items-center justify-center gap-3 hover:border-brand-primary transition-colors disabled:opacity-50"
                        >
                          <DocumentCheckIcon className="w-12 h-12 text-light-text-secondary dark:text-dark-text-secondary" />
                          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            {uploading ? 'Uploading...' : 'Click to upload ID document'}
                          </span>
                        </button>
                      )}
                      <input
                        ref={verificationIdInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleVerificationIdSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Submit Verification Button */}
                    <button
                      onClick={handleSubmitVerification}
                      disabled={submittingVerification || !verificationPhotoPreview || !verificationIdPreview || currentUser?.verificationStatus === 'pending'}
                      className="w-full bg-brand-primary text-white py-3 rounded-lg font-semibold hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submittingVerification ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting...</span>
                        </>
                      ) : currentUser?.verificationStatus === 'pending' ? (
                        <>
                          <DocumentCheckIcon className="w-5 h-5" />
                          <span>Verification Under Review</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheckIcon className="w-5 h-5" />
                          <span>Submit Verification</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Account Info */}
            <div className="pt-6 border-t border-light-border dark:border-dark-border">
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-border dark:border-dark-border">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Role</p>
                  <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                    {currentUser?.role || 'SEEKER'}
                  </p>
                </div>
                <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-border dark:border-dark-border">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Premium Status</p>
                  <div className="flex items-center gap-2">
                    {currentUser?.isPremium ? (
                      <>
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <span className="font-semibold text-green-500">Premium</span>
                      </>
                    ) : (
                      <span className="font-semibold text-light-text-secondary dark:text-dark-text-secondary">Free</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                onClick={handleSave}
                disabled={loading || uploading}
                className="flex-1 bg-brand-primary text-white py-3 rounded-lg font-semibold hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

