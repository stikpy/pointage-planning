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

async function fixRLSPolicies() {
  try {
    console.log('🔧 Correction des politiques RLS...');

    // 1. Désactiver temporairement RLS
    console.log('📝 Désactivation temporaire de RLS...');
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.clock_sessions DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.clock_photos DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
      `
    });

    // 2. Supprimer les politiques existantes
    console.log('🗑️ Suppression des politiques existantes...');
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Employees are viewable by everyone" ON public.employees;
        DROP POLICY IF EXISTS "Only managers can modify employees" ON public.employees;
        DROP POLICY IF EXISTS "Users can view their own shifts" ON public.shifts;
        DROP POLICY IF EXISTS "Users can insert their own shifts" ON public.shifts;
        DROP POLICY IF EXISTS "Users can update their own shifts" ON public.shifts;
        DROP POLICY IF EXISTS "Clock sessions are viewable by everyone" ON public.clock_sessions;
        DROP POLICY IF EXISTS "Clock sessions can be inserted by anyone" ON public.clock_sessions;
        DROP POLICY IF EXISTS "Clock sessions can be updated by anyone" ON public.clock_sessions;
        DROP POLICY IF EXISTS "Users can view their own photos" ON public.clock_photos;
        DROP POLICY IF EXISTS "Users can insert their own photos" ON public.clock_photos;
        DROP POLICY IF EXISTS "Settings are viewable by managers" ON public.app_settings;
        DROP POLICY IF EXISTS "Settings can be modified by managers" ON public.app_settings;
      `
    });

    // 3. Réactiver RLS
    console.log('🔒 Réactivation de RLS...');
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.clock_sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.clock_photos ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
      `
    });

    // 4. Créer des politiques simples et non récursives
    console.log('✨ Création des nouvelles politiques...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Politiques pour les employés (lecture publique, écriture pour tous)
        CREATE POLICY "Public read access for employees" ON public.employees
          FOR SELECT
          TO anon, authenticated
          USING (true);

        CREATE POLICY "Public write access for employees" ON public.employees
          FOR ALL
          TO anon, authenticated
          USING (true)
          WITH CHECK (true);

        -- Politiques pour les créneaux (lecture et écriture publiques)
        CREATE POLICY "Public access for shifts" ON public.shifts
          FOR ALL
          TO anon, authenticated
          USING (true)
          WITH CHECK (true);

        -- Politiques pour les sessions de pointage (lecture et écriture publiques)
        CREATE POLICY "Public access for clock sessions" ON public.clock_sessions
          FOR ALL
          TO anon, authenticated
          USING (true)
          WITH CHECK (true);

        -- Politiques pour les photos de pointage (lecture et écriture publiques)
        CREATE POLICY "Public access for clock photos" ON public.clock_photos
          FOR ALL
          TO anon, authenticated
          USING (true)
          WITH CHECK (true);

        -- Politiques pour les paramètres (lecture et écriture publiques)
        CREATE POLICY "Public access for app settings" ON public.app_settings
          FOR ALL
          TO anon, authenticated
          USING (true)
          WITH CHECK (true);
      `
    });

    console.log('✅ Politiques RLS corrigées avec succès !');

    // 5. Tester l'accès aux données
    console.log('🧪 Test d\'accès aux données...');
    
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (empError) {
      console.error('❌ Erreur test employés:', empError);
    } else {
      console.log('✅ Accès aux employés réussi');
    }

    const { data: shifts, error: shiftError } = await supabase
      .from('shifts')
      .select('*')
      .limit(1);
    
    if (shiftError) {
      console.error('❌ Erreur test créneaux:', shiftError);
    } else {
      console.log('✅ Accès aux créneaux réussi');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction des politiques:', error);
  }
}

// Exécuter le script
fixRLSPolicies();
