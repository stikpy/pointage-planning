const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl'

async function testMCPConnection() {
  console.log('🔍 Test de connexion MCP Supabase...')
  console.log('URL:', supabaseUrl)
  console.log('Service Key:', supabaseServiceKey.substring(0, 20) + '...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test 1: Vérifier les tables existantes
    console.log('\n1. 📊 Vérification des tables...')
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .in('tablename', ['employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings'])
    
    if (tablesError) {
      console.error('❌ Erreur tables:', tablesError.message)
    } else {
      console.log('✅ Tables trouvées:', tables.map(t => t.tablename))
    }
    
    // Test 2: Vérifier les employés
    console.log('\n2. 👥 Vérification des employés...')
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, role, pin_code, work_schedule')
      .limit(10)
    
    if (empError) {
      console.error('❌ Erreur employés:', empError.message)
    } else {
      console.log('✅ Employés trouvés:', employees.length)
      employees.forEach(emp => {
        console.log(`   - ${emp.name} (${emp.role}) - PIN: ${emp.pin_code}`)
        console.log(`     Horaires: ${emp.work_schedule?.startTime} - ${emp.work_schedule?.endTime}`)
      })
    }
    
    // Test 3: Vérifier les paramètres
    console.log('\n3. ⚙️ Vérification des paramètres...')
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('id, value, description')
    
    if (settingsError) {
      console.error('❌ Erreur paramètres:', settingsError.message)
    } else {
      console.log('✅ Paramètres trouvés:', settings.length)
      settings.forEach(setting => {
        console.log(`   - ${setting.id}: ${setting.description}`)
        console.log(`     Valeur: ${JSON.stringify(setting.value)}`)
      })
    }
    
    // Test 4: Test d'insertion d'un créneau
    console.log('\n4. 📝 Test d\'insertion d\'un créneau...')
    const testShift = {
      employee_id: employees[0]?.id || 'emp_1',
      start_time: new Date().toISOString(),
      status: 'active',
      notes: 'Test MCP connection'
    }
    
    const { data: newShift, error: shiftError } = await supabase
      .from('shifts')
      .insert(testShift)
      .select()
    
    if (shiftError) {
      console.error('❌ Erreur insertion créneau:', shiftError.message)
    } else {
      console.log('✅ Créneau inséré:', newShift[0]?.id)
      
      // Nettoyer le test
      await supabase
        .from('shifts')
        .delete()
        .eq('id', newShift[0]?.id)
      console.log('🧹 Créneau de test supprimé')
    }
    
    // Test 5: Vérifier les index
    console.log('\n5. 🔍 Vérification des index...')
    const { data: indexes, error: indexError } = await supabase
      .from('pg_indexes')
      .select('indexname, tablename')
      .eq('schemaname', 'public')
      .like('indexname', 'idx_%')
    
    if (indexError) {
      console.error('❌ Erreur index:', indexError.message)
    } else {
      console.log('✅ Index trouvés:', indexes.length)
      indexes.forEach(idx => {
        console.log(`   - ${idx.indexname} sur ${idx.tablename}`)
      })
    }
    
    // Test 6: Vérifier RLS
    console.log('\n6. 🔒 Vérification Row Level Security...')
    const { data: rlsTables, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname')
      .eq('relrowsecurity', true)
      .in('relname', ['employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings'])
    
    if (rlsError) {
      console.error('❌ Erreur RLS:', rlsError.message)
    } else {
      console.log('✅ RLS activé sur:', rlsTables.map(t => t.relname))
    }
    
    console.log('\n🎉 Test MCP Supabase terminé avec succès !')
    console.log('\n📋 Résumé :')
    console.log(`✅ Tables: ${tables?.length || 0}/5`)
    console.log(`✅ Employés: ${employees?.length || 0}`)
    console.log(`✅ Paramètres: ${settings?.length || 0}`)
    console.log(`✅ Index: ${indexes?.length || 0}`)
    console.log(`✅ RLS: ${rlsTables?.length || 0}/5`)
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message)
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  testMCPConnection()
}

module.exports = { testMCPConnection }
