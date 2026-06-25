export interface User {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  admin?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  hasMfa: boolean;
}
