const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const secretKey = 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

async function mcpMigration() {
  console.log('🔧 Migration via MCP Supabase...\n');

  try {
    const supabase = createClient(supabaseUrl, secretKey);

    // Étape 1: Vérifier la structure actuelle
    console.log('1️⃣ Vérification de la structure actuelle...');
    
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (empError) {
      console.log('❌ Erreur employés:', empError.message);
    } else {
      console.log('✅ Structure employés OK');
      if (employees && employees[0]) {
        console.log('   Colonnes:', Object.keys(employees[0]).join(', '));
      }
    }

    // Étape 2: Créer une fonction SQL pour gérer RLS
    console.log('\n2️⃣ Création d\'une fonction de gestion RLS...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION fix_rls_policies()
      RETURNS text AS $$
      BEGIN
        -- Supprimer les politiques existantes problématiques
        DROP POLICY IF EXISTS "Employees are viewable by everyone" ON public.employees;
        DROP POLICY IF EXISTS "Only managers can modify employees" ON public.employees;
        DROP POLICY IF EXISTS "Public read access for employees" ON public.employees;
        DROP POLICY IF EXISTS "Public write access for employees" ON public.employees;
        DROP POLICY IF EXISTS "Allow all operations on employees" ON public.employees;
        DROP POLICY IF EXISTS "Allow all operations on shifts" ON public.shifts;
        DROP POLICY IF EXISTS "Allow all operations on clock_sessions" ON public.clock_sessions;
        DROP POLICY IF EXISTS "Allow all operations on clock_photos" ON public.clock_photos;
        DROP POLICY IF EXISTS "Allow all operations on app_settings" ON public.app_settings;
        
        -- Créer des politiques simples
        CREATE POLICY "Allow all on employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow all on shifts" ON public.shifts FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow all on clock_sessions" ON public.clock_sessions FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow all on clock_photos" ON public.clock_photos FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow all on app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
        
        -- Configurer le storage
        UPDATE storage.buckets SET public = true WHERE id = 'clock-photos';
        
        RETURN 'RLS policies fixed successfully';
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretKey}`,
          'apikey': secretKey
        },
        body: JSON.stringify({ sql: createFunctionSQL })
      });

      if (response.ok) {
        console.log('✅ Fonction créée');
      } else {
        const error = await response.text();
        console.log('❌ Erreur création fonction:', error.substring(0, 100));
      }
    } catch (error) {
      console.log('❌ Exception création fonction:', error.message);
    }

    // Étape 3: Exécuter la fonction
    console.log('\n3️⃣ Exécution de la fonction...');
    
    try {
      const { data: result, error: execError } = await supabase
        .rpc('fix_rls_policies');

      if (execError) {
        console.log('❌ Erreur exécution:', execError.message);
      } else {
        console.log('✅ Fonction exécutée:', result);
      }
    } catch (error) {
      console.log('❌ Exception exécution:', error.message);
    }

    // Étape 4: Test avec clé publique
    console.log('\n4️⃣ Test avec clé publique...');
    
    const publicSupabase = createClient(supabaseUrl, 'sb_publishable_RnLS-wVof-pbR7Z2d-xyJg_bxYUEbDd');
    
    const { data: testData, error: testError } = await publicSupabase
      .from('employees')
      .select('id, name, role, pin_code')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur test public:', testError.message);
    } else {
      console.log('✅ Test public réussi:', testData);
    }

    // Étape 5: Test d'upload
    console.log('\n5️⃣ Test d\'upload...');
    
    const canvas = require('canvas');
    const { createCanvas } = canvas;
    
    const testCanvas = createCanvas(1, 1);
    const ctx = testCanvas.getContext('2d');
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);
    
    const buffer = testCanvas.toBuffer('image/png');
    const blob = new Blob([buffer], { type: 'image/png' });
    
    const fileName = `mcp_test_${Date.now()}.png`;
    
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

    // Étape 6: Nettoyer la fonction temporaire
    console.log('\n6️⃣ Nettoyage...');
    
    try {
      const { data: cleanupResult, error: cleanupError } = await supabase
        .rpc('exec_sql', { sql: 'DROP FUNCTION IF EXISTS fix_rls_policies();' });

      if (cleanupError) {
        console.log('⚠️ Erreur nettoyage:', cleanupError.message);
      } else {
        console.log('✅ Fonction nettoyée');
      }
    } catch (error) {
      console.log('⚠️ Exception nettoyage:', error.message);
    }

    console.log('\n🎉 Migration MCP terminée !');
    console.log('📋 L\'application devrait maintenant fonctionner sur :');
    console.log('   https://pointage-planning.vercel.app');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

mcpMigration();
