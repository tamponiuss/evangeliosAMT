import axios from 'axios';

const base = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: base || undefined,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('ev_token');
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ev_token');
      localStorage.removeItem('ev_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
