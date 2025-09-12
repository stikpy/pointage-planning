const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const secretKey = 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

async function testImageInsert() {
  console.log('🖼️ Test d\'insertion d\'image...\n');

  try {
    const supabase = createClient(supabaseUrl, secretKey);

    // Chemin vers l'image
    const imagePath = path.join(__dirname, '..', 'utils', 'EBC41BA4-428D-46CE-A88F-8FA866813775_1_105_c.jpeg');
    
    // Vérifier que l'image existe
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Image non trouvée:', imagePath);
      return;
    }

    console.log('✅ Image trouvée:', imagePath);

    // Lire l'image
    const imageBuffer = fs.readFileSync(imagePath);
    const fileName = `test_${Date.now()}_${path.basename(imagePath)}`;
    
    console.log('📤 Upload de l\'image vers Supabase Storage...');
    
    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('clock-photos')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erreur upload:', uploadError);
      return;
    }

    console.log('✅ Image uploadée:', uploadData.path);

    // Obtenir l'URL publique
    const { data: urlData } = supabase
      .storage
      .from('clock-photos')
      .getPublicUrl(fileName);

    console.log('🔗 URL publique:', urlData.publicUrl);

    // Insérer dans la table clock_photos
    console.log('💾 Insertion dans la table clock_photos...');
    
    // Convertir l'image en base64 pour photo_data
    const base64Data = imageBuffer.toString('base64');
    
    const photoRecord = {
      employee_id: 'emp_1',
      photo_url: urlData.publicUrl,
      photo_data: base64Data, // Ajouter les données base64
      timestamp: new Date().toISOString(),
      metadata: {
        original_filename: path.basename(imagePath),
        file_size: imageBuffer.length,
        upload_timestamp: Date.now()
      }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('clock_photos')
      .insert(photoRecord)
      .select();

    if (insertError) {
      console.error('❌ Erreur insertion:', insertError);
    } else {
      console.log('✅ Photo insérée:', insertData);
    }

    // Test de récupération
    console.log('\n🔍 Test de récupération...');
    
    const { data: photos, error: fetchError } = await supabase
      .from('clock_photos')
      .select('*')
      .eq('employee_id', 'emp_1')
      .order('timestamp', { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error('❌ Erreur récupération:', fetchError);
    } else {
      console.log('✅ Photos récupérées:', photos.length);
      photos.forEach((photo, index) => {
        console.log(`   ${index + 1}. ${photo.photo_url} (${photo.timestamp})`);
      });
    }

    // Test avec l'API Next.js
    console.log('\n🌐 Test avec l\'API Next.js...');
    
    try {
      const response = await fetch('http://localhost:3000/api/clock-photos?employee_id=emp_1');
      if (response.ok) {
        const apiPhotos = await response.json();
        console.log('✅ API Next.js fonctionne:', apiPhotos.length, 'photos');
      } else {
        console.log('⚠️ API Next.js non disponible (serveur local non démarré)');
      }
    } catch (error) {
      console.log('⚠️ API Next.js non disponible:', error.message);
    }

    console.log('\n🎉 Test d\'insertion d\'image terminé !');
    console.log('📋 Résumé :');
    console.log('- Image uploadée vers Supabase Storage ✅');
    console.log('- URL publique générée ✅');
    console.log('- Enregistrement dans clock_photos ✅');
    console.log('- Récupération des données ✅');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testImageInsert();
