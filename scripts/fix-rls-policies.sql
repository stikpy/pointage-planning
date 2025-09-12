-- Script pour corriger les politiques RLS de Supabase
-- Ce script doit être exécuté dans l'éditeur SQL de Supabase

-- 1. Supprimer toutes les politiques existantes pour éviter les conflits
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

-- 2. Désactiver temporairement RLS pour corriger les problèmes
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

-- 3. Réactiver RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Créer des politiques simples et non récursives

-- Politiques pour les employés (lecture publique, écriture pour tous)
CREATE POLICY "Public read access for employees" ON public.employees
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public write access for employees" ON public.employees
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques pour les créneaux (lecture et écriture publiques)
CREATE POLICY "Public access for shifts" ON public.shifts
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques pour les sessions de pointage (lecture et écriture publiques)
CREATE POLICY "Public access for clock sessions" ON public.clock_sessions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques pour les photos de pointage (lecture et écriture publiques)
CREATE POLICY "Public access for clock photos" ON public.clock_photos
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques pour les paramètres (lecture et écriture publiques)
CREATE POLICY "Public access for app settings" ON public.app_settings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Créer des politiques pour le storage bucket clock-photos
-- Note: Ces politiques doivent être créées dans l'interface Supabase Storage
-- Aller dans Storage > clock-photos > Policies et ajouter :

-- Policy pour l'upload (INSERT)
-- Name: "Public upload access"
-- Target roles: anon, authenticated
-- Operation: INSERT
-- Policy definition: true

-- Policy pour la lecture (SELECT)
-- Name: "Public read access"
-- Target roles: anon, authenticated
-- Operation: SELECT
-- Policy definition: true

-- Policy pour la mise à jour (UPDATE)
-- Name: "Public update access"
-- Target roles: anon, authenticated
-- Operation: UPDATE
-- Policy definition: true

-- Policy pour la suppression (DELETE)
-- Name: "Public delete access"
-- Target roles: anon, authenticated
-- Operation: DELETE
-- Policy definition: true
