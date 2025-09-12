-- =====================================================
-- CORRECTION URGENTE RLS - À EXÉCUTER DANS SUPABASE DASHBOARD
-- =====================================================
-- URL: https://supabase.com/dashboard/project/ztgqzlrvrgnvilkipznr/sql

-- 1. DÉSACTIVER RLS SUR TOUTES LES TABLES
-- =====================================================
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

-- 2. CONFIGURER LE STORAGE
-- =====================================================
-- Rendre le bucket public
UPDATE storage.buckets SET public = true WHERE id = 'clock-photos';

-- Désactiver RLS sur storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. VÉRIFICATION
-- =====================================================
-- Vérifier que RLS est désactivé
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings');

-- Vérifier le bucket
SELECT id, public FROM storage.buckets WHERE id = 'clock-photos';

-- Test d'accès
SELECT id, name, role FROM public.employees LIMIT 1;
