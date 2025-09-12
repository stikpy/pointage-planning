const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Configuration de la base de données
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:[YOUR-PASSWORD]@db.ztgqzlrvrgnvilkipznr.supabase.co:5432/postgres'
}

async function setupDatabase() {
  const client = new Client(dbConfig)
  
  try {
    await client.connect()
    console.log('✅ Connexion à la base de données établie')
    
    // Lire le fichier de schéma
    const schemaPath = path.join(__dirname, '../supabase/schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    
    // Exécuter le schéma
    await client.query(schemaSQL)
    console.log('✅ Schéma de base de données créé avec succès')
    
    // Vérifier que les tables ont été créées
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings')
      ORDER BY table_name
    `)
    
    console.log('📋 Tables créées:', result.rows.map(row => row.table_name))
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration de la base de données:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  setupDatabase()
}

module.exports = { setupDatabase }
