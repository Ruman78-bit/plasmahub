import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '';
const normalizeBaseUrl = (url) => {
  if (!url) return '/api';
  const trimmed = url.replace(/\/+$|\s+$/g, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};
const baseURL = normalizeBaseUrl(rawBaseUrl);
const api = axios.create({ baseURL });

// Attach JWT on every outbound request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  login:    (d) => api.post('/auth/login', d),
  getMe:    ()  => api.get('/auth/me'),
};

export const patientAPI = {
  createRequest: (d)   => api.post('/patient/requests', d),
  getRequests:   ()    => api.get('/patient/requests'),
  cancelRequest: (id)  => api.delete(`/patient/requests/${id}`),
  getHospitals:  (bg)  => api.get('/patient/hospitals', { params: bg ? { bloodGroup: bg } : {} }),
};

export const hospitalAPI = {
  getInventory:    ()        => api.get('/hospital/inventory'),
  updateInventory: (stock)   => api.put('/hospital/inventory', { stock }),
  getRequests:     (status)  => api.get('/hospital/requests', { params: status ? { status } : {} }),
  updateRequest:   (id, d)   => api.patch(`/hospital/requests/${id}`, d),
  getStats:        ()        => api.get('/hospital/stats'),
};

export const adminAPI = {
  getMetrics:   ()      => api.get('/admin/metrics'),
  getUsers:     (p)     => api.get('/admin/users', { params: p }),
  getRequests:  (p)     => api.get('/admin/requests', { params: p }),
  getInventory: ()      => api.get('/admin/inventory'),
};

export default api;