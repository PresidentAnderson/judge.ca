import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from './auth';

// Routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/',
];

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/journal',
  '/habits',
  '/life-areas',
  '/profile',
];

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Get the auth token from cookies
  const token = request.cookies.get('stack-auth-token')?.value;
  
  // If no token and trying to access protected route, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If token exists, verify it
  if (token) {
    try {
      const user = await verifyJWT(token);
      
      // If token is invalid, clear it and redirect to login for protected routes
      if (!user) {
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('stack-auth-token');
        return response;
      }
      
      // If authenticated and trying to access auth pages, redirect to dashboard
      if (isPublicRoute && pathname.startsWith('/auth/')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      // Add user info to request headers for API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-user-email', user.email);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      
      // Clear invalid token and redirect to login for protected routes
      if (isProtectedRoute) {
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('stack-auth-token');
        return response;
      }
    }
  }
  
  return NextResponse.next();
}

// Helper to get user from request headers (for API routes)
export function getUserFromHeaders(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  
  if (!userId || !userEmail) {
    return null;
  }
  
  return {
    id: userId,
    email: userEmail,
  };
}