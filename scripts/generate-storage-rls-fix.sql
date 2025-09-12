-- Script SQL pour corriger les politiques RLS Storage dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase Dashboard

-- 1. Rendre le bucket clock-photos public
UPDATE storage.buckets SET public = true WHERE id = 'clock-photos';

-- 2. Supprimer les politiques existantes sur storage.objects
DROP POLICY IF EXISTS "Public read clock-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload clock-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public update clock-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete clock-photos" ON storage.objects;

-- 3. Créer des politiques simples pour le bucket clock-photos
-- Lecture publique
CREATE POLICY "Public read clock-photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'clock-photos');

-- Upload depuis client (anon + authenticated)
CREATE POLICY "Public upload clock-photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'clock-photos');

-- Mise à jour si nécessaire
CREATE POLICY "Public update clock-photos"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'clock-photos')
WITH CHECK (bucket_id = 'clock-photos');

-- Suppression si nécessaire
CREATE POLICY "Public delete clock-photos"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'clock-photos');

-- 4. Vérifier les politiques storage créées
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- 5. Vérifier le bucket
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'clock-photos';
