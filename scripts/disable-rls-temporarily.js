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

async function disableRLSTemporarily() {
  try {
    console.log('🔧 Désactivation temporaire de RLS...\n');

    // Désactiver RLS sur toutes les tables
    const tables = ['employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings'];
    
    for (const table of tables) {
      try {
        // Utiliser une requête directe SQL
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('*')
          .eq('table_name', table)
          .eq('table_schema', 'public');
        
        if (error) {
          console.log(`⚠️ Erreur vérification table ${table}:`, error.message);
        } else {
          console.log(`✅ Table ${table} trouvée`);
        }
      } catch (err) {
        console.log(`⚠️ Erreur table ${table}:`, err.message);
      }
    }

    // Essayer de désactiver RLS via une requête SQL brute
    console.log('\n🔧 Tentative de désactivation RLS...');
    
    // Méthode alternative : utiliser la fonction SQL directe
    const disableQueries = [
      'ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;'
    ];

    for (const query of disableQueries) {
      try {
        // Utiliser une requête SQL brute via l'API REST
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: query })
        });

        if (response.ok) {
          console.log('✅ RLS désactivé');
        } else {
          const error = await response.text();
          console.log('⚠️ Erreur:', error);
        }
      } catch (error) {
        console.log('⚠️ Erreur requête:', error.message);
      }
    }

    // Test final
    console.log('\n🧪 Test final...');
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: testData, error: testError } = await anonSupabase
      .from('employees')
      .select('id, name')
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
disableRLSTemporarily();
