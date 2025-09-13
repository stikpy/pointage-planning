import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Déconnexion côté serveur
    await authService.logout();

    // Créer la réponse
    const response = NextResponse.json({
      success: true,
      message: 'Déconnexion réussie',
    });

    // Supprimer les cookies
    response.cookies.delete('auth_token');
    response.cookies.delete('user_role');
    response.cookies.delete('user_id');

    return response;
  } catch (error) {
    console.error('Erreur API logout:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}