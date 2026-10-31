import { request } from './client';
import { AuthResponse, UserSummary } from '../types';

export async function signup(
  emailOrPayload: string | { email: string; password: string },
  password?: string
): Promise<AuthResponse> {
  const payload = typeof emailOrPayload === 'string'
    ? { email: emailOrPayload, password: password! }
    : emailOrPayload;
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(
  emailOrPayload: string | { email: string; password: string },
  password?: string
): Promise<AuthResponse> {
  const payload = typeof emailOrPayload === 'string'
    ? { email: emailOrPayload, password: password! }
    : emailOrPayload;
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(
  emailOrPayload: string | { email: string }
): Promise<{ message: string; success: boolean }> {
  const payload = typeof emailOrPayload === 'string'
    ? { email: emailOrPayload }
    : emailOrPayload;
  return request<{ message: string; success: boolean }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(
  tokenOrPayload: string | { token: string; new_password: string },
  newPassword?: string
): Promise<{ message: string; success: boolean }> {
  const payload = typeof tokenOrPayload === 'string'
    ? { token: tokenOrPayload, new_password: newPassword! }
    : tokenOrPayload;
  return request<{ message: string; success: boolean }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe(): Promise<UserSummary> {
  return request<UserSummary>('/auth/me');
}

export async function createStaff(
  emailOrPayload: string | { email: string; password: string },
  password?: string
): Promise<UserSummary> {
  const payload = typeof emailOrPayload === 'string'
    ? { email: emailOrPayload, password: password! }
    : emailOrPayload;
  return request<UserSummary>('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getUsers(): Promise<UserSummary[]> {
  return request<UserSummary[]>('/admin/users');
}

export const authApi = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  me: getMe,
  createStaff,
  listUsers: getUsers,
};
