
-- =====================================================
-- SCRIPT SQL OPTIMISÉ POUR CORRIGER RLS
-- =====================================================
-- Généré automatiquement via MCP Supabase
-- Date: 2025-09-12T22:49:31.014Z

-- 1. SUPPRIMER TOUTES LES POLITIQUES EXISTANTES
-- =====================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Supprimer toutes les politiques sur les tables publiques
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
    
    RAISE NOTICE 'Politiques existantes supprimées';
END $$;

-- 2. DÉSACTIVER RLS TEMPORAIREMENT
-- =====================================================
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

-- 3. CONFIGURER LE STORAGE
-- =====================================================
UPDATE storage.buckets SET public = true WHERE id = 'clock-photos';

-- 4. VÉRIFICATION
-- =====================================================
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings')
ORDER BY tablename;

-- Vérifier le bucket
SELECT id, public FROM storage.buckets WHERE id = 'clock-photos';

-- Test d'accès
SELECT id, name, role FROM public.employees LIMIT 1;

-- =====================================================
-- SCRIPT TERMINÉ
-- =====================================================
