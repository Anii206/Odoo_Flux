export type UserRole = 'admin' | 'staff' | 'customer';

export interface UserSummary {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export type User = UserSummary;

export interface AuthResponse {
  token: string;
  user: UserSummary;
}

