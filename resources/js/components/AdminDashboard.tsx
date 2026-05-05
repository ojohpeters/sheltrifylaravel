import React, { useState, useEffect, useRef } from 'react';
import { adminAPI, feelsAPI, listingsAPI, uploadAPI } from '../services/api';
import { CloseIcon, UserIcon, BuildingStorefrontIcon, TrendingUpIcon, UsersIcon, CloudArrowUpIcon, TrashIcon, CheckCircleIcon, XCircleIcon, DocumentCheckIcon, Bars3Icon, XMarkIcon, ChartBarIcon, ShoppingCartIcon, VideoCameraIcon, CogIcon, CreditCardIcon, DocumentTextIcon } from './icons';
import { useToast } from '../contexts/ToastContext';

interface AdminDashboardProps {
  onClose?: () => void;
}

interface Stats {
  users: {
    total: number;
    premium: number;
    recent: number;
  };
  listings: {
    total: number;
    active: number;
    recent: number;
  };
  favorites: {
    total: number;
  };
}

interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isPremium: boolean;
  createdAt: string;
  wallet?: {
    swcBalance: number;
    tier: string;
    referrals: number;
  };
  _count?: {
    listings: number;
    favorites: number;
  };
}

interface Listing {
  id: string;
  title: string;
  price: string;
  location: string;
  propertyType: string | null;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
  _count?: {
    favorites: number;
    appointments: number;
  };
}

interface FeelsVideo {
  id: string;
  videoUrl: string;
  caption: string | null;
  music: string | null;
  likes: number;
  shares: number;
  createdAt: string;
  user: {
    id: string;
    fullName: string | null;
    email: string;
  };
}

interface MarketplaceProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string | null;
    email: string;
  };
}

