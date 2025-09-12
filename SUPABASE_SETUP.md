# Configuration Supabase pour l'Application de Pointage

## 1. Configuration de la base de données

### Variables d'environnement
Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ztgqzlrvrgnvilkipznr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database URL (pour les migrations et l'administration)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ztgqzlrvrgnvilkipznr.supabase.co:5432/postgres
```

### Récupération des clés Supabase
1. Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
2. Allez dans Settings > API
3. Copiez l'URL du projet et la clé publique (anon key)
4. Remplacez `your-anon-key-here` par votre clé publique

## 2. Création des tables

### Option 1 : Via le script Node.js (recommandé)
```bash
# Remplacer [YOUR-PASSWORD] par votre mot de passe de base de données
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.ztgqzlrvrgnvilkipznr.supabase.co:5432/postgres"

# Exécuter le script de configuration
npm run setup-db
```

### Option 2 : Via l'interface Supabase
1. Allez dans votre projet Supabase
2. Ouvrez l'éditeur SQL
3. Copiez et exécutez le contenu du fichier `supabase/schema.sql`

## 3. Structure des tables créées

### `employees`
- Stocke les informations des employés
- Inclut les codes PIN, horaires de travail, rôles
- RLS activé avec politiques de sécurité

### `shifts`
- Stocke les créneaux de travail
- Calcul automatique des heures totales
- Statuts : active, completed, cancelled

### `clock_sessions`
- Sessions de pointage via QR codes
- Validation des signatures et expiration
- Sécurité temporelle (5 minutes)

### `clock_photos`
- Photos de pointage avec métadonnées
- Liens vers les créneaux et employés
- Horodatage automatique

### `app_settings`
- Paramètres de l'application
- Configuration générale et par défaut

## 4. Sécurité (Row Level Security)

Toutes les tables ont RLS activé avec des politiques :
- **Employés** : Lecture publique, modification par les managers
- **Créneaux** : Accès aux propres créneaux + managers
- **Sessions** : Accès public pour validation
- **Photos** : Accès aux propres photos + managers
- **Paramètres** : Accès managers uniquement

## 5. Utilisation dans l'application

### Hooks disponibles
- `useEmployees()` : Gestion des employés
- `useShifts(employeeId?)` : Gestion des créneaux
- `useClockPhotos(employeeId?)` : Gestion des photos
- `useDatabaseInit()` : Initialisation de la base

### Exemple d'utilisation
```typescript
import { useEmployees } from '../hooks/useSupabase'

function MyComponent() {
  const { employees, loading, error, addEmployee } = useEmployees()
  
  if (loading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>
  
  return (
    <div>
      {employees.map(emp => (
        <div key={emp.id}>{emp.name}</div>
      ))}
    </div>
  )
}
```

## 6. Migration depuis localStorage

Pour migrer les données existantes :
1. Exportez les données depuis l'ancienne version
2. Utilisez les fonctions d'import dans les hooks Supabase
3. Les données seront automatiquement synchronisées

## 7. Déploiement

L'application est déjà configurée pour Vercel avec Supabase :
- Variables d'environnement configurées
- Build optimisé pour la production
- RLS activé pour la sécurité

## 8. Monitoring et maintenance

### Logs
- Consultez les logs dans le dashboard Supabase
- Surveillez les erreurs RLS
- Vérifiez les performances des requêtes

### Sauvegarde
- Supabase effectue des sauvegardes automatiques
- Exportez régulièrement les données importantes
- Testez les procédures de récupération

## 9. Dépannage

### Erreurs courantes
- **42501** : Problème de permissions RLS
- **Connection refused** : Vérifiez l'URL de base de données
- **Invalid API key** : Vérifiez les clés Supabase

### Solutions
1. Vérifiez les variables d'environnement
2. Testez la connexion avec le script setup-db
3. Consultez les logs Supabase
4. Vérifiez les politiques RLS
