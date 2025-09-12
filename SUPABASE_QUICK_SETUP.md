# 🚀 Configuration Rapide Supabase

## Étape 1 : Récupérer vos clés Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Copiez :
   - **Project URL** : `https://ztgqzlrvrgnvilkipznr.supabase.co`
   - **anon public** key
   - **service_role** key (dans la section "Project API keys")

## Étape 2 : Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ztgqzlrvrgnvilkipznr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-ici
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role-ici

# Database URL (optionnel)
DATABASE_URL=postgresql://postgres:[VOTRE-MOT-DE-PASSE]@db.ztgqzlrvrgnvilkipznr.supabase.co:5432/postgres
```

## Étape 3 : Créer les tables automatiquement

```bash
# Créer les tables via Supabase
npm run setup-supabase
```

## Étape 4 : Tester la connexion

```bash
# Tester que tout fonctionne
npm run test-supabase
```

## Étape 5 : Lancer l'application

```bash
# Démarrer l'application
npm run dev
```

## ✅ Vérification

Après l'exécution, vous devriez voir dans Supabase :
- ✅ 5 tables créées (employees, shifts, clock_sessions, clock_photos, app_settings)
- ✅ 5 employés de test insérés
- ✅ RLS (Row Level Security) activé
- ✅ Index de performance créés

## 🔧 Dépannage

### Erreur "exec_sql function not found"
Cette fonction n'existe pas par défaut dans Supabase. Dans ce cas, utilisez l'interface SQL :

1. Allez dans **SQL Editor** de Supabase
2. Copiez le contenu de `supabase/schema.sql`
3. Exécutez le script

### Erreur de permissions
Assurez-vous d'utiliser la **service_role** key et non l'anon key pour les opérations d'administration.

### Tables déjà existantes
Le script utilise `CREATE TABLE IF NOT EXISTS` donc il est sûr de le relancer.

## 📱 Utilisation

Une fois configuré, l'application fonctionnera avec Supabase :
- Données persistantes en base
- Synchronisation en temps réel
- Sécurité RLS intégrée
- API automatique générée

## 🆘 Aide

Si vous rencontrez des problèmes :
1. Vérifiez vos clés API
2. Consultez les logs Supabase
3. Testez la connexion avec `npm run test-supabase`
4. Vérifiez que les tables existent dans l'interface Supabase
