import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('solarassist_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const data = (request) => request.then((response) => response.data);

export const getVendorServiceRequests = () => data(api.get('/vendor/service-requests'));
export const getVendorServiceMessages = (requestId) => data(api.get(`/vendor/service-requests/${requestId}/messages`));
export const sendVendorServiceMessage = (requestId, message) => data(
  api.post(`/vendor/service-requests/${requestId}/messages`, { message }),
);
export const updateVendorServiceRequestStatus = (requestId, status) => data(
  api.patch(`/vendor/service-requests/${requestId}`, { status }),
);

export const getUserServiceRequests = () => data(api.get('/user/service-requests'));
export const getUserServiceMessages = (requestId) => data(api.get(`/user/service-requests/${requestId}/messages`));
export const sendUserServiceMessage = (requestId, message) => data(
  api.post(`/user/service-requests/${requestId}/messages`, { message }),
);
export const createServiceRequest = (payload) => data(api.post('/user/service-requests', payload));
export const getServiceProviders = () => data(api.get('/user/vendors'));

export const getVendorRequests = () => data(api.get('/vendor/requests'));
export const updateVendorRequestStatus = (requestId, payload) => data(
  api.put(`/vendor/requests/${requestId}`, payload),
);
export const getVendorDashboard = () => data(api.get('/vendor/dashboard'));
export const getVendorReports = () => data(api.get('/vendor/reports'));
export const getVendorProducts = () => data(api.get('/vendor/products'));
export const createVendorProduct = (payload) => data(api.post('/vendor/products', payload));
export const updateVendorProduct = (productId, payload) => data(api.put(`/vendor/products/${productId}`, payload));
export const deleteVendorProduct = (productId) => data(api.delete(`/vendor/products/${productId}`));
export const getVendorProfile = () => data(api.get('/vendor/profile'));
export const updateVendorProfile = (payload) => data(api.put('/vendor/profile', payload));
export const getRepairProviderProfile = () => data(api.get('/vendor/profile'));
export const updateRepairProviderProfile = (payload) => data(api.put('/vendor/profile', payload));

export const getAdminDashboard = () => data(api.get('/admin/dashboard'));
export const getAdminUsers = () => data(api.get('/admin/users'));
export const updateAdminUser = (userId, payload) => data(api.put(`/admin/users/${userId}`, payload));
export const toggleAdminUserStatus = (userId) => data(api.patch(`/admin/users/${userId}/status`));
export const getAdminVendors = () => data(api.get('/admin/vendors'));
export const approveVendorAccount = (vendorId) => data(api.post(`/admin/vendors/${vendorId}/approve`));
export const rejectVendorAccount = (vendorId) => data(api.post(`/admin/vendors/${vendorId}/reject`));
export const getAdminRepairProviders = () => data(api.get('/admin/repair-providers'));
export const approveRepairProvider = (providerId) => data(api.post(`/admin/repair-providers/${providerId}/approve`));
export const rejectRepairProvider = (providerId) => data(api.post(`/admin/repair-providers/${providerId}/reject`));
export const getAdminAnalytics = () => data(api.get('/admin/analytics'));
export const getAdminSettings = () => data(api.get('/admin/settings'));
export const updateAdminSetting = (settingKey, payload) => data(api.put(`/admin/settings/${settingKey}`, payload));

export const getAccountProfile = () => data(api.get('/account/profile'));
export const updateAccountProfile = (payload) => data(api.put('/account/profile', payload));
export const linkGoogleAccount = (credential) => data(api.post('/account/google/link', { credential }));
export const fetchFinancialAnalysis = (payload) => data(api.post('/pipeline/financial-analysis', payload));
export const generateRecommendation = (payload) => data(api.post('/pipeline/recommend', payload));

export default api;