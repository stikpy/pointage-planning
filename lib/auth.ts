import { createClient } from '@supabase/supabase-js';
import { UserRole, User, Permission } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RnLS-wVof-pbR7Z2d-xyJg_bxYUEbDd';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== SYSTÈME D'AUTHENTIFICATION =====
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
  departmentId?: string;
  teamId?: string;
  permissions: Permission[];
  profile: {
    firstName: string;
    lastName: string;
    position: string;
    phone?: string;
    avatar?: string;
  };
  isActive: boolean;
  lastLogin?: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

// ===== PERMISSIONS PAR DÉFAUT =====
export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    { resource: 'organizations', actions: ['read', 'write', 'delete'], scope: 'organization' },
    { resource: 'users', actions: ['read', 'write', 'delete'], scope: 'organization' },
    { resource: 'departments', actions: ['read', 'write', 'delete'], scope: 'organization' },
    { resource: 'teams', actions: ['read', 'write', 'delete'], scope: 'organization' },
    { resource: 'shifts', actions: ['read', 'write', 'delete', 'approve'], scope: 'organization' },
    { resource: 'reports', actions: ['read', 'write', 'delete'], scope: 'organization' },
    { resource: 'settings', actions: ['read', 'write', 'delete'], scope: 'organization' },
  ],
  [UserRole.ADMIN]: [
    { resource: 'users', actions: ['read', 'write'], scope: 'organization' },
    { resource: 'departments', actions: ['read', 'write'], scope: 'organization' },
    { resource: 'teams', actions: ['read', 'write'], scope: 'organization' },
    { resource: 'shifts', actions: ['read', 'write', 'approve'], scope: 'organization' },
    { resource: 'reports', actions: ['read', 'write'], scope: 'organization' },
    { resource: 'settings', actions: ['read', 'write'], scope: 'organization' },
  ],
  [UserRole.MANAGER]: [
    { resource: 'users', actions: ['read'], scope: 'team' },
    { resource: 'shifts', actions: ['read', 'write', 'approve'], scope: 'team' },
    { resource: 'reports', actions: ['read'], scope: 'team' },
    { resource: 'settings', actions: ['read'], scope: 'team' },
  ],
  [UserRole.USER]: [
    { resource: 'shifts', actions: ['read'], scope: 'self' },
    { resource: 'reports', actions: ['read'], scope: 'self' },
  ],
};

