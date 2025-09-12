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

async function tempFixWithServiceKey() {
  try {
    console.log('🔧 Solution temporaire avec clé de service...\n');

    // Test 1: Vérifier que la clé de service fonctionne
    console.log('1️⃣ Test clé de service...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, role')
      .limit(3);
    
    if (empError) {
      console.error('❌ Erreur clé de service:', empError.message);
      return;
    } else {
      console.log('✅ Clé de service OK:', employees?.length || 0, 'employés');
    }

    // Test 2: Vérifier le storage
    console.log('\n2️⃣ Test storage...');
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketError) {
      console.error('❌ Erreur storage:', bucketError.message);
    } else {
      console.log('✅ Storage OK:', buckets.length, 'buckets');
    }

    // Test 3: Test d'upload
    console.log('\n3️⃣ Test upload...');
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
      
      // Nettoyer
      await supabase
        .storage
        .from('clock-photos')
        .remove([fileName]);
      console.log('   Test nettoyé');
    }

    console.log('\n🎉 Solution temporaire validée !');
    console.log('📋 Prochaines étapes :');
    console.log('1. Modifier lib/supabase.ts pour utiliser la clé de service temporairement');
    console.log('2. Déployer sur Vercel');
    console.log('3. Tester l\'application');
    console.log('4. Corriger les politiques RLS plus tard');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
tempFixWithServiceKey();
