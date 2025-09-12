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

async function fixRLSViaREST() {
  try {
    console.log('🔧 Correction RLS via API REST Supabase...\n');

    // Méthode 1: Utiliser l'API REST directe pour exécuter SQL
    console.log('1️⃣ Tentative via API REST directe...');
    
    const sqlQueries = [
      'ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;',
      'UPDATE storage.buckets SET public = true WHERE id = \'clock-photos\';',
      'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;'
    ];

    for (const sql of sqlQueries) {
      try {
        // Utiliser l'API REST directe
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql })
        });

        if (response.ok) {
          console.log('✅ Requête exécutée:', sql.substring(0, 50) + '...');
        } else {
          const error = await response.text();
          console.log('⚠️ Erreur:', error.substring(0, 100) + '...');
        }
      } catch (error) {
        console.log('⚠️ Erreur requête:', error.message);
      }
    }

    // Méthode 2: Utiliser les fonctions Supabase disponibles
    console.log('\n2️⃣ Tentative via fonctions Supabase...');
    
    try {
      // Créer une fonction temporaire pour exécuter SQL
      const { data: createFunction, error: createError } = await supabase
        .rpc('exec_sql', { 
          sql: `
            CREATE OR REPLACE FUNCTION temp_disable_rls()
            RETURNS void AS $$
            BEGIN
              ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
              ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;
              ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;
              ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;
              ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
              UPDATE storage.buckets SET public = true WHERE id = 'clock-photos';
              ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
            END;
            $$ LANGUAGE plpgsql;
          `
        });

      if (createError) {
        console.log('⚠️ Erreur création fonction:', createError.message);
      } else {
        console.log('✅ Fonction créée');
        
        // Exécuter la fonction
        const { data: execData, error: execError } = await supabase
          .rpc('temp_disable_rls');

        if (execError) {
          console.log('⚠️ Erreur exécution:', execError.message);
        } else {
          console.log('✅ RLS désactivé via fonction');
        }

        // Supprimer la fonction temporaire
        await supabase.rpc('exec_sql', { 
          sql: 'DROP FUNCTION IF EXISTS temp_disable_rls();' 
        });
      }
    } catch (error) {
      console.log('⚠️ Erreur fonction:', error.message);
    }

    // Méthode 3: Utiliser les opérations directes sur les tables
    console.log('\n3️⃣ Tentative via opérations directes...');
    
    try {
      // Tester l'accès direct aux tables
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, name, role')
        .limit(1);
      
      if (empError) {
        console.log('❌ Erreur accès employés:', empError.message);
      } else {
        console.log('✅ Accès employés OK:', employees);
      }

      // Tester l'accès au storage
      const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketError) {
        console.log('❌ Erreur accès storage:', bucketError.message);
      } else {
        console.log('✅ Accès storage OK:', buckets.length, 'buckets');
      }

    } catch (error) {
      console.log('⚠️ Erreur opérations directes:', error.message);
    }

    // Test final avec clé anonyme
    console.log('\n4️⃣ Test final avec clé anonyme...');
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: testData, error: testError } = await anonSupabase
      .from('employees')
      .select('id, name, role')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur test final:', testError.message);
    } else {
      console.log('✅ Test final réussi:', testData);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
fixRLSViaREST();