// ===== FONCTIONS D'AUTHENTIFICATION =====
export class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private tokens: AuthTokens | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Connexion avec email/password
  async login(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Utilisateur non trouvé' };
      }

      // Récupérer les données utilisateur complètes
      const userData = await this.getUserData(data.user.id);
      if (!userData) {
        return { success: false, error: 'Données utilisateur non trouvées' };
      }

      this.currentUser = userData;
      this.tokens = {
        accessToken: data.session?.access_token || '',
        refreshToken: data.session?.refresh_token || '',
        expiresIn: data.session?.expires_in || 3600,
        tokenType: 'Bearer',
      };

      // Mettre à jour la dernière connexion
      await this.updateLastLogin(data.user.id);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.currentUser = null;
      this.tokens = null;
      
      // Nettoyer le localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_tokens');
      }
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  }

  // Récupérer les données utilisateur depuis la base
  private async getUserData(userId: string): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          organization_id,
          department_id,
          team_id,
          profile,
          is_active,
          last_login,
          organizations(name),
          departments(name),
          teams(name)
        `)
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Erreur récupération utilisateur:', error);
        return null;
      }

      // Construire l'objet utilisateur avec permissions
      const user: AuthUser = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        organizationId: data.organization_id,
        departmentId: data.department_id,
        teamId: data.team_id,
        profile: data.profile || {},
        permissions: DEFAULT_PERMISSIONS[data.role as UserRole] || [],
        isActive: data.is_active,
        lastLogin: data.last_login ? new Date(data.last_login) : undefined,
      };

      return user;
    } catch (error) {
      console.error('Erreur getUserData:', error);
      return null;
    }
  }

  // Mettre à jour la dernière connexion
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Erreur updateLastLogin:', error);
    }
  }

  // Vérifier si l'utilisateur a une permission
  hasPermission(resource: string, action: string, scope?: string): boolean {
    if (!this.currentUser) return false;

    return this.currentUser.permissions.some(permission => {
      const resourceMatch = permission.resource === resource || permission.resource === '*';
      const actionMatch = permission.actions.includes(action) || permission.actions.includes('*');
      const scopeMatch = !scope || permission.scope === scope || permission.scope === 'organization';

      return resourceMatch && actionMatch && scopeMatch;
    });
  }

  // Vérifier le rôle
  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
  }

  // Vérifier si l'utilisateur a un rôle supérieur ou égal
  hasRoleOrHigher(requiredRole: UserRole): boolean {
    if (!this.currentUser) return false;

    const roleHierarchy = {
      [UserRole.USER]: 1,
      [UserRole.MANAGER]: 2,
      [UserRole.ADMIN]: 3,
      [UserRole.SUPER_ADMIN]: 4,
    };

    const userLevel = roleHierarchy[this.currentUser.role];
    const requiredLevel = roleHierarchy[requiredRole];

    return userLevel >= requiredLevel;
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Obtenir les tokens
  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  // Initialiser depuis le localStorage (au chargement de l'app)
  async initializeFromStorage(): Promise<AuthUser | null> {
    if (typeof window === 'undefined') return null;

    try {
      const storedUser = localStorage.getItem('auth_user');
      const storedTokens = localStorage.getItem('auth_tokens');

      if (storedUser && storedTokens) {
        const user = JSON.parse(storedUser) as AuthUser;
        const tokens = JSON.parse(storedTokens) as AuthTokens;

        // Vérifier si les tokens sont encore valides
        if (this.isTokenValid(tokens)) {
          this.currentUser = user;
          this.tokens = tokens;
          return user;
        } else {
          // Tenter de rafraîchir le token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.currentUser;
          }
        }
      }

      // Nettoyer le storage si invalide
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_tokens');
      return null;
    } catch (error) {
      console.error('Erreur initializeFromStorage:', error);
      return null;
    }
  }

  // Vérifier si un token est valide
  private isTokenValid(tokens: AuthTokens): boolean {
    // Vérification basique - en production, vérifier la signature JWT
    return tokens.accessToken.length > 0 && tokens.expiresIn > Date.now() / 1000;
  }

  // Rafraîchir le token
  private async refreshToken(): Promise<boolean> {
    try {
      if (!this.tokens?.refreshToken) return false;

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: this.tokens.refreshToken,
      });

      if (error || !data.session) {
        return false;
      }

      this.tokens = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        tokenType: 'Bearer',
      };

      // Sauvegarder dans le localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_tokens', JSON.stringify(this.tokens));
      }

      return true;
    } catch (error) {
      console.error('Erreur refreshToken:', error);
      return false;
    }
  }

  // Sauvegarder dans le localStorage
  saveToStorage(): void {
    if (typeof window === 'undefined' || !this.currentUser || !this.tokens) return;

    localStorage.setItem('auth_user', JSON.stringify(this.currentUser));
    localStorage.setItem('auth_tokens', JSON.stringify(this.tokens));
  }
}

// Instance singleton
export const authService = AuthService.getInstance();

// Hook React pour l'authentification
export function useAuth() {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const initAuth = async () => {
      const currentUser = await authService.initializeFromStorage();
      setUser(currentUser);
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      authService.saveToStorage();
    }
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const hasPermission = (resource: string, action: string, scope?: string) => {
    return authService.hasPermission(resource, action, scope);
  };

  const hasRole = (role: UserRole) => {
    return authService.hasRole(role);
  };

  const hasRoleOrHigher = (role: UserRole) => {
    return authService.hasRoleOrHigher(role);
  };

  return {
    user,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    hasRoleOrHigher,
  };
}