import axios from 'axios';
import { storage } from '../lib/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS !== 'false';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper for simulated network delay when in mock mode
export const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));


let unauthorizedHandler: (() => void) | null = null;
/** Registered once by the app root; called when the server says the session is no longer valid. */
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  unauthorizedHandler = fn;
};

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    // Login calls return 401 for wrong credentials; those must not log the user out.
    const url: string = error?.config?.url ?? '';
    if (error?.response?.status === 401 && !url.startsWith('/auth/')) unauthorizedHandler?.();
    return Promise.reject(error);
  },
);
