const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here'

async function testSupabaseConnection() {
  console.log('🔍 Test de connexion à Supabase...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey.substring(0, 20) + '...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test de connexion basique
    console.log('\n1. Test de connexion basique...')
    const { data, error } = await supabase
      .from('employees')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message)
      return false
    }
    
    console.log('✅ Connexion établie avec succès')
    
    // Test de lecture des employés
    console.log('\n2. Test de lecture des employés...')
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(5)
    
    if (empError) {
      console.error('❌ Erreur lors de la lecture des employés:', empError.message)
      return false
    }
    
    console.log(`✅ ${employees.length} employés trouvés`)
    employees.forEach(emp => {
      console.log(`   - ${emp.name} (${emp.role})`)
    })
    
    // Test de lecture des créneaux
    console.log('\n3. Test de lecture des créneaux...')
    const { data: shifts, error: shiftError } = await supabase
      .from('shifts')
      .select('*')
      .limit(5)
    
    if (shiftError) {
      console.error('❌ Erreur lors de la lecture des créneaux:', shiftError.message)
      return false
    }
    
    console.log(`✅ ${shifts.length} créneaux trouvés`)
    
    // Test de création d'un employé (si pas d'erreur)
    console.log('\n4. Test de création d\'un employé...')
    const testEmployee = {
      id: 'test_' + Date.now(),
      name: 'Test Employee',
      email: 'test@example.com',
      position: 'Test Position',
      role: 'employee',
      pin_code: '0000'
    }
    
    const { data: newEmp, error: createError } = await supabase
      .from('employees')
      .insert(testEmployee)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Erreur lors de la création:', createError.message)
      return false
    }
    
    console.log('✅ Employé de test créé:', newEmp.name)
    
    // Nettoyage - suppression de l'employé de test
    console.log('\n5. Nettoyage...')
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', testEmployee.id)
    
    if (deleteError) {
      console.error('⚠️ Erreur lors du nettoyage:', deleteError.message)
    } else {
      console.log('✅ Employé de test supprimé')
    }
    
    console.log('\n🎉 Tous les tests sont passés avec succès !')
    return true
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message)
    return false
  }
}

// Exécuter le test si appelé directement
if (require.main === module) {
  testSupabaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { testSupabaseConnection }
