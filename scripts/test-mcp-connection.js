const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

// Utiliser la clé de service pour bypasser RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('🔍 Test de connexion Supabase...');
    
    // Test 1: Connexion de base
    const { data: testData, error: testError } = await supabase
      .from('employees')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur test connexion:', testError);
      return;
    }
    
    console.log('✅ Connexion Supabase OK');
    
    // Test 2: Vérifier les politiques RLS
    console.log('\n🔍 Vérification des politiques RLS...');
    
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT tablename, rowsecurity as rls_enabled
          FROM pg_tables
          WHERE schemaname='public' 
            AND tablename IN ('employees','shifts','clock_sessions','clock_photos','app_settings');
        `
      });
    
    if (rlsError) {
      console.error('❌ Erreur RLS check:', rlsError);
    } else {
      console.log('📊 État RLS des tables:', rlsData);
    }
    
    // Test 3: Vérifier les politiques existantes
    const { data: policiesData, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT policyname, cmd, roles, qual, with_check
          FROM pg_policies
          WHERE schemaname='public' AND tablename='employees';
        `
      });
    
    if (policiesError) {
      console.error('❌ Erreur policies check:', policiesError);
    } else {
      console.log('📋 Politiques employees:', policiesData);
    }
    
    // Test 4: Vérifier le bucket storage
    const { data: bucketData, error: bucketError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT id, name, public FROM storage.buckets WHERE id='clock-photos';
        `
      });
    
    if (bucketError) {
      console.error('❌ Erreur bucket check:', bucketError);
    } else {
      console.log('🪣 Bucket clock-photos:', bucketData);
    }
    
    // Test 5: Vérifier les politiques storage
    const { data: storagePoliciesData, error: storagePoliciesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT policyname, cmd, roles, qual, with_check
          FROM pg_policies
          WHERE schemaname='storage' AND tablename='objects';
        `
      });
    
    if (storagePoliciesError) {
      console.error('❌ Erreur storage policies check:', storagePoliciesError);
    } else {
      console.log('📋 Politiques storage:', storagePoliciesData);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testConnection();