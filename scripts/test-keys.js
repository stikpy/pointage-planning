const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';

// Test avec différentes clés
const keys = {
  anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0Z3F6bHJ2cmdudmlsa2lwem5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDk1NTQsImV4cCI6MjA3MzI4NTU1NH0.1fc1e918',
  service: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0Z3F6bHJ2cmdudmlsa2lwem5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcwOTU1NCwiZXhwIjoyMDczMjg1NTU0fQ.sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl'
};

async function testKeys() {
  console.log('🔑 Test des clés API...\n');

  for (const [keyType, key] of Object.entries(keys)) {
    console.log(`\n${keyType.toUpperCase()} KEY:`);
    console.log(`Clé: ${key.substring(0, 50)}...`);
    
    try {
      const supabase = createClient(supabaseUrl, key);
      
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, role')
        .limit(1);
      
      if (error) {
        console.log(`❌ Erreur: ${error.message}`);
      } else {
        console.log(`✅ Succès: ${data?.length || 0} employés trouvés`);
        if (data && data[0]) {
          console.log(`   Exemple: ${data[0].name}`);
        }
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
  }
}

testKeys();
