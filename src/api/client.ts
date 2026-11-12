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

