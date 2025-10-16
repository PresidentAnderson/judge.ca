import { jwtVerify, createRemoteJWKSet } from 'jose';
import { cookies } from 'next/headers';

// Stack Auth configuration
const STACK_AUTH_PROJECT_ID = process.env.NEXT_PUBLIC_STACK_PROJECT_ID!;
const STACK_SECRET_SERVER_KEY = process.env.STACK_SECRET_SERVER_KEY!;
const STACK_AUTH_JWKS_URL = `https://api.stack-auth.com/api/v1/projects/${STACK_AUTH_PROJECT_ID}/.well-known/jwks.json`;

if (!STACK_AUTH_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_STACK_PROJECT_ID environment variable is required');
}

if (!STACK_SECRET_SERVER_KEY) {
  throw new Error('STACK_SECRET_SERVER_KEY environment variable is required');
}

// JWT verification using Stack Auth JWKS
const JWKS = createRemoteJWKSet(new URL(STACK_AUTH_JWKS_URL));

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  iat: number;
  exp: number;
}

export async function verifyJWT(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://api.stack-auth.com/api/v1/projects/${STACK_AUTH_PROJECT_ID}`,
      audience: STACK_AUTH_PROJECT_ID,
    });

    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('stack-auth-token')?.value;
    
    if (!token) {
      return null;
    }

    return await verifyJWT(token);
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

export function isAuthenticated(user: AuthUser | null): user is AuthUser {
  return user !== null;
}

export function requireAuth(user: AuthUser | null): AuthUser {
  if (!isAuthenticated(user)) {
    throw new Error('Authentication required');
  }
  return user;
}

// Helper for client-side auth state
export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error?: string;
}

// Auth context helper functions
export const authHelpers = {
  login: (email: string, password: string) => {
    // This would typically redirect to Stack Auth login
    const loginUrl = `https://api.stack-auth.com/api/v1/projects/${STACK_AUTH_PROJECT_ID}/login`;
    window.location.href = `${loginUrl}?email=${encodeURIComponent(email)}&redirect_uri=${encodeURIComponent(window.location.origin)}`;
  },
  
  signup: (email: string, password: string, name?: string) => {
    // This would typically redirect to Stack Auth signup
    const signupUrl = `https://api.stack-auth.com/api/v1/projects/${STACK_AUTH_PROJECT_ID}/signup`;
    const params = new URLSearchParams({
      email,
      redirect_uri: window.location.origin,
    });
    if (name) params.set('name', name);
    window.location.href = `${signupUrl}?${params.toString()}`;
  },
  
  logout: async () => {
    // Clear the auth token cookie
    document.cookie = 'stack-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; Secure; SameSite=Lax';
    window.location.href = '/auth/login';
  },
  
  getAuthHeaders: () => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('stack-auth-token='))
      ?.split('=')[1];
    
    const headers: HeadersInit = {};
    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return headers;
  }
};