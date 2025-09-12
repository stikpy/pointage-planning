const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const secretKey = 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

async function createSimplePolicies() {
  console.log('🔧 Création de politiques RLS simples...\n');

  try {
    const supabase = createClient(supabaseUrl, secretKey);

    // Étape 1: Supprimer les politiques existantes problématiques
    console.log('1️⃣ Suppression des politiques existantes...');
    
    const dropPoliciesQueries = [
      'DROP POLICY IF EXISTS "Employees are viewable by everyone" ON public.employees;',
      'DROP POLICY IF EXISTS "Only managers can modify employees" ON public.employees;',
      'DROP POLICY IF EXISTS "Public read access for employees" ON public.employees;',
      'DROP POLICY IF EXISTS "Public write access for employees" ON public.employees;',
      'DROP POLICY IF EXISTS "Allow all operations on employees" ON public.employees;',
      'DROP POLICY IF EXISTS "Allow all operations on shifts" ON public.shifts;',
      'DROP POLICY IF EXISTS "Allow all operations on clock_sessions" ON public.clock_sessions;',
      'DROP POLICY IF EXISTS "Allow all operations on clock_photos" ON public.clock_photos;',
      'DROP POLICY IF EXISTS "Allow all operations on app_settings" ON public.app_settings;'
    ];

    for (const sql of dropPoliciesQueries) {
      try {
        console.log(`   Suppression: ${sql.split('"')[1] || 'politique'}...`);
        
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
          console.log('   ✅ Supprimé');
        } else {
          console.log('   ⚠️ Erreur (normal si n\'existe pas)');
        }
      } catch (error) {
        console.log('   ⚠️ Exception:', error.message);
      }
    }

    // Étape 2: Créer des politiques simples qui permettent tout
    console.log('\n2️⃣ Création de politiques simples...');
    
    const createPoliciesQueries = [
      'CREATE POLICY "Allow all on employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);',
      'CREATE POLICY "Allow all on shifts" ON public.shifts FOR ALL USING (true) WITH CHECK (true);',
      'CREATE POLICY "Allow all on clock_sessions" ON public.clock_sessions FOR ALL USING (true) WITH CHECK (true);',
      'CREATE POLICY "Allow all on clock_photos" ON public.clock_photos FOR ALL USING (true) WITH CHECK (true);',
      'CREATE POLICY "Allow all on app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);'
    ];

    for (const sql of createPoliciesQueries) {
      try {
        console.log(`   Création: ${sql.split('"')[1]}...`);
        
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
          console.log('   ✅ Créé');
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

    // Test final
    console.log('\n4️⃣ Test final...');
    
    const publicSupabase = createClient(supabaseUrl, 'sb_publishable_RnLS-wVof-pbR7Z2d-xyJg_bxYUEbDd');
    
    const { data: testData, error: testError } = await publicSupabase
      .from('employees')
      .select('id, name, role, pin_code')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur test final:', testError.message);
    } else {
      console.log('✅ Test final réussi:', testData);
      console.log('\n🎉 Politiques RLS créées avec succès !');
      console.log('📋 L\'application devrait maintenant fonctionner sur :');
      console.log('   https://pointage-planning.vercel.app');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createSimplePolicies();
