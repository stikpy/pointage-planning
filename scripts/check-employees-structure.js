const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const secretKey = 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

async function checkEmployeesStructure() {
  console.log('🔍 Vérification de la structure de la table employees...\n');

  try {
    const supabase = createClient(supabaseUrl, secretKey);

    // Test 1: Récupérer tous les employés sans spécifier de colonnes
    console.log('1️⃣ Récupération de tous les employés...');
    const { data: allEmployees, error: allError } = await supabase
      .from('employees')
      .select('*')
      .limit(3);
    
    if (allError) {
      console.log('❌ Erreur:', allError.message);
      return;
    } else {
      console.log('✅ Employés trouvés:', allEmployees?.length || 0);
      if (allEmployees && allEmployees[0]) {
        console.log('📋 Structure de l\'employé:');
        console.log(JSON.stringify(allEmployees[0], null, 2));
      }
    }

    // Test 2: Vérifier les colonnes spécifiques
    console.log('\n2️⃣ Test des colonnes spécifiques...');
    const { data: specificEmployees, error: specificError } = await supabase
      .from('employees')
      .select('id, name, role, pin_code, work_schedule')
      .limit(3);
    
    if (specificError) {
      console.log('❌ Erreur colonnes spécifiques:', specificError.message);
    } else {
      console.log('✅ Colonnes spécifiques OK');
      if (specificEmployees && specificEmployees[0]) {
        console.log('📋 Employé avec colonnes spécifiques:');
        console.log(JSON.stringify(specificEmployees[0], null, 2));
      }
    }

    // Test 3: Lister toutes les colonnes disponibles
    console.log('\n3️⃣ Test de récupération de toutes les colonnes...');
    const { data: allColumns, error: columnsError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.log('❌ Erreur colonnes:', columnsError.message);
    } else {
      console.log('✅ Toutes les colonnes récupérées');
      if (allColumns && allColumns[0]) {
        console.log('📋 Colonnes disponibles:');
        Object.keys(allColumns[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof allColumns[0][key]}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkEmployeesStructure();
