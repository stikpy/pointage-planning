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

async function fixRLSViaServiceKey() {
  try {
    console.log('🔧 Correction RLS via clé de service...\n');

    // Méthode 1: Utiliser l'API REST directe avec la clé de service
    console.log('1️⃣ Tentative via API REST avec clé de service...');
    
    const disableRLSQueries = [
      'ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;',
      'UPDATE storage.buckets SET public = true WHERE id = \'clock-photos\';',
      'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;'
    ];

    for (const sql of disableRLSQueries) {
      try {
        // Utiliser l'endpoint SQL direct de Supabase
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Prefer': 'return=minimal'
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

    // Méthode 2: Utiliser l'API GraphQL de Supabase
    console.log('\n2️⃣ Tentative via API GraphQL...');
    
    try {
      const graphqlQuery = `
        mutation {
          execSql(sql: "ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;") {
            success
            error
          }
        }
      `;

      const response = await fetch(`${supabaseUrl}/graphql/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ query: graphqlQuery })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ GraphQL résultat:', result);
      } else {
        console.log('⚠️ Erreur GraphQL:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Erreur GraphQL:', error.message);
    }

    // Méthode 3: Utiliser les fonctions RPC disponibles
    console.log('\n3️⃣ Tentative via fonctions RPC...');
    
    try {
      // Lister les fonctions disponibles
      const { data: functions, error: funcError } = await supabase
        .from('pg_proc')
        .select('proname, proargnames')
        .like('proname', '%exec%')
        .limit(10);
      
      if (funcError) {
        console.log('⚠️ Erreur liste fonctions:', funcError.message);
      } else {
        console.log('📋 Fonctions disponibles:', functions);
      }
    } catch (error) {
      console.log('⚠️ Erreur fonctions RPC:', error.message);
    }

    // Méthode 4: Utiliser l'API REST pour modifier les politiques directement
    console.log('\n4️⃣ Tentative modification directe des politiques...');
    
    try {
      // Supprimer les politiques via l'API REST
      const policiesToDelete = [
        'Employees are viewable by everyone',
        'Only managers can modify employees',
        'Public read access for employees',
        'Public write access for employees'
      ];

      for (const policyName of policiesToDelete) {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/drop_policy`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ 
              table_name: 'employees',
              policy_name: policyName
            })
          });

          if (response.ok) {
            console.log('✅ Politique supprimée:', policyName);
          } else {
            console.log('⚠️ Erreur suppression:', policyName);
          }
        } catch (error) {
          console.log('⚠️ Erreur suppression politique:', error.message);
        }
      }
    } catch (error) {
      console.log('⚠️ Erreur modification politiques:', error.message);
    }

    // Test final
    console.log('\n5️⃣ Test final...');
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
fixRLSViaServiceKey();
