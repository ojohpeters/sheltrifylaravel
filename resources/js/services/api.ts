const envApi = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const API_BASE =
  envApi && envApi.length > 0 ? envApi.replace(/\/$/, '') : '/api';

const VIDEO_MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  return (
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ??
    ''
  );
}

function clearClientAuthCache(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('user');
}

const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const method = (options.method || 'GET').toUpperCase();
  const baseHeaders: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!(options.body instanceof FormData)) {
    baseHeaders['Content-Type'] = 'application/json';
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    baseHeaders['X-CSRF-TOKEN'] = getCsrfToken();
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: baseHeaders,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Request failed' }));
    const errorMessage =
      error.message ||
      error.error ||
      `HTTP error! status: ${response.status}`;

    console.error('API Error:', { status: response.status, error });

    const apiError: any = new Error(errorMessage);
    apiError.response = {
      status: response.status,
      data: error,
    };
    throw apiError;
  }

  return response.json();
};

// Auth API
export const authAPI = {
  signup: async (data: { email: string; password: string; fullName?: string; phone?: string; whatsapp?: string; role?: string; avatarUrl?: string; artisanService?: string; artisanLocation?: string; artisanBio?: string }) => {
    const response = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response;
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return response;
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: '{}',
      });
    } catch {
      /* ignore network errors */
    }
    clearClientAuthCache();
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  forgotPassword: async (email: string) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, newPassword: string) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
};

// Listings API
export const listingsAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; propertyType?: string; location?: string; minBedrooms?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest(`/listings${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/listings/${id}`);
  },

  create: async (data: any) => {
    return apiRequest('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiRequest(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/listings/${id}`, {
      method: 'DELETE',
    });
  },

  getMyListings: async () => {
    return apiRequest('/listings/user/my-listings');
  },

  boost: async (listingId: string, duration?: number) => {
    return apiRequest(`/listings/${listingId}/boost`, {
      method: 'POST',
      body: JSON.stringify({ duration }),
    });
  },
};

