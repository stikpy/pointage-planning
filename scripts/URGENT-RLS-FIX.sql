-- ========================================
-- URGENT: CORRECTION RLS SUPABASE
-- ========================================
-- Copie ce script dans l'éditeur SQL de Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/ztgqzlrvrgnvilkipznr/sql

-- ÉTAPE 1: Désactiver RLS temporairement
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 2: Supprimer TOUTES les politiques existantes
DROP POLICY IF EXISTS "Employees are viewable by everyone" ON public.employees;
DROP POLICY IF EXISTS "Only managers can modify employees" ON public.employees;
DROP POLICY IF EXISTS "Public read access for employees" ON public.employees;
DROP POLICY IF EXISTS "Public write access for employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can insert their own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can update their own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Public access for shifts" ON public.shifts;
DROP POLICY IF EXISTS "Clock sessions are viewable by everyone" ON public.clock_sessions;
DROP POLICY IF EXISTS "Clock sessions can be inserted by anyone" ON public.clock_sessions;
DROP POLICY IF EXISTS "Clock sessions can be updated by anyone" ON public.clock_sessions;
DROP POLICY IF EXISTS "Public access for clock sessions" ON public.clock_sessions;
DROP POLICY IF EXISTS "Users can view their own photos" ON public.clock_photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON public.clock_photos;
DROP POLICY IF EXISTS "Public access for clock photos" ON public.clock_photos;
DROP POLICY IF EXISTS "Settings are viewable by managers" ON public.app_settings;
DROP POLICY IF EXISTS "Settings can be modified by managers" ON public.app_settings;
DROP POLICY IF EXISTS "Public access for app settings" ON public.app_settings;

-- ÉTAPE 3: Vérifier qu'il n'y a plus de politiques
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ÉTAPE 4: Laisser RLS désactivé temporairement
-- (Ne pas réactiver RLS pour l'instant)

-- ÉTAPE 5: Tester l'accès
SELECT id, name, role FROM public.employees LIMIT 1;
