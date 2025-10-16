// Stack Auth configuration - Client Side Only
const STACK_AUTH_PROJECT_ID = process.env.NEXT_PUBLIC_STACK_PROJECT_ID!;

if (!STACK_AUTH_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_STACK_PROJECT_ID environment variable is required');
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at?: string;
}

// Helper for client-side auth state
export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error?: string;
}

// Client-side function to get user from token (no server calls)
export function getCurrentUserFromToken(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('stack-auth-token='))
    ?.split('=')[1];
    
  if (!token) return null;
  
  try {
    // Decode JWT payload (client-side only - not verified)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      avatar_url: payload.picture,
      created_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined,
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Client-side async function that checks authentication and redirects if needed
export async function requireClientAuth(): Promise<AuthUser | null> {
  const user = getCurrentUserFromToken();
  if (!user) {
    window.location.href = '/auth/login';
    return null;
  }
  return user;
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