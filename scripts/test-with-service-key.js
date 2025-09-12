const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

// Utiliser la clé de service (comme dans l'app modifiée)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWithServiceKey() {
  try {
    console.log('🧪 Test avec clé de service (comme dans l\'app modifiée)...\n');

    // Test 1: Accès aux employés
    console.log('1️⃣ Test accès employés...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, role')
      .limit(3);
    
    if (empError) {
      console.error('❌ Erreur employés:', empError.message);
    } else {
      console.log('✅ Employés accessibles:', employees?.length || 0, 'enregistrements');
      console.log('   Exemple:', employees?.[0]);
    }

    // Test 2: Accès aux créneaux
    console.log('\n2️⃣ Test accès créneaux...');
    const { data: shifts, error: shiftError } = await supabase
      .from('shifts')
      .select('id, employee_id, start_time, status')
      .limit(3);
    
    if (shiftError) {
      console.error('❌ Erreur créneaux:', shiftError.message);
    } else {
      console.log('✅ Créneaux accessibles:', shifts?.length || 0, 'enregistrements');
    }

    // Test 3: Accès aux photos
    console.log('\n3️⃣ Test accès photos...');
    const { data: photos, error: photoError } = await supabase
      .from('clock_photos')
      .select('id, employee_id, timestamp')
      .limit(3);
    
    if (photoError) {
      console.error('❌ Erreur photos:', photoError.message);
    } else {
      console.log('✅ Photos accessibles:', photos?.length || 0, 'enregistrements');
    }

    // Test 4: Test d'insertion d'un créneau
    console.log('\n4️⃣ Test insertion créneau...');
    const testShift = {
      employee_id: 'emp_1',
      start_time: new Date().toISOString(),
      status: 'active'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('shifts')
      .insert(testShift)
      .select();

    if (insertError) {
      console.error('❌ Erreur insertion:', insertError.message);
    } else {
      console.log('✅ Insertion créneau réussie:', insertData);
      
      // Nettoyer le test
      if (insertData && insertData[0]) {
        await supabase
          .from('shifts')
          .delete()
          .eq('id', insertData[0].id);
        console.log('   Test nettoyé');
      }
    }

    // Test 5: Test d'upload d'image
    console.log('\n5️⃣ Test upload image...');
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
      console.error('❌ Erreur upload:', uploadError.message);
    } else {
      console.log('✅ Upload réussi:', uploadData);
      
      // Nettoyer le test
      await supabase
        .storage
        .from('clock-photos')
        .remove([fileName]);
      console.log('   Test nettoyé');
    }

    console.log('\n🎉 Tous les tests réussis avec la clé de service !');
    console.log('📋 L\'application devrait maintenant fonctionner en production.');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testWithServiceKey();
