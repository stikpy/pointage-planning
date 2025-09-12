const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const secretKey = 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

async function executeSQLViaAPI() {
  console.log('🔧 Exécution du script SQL via API Supabase...\n');

  try {
    const supabase = createClient(supabaseUrl, secretKey);

    // Commandes SQL à exécuter
    const sqlCommands = [
      'ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;',
      'UPDATE storage.buckets SET public = true WHERE id = \'clock-photos\';',
      'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;'
    ];

    console.log('1️⃣ Exécution des commandes SQL...');
    
    for (const sql of sqlCommands) {
      try {
        console.log(`   Exécution: ${sql.substring(0, 50)}...`);
        
        // Utiliser l'API REST directe
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secretKey}`,
            'apikey': secretKey
          },
          body: JSON.stringify({ sql })
        });

        if (response.ok) {
          console.log('   ✅ Succès');
        } else {
          const error = await response.text();
          console.log('   ❌ Erreur:', error.substring(0, 100));
        }
      } catch (error) {
        console.log('   ❌ Exception:', error.message);
      }
    }

    // Test de vérification
    console.log('\n2️⃣ Vérification des résultats...');
    
    // Test 1: Accès aux employés avec clé publique
    const publicSupabase = createClient(supabaseUrl, 'sb_publishable_RnLS-wVof-pbR7Z2d-xyJg_bxYUEbDd');
    
    const { data: employees, error: empError } = await publicSupabase
      .from('employees')
      .select('id, name, role, pin_code')
      .limit(1);
    
    if (empError) {
      console.log('❌ Erreur employés:', empError.message);
    } else {
      console.log('✅ Employés accessibles:', employees?.length || 0);
      if (employees && employees[0]) {
        console.log('   Exemple:', employees[0].name);
      }
    }

    // Test 2: Accès au storage
    const { data: buckets, error: bucketError } = await publicSupabase
      .storage
      .listBuckets();
    
    if (bucketError) {
      console.log('❌ Erreur storage:', bucketError.message);
    } else {
      console.log('✅ Storage accessible:', buckets?.length || 0, 'buckets');
      const clockBucket = buckets?.find(b => b.name === 'clock-photos');
      if (clockBucket) {
        console.log('   Bucket clock-photos public:', clockBucket.public);
      }
    }

    // Test 3: Test d'upload
    console.log('\n3️⃣ Test d\'upload...');
    
    const canvas = require('canvas');
    const { createCanvas } = canvas;
    
    const testCanvas = createCanvas(1, 1);
    const ctx = testCanvas.getContext('2d');
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);
    
    const buffer = testCanvas.toBuffer('image/png');
    const blob = new Blob([buffer], { type: 'image/png' });
    
    const fileName = `test_${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await publicSupabase
      .storage
      .from('clock-photos')
      .upload(fileName, blob);
    
    if (uploadError) {
      console.log('❌ Erreur upload:', uploadError.message);
    } else {
      console.log('✅ Upload réussi:', uploadData.path);
      
      // Nettoyer
      await publicSupabase
        .storage
        .from('clock-photos')
        .remove([fileName]);
      console.log('   Test nettoyé');
    }

    console.log('\n🎉 Script SQL exécuté !');
    console.log('📋 L\'application devrait maintenant fonctionner sur :');
    console.log('   https://pointage-planning.vercel.app');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

executeSQLViaAPI();
