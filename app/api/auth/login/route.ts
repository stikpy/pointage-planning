import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../lib/auth';
import { UserRole } from '../../../../types';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Authentification
    const result = await authService.login(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur de connexion' },
        { status: 401 }
      );
    }

    const user = result.user!;
    const tokens = authService.getTokens()!;

    // Créer la réponse avec les cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        departmentId: user.departmentId,
        teamId: user.teamId,
        profile: user.profile,
        permissions: user.permissions,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: tokens.tokenType,
      },
    });

    // Définir les cookies sécurisés
    response.cookies.set('auth_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.expiresIn,
      path: '/',
    });

    response.cookies.set('user_role', user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.expiresIn,
      path: '/',
    });

    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.expiresIn,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erreur API login:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Vérifier si l'utilisateur est déjà connecté
  const authToken = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const userId = request.cookies.get('user_id')?.value;

  if (!authToken || !userRole || !userId) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  try {
    // Vérifier la validité du token (en production, vérifier la signature JWT)
    const user = authService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        departmentId: user.departmentId,
        teamId: user.teamId,
        profile: user.profile,
        permissions: user.permissions,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Erreur vérification auth:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}