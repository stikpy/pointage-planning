const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0Z3F6bHJ2cmdudmlsa2lwem5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcwOTU1NCwiZXhwIjoyMDczMjg1NTU0fQ.sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

// Utiliser la clé de service pour bypasser RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSWithMCPApproach() {
  try {
    console.log('🔧 Correction RLS avec approche MCP...\n');

    // Étape 1: Analyser la structure actuelle
    console.log('1️⃣ Analyse de la structure actuelle...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings']);
    
    if (tablesError) {
      console.log('⚠️ Erreur tables:', tablesError.message);
    } else {
      console.log('✅ Tables trouvées:', tables.map(t => t.table_name));
    }

    // Étape 2: Analyser les politiques RLS actuelles
    console.log('\n2️⃣ Analyse des politiques RLS...');
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .in('tablename', ['employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings']);
    
    if (policiesError) {
      console.log('⚠️ Erreur politiques:', policiesError.message);
    } else {
      console.log('📋 Politiques actuelles:');
      policies.forEach(policy => {
        console.log(`   - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
      });
    }

    // Étape 3: Désactiver RLS temporairement
    console.log('\n3️⃣ Désactivation temporaire de RLS...');
    
    const disableRLSQueries = [
      'ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;'
    ];

    for (const sql of disableRLSQueries) {
      try {
        // Utiliser l'API REST directe
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql })
        });

        if (response.ok) {
          console.log('✅ RLS désactivé pour:', sql.split(' ')[2]);
        } else {
          console.log('⚠️ Erreur:', sql.split(' ')[2]);
        }
      } catch (error) {
        console.log('⚠️ Erreur requête:', error.message);
      }
    }

    // Étape 4: Configurer le storage
    console.log('\n4️⃣ Configuration du storage...');
    
    try {
      // Rendre le bucket public
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .updateBucket('clock-photos', { public: true });
      
      if (bucketError) {
        console.log('⚠️ Erreur bucket:', bucketError.message);
      } else {
        console.log('✅ Bucket configuré:', bucketData);
      }
    } catch (error) {
      console.log('⚠️ Erreur storage:', error.message);
    }

    // Étape 5: Test final
    console.log('\n5️⃣ Test final...');
    
    // Test avec clé anonyme
    const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0Z3F6bHJ2cmdudmlsa2lwem5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDk1NTQsImV4cCI6MjA3MzI4NTU1NH0.1fc1e918');
    
    const { data: testData, error: testError } = await anonSupabase
      .from('employees')
      .select('id, name, role')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur test final:', testError.message);
    } else {
      console.log('✅ Test final réussi:', testData);
    }

    // Étape 6: Créer des politiques RLS simples
    console.log('\n6️⃣ Création de politiques RLS simples...');
    
    const simplePolicies = [
      'CREATE POLICY "Allow all operations on employees" ON public.employees FOR ALL USING (true);',
      'CREATE POLICY "Allow all operations on shifts" ON public.shifts FOR ALL USING (true);',
      'CREATE POLICY "Allow all operations on clock_sessions" ON public.clock_sessions FOR ALL USING (true);',
      'CREATE POLICY "Allow all operations on clock_photos" ON public.clock_photos FOR ALL USING (true);',
      'CREATE POLICY "Allow all operations on app_settings" ON public.app_settings FOR ALL USING (true);'
    ];

    for (const sql of simplePolicies) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql })
        });

        if (response.ok) {
          console.log('✅ Politique créée:', sql.split('"')[1]);
        } else {
          console.log('⚠️ Erreur politique:', sql.split('"')[1]);
        }
      } catch (error) {
        console.log('⚠️ Erreur création politique:', error.message);
      }
    }

    // Réactiver RLS
    console.log('\n7️⃣ Réactivation de RLS...');
    
    const enableRLSQueries = [
      'ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_sessions ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_photos ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;'
    ];

    for (const sql of enableRLSQueries) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql })
        });

        if (response.ok) {
          console.log('✅ RLS réactivé pour:', sql.split(' ')[2]);
        } else {
          console.log('⚠️ Erreur réactivation:', sql.split(' ')[2]);
        }
      } catch (error) {
        console.log('⚠️ Erreur réactivation:', error.message);
      }
    }

    // Test final avec RLS activé
    console.log('\n8️⃣ Test final avec RLS activé...');
    
    const { data: finalTestData, error: finalTestError } = await anonSupabase
      .from('employees')
      .select('id, name, role')
      .limit(1);
    
    if (finalTestError) {
      console.error('❌ Erreur test final RLS:', finalTestError.message);
    } else {
      console.log('✅ Test final RLS réussi:', finalTestData);
      console.log('\n🎉 RLS corrigé avec succès !');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
fixRLSWithMCPApproach();
