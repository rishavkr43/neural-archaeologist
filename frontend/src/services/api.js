import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const auth = {
  register: (email, password) =>
    api.post('/api/auth/register', { email, password }),
  
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
};

// Investigation APIs
export const investigations = {
  create: (repoUrl) =>
    api.post('/api/investigations/', { repo_url: repoUrl }),
  
  get: (id) =>
    api.get(`/api/investigations/${id}`),
  
  list: (skip = 0, limit = 20) =>
    api.get(`/api/investigations/`, { params: { skip, limit } }),
  
  delete: (id) =>
    api.delete(`/api/investigations/${id}`),
  
  getLogs: (id) =>
    api.get(`/api/investigations/${id}/logs`),
};

export default api;