import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const API = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para agregar token JWT a cada request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (username, email, password, full_name) =>
    API.post('/auth/register', { username, email, password, full_name }),
  login: (username, password) => API.post('/auth/login', { username, password }),
};

// Products
export const productsAPI = {
  getAll: () => API.get('/products'),
  create: (product) => API.post('/products', product),
  updateStock: (id, stock_quantity) => API.put(`/products/${id}/stock`, { stock_quantity }),
};

// Sales
export const salesAPI = {
  create: (sale) => API.post('/sales', sale),
  getAll: () => API.get('/sales'),
  getByDate: (date) => API.get('/sales/by-date', { params: { date } }),
};

// Purchases
export const purchasesAPI = {
  create: (purchase) => API.post('/purchases', purchase),
  getAll: () => API.get('/purchases'),
  getByDate: (date) => API.get('/purchases/by-date', { params: { date } }),
};

// Dashboard
export const dashboardAPI = {
  getToday: () => API.get('/dashboard/today'),
  getMonth: () => API.get('/dashboard/month'),
  getInventory: () => API.get('/dashboard/inventory'),
};

export default API;
