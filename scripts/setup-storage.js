const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl'

async function setupStorage() {
  console.log('🚀 Configuration du stockage Supabase...')
  console.log('URL:', supabaseUrl)
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 1. Créer le bucket pour les photos de pointage
    console.log('\n1. 📸 Création du bucket clock-photos...')
    
    const { data: bucketData, error: bucketError } = await supabase.storage
      .createBucket('clock-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })
    
    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket clock-photos existe déjà')
      } else {
        console.error('❌ Erreur création bucket:', bucketError.message)
      }
    } else {
      console.log('✅ Bucket clock-photos créé:', bucketData)
    }
    
    // 2. Configurer les politiques RLS pour le bucket
    console.log('\n2. 🔒 Configuration des politiques de sécurité...')
    
    // Note: Les politiques de storage doivent être configurées via l'interface Supabase
    // car l'API ne permet pas de créer des politiques de storage directement
    console.log('📋 Politiques à configurer manuellement dans Supabase Dashboard:')
    console.log('   - Storage > Policies > clock-photos')
    console.log('   - Policy: "Users can upload their own photos"')
    console.log('   - Policy: "Users can view their own photos"')
    console.log('   - Policy: "Managers can view all photos"')
    
    // 3. Tester l'upload d'un fichier de test
    console.log('\n3. 🧪 Test d\'upload...')
    
    const testContent = 'Test file for clock-photos bucket'
    const testBlob = new Blob([testContent], { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clock-photos')
      .upload('test.txt', testBlob)
    
    if (uploadError) {
      console.error('❌ Erreur test upload:', uploadError.message)
    } else {
      console.log('✅ Test upload réussi:', uploadData)
      
      // Nettoyer le fichier de test
      await supabase.storage
        .from('clock-photos')
        .remove(['test.txt'])
      console.log('🧹 Fichier de test supprimé')
    }
    
    // 4. Vérifier les buckets existants
    console.log('\n4. 📋 Vérification des buckets...')
    
    const { data: buckets, error: bucketsError } = await supabase.storage
      .listBuckets()
    
    if (bucketsError) {
      console.error('❌ Erreur liste buckets:', bucketsError.message)
    } else {
      console.log('✅ Buckets trouvés:', buckets.length)
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`)
      })
    }
    
    console.log('\n🎉 Configuration du stockage terminée !')
    console.log('\n📋 Prochaines étapes :')
    console.log('1. Allez dans Supabase Dashboard > Storage')
    console.log('2. Configurez les politiques RLS pour le bucket clock-photos')
    console.log('3. Testez l\'upload de photos dans l\'application')
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message)
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  setupStorage()
}

module.exports = { setupStorage }
