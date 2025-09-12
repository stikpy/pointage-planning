const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl'

async function createTablesWithREST() {
  console.log('🚀 Création des tables via API REST Supabase...')
  console.log('URL:', supabaseUrl)
  console.log('Service Key:', supabaseServiceKey.substring(0, 20) + '...')
  
  try {
    // Lire le fichier de schéma
    const schemaPath = path.join(__dirname, '../supabase/schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('\n📝 Exécution du SQL via API REST...')
    
    // Diviser le SQL en instructions individuelles
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📊 ${statements.length} instructions SQL à exécuter`)
    
    // Exécuter chaque instruction via l'API REST
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\n${i + 1}/${statements.length} Exécution: ${statement.substring(0, 50)}...`)
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: statement })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.warn(`⚠️  Erreur sur l'instruction ${i + 1}:`, errorText)
        } else {
          console.log(`✅ Instruction ${i + 1} exécutée avec succès`)
        }
      } catch (err) {
        console.warn(`⚠️  Erreur sur l'instruction ${i + 1}:`, err.message)
      }
    }
    
    // Vérifier que les tables ont été créées
    console.log('\n🔍 Vérification des tables créées...')
    
    const response = await fetch(`${supabaseUrl}/rest/v1/information_schema.tables?table_schema=eq.public&table_name=in.(employees,shifts,clock_sessions,clock_photos,app_settings)`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    })
    
    if (response.ok) {
      const tables = await response.json()
      console.log('✅ Tables créées:', tables.map(t => t.table_name))
    } else {
      console.error('❌ Erreur lors de la vérification des tables')
    }
    
    // Vérifier les employés de test
    console.log('\n👥 Vérification des employés de test...')
    const empResponse = await fetch(`${supabaseUrl}/rest/v1/employees?select=id,name,role&limit=5`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    })
    
    if (empResponse.ok) {
      const employees = await empResponse.json()
      console.log('✅ Employés trouvés:', employees.length)
      employees.forEach(emp => {
        console.log(`   - ${emp.name} (${emp.role})`)
      })
    } else {
      console.error('❌ Erreur lors de la vérification des employés')
    }
    
    console.log('\n🎉 Configuration terminée !')
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message)
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  createTablesWithREST()
}

module.exports = { createTablesWithREST }
