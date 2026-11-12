export type UserRole = 'worker' | 'employer' | 'admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string;
  verified: boolean;
  onboarded: boolean;
  city?: string;
  trade?: string;
  companyName?: string;
  status?: 'active' | 'pending' | 'blocked';
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole;
  login: (user: User, token: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateUser: (partial: Partial<User>) => void;
}
