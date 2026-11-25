import { create } from 'axios';
import { storage } from '../lib/storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const apiClient = create({
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

/**
 * A picked file (local uri) in the form React Native's FormData sends as a real file.
 * The backend checks the real content, so the type here only helps the upload.
 */
export const fileForUpload = (uri: string, name: string, mimeType?: string) =>
  ({ uri, name, type: mimeType ?? 'application/octet-stream' }) as unknown as Blob;

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
    // The backend explains every error as { message, code }. Pass those on, so the screens
    // show "Please upload a PDF..." instead of "Request failed with status code 415".
    const body = error?.response?.data;
    if (body && typeof body.message === 'string') {
      error.message = body.message;
      error.code = body.code;
    }
    return Promise.reject(error);
  },
);