type AdminPage = 'dashboard' | 'users' | 'verifications' | 'accommodations' | 'listings' | 'feels' | 'marketplace' | 'analytics' | 'ai' | 'system' | 'transactions' | 'content' | 'requests';
type AdminView = 'list' | 'edit' | 'create' | 'upload';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { showSuccess, showError } = useToast();
  const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AdminView>('list');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [feelsVideos, setFeelsVideos] = useState<FeelsVideo[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([]);
  const [pendingProducts, setPendingProducts] = useState<MarketplaceProduct[]>([]);
  const [allMarketplaceProducts, setAllMarketplaceProducts] = useState<any[]>([]);
  const [marketplaceTab, setMarketplaceTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [listingFilter, setListingFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [uploadData, setUploadData] = useState({ videoUrl: '', caption: '', music: '' });
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserData, setEditUserData] = useState({ email: '', fullName: '', phone: '', role: '', isPremium: false, isVerified: false });
  const [listingFormData, setListingFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: '',
    propertyType: '',
    imageUrl: '',
    videoUrl: '',
    landlordName: '',
    landlordEmail: '',
    landlordPhone: ''
  });
  const [listingImageFile, setListingImageFile] = useState<File | null>(null);
  const [listingVideoFile, setListingVideoFile] = useState<File | null>(null);
  const [listingImagePreview, setListingImagePreview] = useState<string | null>(null);
  const [listingVideoPreview, setListingVideoPreview] = useState<string | null>(null);
  const listingImageInputRef = useRef<HTMLInputElement>(null);
  const listingVideoInputRef = useRef<HTMLInputElement>(null);
  
  // Additional state for new tabs
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiStats, setAIStats] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [content, setContent] = useState<any>(null);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    // Reset view when switching pages
    setCurrentView('list');
    if (currentPage === 'users') {
      loadUsers();
    } else if (currentPage === 'verifications') {
      loadPendingVerifications();
    } else if (currentPage === 'accommodations' || currentPage === 'listings') {
      loadListings();
    } else if (currentPage === 'feels') {
      loadFeelsVideos();
    } else if (currentPage === 'marketplace') {
      loadMarketplaceProducts();
      loadPendingProducts();
      loadAllMarketplaceProducts();
    } else if (currentPage === 'requests') {
      loadAppointments();
    } else if (currentPage === 'analytics') {
      loadAnalytics();
    } else if (currentPage === 'ai') {
      loadAIStats();
    } else if (currentPage === 'system') {
      loadSystemHealth();
    } else if (currentPage === 'transactions') {
      loadTransactions();
    } else if (currentPage === 'content') {
      loadContent();
    }
  }, [currentPage, searchTerm, listingFilter, appointmentFilter]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({
        search: searchTerm || undefined,
        limit: 100
      });
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadListings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getListings({
        search: searchTerm || undefined,
        limit: 100,
        isActive: listingFilter === 'all' ? undefined : listingFilter === 'active'
      });
      if (response.success) {
        setListings(response.data.listings);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const loadMarketplaceProducts = async () => {
    try {
      const response = await adminAPI.getPendingMarketplaceProducts();
      if (response.success) {
        setMarketplaceProducts(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load marketplace products:', err);
    }
  };

  const loadPendingProducts = async () => {
    try {
      const response = await adminAPI.getPendingMarketplaceProducts();
      if (response.success) {
        setPendingProducts(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load pending products:', err);
    }
  };

  const loadAllMarketplaceProducts = async () => {
    try {
      const response = await adminAPI.getAllMarketplaceProducts();
      if (response.success) setAllMarketplaceProducts(response.data.products || []);
    } catch (err: any) {
      console.error('Failed to load all marketplace products:', err);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const params = appointmentFilter !== 'all' ? { status: appointmentFilter } : undefined;
      const response = await adminAPI.getAllAppointments(params);
      if (response.success) setAppointments(response.data.appointments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load property requests');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAnalytics({ period: 30 });
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemHealth = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSystemHealth();
      if (response.success) {
        setSystemHealth(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load system health');
    } finally {
      setLoading(false);
    }
  };

  const loadAIStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAIStats();
      if (response.success) {
        setAIStats(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load AI stats');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTransactions({ page: 1, limit: 50 });
      if (response.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getContent();
      if (response.success) {
        setContent(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingVerifications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPendingVerifications();
      if (response.success) {
        setPendingVerifications(response.data.verifications || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVerification = async (userId: string) => {
    try {
      const response = await adminAPI.approveVerification(userId);
      if (response.success) {
        showSuccess('Verification approved successfully!');
        loadPendingVerifications();
      } else {
        showError(response.message || 'Failed to approve verification');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to approve verification');
    }
  };

  const handleRejectVerification = async (userId: string, reason?: string) => {
    try {
      const response = await adminAPI.rejectVerification(userId, reason);
      if (response.success) {
        showSuccess('Verification rejected');
        loadPendingVerifications();
      } else {
        showError(response.message || 'Failed to reject verification');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to reject verification');
    }
  };

  const handleApproveListing = async (id: string) => {
    try {
      const response = await adminAPI.updateListing(id, { isActive: true });
      if (response.success) {
        showSuccess('Listing approved and activated successfully!');
        loadListings();
      } else {
        showError(response.message || 'Failed to approve listing');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to approve listing');
    }
  };

  const handleRejectListing = async (id: string) => {
    try {
      const response = await adminAPI.updateListing(id, { isActive: false });
      if (response.success) {
        showSuccess('Listing deactivated successfully!');
        loadListings();
      } else {
        showError(response.message || 'Failed to deactivate listing');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to deactivate listing');
    }
  };

  const handleApproveProduct = async (id: string) => {
    try {
      const response = await adminAPI.approveMarketplaceProduct(id);
      if (response.success) {
        showSuccess('Product approved successfully!');
        loadPendingProducts();
        loadMarketplaceProducts();
      } else {
        showError(response.message || 'Failed to approve product');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to approve product');
    }
  };

  const handleRejectProduct = async (id: string) => {
    try {
      const response = await adminAPI.rejectMarketplaceProduct(id);
      if (response.success) {
        showSuccess('Product rejected successfully!');
        loadPendingProducts();
        loadMarketplaceProducts();
      } else {
        showError(response.message || 'Failed to reject product');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to reject product');
    }
  };

  const loadFeelsVideos = async () => {
    try {
      setLoading(true);
      const response = await feelsAPI.getAll();
      if (response.success) {
        setFeelsVideos(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleListingImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        showError('Image file size must be less than 20MB');
        return;
      }
      setListingImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setListingImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleListingVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        showError('Video file size must be less than 20MB');
        return;
      }
      setListingVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setListingVideoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      showError('Please select a video file');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      showError('Video size must be less than 20MB');
      return;
    }

    setVideoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadFeelsVideo = async () => {
    if (!videoFile) {
      showError('Please select a video file');
      return;
    }

    try {
      setUploading(true);
      
      // First upload the video file
      const uploadResponse = await uploadAPI.uploadVideo(videoFile);
      
      if (!uploadResponse.success || !uploadResponse.data?.url) {
        showError(uploadResponse.message || 'Failed to upload video file');
        return;
      }

      // Then create the feels video with the uploaded video URL
      const response = await feelsAPI.create({
        videoUrl: uploadResponse.data.url,
        caption: uploadData.caption || undefined,
        music: uploadData.music || undefined
      });

      if (response.success) {
        setCurrentView('list');
        setUploadData({ videoUrl: '', caption: '', music: '' });
        setVideoFile(null);
        setVideoPreview(null);
        if (videoFileInputRef.current) {
          videoFileInputRef.current.value = '';
        }
        loadFeelsVideos();
        showSuccess('Video uploaded successfully!');
      } else {
        showError(response.message || 'Failed to create video');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFeelsVideo = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    try {
      const response = await feelsAPI.delete(id);
      if (response.success) {
        loadFeelsVideos();
        showSuccess('Video deleted successfully!');
      } else {
        showError(response.message || 'Failed to delete video');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to delete video');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserData({
      email: user.email,
      fullName: user.fullName || '',
      phone: user.phone || '',
      role: user.role,
      isPremium: user.isPremium,
      isVerified: false
    });
    setCurrentView('edit');
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);
      const response = await adminAPI.updateUser(editingUser.id, editUserData);
      if (response.success) {
        showSuccess('User updated successfully!');
        setCurrentView('list');
        setEditingUser(null);
        loadUsers();
      } else {
        showError(response.message || 'Failed to update user');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      setLoading(true);
      const response = await adminAPI.deleteUser(userId);
      if (response.success) {
        showSuccess('User deleted successfully!');
        loadUsers();
      } else {
        showError(response.message || 'Failed to delete user');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Navigation menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'verifications', label: 'Verifications', icon: DocumentCheckIcon, badge: pendingVerifications.length },
    { id: 'accommodations', label: 'Accommodations', icon: BuildingStorefrontIcon },
    { id: 'listings', label: 'Listings', icon: BuildingStorefrontIcon },
    { id: 'feels', label: 'Feels Videos', icon: VideoCameraIcon },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCartIcon, badge: pendingProducts.length },
    { id: 'requests', label: 'Property Requests', icon: DocumentCheckIcon, badge: appointments.filter((a: any) => a.status === 'pending').length },
    { id: 'analytics', label: 'Analytics', icon: TrendingUpIcon },
    { id: 'ai', label: 'AI Management', icon: UserIcon },
    { id: 'system', label: 'System', icon: CogIcon },
    { id: 'transactions', label: 'Transactions', icon: CreditCardIcon },
    { id: 'content', label: 'Content', icon: DocumentTextIcon },
  ];

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border">
            <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Admin Panel</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id as AdminPage);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20'
                      : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-bg'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          {onClose && (
            <div className="p-4 border-t border-light-border dark:border-dark-border">
              <button
                onClick={onClose}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
                <span className="font-medium">Close Dashboard</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 overflow-x-hidden">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-sm border-b border-light-border dark:border-dark-border lg:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">
              {menuItems.find(m => m.id === currentPage)?.label || 'Admin Dashboard'}
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-6 lg:p-8">
          {/* Desktop Page Header */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {menuItems.find(m => m.id === currentPage)?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                {currentPage === 'dashboard' && 'Overview of your platform statistics'}
                {currentPage === 'users' && 'Manage all platform users'}
                {currentPage === 'verifications' && 'Review and approve landlord/agent verifications'}
                {currentPage === 'accommodations' && 'Upload and manage accommodation listings'}
                {currentPage === 'listings' && 'Manage all property listings'}
                {currentPage === 'feels' && 'Manage Feels video content'}
                {currentPage === 'marketplace' && 'Manage marketplace products'}
                {currentPage === 'analytics' && 'View platform analytics and insights'}
                {currentPage === 'ai' && 'AI system management and configuration'}
                {currentPage === 'system' && 'System health and monitoring'}
                {currentPage === 'transactions' && 'View all platform transactions'}
                {currentPage === 'content' && 'Manage platform content'}
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12 text-light-text-secondary dark:text-dark-text-secondary">
              Loading...
            </div>
          )}

          {/* Page Content Sections */}
          {currentPage === 'dashboard' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border">
                <div className="flex items-center gap-3 mb-2">
                  <UsersIcon className="w-6 h-6 text-brand-primary" />
                  <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">Total Users</h3>
                </div>
                <p className="text-3xl font-bold text-brand-primary">{stats.users.total}</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {stats.users.recent} new in last 30 days
                </p>
              </div>

              <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUpIcon className="w-6 h-6 text-green-500" />
                  <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">Premium Users</h3>
                </div>
                <p className="text-3xl font-bold text-green-500">{stats.users.premium}</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {((stats.users.premium / stats.users.total) * 100).toFixed(1)}% of total
                </p>
              </div>

              <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border">
                <div className="flex items-center gap-3 mb-2">
                  <BuildingStorefrontIcon className="w-6 h-6 text-blue-500" />
                  <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">Total Listings</h3>
                </div>
                <p className="text-3xl font-bold text-blue-500">{stats.listings.total}</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {stats.listings.active} active, {stats.listings.recent} new
                </p>
              </div>

              <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border">
                <div className="flex items-center gap-3 mb-2">
                  <UserIcon className="w-6 h-6 text-purple-500" />
                  <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">Total Favorites</h3>
                </div>
                <p className="text-3xl font-bold text-purple-500">{stats.favorites.total}</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  Saved properties
                </p>
              </div>
            </div>
          )}

          {currentPage === 'users' && (
            <div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-light-border dark:border-dark-border">
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Email</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Name</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Role</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Premium</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Listings</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Joined</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg">
                        <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary">{user.email}</td>
                        <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary">{user.fullName || 'N/A'}</td>
                        <td className="p-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.role === 'ADMIN' ? 'bg-red-500/20 text-red-500' :
                            user.role === 'LANDLORD' ? 'bg-blue-500/20 text-blue-500' :
                            user.role === 'AGENT' ? 'bg-green-500/20 text-green-500' :
                            'bg-gray-500/20 text-gray-500'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          {user.isPremium ? (
                            <span className="text-green-500 font-semibold">✓ Premium</span>
                          ) : (
                            <span className="text-light-text-secondary dark:text-dark-text-secondary">Free</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary">
                          {user._count?.listings || 0}
                        </td>
                        <td className="p-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                              title="Edit User"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete User"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && !loading && (
                  <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                    No users found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verifications Page */}
          {currentPage === 'verifications' && (
            <div>
              <div className="mb-6 bg-gradient-to-r from-brand-primary/10 to-cyan-400/10 dark:from-brand-primary/20 dark:to-cyan-400/20 border border-brand-primary/20 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                  🔒 Verification Review
                </h2>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Review and approve verification documents submitted by landlords and agents before they can upload accommodations.
                </p>
              </div>

              {pendingVerifications.length === 0 && !loading && (
                <div className="text-center py-12 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg">
                  <DocumentCheckIcon className="w-16 h-16 mx-auto text-light-text-secondary dark:text-dark-text-secondary mb-4" />
                  <p className="text-lg text-light-text-primary dark:text-dark-text-primary mb-2">No pending verifications</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">All verification requests have been reviewed.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingVerifications.map((verification) => (
                  <div key={verification.id} className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">
                          {verification.fullName || verification.email}
                        </h3>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{verification.email}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          verification.role === 'LANDLORD' 
                            ? 'bg-blue-500/20 text-blue-500' 
                            : 'bg-green-500/20 text-green-500'
                        }`}>
                          {verification.role}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2">
                          Profile Photo
                        </label>
                        {verification.verificationPhotoUrl ? (
                          <img 
                            src={verification.verificationPhotoUrl} 
                            alt="Profile" 
                            className="w-full h-48 object-cover rounded-lg border border-light-border dark:border-dark-border"
                          />
                        ) : (
                          <div className="w-full h-48 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg flex items-center justify-center">
                            <span className="text-light-text-secondary dark:text-dark-text-secondary">No photo uploaded</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2">
                          ID Document ({verification.verificationIdType || 'N/A'})
                        </label>
                        {verification.verificationIdUrl ? (
                          <a 
                            href={verification.verificationIdUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-full h-48 border border-light-border dark:border-dark-border rounded-lg overflow-hidden hover:border-brand-primary transition-colors"
                          >
                            <img 
                              src={verification.verificationIdUrl} 
                              alt="ID Document" 
                              className="w-full h-full object-contain"
                            />
                          </a>
                        ) : (
                          <div className="w-full h-48 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg flex items-center justify-center">
                            <span className="text-light-text-secondary dark:text-dark-text-secondary">No ID document uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveVerification(verification.id)}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Please provide a reason for rejection (optional):');
                          if (reason !== null) {
                            handleRejectVerification(verification.id, reason || undefined);
                          }
                        }}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <XCircleIcon className="w-5 h-5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(currentPage === 'accommodations' || currentPage === 'listings') && (
            <div>
              <div className="mb-6 bg-gradient-to-r from-brand-primary/10 to-cyan-400/10 dark:from-brand-primary/20 dark:to-cyan-400/20 border border-brand-primary/20 rounded-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                      {currentPage === 'accommodations' ? '🏠 Accommodation Management' : '📋 Listings Management'}
                    </h2>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {currentPage === 'accommodations' 
                        ? 'Upload and manage accommodation listings for seekers to find. This is separate from Marketplace products.'
                        : 'Manage all property listings in the system.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentView('create')}
                    className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-all font-semibold whitespace-nowrap shadow-lg shadow-brand-primary/20"
                  >
                    + Upload New Accommodation
                  </button>
                </div>
              </div>
              <div className="mb-4 flex gap-4">
                <input
                  type="text"
                  placeholder="Search accommodations by title, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
                <select
                  value={listingFilter}
                  onChange={(e) => setListingFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                >
                  <option value="all">All Accommodations</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-light-border dark:border-dark-border">
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Title</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Price</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Location</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Owner</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Status</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Created</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <tr key={listing.id} className="border-b border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg">
                        <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary font-semibold">{listing.title}</td>
                        <td className="p-3 text-sm text-brand-primary font-bold">{listing.price}</td>
                        <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary">{listing.location}</td>
                        <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary">{listing.user.fullName || listing.user.email}</td>
                        <td className="p-3 text-sm">
                          {listing.isActive ? (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-500">Active</span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-500">Inactive</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {formatDate(listing.createdAt)}
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex gap-2">
                            {!listing.isActive ? (
                              <button
                                onClick={() => handleApproveListing(listing.id)}
                                className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition-colors"
                                title="Approve & Activate"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRejectListing(listing.id)}
                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                title="Deactivate"
                              >
                                <XCircleIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {listings.length === 0 && !loading && (
                  <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                    No listings found
                  </div>
                )}
              </div>
            </div>
          )}

          {currentPage === 'feels' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">Feels Videos</h3>
                <button
                  onClick={() => setCurrentView('upload')}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-all"
                >
                  <CloudArrowUpIcon className="w-5 h-5" />
                  Upload Video
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-light-border dark:border-dark-border">
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Video URL</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Caption</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Author</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Likes</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Created</th>
                      <th className="text-left p-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feelsVideos.map((video) => (
                      <tr key={video.id} className="border-b border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg">
                        <td className="p-3 text-sm">
                          <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline truncate block max-w-xs">
                            {video.videoUrl}
                          </a>
                        </td>
                        <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary max-w-xs truncate">
                          {video.caption || 'No caption'}
                        </td>
                        <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary">
                          {video.user.fullName || video.user.email.split('@')[0]}
                        </td>
                        <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary">
                          {video.likes}
                        </td>
                        <td className="p-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {formatDate(video.createdAt)}
                        </td>
                        <td className="p-3 text-sm">
                          <button
                            onClick={() => handleDeleteFeelsVideo(video.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Delete video"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {feelsVideos.length === 0 && !loading && (
                  <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                    No videos found. Upload the first video!
                  </div>
                )}
              </div>
            </div>
          )}

          {currentPage === 'marketplace' && (
            <div>
              {/* Tabs */}
              <div className="flex gap-2 mb-5 border-b border-light-border dark:border-dark-border pb-3">
                {(['pending', 'approved', 'all'] as const).map((tab) => {
                  const count = tab === 'pending' ? pendingProducts.length : tab === 'approved' ? allMarketplaceProducts.filter(p => p.isApproved).length : allMarketplaceProducts.length;
                  return (
                    <button key={tab} onClick={() => setMarketplaceTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${marketplaceTab === tab ? 'bg-brand-primary text-white' : 'bg-light-bg dark:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary'}`}
                    >
                      {tab === 'pending' ? `Pending (${pendingProducts.length})` : tab === 'approved' ? `Approved (${allMarketplaceProducts.filter(p => p.isApproved).length})` : `All (${allMarketplaceProducts.length})`}
                    </button>
                  );
                })}
              </div>

              {/* Pending tab */}
              {marketplaceTab === 'pending' && (
                pendingProducts.length === 0 ? (
                  <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border">
                    No pending products to approve
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingProducts.map((product) => (
                      <div key={product.id} className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-amber-400/30 border-l-4 border-l-amber-400">
                        <div className="flex gap-4">
                          {product.imageUrl && (
                            <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">{product.name}</h4>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2 line-clamp-2">{product.description || 'No description'}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <span className="text-brand-primary font-bold">₦{product.price?.toLocaleString()}</span>
                              <span className="px-2 py-0.5 bg-light-card dark:bg-dark-card rounded-full">{product.category?.replace(/_/g, ' ')}</span>
                              <span className="text-light-text-secondary dark:text-dark-text-secondary">By: {product.user?.fullName || product.user?.email}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button onClick={() => { handleApproveProduct(product.id); loadAllMarketplaceProducts(); }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-semibold">
                              <CheckCircleIcon className="w-4 h-4" />Approve
                            </button>
                            <button onClick={() => { handleRejectProduct(product.id); loadAllMarketplaceProducts(); }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-semibold">
                              <XCircleIcon className="w-4 h-4" />Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Approved / All tabs */}
              {(marketplaceTab === 'approved' || marketplaceTab === 'all') && (() => {
                const items = marketplaceTab === 'approved' ? allMarketplaceProducts.filter(p => p.isApproved) : allMarketplaceProducts;
                return items.length === 0 ? (
                  <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border">
                    No products found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-light-border dark:border-dark-border text-left text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wide">
                          <th className="p-3">Product</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Seller</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((product: any) => (
                          <tr key={product.id} className="border-b border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />}
                                <span className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary line-clamp-1">{product.name}</span>
                              </div>
                            </td>
                            <td className="p-3 text-sm text-brand-primary font-bold">₦{product.price?.toLocaleString()}</td>
                            <td className="p-3 text-xs text-light-text-secondary dark:text-dark-text-secondary">{product.category?.replace(/_/g, ' ')}</td>
                            <td className="p-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">{product.user?.fullName || product.user?.email}</td>
                            <td className="p-3">
                              {product.isApproved ? (
                                <span className="px-2 py-1 text-xs font-semibold bg-green-500/20 text-green-500 rounded-full">Approved</span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold bg-amber-500/20 text-amber-500 rounded-full">Pending</span>
                              )}
                            </td>
                            <td className="p-3">
                              {!product.isApproved ? (
                                <button onClick={() => { handleApproveProduct(product.id); loadAllMarketplaceProducts(); }}
                                  className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition-colors" title="Approve">
                                  <CheckCircleIcon className="w-5 h-5" />
                                </button>
                              ) : (
                                <button onClick={() => { handleRejectProduct(product.id); loadAllMarketplaceProducts(); }}
                                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Reject/Remove">
                                  <XCircleIcon className="w-5 h-5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Property Requests (Q5) */}
          {currentPage === 'requests' && (
            <div>
              <div className="mb-6 bg-gradient-to-r from-brand-primary/10 to-cyan-400/10 border border-brand-primary/20 rounded-lg p-5">
                <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">🏠 Property Requests</h2>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  All seeker appointment requests — see who requested, the listing, and the agent/landlord who uploaded it.
                </p>
              </div>
              <div className="mb-4 flex gap-3 flex-wrap">
                {['all', 'pending', 'confirmed', 'rented_out', 'completed', 'cancelled'].map((s) => (
                  <button key={s} onClick={() => { setAppointmentFilter(s); loadAppointments(); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${appointmentFilter === s ? 'bg-brand-primary text-white' : 'bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:border-brand-primary/40'}`}
                  >
                    {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
              </div>
              {appointments.length === 0 && !loading ? (
                <div className="text-center py-12 text-light-text-secondary dark:text-dark-text-secondary">
                  No property requests found
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appt: any) => (
                    <div key={appt.id} className={`bg-light-bg dark:bg-dark-bg p-4 rounded-xl border-l-4 border border-light-border dark:border-dark-border ${
                      appt.status === 'rented_out' ? 'border-l-green-500' : appt.status === 'pending' ? 'border-l-amber-400' : appt.status === 'cancelled' ? 'border-l-red-500' : 'border-l-blue-400'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Listing */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            {appt.listing?.imageUrl && <img src={appt.listing.imageUrl} alt={appt.listing.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />}
                            <div>
                              <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{appt.listing?.title || 'Unknown Listing'}</p>
                              <p className="text-sm text-brand-primary font-bold">{appt.listing?.price}</p>
                              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">📍 {appt.listing?.location}</p>
                            </div>
                          </div>
                        </div>
                        {/* Seeker */}
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wide mb-1">Seeker (Requested)</p>
                          <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">{appt.user?.fullName || appt.user?.email}</p>
                          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{appt.user?.phone || appt.user?.email}</p>
                        </div>
                        {/* Agent/Landlord */}
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wide mb-1">Listed by</p>
                          <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">{appt.listing?.user?.fullName || appt.listing?.user?.email || '—'}</p>
                          <p className="text-xs text-brand-primary">{appt.listing?.user?.role?.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{appt.listing?.user?.phone}</p>
                        </div>
                        {/* Status + actions */}
                        <div className="flex flex-col gap-2 items-end">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            appt.status === 'rented_out' ? 'bg-green-500/20 text-green-500' :
                            appt.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                            appt.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                            'bg-blue-500/20 text-blue-500'
                          }`}>{appt.status?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                          <select
                            value={appt.status}
                            onChange={async (e) => {
                              await adminAPI.updateAppointment(appt.id, e.target.value);
                              loadAppointments();
                            }}
                            className="text-xs bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg px-2 py-1 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="rented_out">Rented Out ✓</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <p className="text-[10px] text-light-text-muted dark:text-dark-text-muted">{new Date(appt.createdAt || appt.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {appt.notes && (
                        <p className="mt-3 text-xs text-light-text-secondary dark:text-dark-text-secondary bg-light-card dark:bg-dark-card rounded-lg p-2">💬 {appt.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {currentPage === 'analytics' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
                  Analytics Dashboard
                </h3>
                {analytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-border dark:border-dark-border">
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold text-brand-primary">
                        ₦{analytics.revenue?.total?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-border dark:border-dark-border">
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Transactions</p>
                      <p className="text-2xl font-bold text-brand-primary">{analytics.revenue?.transactions || 0}</p>
                    </div>
                    <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-border dark:border-dark-border">
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Top Locations</p>
                      <p className="text-2xl font-bold text-brand-primary">{analytics.topLocations?.length || 0}</p>
                    </div>
                    <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-border dark:border-dark-border">
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">User Roles</p>
                      <p className="text-2xl font-bold text-brand-primary">{analytics.roleDistribution?.length || 0}</p>
                    </div>
                  </div>
                )}
                {analytics?.topLocations && analytics.topLocations.length > 0 && (
                  <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-border dark:border-dark-border">
                    <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">Top Locations</h4>
                    <div className="space-y-2">
                      {analytics.topLocations.slice(0, 10).map((loc: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-light-text-primary dark:text-dark-text-primary">{loc.location}</span>
                          <span className="text-brand-primary font-semibold">{loc._count.id} listings</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Management Tab */}
          {currentPage === 'ai' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
                  AI Management
                </h3>
                {aiStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border">
                      <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">AI Status</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">Status:</span>
                          <span className={`font-semibold ${aiStats.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                            {aiStats.status || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">Model:</span>
                          <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                            {aiStats.model || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">AI Enabled:</span>
                          <span className={`font-semibold ${aiStats.aiEnabled ? 'text-green-500' : 'text-red-500'}`}>
                            {aiStats.aiEnabled ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border">
                      <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Available Data</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">Listings:</span>
                          <span className="font-semibold text-brand-primary">
                            {aiStats.availableData?.listings || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">Last Updated:</span>
                          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            {aiStats.availableData?.lastUpdated ? new Date(aiStats.availableData.lastUpdated).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Health Tab */}
          {currentPage === 'system' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
                  System Health & Monitoring
                </h3>
                {systemHealth && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border">
                      <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Database</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">Status:</span>
                          <span className={`font-semibold ${systemHealth.database?.status === 'healthy' ? 'text-green-500' : 'text-yellow-500'}`}>
                            {systemHealth.database?.status || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">Latency:</span>
                          <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                            {systemHealth.database?.latency || 0}ms
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">Connected:</span>
                          <span className={`font-semibold ${systemHealth.database?.connected ? 'text-green-500' : 'text-red-500'}`}>
                            {systemHealth.database?.connected ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border">
                      <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">System Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">Uptime:</span>
                          <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                            {systemHealth.system?.uptime ? Math.floor(systemHealth.system.uptime / 3600) + 'h' : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">Node Version:</span>
                          <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                            {systemHealth.system?.nodeVersion || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">Memory:</span>
                          <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                            {systemHealth.system?.memory ? Math.round(systemHealth.system.memory.heapUsed / 1024 / 1024) + 'MB' : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {systemHealth.metrics && (
                      <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border col-span-1 md:col-span-2">
                        <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Platform Metrics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total Users</p>
                            <p className="text-2xl font-bold text-brand-primary">{systemHealth.metrics.totalUsers || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total Listings</p>
                            <p className="text-2xl font-bold text-brand-primary">{systemHealth.metrics.totalListings || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Active Listings</p>
                            <p className="text-2xl font-bold text-brand-primary">{systemHealth.metrics.activeListings || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Pending Products</p>
                            <p className="text-2xl font-bold text-brand-primary">{systemHealth.metrics.pendingProducts || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {currentPage === 'transactions' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
                  Transaction Management
                </h3>
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b border-light-border dark:border-dark-border">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">User</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx: any) => (
                          <tr key={tx.id} className="border-b border-light-border dark:border-dark-border">
                            <td className="py-3 px-4 text-sm text-light-text-primary dark:text-dark-text-primary">
                              {tx.user?.fullName || tx.user?.email || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-light-text-primary dark:text-dark-text-primary">
                              ₦{tx.amount?.toLocaleString() || '0'}
                            </td>
                            <td className="py-3 px-4 text-sm text-light-text-primary dark:text-dark-text-primary">
                              {tx.type || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                tx.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                'bg-red-500/20 text-red-500'
                              }`}>
                                {tx.status || 'Unknown'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                              {tx.createdAt ? formatDate(tx.createdAt) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-light-text-secondary dark:text-dark-text-secondary">No transactions found</p>
                )}
              </div>
            </div>
          )}

          {/* Content Management Tab */}
          {currentPage === 'content' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
                  Content Management
                </h3>
                {content && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border">
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Listings</p>
                      <p className="text-3xl font-bold text-brand-primary">{content.content?.listings || 0}</p>
                    </div>
                    <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border">
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Posts</p>
                      <p className="text-3xl font-bold text-brand-primary">{content.content?.posts || 0}</p>
                    </div>
                    <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border">
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Videos</p>
                      <p className="text-3xl font-bold text-brand-primary">{content.content?.videos || 0}</p>
                    </div>
                    <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg border border-light-border dark:border-dark-border">
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Stories</p>
                      <p className="text-3xl font-bold text-brand-primary">{content.content?.stories || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals - Edit User */}
      {currentView === 'edit' && currentPage === 'users' && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Edit User</h2>
              <button onClick={() => { setCurrentView('list'); setEditingUser(null); }} className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Email</label>
                <input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Full Name</label>
                <input
                  type="text"
                  value={editUserData.fullName}
                  onChange={(e) => setEditUserData({ ...editUserData, fullName: e.target.value })}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Role</label>
                <select
                  value={editUserData.role}
                  onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                >
                  <option value="SEEKER">Seeker</option>
                  <option value="LANDLORD">Landlord</option>
                  <option value="AGENT">Agent</option>
                  <option value="REFERRER">Referrer</option>
                  <option value="TENANT">Tenant</option>
                  <option value="INVESTOR">Investor</option>
                  <option value="ARTISAN">Artisan</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-light-text-primary dark:text-dark-text-primary">
                  <input
                    type="checkbox"
                    checked={editUserData.isPremium}
                    onChange={(e) => setEditUserData({ ...editUserData, isPremium: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Premium User
                </label>
                <label className="flex items-center gap-2 text-sm text-light-text-primary dark:text-dark-text-primary">
                  <input
                    type="checkbox"
                    checked={editUserData.isVerified}
                    onChange={(e) => setEditUserData({ ...editUserData, isVerified: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Verified
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveUser}
                  disabled={loading || !editUserData.email.trim()}
                  className="flex-1 bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-secondary disabled:bg-brand-secondary/50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => { setCurrentView('list'); setEditingUser(null); }}
                  className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Accommodation Modal */}
      {currentView === 'create' && (currentPage === 'accommodations' || currentPage === 'listings') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-2xl p-6 my-8">
            <button onClick={() => setCurrentView('list')} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
              <CloseIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-2 text-light-text-primary dark:text-dark-text-primary">Create New Accommodation Listing</h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">Upload accommodation listings for seekers to find. This is separate from Marketplace products.</p>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Title *</label>
                <input
                  type="text"
                  value={listingFormData.title}
                  onChange={(e) => setListingFormData({ ...listingFormData, title: e.target.value })}
                  placeholder="e.g., Beautiful 3 Bedroom Apartment"
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Description</label>
                <textarea
                  value={listingFormData.description}
                  onChange={(e) => setListingFormData({ ...listingFormData, description: e.target.value })}
                  placeholder="Describe the property..."
                  rows={3}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Price *</label>
                  <input
                    type="text"
                    value={listingFormData.price}
                    onChange={(e) => setListingFormData({ ...listingFormData, price: e.target.value })}
                    placeholder="₦2.5M/year"
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Location *</label>
                  <input
                    type="text"
                    value={listingFormData.location}
                    onChange={(e) => setListingFormData({ ...listingFormData, location: e.target.value })}
                    placeholder="Lagos, Ikeja"
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Bedrooms</label>
                  <input
                    type="number"
                    value={listingFormData.bedrooms}
                    onChange={(e) => setListingFormData({ ...listingFormData, bedrooms: e.target.value })}
                    placeholder="3"
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Property Type</label>
                  <select
                    value={listingFormData.propertyType}
                    onChange={(e) => setListingFormData({ ...listingFormData, propertyType: e.target.value })}
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  >
                    <option value="">Select type</option>
                    <option value="RESIDENTIAL_HOUSE">Residential House</option>
                    <option value="HOTEL">Hotel</option>
                    <option value="OFFICE_SPACE">Office Space</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="DUPLEX">Duplex</option>
                    <option value="BUNGALOW">Bungalow</option>
                    <option value="SELF_CONTAIN">Self Contain</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Image URL</label>
                  <input
                    type="url"
                    value={listingFormData.imageUrl}
                    onChange={(e) => setListingFormData({ ...listingFormData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Video URL</label>
                  <input
                    type="url"
                    value={listingFormData.videoUrl}
                    onChange={(e) => setListingFormData({ ...listingFormData, videoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="border-t border-light-border dark:border-dark-border pt-4 mt-4">
                <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Landlord Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Landlord Name</label>
                    <input
                      type="text"
                      value={listingFormData.landlordName}
                      onChange={(e) => setListingFormData({ ...listingFormData, landlordName: e.target.value })}
                      placeholder="John Doe"
                      className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Landlord Email</label>
                      <input
                        type="email"
                        value={listingFormData.landlordEmail}
                        onChange={(e) => setListingFormData({ ...listingFormData, landlordEmail: e.target.value })}
                        placeholder="landlord@example.com"
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Landlord Phone</label>
                      <input
                        type="tel"
                        value={listingFormData.landlordPhone}
                        onChange={(e) => setListingFormData({ ...listingFormData, landlordPhone: e.target.value })}
                        placeholder="+234 800 000 0000"
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={async () => {
                    if (!listingFormData.title || !listingFormData.price || !listingFormData.location) {
                      showError('Please fill in all required fields (Title, Price, Location)');
                      return;
                    }
                    try {
                      setLoading(true);
                      const listingData: any = {
                        title: listingFormData.title,
                        description: listingFormData.description || undefined,
                        price: listingFormData.price,
                        location: listingFormData.location,
                        bedrooms: listingFormData.bedrooms ? parseInt(listingFormData.bedrooms) : undefined,
                        propertyType: listingFormData.propertyType || undefined,
                        imageUrl: listingFormData.imageUrl || undefined,
                        videoUrl: listingFormData.videoUrl || undefined,
                        landlordName: listingFormData.landlordName || undefined,
                        landlordEmail: listingFormData.landlordEmail || undefined,
                        landlordPhone: listingFormData.landlordPhone || undefined,
                      };
                      const response = await listingsAPI.create(listingData);
                      if (response.success) {
                        showSuccess('Listing created successfully!');
                        setCurrentView('list');
                        setListingFormData({
                          title: '',
                          description: '',
                          price: '',
                          location: '',
                          bedrooms: '',
                          propertyType: '',
                          imageUrl: '',
                          videoUrl: '',
                          landlordName: '',
                          landlordEmail: '',
                          landlordPhone: ''
                        });
                        loadListings();
                      } else {
                        showError(response.message || 'Failed to create listing');
                      }
                      } catch (error: any) {
                        // Handle verification errors specifically
                        if (error.response?.data?.code === 'VERIFICATION_PENDING') {
                          showError('Your verification is pending. Please wait for admin approval before creating listings.');
                        } else if (error.response?.data?.code === 'VERIFICATION_REJECTED') {
                          showError('Your verification was rejected. Please submit new verification documents in your profile.');
                        } else if (error.response?.data?.code === 'VERIFICATION_REQUIRED') {
                          showError('You must submit verification documents (profile photo and ID) before creating listings. Please complete verification in your profile first.');
                        } else {
                          showError(error.message || 'Failed to create listing');
                        }
                      } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-secondary disabled:bg-brand-secondary/50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Listing'}
                </button>
                <button
                  onClick={() => {
                        setCurrentView('list');
                    setListingFormData({
                      title: '',
                      description: '',
                      price: '',
                      location: '',
                      bedrooms: '',
                      propertyType: '',
                      imageUrl: '',
                      videoUrl: '',
                      landlordName: '',
                      landlordEmail: '',
                      landlordPhone: ''
                    });
                  }}
                  className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {currentView === 'upload' && currentPage === 'feels' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-md p-6">
            <button onClick={() => setCurrentView('list')} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
              <CloseIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Upload Feels Video</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Video URL (YouTube)</label>
                <input
                  type="text"
                  value={uploadData.videoUrl}
                  onChange={(e) => setUploadData({ ...uploadData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Caption (optional)</label>
                <textarea
                  value={uploadData.caption}
                  onChange={(e) => setUploadData({ ...uploadData, caption: e.target.value })}
                  placeholder="Add a caption..."
                  rows={3}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Music/Credit (optional)</label>
                <input
                  type="text"
                  value={uploadData.music}
                  onChange={(e) => setUploadData({ ...uploadData, music: e.target.value })}
                  placeholder="Original Audio - @username"
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUploadFeelsVideo}
                  disabled={uploading || !videoFile}
                  className="flex-1 bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-secondary disabled:bg-brand-secondary/50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-5 h-5" />
                      <span>Upload Video</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setCurrentView('list');
                    setVideoFile(null);
                    setVideoPreview(null);
                    setUploadData({ videoUrl: '', caption: '', music: '' });
                    if (videoFileInputRef.current) {
                      videoFileInputRef.current.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User View */}
      {currentView === 'edit' && activeTab === 'users' && editingUser && (
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Edit User</h2>
            <button onClick={() => { setCurrentView('list'); setEditingUser(null); }} className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
              <CloseIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Email</label>
                <input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Full Name</label>
                <input
                  type="text"
                  value={editUserData.fullName}
                  onChange={(e) => setEditUserData({ ...editUserData, fullName: e.target.value })}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Role</label>
                <select
                  value={editUserData.role}
                  onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                >
                  <option value="SEEKER">Seeker</option>
                  <option value="LANDLORD">Landlord</option>
                  <option value="AGENT">Agent</option>
                  <option value="REFERRER">Referrer</option>
                  <option value="TENANT">Tenant</option>
                  <option value="INVESTOR">Investor</option>
                  <option value="ARTISAN">Artisan</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-light-text-primary dark:text-dark-text-primary">
                  <input
                    type="checkbox"
                    checked={editUserData.isPremium}
                    onChange={(e) => setEditUserData({ ...editUserData, isPremium: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Premium User
                </label>
                <label className="flex items-center gap-2 text-sm text-light-text-primary dark:text-dark-text-primary">
                  <input
                    type="checkbox"
                    checked={editUserData.isVerified}
                    onChange={(e) => setEditUserData({ ...editUserData, isVerified: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Verified
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveUser}
                  disabled={loading || !editUserData.email.trim()}
                  className="flex-1 bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-secondary disabled:bg-brand-secondary/50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => { setCurrentView('list'); setEditingUser(null); }}
                  className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Accommodation Modal */}
      {currentView === 'create' && (currentPage === 'accommodations' || currentPage === 'listings') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-2xl p-6 my-8">
            <button onClick={() => setCurrentView('list')} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
              <CloseIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-2 text-light-text-primary dark:text-dark-text-primary">Create New Accommodation Listing</h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">Upload accommodation listings for seekers to find. This is separate from Marketplace products.</p>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Title *</label>
                <input
                  type="text"
                  value={listingFormData.title}
                  onChange={(e) => setListingFormData({ ...listingFormData, title: e.target.value })}
                  placeholder="e.g., Beautiful 3 Bedroom Apartment"
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Description</label>
                <textarea
                  value={listingFormData.description}
                  onChange={(e) => setListingFormData({ ...listingFormData, description: e.target.value })}
                  placeholder="Describe the property..."
                  rows={3}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Price *</label>
                  <input
                    type="text"
                    value={listingFormData.price}
                    onChange={(e) => setListingFormData({ ...listingFormData, price: e.target.value })}
                    placeholder="₦2.5M/year"
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Location *</label>
                  <input
                    type="text"
                    value={listingFormData.location}
                    onChange={(e) => setListingFormData({ ...listingFormData, location: e.target.value })}
                    placeholder="Lagos, Ikeja"
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Bedrooms</label>
                  <input
                    type="number"
                    value={listingFormData.bedrooms}
                    onChange={(e) => setListingFormData({ ...listingFormData, bedrooms: e.target.value })}
                    placeholder="3"
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Property Type</label>
                  <select
                    value={listingFormData.propertyType}
                    onChange={(e) => setListingFormData({ ...listingFormData, propertyType: e.target.value })}
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  >
                    <option value="">Select type</option>
                    <option value="RESIDENTIAL_HOUSE">Residential House</option>
                    <option value="HOTEL">Hotel</option>
                    <option value="OFFICE_SPACE">Office Space</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="DUPLEX">Duplex</option>
                    <option value="BUNGALOW">Bungalow</option>
                    <option value="SELF_CONTAIN">Self Contain</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Image URL</label>
                  <input
                    type="url"
                    value={listingFormData.imageUrl}
                    onChange={(e) => setListingFormData({ ...listingFormData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Video URL</label>
                  <input
                    type="url"
                    value={listingFormData.videoUrl}
                    onChange={(e) => setListingFormData({ ...listingFormData, videoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="border-t border-light-border dark:border-dark-border pt-4 mt-4">
                <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Landlord Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Landlord Name</label>
                    <input
                      type="text"
                      value={listingFormData.landlordName}
                      onChange={(e) => setListingFormData({ ...listingFormData, landlordName: e.target.value })}
                      placeholder="John Doe"
                      className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Landlord Email</label>
                      <input
                        type="email"
                        value={listingFormData.landlordEmail}
                        onChange={(e) => setListingFormData({ ...listingFormData, landlordEmail: e.target.value })}
                        placeholder="landlord@example.com"
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Landlord Phone</label>
                      <input
                        type="tel"
                        value={listingFormData.landlordPhone}
                        onChange={(e) => setListingFormData({ ...listingFormData, landlordPhone: e.target.value })}
                        placeholder="+234 800 000 0000"
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={async () => {
                    if (!listingFormData.title || !listingFormData.price || !listingFormData.location) {
                      showError('Please fill in all required fields (Title, Price, Location)');
                      return;
                    }
                    try {
                      setLoading(true);
                      const listingData: any = {
                        title: listingFormData.title,
                        description: listingFormData.description || undefined,
                        price: listingFormData.price,
                        location: listingFormData.location,
                        bedrooms: listingFormData.bedrooms ? parseInt(listingFormData.bedrooms) : undefined,
                        propertyType: listingFormData.propertyType || undefined,
                        imageUrl: listingFormData.imageUrl || undefined,
                        videoUrl: listingFormData.videoUrl || undefined,
                        landlordName: listingFormData.landlordName || undefined,
                        landlordEmail: listingFormData.landlordEmail || undefined,
                        landlordPhone: listingFormData.landlordPhone || undefined,
                      };
                      const response = await listingsAPI.create(listingData);
                      if (response.success) {
                        showSuccess('Listing created successfully!');
                        setCurrentView('list');
                        setListingFormData({
                          title: '',
                          description: '',
                          price: '',
                          location: '',
                          bedrooms: '',
                          propertyType: '',
                          imageUrl: '',
                          videoUrl: '',
                          landlordName: '',
                          landlordEmail: '',
                          landlordPhone: ''
                        });
                        loadListings();
                      } else {
                        showError(response.message || 'Failed to create listing');
                      }
                      } catch (error: any) {
                        // Handle verification errors specifically
                        if (error.response?.data?.code === 'VERIFICATION_PENDING') {
                          showError('Your verification is pending. Please wait for admin approval before creating listings.');
                        } else if (error.response?.data?.code === 'VERIFICATION_REJECTED') {
                          showError('Your verification was rejected. Please submit new verification documents in your profile.');
                        } else if (error.response?.data?.code === 'VERIFICATION_REQUIRED') {
                          showError('You must submit verification documents (profile photo and ID) before creating listings. Please complete verification in your profile first.');
                        } else {
                          showError(error.message || 'Failed to create listing');
                        }
                      } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-secondary disabled:bg-brand-secondary/50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Listing'}
                </button>
                <button
                  onClick={() => {
                        setCurrentView('list');
                    setListingFormData({
                      title: '',
                      description: '',
                      price: '',
                      location: '',
                      bedrooms: '',
                      propertyType: '',
                      imageUrl: '',
                      videoUrl: '',
                      landlordName: '',
                      landlordEmail: '',
                      landlordPhone: ''
                    });
                  }}
                  className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {currentView === 'upload' && currentPage === 'feels' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-md p-6">
            <button onClick={() => setCurrentView('list')} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
              <CloseIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Upload Feels Video</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Video URL (YouTube)</label>
                <input
                  type="text"
                  value={uploadData.videoUrl}
                  onChange={(e) => setUploadData({ ...uploadData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Caption (optional)</label>
                <textarea
                  value={uploadData.caption}
                  onChange={(e) => setUploadData({ ...uploadData, caption: e.target.value })}
                  placeholder="Add a caption..."
                  rows={3}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Music/Credit (optional)</label>
                <input
                  type="text"
                  value={uploadData.music}
                  onChange={(e) => setUploadData({ ...uploadData, music: e.target.value })}
                  placeholder="Original Audio - @username"
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUploadFeelsVideo}
                  disabled={uploading || !uploadData.videoUrl.trim()}
                  className="flex-1 bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-secondary disabled:bg-brand-secondary/50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
                <button
                  onClick={() => setCurrentView('list')}
                  className="px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
