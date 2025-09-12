const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const secretKey = 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

async function mcpSQLGenerator() {
  console.log('🔧 Générateur SQL via MCP...\n');

  try {
    const supabase = createClient(supabaseUrl, secretKey);

    // Étape 1: Analyser la structure actuelle
    console.log('1️⃣ Analyse de la structure actuelle...');
    
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (empError) {
      console.log('❌ Erreur employés:', empError.message);
    } else {
      console.log('✅ Structure employés analysée');
      if (employees && employees[0]) {
        console.log('   Colonnes:', Object.keys(employees[0]).join(', '));
      }
    }

    // Étape 2: Générer le script SQL optimisé
    console.log('\n2️⃣ Génération du script SQL optimisé...');
    
    const sqlScript = `
-- =====================================================
-- SCRIPT SQL OPTIMISÉ POUR CORRIGER RLS
-- =====================================================
-- Généré automatiquement via MCP Supabase
-- Date: ${new Date().toISOString()}

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
`;

    // Écrire le script dans un fichier
    const fs = require('fs');
    const scriptPath = 'scripts/MCP-GENERATED-SQL.sql';
    fs.writeFileSync(scriptPath, sqlScript);
    
    console.log(`✅ Script SQL généré: ${scriptPath}`);
    console.log('📋 Contenu du script:');
    console.log(sqlScript);

    // Étape 3: Test de la clé secrète
    console.log('\n3️⃣ Test de la clé secrète...');
    
    const { data: secretTest, error: secretError } = await supabase
      .from('employees')
      .select('id, name, role, pin_code')
      .limit(1);
    
    if (secretError) {
      console.log('❌ Erreur clé secrète:', secretError.message);
    } else {
      console.log('✅ Clé secrète fonctionne:', secretTest);
    }

    // Étape 4: Test de la clé publique
    console.log('\n4️⃣ Test de la clé publique...');
    
    const publicSupabase = createClient(supabaseUrl, 'sb_publishable_RnLS-wVof-pbR7Z2d-xyJg_bxYUEbDd');
    
    const { data: publicTest, error: publicError } = await publicSupabase
      .from('employees')
      .select('id, name, role, pin_code')
      .limit(1);
    
    if (publicError) {
      console.log('❌ Erreur clé publique:', publicError.message);
      console.log('   C\'est normal, RLS bloque encore l\'accès');
    } else {
      console.log('✅ Clé publique fonctionne:', publicTest);
    }

    console.log('\n🎉 Script SQL généré avec succès !');
    console.log('📋 Instructions :');
    console.log('1. Aller sur https://supabase.com/dashboard/project/ztgqzlrvrgnvilkipznr/sql');
    console.log('2. Copier le contenu du fichier MCP-GENERATED-SQL.sql');
    console.log('3. Coller dans l\'éditeur SQL et exécuter');
    console.log('4. Tester l\'application : https://pointage-planning.vercel.app');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

mcpSQLGenerator();
