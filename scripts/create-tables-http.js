const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl'

async function createTablesWithHTTP() {
  console.log('🚀 Création des tables via HTTP Supabase...')
  console.log('URL:', supabaseUrl)
  console.log('Service Key:', supabaseServiceKey.substring(0, 20) + '...')
  
  try {
    // Lire le fichier de schéma
    const schemaPath = path.join(__dirname, '../supabase/schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('\n📝 Instructions pour créer les tables :')
    console.log('1. Allez sur https://supabase.com/dashboard')
    console.log('2. Sélectionnez votre projet')
    console.log('3. Allez dans SQL Editor')
    console.log('4. Copiez et collez le SQL suivant :')
    console.log('\n' + '='.repeat(80))
    console.log(schemaSQL)
    console.log('='.repeat(80))
    
    console.log('\n5. Cliquez sur "Run" pour exécuter le script')
    console.log('6. Attendez que toutes les tables soient créées')
    console.log('7. Relancez: npm run test-simple')
    
    // Test de connexion simple
    console.log('\n🔍 Test de connexion...')
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    })
    
    if (response.ok) {
      console.log('✅ Connexion Supabase réussie')
    } else {
      console.error('❌ Erreur de connexion:', response.status, response.statusText)
    }
    
    // Essayer de créer une table simple via l'API REST
    console.log('\n🧪 Test de création de table simple...')
    
    // Créer une table de test
    const createTestTableSQL = `
      CREATE TABLE IF NOT EXISTS public.test_table (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    // Utiliser l'API REST pour exécuter du SQL
    const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: createTestTableSQL })
    })
    
    if (sqlResponse.ok) {
      console.log('✅ Table de test créée avec succès')
    } else {
      const errorText = await sqlResponse.text()
      console.log('⚠️  Erreur création table de test:', errorText)
      console.log('💡 La fonction exec_sql n\'existe pas. Utilisez le SQL Editor manuellement.')
    }
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message)
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  createTablesWithHTTP()
}

module.exports = { createTablesWithHTTP }
