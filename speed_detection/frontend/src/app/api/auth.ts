import { apiFetch } from './client';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  role: 'driver' | 'official' | 'admin';
  phone_number?: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface MeResponse {
  authenticated: boolean;
  user?: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const payload = await apiFetch('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return (payload as AuthResponse).user;
}

export async function register(data: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}): Promise<AuthUser> {
  const payload = await apiFetch('/api/auth/register/', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      username: data.email,
      password: data.password,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      role: data.role || 'driver',
    }),
  });
  return (payload as AuthResponse).user;
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout/', { method: 'POST' });
}

export async function me(): Promise<MeResponse> {
  return apiFetch('/api/auth/me/');
}

