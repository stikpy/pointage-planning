-- ========================================
-- URGENT: CORRECTION STORAGE RLS
-- ========================================
-- Copie ce script dans l'éditeur SQL de Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/ztgqzlrvrgnvilkipznr/sql

-- ÉTAPE 1: Rendre le bucket public
UPDATE storage.buckets SET public = true WHERE id = 'clock-photos';

-- ÉTAPE 2: Supprimer toutes les politiques storage existantes
DROP POLICY IF EXISTS "Public read clock-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload clock-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public update clock-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete clock-photos" ON storage.objects;

-- ÉTAPE 3: Désactiver RLS sur storage.objects temporairement
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 4: Vérifier l'état du bucket
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'clock-photos';

-- ÉTAPE 5: Vérifier qu'il n'y a plus de politiques storage
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
