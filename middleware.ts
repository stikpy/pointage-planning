import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from './types';

// ===== MIDDLEWARE DE PERMISSIONS =====
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Routes publiques (pas de protection)
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
  ];

  // Routes protégées par rôle
  const protectedRoutes = {
    '/admin': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    '/admin/organizations': [UserRole.SUPER_ADMIN],
    '/admin/users': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    '/admin/departments': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    '/admin/teams': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    '/admin/settings': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    '/manager': [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    '/manager/planning': [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    '/manager/reports': [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    '/user': [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  };

  // Vérifier si la route est publique
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Récupérer les informations d'authentification depuis les cookies
  const authToken = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value as UserRole;

  // Si pas de token, rediriger vers login
  if (!authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Vérifier les permissions pour les routes protégées
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole)) {
        // Rediriger vers la page d'accueil appropriée selon le rôle
        const redirectUrl = getRedirectUrlForRole(userRole);
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

// Obtenir l'URL de redirection selon le rôle
function getRedirectUrlForRole(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
      return '/admin';
    case UserRole.MANAGER:
      return '/manager';
    case UserRole.USER:
      return '/user';
    default:
      return '/';
  }
}

// Configuration du middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};