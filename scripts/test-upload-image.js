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

async function testImageUpload() {
  try {
    console.log('🖼️ Test upload image...');
    
    // Créer une image de test (1x1 pixel PNG)
    const canvas = require('canvas');
    const { createCanvas } = canvas;
    
    const testCanvas = createCanvas(1, 1);
    const ctx = testCanvas.getContext('2d');
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);
    
    const buffer = testCanvas.toBuffer('image/png');
    const blob = new Blob([buffer], { type: 'image/png' });
    
    const fileName = `test_${Date.now()}.png`;
    
    console.log('📤 Upload en cours...');
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('clock-photos')
      .upload(fileName, blob);
    
    if (uploadError) {
      console.error('❌ Erreur upload:', uploadError.message);
      console.error('   Détails:', uploadError);
    } else {
      console.log('✅ Upload réussi:', uploadData);
      
      // Nettoyer le fichier de test
      await supabase
        .storage
        .from('clock-photos')
        .remove([fileName]);
      console.log('🗑️ Fichier de test supprimé');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    
    // Test alternatif avec un fichier JSON
    console.log('\n🔄 Test alternatif avec JSON...');
    try {
      const jsonBlob = new Blob([JSON.stringify({test: 'data'})], { type: 'application/json' });
      const fileName = `test_${Date.now()}.json`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('clock-photos')
        .upload(fileName, jsonBlob);
      
      if (uploadError) {
        console.error('❌ Erreur upload JSON:', uploadError.message);
      } else {
        console.log('✅ Upload JSON réussi:', uploadData);
        
        // Nettoyer
        await supabase
          .storage
          .from('clock-photos')
          .remove([fileName]);
        console.log('🗑️ Fichier JSON supprimé');
      }
    } catch (jsonError) {
      console.error('❌ Erreur JSON:', jsonError);
    }
  }
}

// Exécuter le test
testImageUpload();
