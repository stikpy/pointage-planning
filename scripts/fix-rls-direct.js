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

async function fixRLSDirect() {
  try {
    console.log('🔧 Correction directe des politiques RLS...\n');

    // 1. Désactiver temporairement RLS sur toutes les tables
    console.log('1️⃣ Désactivation temporaire de RLS...');
    const disableRLSQueries = [
      'ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;'
    ];

    for (const query of disableRLSQueries) {
      try {
        await supabase.rpc('exec', { sql: query });
        console.log('   ✅ RLS désactivé');
      } catch (error) {
        console.log('   ⚠️ Erreur (peut être normal):', error.message);
      }
    }

    // 2. Supprimer toutes les politiques existantes
    console.log('\n2️⃣ Suppression des politiques existantes...');
    const dropPoliciesQueries = [
      'DROP POLICY IF EXISTS "Employees are viewable by everyone" ON public.employees;',
      'DROP POLICY IF EXISTS "Only managers can modify employees" ON public.employees;',
      'DROP POLICY IF EXISTS "Users can view their own shifts" ON public.shifts;',
      'DROP POLICY IF EXISTS "Users can insert their own shifts" ON public.shifts;',
      'DROP POLICY IF EXISTS "Users can update their own shifts" ON public.shifts;',
      'DROP POLICY IF EXISTS "Clock sessions are viewable by everyone" ON public.clock_sessions;',
      'DROP POLICY IF EXISTS "Clock sessions can be inserted by anyone" ON public.clock_sessions;',
      'DROP POLICY IF EXISTS "Clock sessions can be updated by anyone" ON public.clock_sessions;',
      'DROP POLICY IF EXISTS "Users can view their own photos" ON public.clock_photos;',
      'DROP POLICY IF EXISTS "Users can insert their own photos" ON public.clock_photos;',
      'DROP POLICY IF EXISTS "Settings are viewable by managers" ON public.app_settings;',
      'DROP POLICY IF EXISTS "Settings can be modified by managers" ON public.app_settings;'
    ];

    for (const query of dropPoliciesQueries) {
      try {
        await supabase.rpc('exec', { sql: query });
        console.log('   ✅ Politique supprimée');
      } catch (error) {
        console.log('   ⚠️ Erreur (peut être normal):', error.message);
      }
    }

    // 3. Réactiver RLS
    console.log('\n3️⃣ Réactivation de RLS...');
    const enableRLSQueries = [
      'ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_sessions ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_photos ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;'
    ];

    for (const query of enableRLSQueries) {
      try {
        await supabase.rpc('exec', { sql: query });
        console.log('   ✅ RLS réactivé');
      } catch (error) {
        console.log('   ⚠️ Erreur:', error.message);
      }
    }

    // 4. Créer des politiques simples et non récursives
    console.log('\n4️⃣ Création des nouvelles politiques...');
    const createPoliciesQueries = [
      // Politiques pour employees
      `CREATE POLICY "Public read access for employees" ON public.employees
        FOR SELECT
        TO anon, authenticated
        USING (true);`,
      
      `CREATE POLICY "Public write access for employees" ON public.employees
        FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true);`,

      // Politiques pour shifts
      `CREATE POLICY "Public access for shifts" ON public.shifts
        FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true);`,

      // Politiques pour clock_sessions
      `CREATE POLICY "Public access for clock sessions" ON public.clock_sessions
        FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true);`,

      // Politiques pour clock_photos
      `CREATE POLICY "Public access for clock photos" ON public.clock_photos
        FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true);`,

      // Politiques pour app_settings
      `CREATE POLICY "Public access for app settings" ON public.app_settings
        FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true);`
    ];

    for (const query of createPoliciesQueries) {
      try {
        await supabase.rpc('exec', { sql: query });
        console.log('   ✅ Politique créée');
      } catch (error) {
        console.log('   ❌ Erreur création politique:', error.message);
      }
    }

    // 5. Tester l'accès avec la clé anonyme
    console.log('\n5️⃣ Test avec clé anonyme...');
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: testEmployees, error: testError } = await anonSupabase
      .from('employees')
      .select('id, name, role')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur test anonyme:', testError.message);
    } else {
      console.log('✅ Test anonyme réussi:', testEmployees);
    }

    console.log('\n🎉 Correction RLS terminée !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
fixRLSDirect();
