import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const API = axios.create({
  baseURL: API_BASE_URL,
});

const responseCache = new Map();

const makeCacheKey = (url, params = {}) => `${url}|${JSON.stringify(params)}`;

const getCachedResponse = (key, ttlMs) => {
  const entry = responseCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > ttlMs) {
    responseCache.delete(key);
    return null;
  }

  return {
    data: entry.data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  };
};

const invalidateCacheByPrefix = (prefixes) => {
  for (const key of responseCache.keys()) {
    if (prefixes.some((prefix) => key.startsWith(`${prefix}|`) || key.startsWith(prefix))) {
      responseCache.delete(key);
    }
  }
};

const cachedGet = async (url, config = {}, ttlMs = 60_000) => {
  const key = makeCacheKey(url, config.params || {});
  const cached = getCachedResponse(key, ttlMs);
  if (cached) return cached;

  const response = await API.get(url, config);
  responseCache.set(key, {
    data: response.data,
    timestamp: Date.now(),
  });
  return response;
};

export const clearApiCache = () => {
  responseCache.clear();
};

export const warmupAppCache = async () => {
  await Promise.allSettled([
    cachedGet('/dashboard/today', {}, 30_000),
    cachedGet('/dashboard/month', {}, 30_000),
    cachedGet('/products', {}, 120_000),
    cachedGet('/sales', {}, 60_000),
    cachedGet('/purchases', {}, 60_000),
    cachedGet('/purchases/consumables-stock', {}, 60_000),
  ]);
};

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
  getAll: () => cachedGet('/products', {}, 120_000),
  create: async (product) => {
    const response = await API.post('/products', product);
    invalidateCacheByPrefix(['/products', '/dashboard/inventory']);
    return response;
  },
  updateStock: async (id, stock_quantity) => {
    const response = await API.put(`/products/${id}/stock`, { stock_quantity });
    invalidateCacheByPrefix(['/products', '/dashboard/inventory']);
    return response;
  },
};

// Sales
export const salesAPI = {
  create: async (sale) => {
    const response = await API.post('/sales', sale);
    invalidateCacheByPrefix(['/sales', '/dashboard', '/purchases/consumables-stock']);
    return response;
  },
  getAll: () => cachedGet('/sales', {}, 60_000),
  getByDate: (date) => cachedGet('/sales/by-date', { params: { date } }, 60_000),
  getConsumables: () => cachedGet('/sales/consumables', {}, 60_000),
  getProductConsumables: (productId) => cachedGet(`/sales/product-consumables/${productId}`, {}, 60_000),
  saveProductConsumables: async (productId, consumables) => {
    const response = await API.put(`/sales/product-consumables/${productId}`, { consumables });
    invalidateCacheByPrefix([`/sales/product-consumables/${productId}`]);
    return response;
  },
};

// Purchases
export const purchasesAPI = {
  create: async (purchase) => {
    const response = await API.post('/purchases', purchase);
    invalidateCacheByPrefix(['/purchases', '/sales/consumables']);
    return response;
  },
  getAll: () => cachedGet('/purchases', {}, 60_000),
  getByDate: (date) => cachedGet('/purchases/by-date', { params: { date } }, 60_000),
  getConsumablesStock: () => cachedGet('/purchases/consumables-stock', {}, 60_000),
};

// Dashboard
export const dashboardAPI = {
  getToday: () => cachedGet('/dashboard/today', {}, 30_000),
  getMonth: () => cachedGet('/dashboard/month', {}, 30_000),
  getInventory: () => cachedGet('/dashboard/inventory', {}, 30_000),
};

// Reset
export const resetAPI = {
  getInfo: () => cachedGet('/reset/info', {}, 30_000),
  execute: (data) => API.post('/reset/execute', data),
};

export default API;
