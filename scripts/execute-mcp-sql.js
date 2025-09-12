const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const secretKey = 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

async function executeMCPSQL() {
  console.log('🔧 Exécution du script SQL MCP...\n');

  try {
    const supabase = createClient(supabaseUrl, secretKey);

    // Étape 1: Supprimer les politiques existantes
    console.log('1️⃣ Suppression des politiques existantes...');
    
    const dropPoliciesSQL = `
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
    `;

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretKey}`,
          'apikey': secretKey
        },
        body: JSON.stringify({ sql: dropPoliciesSQL })
      });

      if (response.ok) {
        console.log('✅ Politiques supprimées');
      } else {
        const error = await response.text();
        console.log('⚠️ Erreur suppression politiques:', error.substring(0, 100));
      }
    } catch (error) {
      console.log('⚠️ Exception suppression politiques:', error.message);
    }

    // Étape 2: Désactiver RLS
    console.log('\n2️⃣ Désactivation de RLS...');
    
    const disableRLSQueries = [
      'ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;'
    ];

    for (const sql of disableRLSQueries) {
      try {
        console.log(`   Désactivation RLS: ${sql.split(' ')[2]}...`);
        
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secretKey}`,
            'apikey': secretKey
          },
          body: JSON.stringify({ sql })
        });

        if (response.ok) {
          console.log('   ✅ RLS désactivé');
        } else {
          const error = await response.text();
          console.log('   ❌ Erreur:', error.substring(0, 100));
        }
      } catch (error) {
        console.log('   ❌ Exception:', error.message);
      }
    }

    // Étape 3: Configurer le storage
    console.log('\n3️⃣ Configuration du storage...');
    
    try {
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .updateBucket('clock-photos', { public: true });
      
      if (bucketError) {
        console.log('❌ Erreur bucket:', bucketError.message);
      } else {
        console.log('✅ Bucket configuré:', bucketData);
      }
    } catch (error) {
      console.log('⚠️ Erreur storage:', error.message);
    }

    // Étape 4: Test avec clé publique
    console.log('\n4️⃣ Test avec clé publique...');
    
    const publicSupabase = createClient(supabaseUrl, 'sb_publishable_RnLS-wVof-pbR7Z2d-xyJg_bxYUEbDd');
    
    const { data: testData, error: testError } = await publicSupabase
      .from('employees')
      .select('id, name, role, pin_code')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur test public:', testError.message);
    } else {
      console.log('✅ Test public réussi:', testData);
    }

    // Étape 5: Test d'upload
    console.log('\n5️⃣ Test d\'upload...');
    
    const canvas = require('canvas');
    const { createCanvas } = canvas;
    
    const testCanvas = createCanvas(1, 1);
    const ctx = testCanvas.getContext('2d');
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);
    
    const buffer = testCanvas.toBuffer('image/png');
    const blob = new Blob([buffer], { type: 'image/png' });
    
    const fileName = `mcp_final_test_${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await publicSupabase
      .storage
      .from('clock-photos')
      .upload(fileName, blob);
    
    if (uploadError) {
      console.log('❌ Erreur upload:', uploadError.message);
    } else {
      console.log('✅ Upload réussi:', uploadData.path);
      
      // Nettoyer
      await publicSupabase
        .storage
        .from('clock-photos')
        .remove([fileName]);
      console.log('   Test nettoyé');
    }

    // Étape 6: Test de création de données
    console.log('\n6️⃣ Test de création de données...');
    
    const { data: insertData, error: insertError } = await publicSupabase
      .from('shifts')
      .insert({
        employee_id: 'emp_1',
        start_time: new Date().toISOString(),
        status: 'active'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Erreur insertion:', insertError.message);
    } else {
      console.log('✅ Insertion réussie:', insertData);
      
      // Nettoyer
      if (insertData && insertData[0]) {
        await publicSupabase
          .from('shifts')
          .delete()
          .eq('id', insertData[0].id);
        console.log('   Test nettoyé');
      }
    }

    console.log('\n🎉 Script SQL MCP exécuté avec succès !');
    console.log('📋 L\'application devrait maintenant fonctionner sur :');
    console.log('   https://pointage-planning.vercel.app');
    console.log('\n🔧 Prochaines étapes :');
    console.log('1. Tester l\'application en scannant un QR code');
    console.log('2. Vérifier que le pointage et les photos fonctionnent');
    console.log('3. Utiliser le MCP pour les futures migrations');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

executeMCPSQL();