// Favorites API
export const favoritesAPI = {
  getAll: async () => {
    return apiRequest('/favorites');
  },

  add: async (listingId: string) => {
    return apiRequest(`/favorites/${listingId}`, {
      method: 'POST',
    });
  },

  remove: async (listingId: string) => {
    return apiRequest(`/favorites/${listingId}`, {
      method: 'DELETE',
    });
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    return apiRequest('/users/profile');
  },

  updateProfile: async (data: { fullName?: string; phone?: string; avatarUrl?: string }) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  upgradePremium: async () => {
    return apiRequest('/users/upgrade-premium', {
      method: 'POST',
    });
  },

  upgradeChat: async () => {
    return apiRequest('/users/upgrade-chat', {
      method: 'POST',
    });
  },

  submitVerification: async (data: { verificationPhotoUrl: string; verificationIdUrl: string; verificationIdType: string }) => {
    return apiRequest('/users/submit-verification', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Admin API
export const adminAPI = {
  getUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest(`/admin/users${query ? `?${query}` : ''}`);
  },

  getUser: async (id: string) => {
    return apiRequest(`/admin/users/${id}`);
  },

  updateUser: async (id: string, data: { email?: string; fullName?: string; phone?: string; role?: string; isPremium?: boolean; isVerified?: boolean; artisanService?: string; artisanLocation?: string; artisanBio?: string }) => {
    return apiRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteUser: async (id: string) => {
    return apiRequest(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  getListings: async (params?: { page?: number; limit?: number; search?: string; propertyType?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest(`/admin/listings${query ? `?${query}` : ''}`);
  },

  getListing: async (id: string) => {
    return apiRequest(`/admin/listings/${id}`);
  },

  updateListing: async (id: string, data: any) => {
    return apiRequest(`/admin/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteListing: async (id: string) => {
    return apiRequest(`/admin/listings/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async () => {
    return apiRequest('/admin/stats');
  },

  approveMarketplaceProduct: async (id: string) => {
    return apiRequest(`/admin/marketplace/${id}/approve`, {
      method: 'PUT',
    });
  },

  rejectMarketplaceProduct: async (id: string) => {
    return apiRequest(`/admin/marketplace/${id}/reject`, {
      method: 'PUT',
    });
  },

  getPendingMarketplaceProducts: async () => {
    return apiRequest('/admin/marketplace/pending');
  },

  getPendingVerifications: async () => {
    return apiRequest('/admin/verifications/pending');
  },

  approveVerification: async (userId: string) => {
    return apiRequest(`/admin/verifications/${userId}/approve`, {
      method: 'PUT',
    });
  },

  rejectVerification: async (userId: string, reason?: string) => {
    return apiRequest(`/admin/verifications/${userId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  // Advanced Analytics
  getAnalytics: async (params?: { period?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest(`/admin/analytics${query ? `?${query}` : ''}`);
  },

  // System Health
  getSystemHealth: async () => {
    return apiRequest('/admin/system-health');
  },

  // Transactions
  getTransactions: async (params?: { page?: number; limit?: number; status?: string; type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest(`/admin/transactions${query ? `?${query}` : ''}`);
  },

  // Content Management
  getContent: async (params?: { type?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest(`/admin/content${query ? `?${query}` : ''}`);
  },

  // AI Management
  getAIStats: async () => {
    return apiRequest('/admin/ai/stats');
  },

  // Bulk Operations
  bulkAction: async (data: { action: string; type: string; ids: string[] }) => {
    return apiRequest('/admin/bulk-action', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    return apiRequest('/dashboard/stats');
  },

  getEarnings: async () => {
    return apiRequest('/dashboard/earnings');
  },
};

// Marketplace API
export const marketplaceAPI = {
  getAll: async (params?: { category?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest(`/marketplace${query ? `?${query}` : ''}`);
  },

  getByCategory: async (category: string) => {
    return apiRequest(`/marketplace/category/${category}`);
  },

  create: async (data: any) => {
    return apiRequest('/marketplace', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyProducts: async () => {
    return apiRequest('/marketplace/my-products');
  },

  update: async (id: string, data: any) => {
    return apiRequest(`/marketplace/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/marketplace/${id}`, {
      method: 'DELETE',
    });
  },
};

// Cart API
export const cartAPI = {
  getAll: async () => {
    return apiRequest('/cart');
  },

  add: async (productId: string, quantity: number = 1) => {
    return apiRequest(`/cart/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    });
  },

  update: async (productId: string, quantity: number) => {
    return apiRequest(`/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  remove: async (productId: string) => {
    return apiRequest(`/cart/${productId}`, {
      method: 'DELETE',
    });
  },

  clear: async () => {
    return apiRequest('/cart', {
      method: 'DELETE',
    });
  },
};

// Upload API — all uploads handled by Laravel PHP (no third-party handler)
export const uploadAPI = {
  uploadImage: async (file: File, _requireAuth?: boolean) => {
    if (file.size > IMAGE_MAX_BYTES) {
      throw new Error('Image must be 10 MB or smaller.');
    }
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRF-TOKEN': getCsrfToken(),
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }
    return response.json();
  },

  uploadVideo: async (file: File, _requireAuth?: boolean, onProgress?: (progress: number) => void) => {
    if (file.size > VIDEO_MAX_BYTES) {
      throw new Error('Video must be 20 MB or smaller.');
    }
    return new Promise<any>((resolve, reject) => {
      const formData = new FormData();
      formData.append('video', file);

      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error('Invalid response from server')); }
        } else {
          try { reject(new Error(JSON.parse(xhr.responseText).message || 'Upload failed')); }
          catch { reject(new Error('Upload failed')); }
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

      xhr.open('POST', `${API_BASE}/upload/video`);
      xhr.setRequestHeader('X-CSRF-TOKEN', getCsrfToken());
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send(formData);
    });
  },

  uploadMedia: async (imageFile?: File, videoFile?: File) => {
    if (imageFile && imageFile.size > IMAGE_MAX_BYTES) throw new Error('Image must be 10 MB or smaller.');
    if (videoFile && videoFile.size > VIDEO_MAX_BYTES) throw new Error('Video must be 20 MB or smaller.');

    const formData = new FormData();
    if (imageFile) formData.append('image', imageFile);
    if (videoFile) formData.append('video', videoFile);

    const response = await fetch(`${API_BASE}/upload/media`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRF-TOKEN': getCsrfToken(),
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }
    return response.json();
  },
};

// Community API
export const communityAPI = {
  getPosts: async (params?: { category?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest(`/community/posts${query ? `?${query}` : ''}`);
  },

  getPost: async (id: string) => {
    return apiRequest(`/community/posts/${id}`);
  },

  createPost: async (data: { title: string; content?: string; category?: string; imageUrl?: string; videoUrl?: string }) => {
    return apiRequest('/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  likePost: async (id: string) => {
    return apiRequest(`/community/posts/${id}/like`, {
      method: 'POST',
    });
  },

  lovePost: async (id: string) => {
    return apiRequest(`/community/posts/${id}/love`, {
      method: 'POST',
    });
  },

  addComment: async (postId: string, text: string) => {
    return apiRequest(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  deletePost: async (id: string) => {
    return apiRequest(`/community/posts/${id}`, {
      method: 'DELETE',
    });
  },
};

// Rental Wahala API
export const rentalWahalaAPI = {
  getAll: async () => {
    return apiRequest('/rental-wahala');
  },

  create: async (data: { videoUrl: string; caption?: string; music?: string }) => {
    return apiRequest('/rental-wahala', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { videoUrl?: string; caption?: string; music?: string }) => {
    return apiRequest(`/rental-wahala/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/rental-wahala/${id}`, {
      method: 'DELETE',
    });
  },

  like: async (id: string) => {
    return apiRequest(`/rental-wahala/${id}/like`, {
      method: 'POST',
    });
  },
};

// Feels API
export const feelsAPI = {
  getAll: async () => {
    return apiRequest('/feels');
  },

  create: async (data: { videoUrl: string; caption?: string; music?: string }) => {
    return apiRequest('/feels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { videoUrl?: string; caption?: string; music?: string }) => {
    return apiRequest(`/feels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/feels/${id}`, {
      method: 'DELETE',
    });
  },

  like: async (id: string) => {
    return apiRequest(`/feels/${id}/like`, {
      method: 'POST',
    });
  },

  getComments: async (id: string) => {
    return apiRequest(`/feels/${id}/comments`);
  },

  addComment: async (id: string, text: string) => {
    return apiRequest(`/feels/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },
};

// Investment API
export const investmentAPI = {
  getOpportunities: async () => {
    return apiRequest('/investments/opportunities');
  },

  getOpportunity: async (id: string) => {
    return apiRequest(`/investments/opportunities/${id}`);
  },

  invest: async (opportunityId: string, amount: number) => {
    return apiRequest('/investments/invest', {
      method: 'POST',
      body: JSON.stringify({ opportunityId, amount }),
    });
  },

  getMyInvestments: async () => {
    return apiRequest('/investments/my-investments');
  },

  getStats: async () => {
    return apiRequest('/investments/stats');
  },
};

// Payment API
export const paymentAPI = {
  initialize: async (amount: number, metadata?: any) => {
    return apiRequest('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({ amount, metadata }),
    });
  },

  verify: async (reference: string) => {
    // Payment verification doesn't require auth token (Paystack redirects here)
    const response = await fetch(`${API_BASE}/payments/verify/${reference}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  withdraw: async (data: { amount: number; bankCode: string; accountNumber: string; accountName: string }) => {
    return apiRequest('/payments/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getBanks: async () => {
    return apiRequest('/payments/banks');
  },
};

// Large Transaction API (for transactions that exceed Paystack limits)
export const largeTransactionAPI = {
  createRequest: async (data: {
    amount: number;
    cartItems: Array<{ productId: string; quantity: number; price: number }>;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerAddress?: string;
  }) => {
    return apiRequest('/large-transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyRequests: async () => {
    return apiRequest('/large-transactions/my-requests');
  },
};

// AI API - Get site data for AI context
export const aiAPI = {
  getSiteData: async (params?: { location?: string; propertyType?: string; maxPrice?: number; minBedrooms?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest(`/ai/site-data${query ? `?${query}` : ''}`);
  },

  searchListings: async (params?: { query?: string; location?: string; propertyType?: string; bedrooms?: number; maxPrice?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest(`/ai/search-listings${query ? `?${query}` : ''}`);
  },
};

// Global Tales API
export const globalTalesAPI = {
  getAll: async (params?: { category?: string; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest(`/global-tales${query ? `?${query}` : ''}`);
  },

  getOne: async (id: string) => {
    return apiRequest(`/global-tales/${id}`);
  },

  create: async (data: { title: string; content: string; imageUrl?: string; videoUrl?: string; category?: string; readTime?: number }) => {
    return apiRequest('/global-tales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { title?: string; content?: string; imageUrl?: string; videoUrl?: string; category?: string; readTime?: number }) => {
    return apiRequest(`/global-tales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/global-tales/${id}`, {
      method: 'DELETE',
    });
  },
};

