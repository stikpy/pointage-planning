const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl'

async function createTablesDirect() {
  console.log('🚀 Création des tables via API REST Supabase...')
  console.log('URL:', supabaseUrl)
  console.log('Service Key:', supabaseServiceKey.substring(0, 20) + '...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test de connexion d'abord
    console.log('\n🔍 Test de connexion...')
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)
    
    if (testError) {
      console.error('❌ Erreur de connexion:', testError.message)
      return
    }
    
    console.log('✅ Connexion Supabase réussie')
    
    // Insérer les employés de test directement
    console.log('\n👥 Insertion des employés de test...')
    const testEmployees = [
      {
        id: 'emp_1',
        name: 'Marie Dubois',
        email: 'marie.dubois@restaurant.com',
        position: 'Chef de cuisine',
        role: 'manager',
        pin_code: '1234',
        work_schedule: { startTime: '08:00', endTime: '18:00', days: [1,2,3,4,5] }
      },
      {
        id: 'emp_2',
        name: 'Jean Martin',
        email: 'jean.martin@restaurant.com',
        position: 'Serveur',
        role: 'employee',
        pin_code: '5678',
        work_schedule: { startTime: '09:00', endTime: '17:00', days: [1,2,3,4,5] }
      },
      {
        id: 'emp_3',
        name: 'Sophie Laurent',
        email: 'sophie.laurent@restaurant.com',
        position: 'Cuisinière',
        role: 'employee',
        pin_code: '9012',
        work_schedule: { startTime: '07:00', endTime: '16:00', days: [1,2,3,4,5] }
      },
      {
        id: 'emp_4',
        name: 'Pierre Moreau',
        email: 'pierre.moreau@restaurant.com',
        position: 'Barman',
        role: 'employee',
        pin_code: '3456',
        work_schedule: { startTime: '18:00', endTime: '02:00', days: [1,2,3,4,5] }
      },
      {
        id: 'emp_5',
        name: 'Claire Petit',
        email: 'claire.petit@restaurant.com',
        position: 'Hôtesse',
        role: 'employee',
        pin_code: '7890',
        work_schedule: { startTime: '10:00', endTime: '16:00', days: [1,2,3,4,5] }
      }
    ]
    
    const { error: insertError } = await supabase
      .from('employees')
      .upsert(testEmployees)
    
    if (insertError) {
      console.error('❌ Erreur insertion employés:', insertError.message)
      console.log('💡 Les tables doivent être créées manuellement dans Supabase')
      console.log('📋 Instructions :')
      console.log('1. Allez dans Supabase Dashboard > SQL Editor')
      console.log('2. Copiez le contenu de supabase/schema.sql')
      console.log('3. Exécutez le script SQL')
      console.log('4. Relancez ce script')
    } else {
      console.log('✅ Employés de test insérés avec succès')
    }
    
    // Vérifier les tables existantes
    console.log('\n🔍 Vérification des tables...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings'])
    
    if (tablesError) {
      console.error('❌ Erreur vérification tables:', tablesError.message)
    } else {
      console.log('✅ Tables trouvées:', tables.map(t => t.table_name))
    }
    
    // Vérifier les employés
    console.log('\n👥 Vérification des employés...')
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, role')
      .limit(5)
    
    if (empError) {
      console.error('❌ Erreur vérification employés:', empError.message)
    } else {
      console.log('✅ Employés trouvés:', employees.length)
      employees.forEach(emp => {
        console.log(`   - ${emp.name} (${emp.role})`)
      })
    }
    
    console.log('\n🎉 Configuration terminée !')
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message)
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  createTablesDirect()
}

module.exports = { createTablesDirect }
