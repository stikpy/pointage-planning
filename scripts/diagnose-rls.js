const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

// Utiliser la clé de service pour bypasser RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseRLS() {
  try {
    console.log('🔍 Diagnostic des politiques RLS...\n');
    
    // Test 1: Vérifier l'accès aux employés
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
    
    // Test 2: Vérifier l'accès aux créneaux
    console.log('\n2️⃣ Test accès créneaux...');
    const { data: shifts, error: shiftError } = await supabase
      .from('shifts')
      .select('id, employee_id, start_time, status')
      .limit(3);
    
    if (shiftError) {
      console.error('❌ Erreur créneaux:', shiftError.message);
    } else {
      console.log('✅ Créneaux accessibles:', shifts?.length || 0, 'enregistrements');
      console.log('   Exemple:', shifts?.[0]);
    }
    
    // Test 3: Vérifier l'accès aux photos
    console.log('\n3️⃣ Test accès photos...');
    const { data: photos, error: photoError } = await supabase
      .from('clock_photos')
      .select('id, employee_id, timestamp')
      .limit(3);
    
    if (photoError) {
      console.error('❌ Erreur photos:', photoError.message);
    } else {
      console.log('✅ Photos accessibles:', photos?.length || 0, 'enregistrements');
      console.log('   Exemple:', photos?.[0]);
    }
    
    // Test 4: Vérifier le bucket storage
    console.log('\n4️⃣ Test bucket storage...');
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketError) {
      console.error('❌ Erreur buckets:', bucketError.message);
    } else {
      console.log('✅ Buckets accessibles:', buckets?.length || 0);
      const clockPhotosBucket = buckets?.find(b => b.id === 'clock-photos');
      if (clockPhotosBucket) {
        console.log('   Bucket clock-photos trouvé:', {
          id: clockPhotosBucket.id,
          name: clockPhotosBucket.name,
          public: clockPhotosBucket.public
        });
      } else {
        console.log('   ⚠️ Bucket clock-photos non trouvé');
      }
    }
    
    // Test 5: Vérifier les objets dans le bucket
    console.log('\n5️⃣ Test objets dans clock-photos...');
    const { data: objects, error: objectsError } = await supabase
      .storage
      .from('clock-photos')
      .list();
    
    if (objectsError) {
      console.error('❌ Erreur objets storage:', objectsError.message);
    } else {
      console.log('✅ Objets dans clock-photos:', objects?.length || 0);
      if (objects && objects.length > 0) {
        console.log('   Exemple:', objects[0]);
      }
    }
    
    // Test 6: Test d'upload (simulation)
    console.log('\n6️⃣ Test upload simulation...');
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const fileName = `test_${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('clock-photos')
      .upload(fileName, testBlob);
    
    if (uploadError) {
      console.error('❌ Erreur upload:', uploadError.message);
    } else {
      console.log('✅ Upload réussi:', uploadData);
      
      // Nettoyer le fichier de test
      await supabase
        .storage
        .from('clock-photos')
        .remove([fileName]);
      console.log('   Fichier de test supprimé');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
diagnoseRLS();
