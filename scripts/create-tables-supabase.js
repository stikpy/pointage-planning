const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

async function createTablesWithSupabase() {
  console.log('🚀 Création des tables via Supabase...')
  console.log('URL:', supabaseUrl)
  
  try {
    // Utiliser la clé service role pour les opérations d'administration
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Lire le fichier de schéma
    const schemaPath = path.join(__dirname, '../supabase/schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    
    // Diviser le SQL en instructions individuelles
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 ${statements.length} instructions SQL à exécuter`)
    
    // Exécuter chaque instruction
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\n${i + 1}/${statements.length} Exécution: ${statement.substring(0, 50)}...`)
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        })
        
        if (error) {
          console.warn(`⚠️  Erreur sur l'instruction ${i + 1}:`, error.message)
          // Continuer avec les autres instructions
        } else {
          console.log(`✅ Instruction ${i + 1} exécutée avec succès`)
        }
      } catch (err) {
        console.warn(`⚠️  Erreur sur l'instruction ${i + 1}:`, err.message)
      }
    }
    
    // Vérifier que les tables ont été créées
    console.log('\n🔍 Vérification des tables créées...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings'])
    
    if (tablesError) {
      console.error('❌ Erreur lors de la vérification:', tablesError.message)
    } else {
      console.log('✅ Tables créées:', tables.map(t => t.table_name))
    }
    
    // Vérifier les employés de test
    console.log('\n👥 Vérification des employés de test...')
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, role')
      .limit(5)
    
    if (empError) {
      console.error('❌ Erreur lors de la vérification des employés:', empError.message)
    } else {
      console.log('✅ Employés trouvés:', employees.length)
      employees.forEach(emp => {
        console.log(`   - ${emp.name} (${emp.role})`)
      })
    }
    
    console.log('\n🎉 Configuration terminée avec succès !')
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message)
    process.exit(1)
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  createTablesWithSupabase()
}

module.exports = { createTablesWithSupabase }
