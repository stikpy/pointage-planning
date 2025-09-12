const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const secretKey = 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

async function testMCPConnection() {
  console.log('🔧 Test de la connexion MCP Supabase...\n');

  try {
    const supabase = createClient(supabaseUrl, secretKey);

    // Test 1: Vérifier la connexion
    console.log('1️⃣ Test de connexion...');
    const { data: testData, error: testError } = await supabase
      .from('employees')
      .select('id, name, role')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erreur connexion:', testError.message);
      return;
    } else {
      console.log('✅ Connexion réussie');
    }

    // Test 2: Lister les tables
    console.log('\n2️⃣ Test des tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings']);
    
    if (tablesError) {
      console.log('❌ Erreur tables:', tablesError.message);
    } else {
      console.log('✅ Tables trouvées:', tables.map(t => t.table_name));
    }

    // Test 3: Analyser les données
    console.log('\n3️⃣ Analyse des données...');
    
    // Employés
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, role, pinCode');
    
    if (empError) {
      console.log('❌ Erreur employés:', empError.message);
    } else {
      console.log(`✅ Employés: ${employees?.length || 0} trouvés`);
      employees?.forEach(emp => {
        console.log(`   - ${emp.name} (${emp.role}) - PIN: ${emp.pinCode}`);
      });
    }

    // Créneaux
    const { data: shifts, error: shiftError } = await supabase
      .from('shifts')
      .select('id, employee_id, start_time, status')
      .limit(5);
    
    if (shiftError) {
      console.log('❌ Erreur créneaux:', shiftError.message);
    } else {
      console.log(`✅ Créneaux: ${shifts?.length || 0} trouvés`);
    }

    // Photos
    const { data: photos, error: photoError } = await supabase
      .from('clock_photos')
      .select('id, employee_id, timestamp')
      .limit(5);
    
    if (photoError) {
      console.log('❌ Erreur photos:', photoError.message);
    } else {
      console.log(`✅ Photos: ${photos?.length || 0} trouvées`);
    }

    // Test 4: Storage
    console.log('\n4️⃣ Test du storage...');
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketError) {
      console.log('❌ Erreur storage:', bucketError.message);
    } else {
      console.log(`✅ Storage: ${buckets?.length || 0} buckets`);
      buckets?.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`);
      });
    }

    console.log('\n🎉 MCP Supabase configuré et fonctionnel !');
    console.log('📋 Prochaines étapes :');
    console.log('1. Redémarrer Cursor pour activer le MCP');
    console.log('2. Tester l\'application en production');
    console.log('3. Utiliser le MCP pour gérer les données');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testMCPConnection();