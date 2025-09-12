const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl'

async function testSimple() {
  console.log('🔍 Test simple de connexion Supabase...')
  console.log('URL:', supabaseUrl)
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test 1: Vérifier si la table employees existe
    console.log('\n1. Test de la table employees...')
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(1)
    
    if (empError) {
      console.log('❌ Table employees non trouvée:', empError.message)
      console.log('💡 Vous devez d\'abord exécuter le SQL dans Supabase Dashboard')
    } else {
      console.log('✅ Table employees trouvée !')
      console.log('📊 Nombre d\'employés:', employees.length)
      if (employees.length > 0) {
        console.log('👤 Premier employé:', employees[0].name)
      }
    }
    
    // Test 2: Insérer un employé de test si la table existe
    if (!empError) {
      console.log('\n2. Test d\'insertion d\'employé...')
      const testEmployee = {
        id: 'test_' + Date.now(),
        name: 'Test User',
        email: 'test@example.com',
        position: 'Test Position',
        role: 'employee',
        pin_code: '9999'
      }
      
      const { error: insertError } = await supabase
        .from('employees')
        .insert(testEmployee)
      
      if (insertError) {
        console.log('❌ Erreur insertion:', insertError.message)
      } else {
        console.log('✅ Employé de test inséré avec succès')
        
        // Nettoyer
        await supabase
          .from('employees')
          .delete()
          .eq('id', testEmployee.id)
        console.log('🧹 Employé de test supprimé')
      }
    }
    
    console.log('\n🎉 Test terminé !')
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message)
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  testSimple()
}

module.exports = { testSimple }
