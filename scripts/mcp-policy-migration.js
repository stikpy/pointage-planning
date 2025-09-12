const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const secretKey = 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

async function mcpPolicyMigration() {
  console.log('🔧 Migration des politiques RLS via MCP...\n');

  try {
    const supabase = createClient(supabaseUrl, secretKey);

    // Étape 1: Utiliser l'API REST pour créer des politiques simples
    console.log('1️⃣ Création de politiques RLS simples...');
    
    const policies = [
      {
        table: 'employees',
        name: 'Allow all on employees',
        sql: 'CREATE POLICY "Allow all on employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);'
      },
      {
        table: 'shifts',
        name: 'Allow all on shifts',
        sql: 'CREATE POLICY "Allow all on shifts" ON public.shifts FOR ALL USING (true) WITH CHECK (true);'
      },
      {
        table: 'clock_sessions',
        name: 'Allow all on clock_sessions',
        sql: 'CREATE POLICY "Allow all on clock_sessions" ON public.clock_sessions FOR ALL USING (true) WITH CHECK (true);'
      },
      {
        table: 'clock_photos',
        name: 'Allow all on clock_photos',
        sql: 'CREATE POLICY "Allow all on clock_photos" ON public.clock_photos FOR ALL USING (true) WITH CHECK (true);'
      },
      {
        table: 'app_settings',
        name: 'Allow all on app_settings',
        sql: 'CREATE POLICY "Allow all on app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);'
      }
    ];

    for (const policy of policies) {
      try {
        console.log(`   Création politique pour ${policy.table}...`);
        
        // Utiliser l'API REST directe
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secretKey}`,
            'apikey': secretKey
          },
          body: JSON.stringify({ sql: policy.sql })
        });

        if (response.ok) {
          console.log('   ✅ Politique créée');
        } else {
          const error = await response.text();
          console.log('   ❌ Erreur:', error.substring(0, 100));
        }
      } catch (error) {
        console.log('   ❌ Exception:', error.message);
      }
    }

    // Étape 2: Configurer le storage
    console.log('\n2️⃣ Configuration du storage...');
    
    try {
      // Rendre le bucket public
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

    // Étape 3: Test avec clé publique
    console.log('\n3️⃣ Test avec clé publique...');
    
    const publicSupabase = createClient(supabaseUrl, 'sb_publishable_RnLS-wVof-pbR7Z2d-xyJg_bxYUEbDd');
    
    const { data: testData, error: testError } = await publicSupabase
      .from('employees')
      .select('id, name, role, pin_code')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur test public:', testError.message);
      
      // Si ça ne marche pas, essayons une approche différente
      console.log('\n4️⃣ Tentative d\'approche alternative...');
      
      // Créer des données de test directement
      const { data: insertData, error: insertError } = await supabase
        .from('employees')
        .insert({
          id: 'test_emp',
          name: 'Test Employee',
          role: 'employee',
          pin_code: '0000',
          email: 'test@example.com',
          position: 'Test Position',
          is_active: true,
          max_hours_per_day: 8,
          max_hours_per_week: 40,
          min_break_minutes: 30,
          work_schedule: {
            days: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '18:00'
          }
        })
        .select();
      
      if (insertError) {
        console.log('❌ Erreur insertion test:', insertError.message);
      } else {
        console.log('✅ Insertion test réussie:', insertData);
        
        // Nettoyer
        await supabase
          .from('employees')
          .delete()
          .eq('id', 'test_emp');
        console.log('   Test nettoyé');
      }
    } else {
      console.log('✅ Test public réussi:', testData);
    }

    // Étape 4: Test d'upload
    console.log('\n5️⃣ Test d\'upload...');
    
    const canvas = require('canvas');
    const { createCanvas } = canvas;
    
    const testCanvas = createCanvas(1, 1);
    const ctx = testCanvas.getContext('2d');
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);
    
    const buffer = testCanvas.toBuffer('image/png');
    const blob = new Blob([buffer], { type: 'image/png' });
    
    const fileName = `mcp_test_${Date.now()}.png`;
    
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

    console.log('\n🎉 Migration MCP terminée !');
    console.log('📋 Prochaines étapes :');
    console.log('1. Vérifier l\'application : https://pointage-planning.vercel.app');
    console.log('2. Si problème persiste, exécuter le script SQL manuellement');
    console.log('3. Utiliser le MCP pour les futures migrations');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

mcpPolicyMigration();
