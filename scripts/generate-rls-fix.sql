-- Script SQL pour corriger les politiques RLS dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase Dashboard

-- 1. Désactiver temporairement RLS
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Employees are viewable by everyone" ON public.employees;
DROP POLICY IF EXISTS "Only managers can modify employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can insert their own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can update their own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Clock sessions are viewable by everyone" ON public.clock_sessions;
DROP POLICY IF EXISTS "Clock sessions can be inserted by anyone" ON public.clock_sessions;
DROP POLICY IF EXISTS "Clock sessions can be updated by anyone" ON public.clock_sessions;
DROP POLICY IF EXISTS "Users can view their own photos" ON public.clock_photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON public.clock_photos;
DROP POLICY IF EXISTS "Settings are viewable by managers" ON public.app_settings;
DROP POLICY IF EXISTS "Settings can be modified by managers" ON public.app_settings;

-- 3. Réactiver RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Créer des politiques simples et non récursives
-- Politiques pour employees (lecture publique, écriture pour tous)
CREATE POLICY "Public read access for employees" ON public.employees
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public write access for employees" ON public.employees
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques pour shifts (lecture et écriture publiques)
CREATE POLICY "Public access for shifts" ON public.shifts
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques pour clock_sessions (lecture et écriture publiques)
CREATE POLICY "Public access for clock sessions" ON public.clock_sessions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques pour clock_photos (lecture et écriture publiques)
CREATE POLICY "Public access for clock photos" ON public.clock_photos
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques pour app_settings (lecture et écriture publiques)
CREATE POLICY "Public access for app settings" ON public.app_settings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Vérifier les politiques créées
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
