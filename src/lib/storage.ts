import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

const TOKEN_KEY = 'industrialink_jwt_token';
const USER_KEY = 'industrialink_user_profile';

export const storage = {
  // Token in hardware secure store
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Failed to save secure token', e);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('Failed to delete secure token', e);
    }
  },

  // User Profile
  async getUser(): Promise<User | null> {
    try {
      const data = await SecureStore.getItemAsync(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save user profile', e);
    }
  },

  async removeUser(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.warn('Failed to delete user profile', e);
    }
  },

  async clearAll(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  },
};

