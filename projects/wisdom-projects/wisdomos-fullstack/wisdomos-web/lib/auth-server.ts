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

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at?: string;
}

const jwks = createRemoteJWKSet(new URL(STACK_AUTH_JWKS_URL));

export async function verifyJWT(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://api.stack-auth.com/api/v1/projects/${STACK_AUTH_PROJECT_ID}`,
      audience: STACK_AUTH_PROJECT_ID,
    });

    return {
      id: payload.sub!,
      email: payload.email as string,
      name: payload.name as string,
      avatar_url: payload.picture as string,
      created_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined,
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
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}