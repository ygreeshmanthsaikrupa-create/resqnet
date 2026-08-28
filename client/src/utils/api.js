const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('resqnet_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const request = async (path, options = {}) => {
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...getAuthHeaders(),
    ...options.headers,
  };
  
  const config = {
    ...options,
    headers,
  };

  if (!isFormData && config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, config);
    
    // Catch session expiration (401)
    if (response.status === 401 && localStorage.getItem('resqnet_token')) {
      if (path !== '/auth/login' && path !== '/auth/signup') {
        console.warn('Session expired or unauthorized token.');
      }
    }

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const errorMessage = data.error || data.message || `Request failed (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Base HTTP verbs
const get = (path, params) => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return request(`${path}${query}`);
};
const post = (path, data) => request(path, { method: 'POST', body: data });
const patch = (path, data) => request(path, { method: 'PATCH', body: data });
const del = (path) => request(path, { method: 'DELETE' });
const upload = (path, formData) => request(path, { method: 'POST', body: formData });

// Domain helper methods
export const login = (username, password) => post('/auth/login', { username, password });
export const signup = (username, password, name, role) => post('/auth/signup', { username, password, name, role });
export const getDisasters = () => get('/disasters');
export const getAlerts = (params) => get('/alerts', params);
export const getAlertHistory = () => get('/alerts/history');
export const createAlert = (data) => post('/alerts', data);
export const getReports = (params) => get('/reports', params);
export const createReport = (data) => post('/reports', data);
export const updateReport = (id, data) => patch(`/reports/${id}`, data);
export const confirmReport = (id) => post(`/reports/${id}/confirm`);
export const uploadReportImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return upload('/reports/upload', formData);
};
export const getResources = (params) => get('/resources', params);
export const updateResource = (id, data) => patch(`/resources/${id}`, data);
export const getMapZones = () => get('/map/zones');
export const getMapMarkers = () => get('/map/markers');
export const getDashboardStats = () => get('/dashboard/stats');
export const startSimulation = (speed) => post('/simulation/start', { speed });
export const stopSimulation = () => post('/simulation/stop');
export const resetSimulation = () => post('/simulation/reset');
export const getSimulationStatus = () => get('/simulation/status');

// Export unified api object containing both verbs and domain methods
export const api = {
  get,
  post,
  patch,
  delete: del,
  upload,
  login,
  signup,
  getDisasters,
  getAlerts,
  getAlertHistory,
  createAlert,
  getReports,
  createReport,
  updateReport,
  confirmReport,
  uploadReportImage,
  getResources,
  updateResource,
  getMapZones,
  getMapMarkers,
  getDashboardStats,
  startSimulation,
  stopSimulation,
  resetSimulation,
  getSimulationStatus
};

export default api;
