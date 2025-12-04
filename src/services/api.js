// Use environment variable for API URL in production, fallback to relative path
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : '/api';

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Check if response has success: false (backend error format)
    // Backend returns { success: false, error: '...' } for errors
    if (data.success === false) {
      throw new Error(data.error || 'Request failed');
    }
    
    // Also check HTTP status codes
    if (!response.ok) {
      // Better error message extraction
      const errorMsg = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error) {
    // If it's already an Error object, rethrow it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise create a new error
    throw new Error(error.message || 'Network error. Please check your connection.');
  }
};

// Auth API
export const authAPI = {
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: userData,
  }),
  
  login: (email, password) => apiCall('/auth/login', {
    method: 'POST',
    body: { email, password },
  }),
  
  getMe: () => apiCall('/auth/me'),
  
  verifyInvitation: (token) => apiCall(`/auth/invitation/${token}`),
};

// Users API
export const usersAPI = {
  getAll: () => apiCall('/users'),
  getSubcontractors: (trade, region) => {
    let url = '/users?role=sub';
    if (trade) url += `&trade=${encodeURIComponent(trade)}`;
    if (region) url += `&region=${encodeURIComponent(region)}`;
    return apiCall(url);
  },
  getById: (id) => apiCall(`/users/${id}`),
  create: (userData) => apiCall('/users', {
    method: 'POST',
    body: userData,
  }),
  updateProfile: (profileData) => apiCall('/users/me', {
    method: 'PUT',
    body: profileData,
  }),
};

// Projects API (GC)
export const projectsAPI = {
  getGCProjects: (status) => apiCall(`/projects/gc${status ? `?status=${status}` : ''}`),
  getGCProject: (id) => apiCall(`/projects/gc/${id}`),
  createProject: (projectData) => apiCall('/projects/gc', {
    method: 'POST',
    body: projectData,
  }),
  updateProject: (id, projectData) => apiCall(`/projects/gc/${id}`, {
    method: 'PUT',
    body: projectData,
  }),
  deleteProject: (id) => apiCall(`/projects/gc/${id}`, {
    method: 'DELETE',
  }),
  inviteSub: (projectId, inviteData) => apiCall(`/projects/gc/${projectId}/invite`, {
    method: 'POST',
    body: inviteData,
  }),
  generateComparison: (projectId) => apiCall(`/projects/gc/${projectId}/ai/comparison`, {
    method: 'POST',
  }),
  getComparison: (projectId) => apiCall(`/projects/gc/${projectId}/ai/comparison`),
};

// Projects API (Sub)
export const subProjectsAPI = {
  getSubProjects: () => apiCall('/projects/sub'),
  getSubProject: (id) => apiCall(`/projects/sub/${id}`),
  respondToInvitation: (projectId, response) => apiCall(`/projects/sub/${projectId}/respond`, {
    method: 'POST',
    body: { response },
  }),
};

// Bids API
export const bidsAPI = {
  submitBid: (projectId, bidData) => apiCall(`/bids/project/${projectId}`, {
    method: 'POST',
    body: bidData,
  }),
  getProjectBids: (projectId) => apiCall(`/bids/project/${projectId}`),
  updateBidStatus: (bidId, status) => apiCall(`/bids/${bidId}/status`, {
    method: 'PUT',
    body: { status },
  }),
};

// Admin API
export const adminAPI = {
  getUsers: (role) => apiCall(`/admin/users${role ? `?role=${role}` : ''}`),
  toggleBidlyAccess: (userId, access) => apiCall(`/admin/users/${userId}/bidly-access`, {
    method: 'PUT',
    body: { bidly_access: access },
  }),
  updateSubscriptionTier: (userId, tier) => apiCall(`/admin/users/${userId}/subscription-tier`, {
    method: 'PUT',
    body: { subscription_tier: tier },
  }),
  getProjects: () => apiCall('/admin/projects'),
};

// Referrals API (Growth Flywheel)
export const referralsAPI = {
  getStats: () => apiCall('/referrals/stats'),
  sendInvite: (email, targetRole) => apiCall('/referrals/invite', {
    method: 'POST',
    body: { email, target_role: targetRole },
  }),
  getLeaderboard: () => apiCall('/referrals/leaderboard'),
};

// Utils API
export const utilsAPI = {
  extractEmails: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/utils/extract-emails`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to extract emails');
    }
    
    return data;
  },
};

export default apiCall;

