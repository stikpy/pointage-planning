const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const secretKey = 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

async function checkTableStructure() {
  console.log('🔍 Vérification de la structure des tables...\n');

  try {
    const supabase = createClient(supabaseUrl, secretKey);

    // Vérifier la structure de clock_photos
    console.log('1️⃣ Structure de clock_photos:');
    const { data: clockPhotosStructure, error: clockPhotosError } = await supabase
      .rpc('get_table_columns', { table_name: 'clock_photos' });

    if (clockPhotosError) {
      console.log('❌ Erreur récupération structure clock_photos:', clockPhotosError);
    } else {
      console.log('✅ Structure clock_photos:', clockPhotosStructure);
    }

    // Vérifier la structure de employees
    console.log('\n2️⃣ Structure de employees:');
    const { data: employeesStructure, error: employeesError } = await supabase
      .rpc('get_table_columns', { table_name: 'employees' });

    if (employeesError) {
      console.log('❌ Erreur récupération structure employees:', employeesError);
    } else {
      console.log('✅ Structure employees:', employeesStructure);
    }

    // Vérifier la structure de shifts
    console.log('\n3️⃣ Structure de shifts:');
    const { data: shiftsStructure, error: shiftsError } = await supabase
      .rpc('get_table_columns', { table_name: 'shifts' });

    if (shiftsError) {
      console.log('❌ Erreur récupération structure shifts:', shiftsError);
    } else {
      console.log('✅ Structure shifts:', shiftsStructure);
    }

    // Test simple d'insertion avec toutes les colonnes
    console.log('\n4️⃣ Test d\'insertion avec données complètes:');
    
    const testPhotoRecord = {
      employee_id: 'emp_1',
      photo_url: 'https://example.com/test.jpg',
      photo_data: 'test_base64_data', // Ajouter photo_data
      timestamp: new Date().toISOString(),
      metadata: {}
    };

    const { data: testInsert, error: testInsertError } = await supabase
      .from('clock_photos')
      .insert(testPhotoRecord)
      .select();

    if (testInsertError) {
      console.log('❌ Erreur test insertion:', testInsertError);
    } else {
      console.log('✅ Test insertion réussi:', testInsert);
      
      // Nettoyer
      if (testInsert && testInsert[0]) {
        await supabase
          .from('clock_photos')
          .delete()
          .eq('id', testInsert[0].id);
        console.log('   Test nettoyé');
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkTableStructure();
