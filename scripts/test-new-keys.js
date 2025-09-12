const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';

// Nouvelles clés API Supabase
const keys = {
  publishable: 'sb_publishable_RnLS-wVof-pbR7Z2d-xyJg_bxYUEbDd',
  secret: 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl'
};

async function testNewKeys() {
  console.log('🔑 Test des nouvelles clés API Supabase...\n');

  for (const [keyType, key] of Object.entries(keys)) {
    console.log(`\n${keyType.toUpperCase()} KEY:`);
    console.log(`Clé: ${key}`);
    
    try {
      const supabase = createClient(supabaseUrl, key);
      
      // Test 1: Accès aux employés
      console.log('  📋 Test accès employés...');
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, name, role')
        .limit(3);
      
      if (empError) {
        console.log(`    ❌ Erreur employés: ${empError.message}`);
      } else {
        console.log(`    ✅ Employés: ${employees?.length || 0} trouvés`);
        if (employees && employees[0]) {
          console.log(`    📝 Exemple: ${employees[0].name} (${employees[0].role})`);
        }
      }

      // Test 2: Accès au storage
      console.log('  🗂️ Test storage...');
      const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketError) {
        console.log(`    ❌ Erreur storage: ${bucketError.message}`);
      } else {
        console.log(`    ✅ Storage: ${buckets?.length || 0} buckets`);
        if (buckets && buckets[0]) {
          console.log(`    📁 Bucket: ${buckets[0].name} (public: ${buckets[0].public})`);
        }
      }

      // Test 3: Test d'upload (seulement avec clé secrète)
      if (keyType === 'secret') {
        console.log('  📤 Test upload...');
        const canvas = require('canvas');
        const { createCanvas } = canvas;
        
        const testCanvas = createCanvas(1, 1);
        const ctx = testCanvas.getContext('2d');
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 1, 1);
        
        const buffer = testCanvas.toBuffer('image/png');
        const blob = new Blob([buffer], { type: 'image/png' });
        
        const fileName = `test_${Date.now()}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('clock-photos')
          .upload(fileName, blob);
        
        if (uploadError) {
          console.log(`    ❌ Erreur upload: ${uploadError.message}`);
        } else {
          console.log(`    ✅ Upload réussi: ${uploadData.path}`);
          
          // Nettoyer
          await supabase
            .storage
            .from('clock-photos')
            .remove([fileName]);
          console.log(`    🧹 Test nettoyé`);
        }
      }

    } catch (err) {
      console.log(`    ❌ Exception: ${err.message}`);
    }
  }

  console.log('\n🎯 Résumé:');
  console.log('- Clé publique: Pour le développement (avec RLS)');
  console.log('- Clé secrète: Pour la production (bypass RLS)');
}

testNewKeys();
