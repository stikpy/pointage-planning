const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

async function setupSupabaseTables() {
  console.log('🚀 Configuration des tables Supabase...')
  console.log('URL:', supabaseUrl)
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 1. Créer la table employees
    console.log('\n1. Création de la table employees...')
    const createEmployeesSQL = `
      CREATE TABLE IF NOT EXISTS public.employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        position TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('employee', 'manager')),
        is_active BOOLEAN DEFAULT true,
        max_hours_per_day INTEGER DEFAULT 8,
        max_hours_per_week INTEGER DEFAULT 40,
        min_break_minutes INTEGER DEFAULT 30,
        pin_code TEXT,
        photo_url TEXT,
        work_schedule JSONB DEFAULT '{"startTime": "08:00", "endTime": "18:00", "days": [1,2,3,4,5]}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    const { error: empError } = await supabase.rpc('exec_sql', { sql: createEmployeesSQL })
    if (empError) {
      console.warn('⚠️  Erreur employees:', empError.message)
    } else {
      console.log('✅ Table employees créée')
    }
    
    // 2. Créer la table shifts
    console.log('\n2. Création de la table shifts...')
    const createShiftsSQL = `
      CREATE TABLE IF NOT EXISTS public.shifts (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ,
        break_duration INTEGER DEFAULT 0,
        total_hours DECIMAL(4,2) GENERATED ALWAYS AS (
          CASE 
            WHEN end_time IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (end_time - start_time - INTERVAL '1 minute' * COALESCE(break_duration, 0))) / 3600
            ELSE NULL
          END
        ) STORED,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    const { error: shiftError } = await supabase.rpc('exec_sql', { sql: createShiftsSQL })
    if (shiftError) {
      console.warn('⚠️  Erreur shifts:', shiftError.message)
    } else {
      console.log('✅ Table shifts créée')
    }
    
    // 3. Créer la table clock_sessions
    console.log('\n3. Création de la table clock_sessions...')
    const createSessionsSQL = `
      CREATE TABLE IF NOT EXISTS public.clock_sessions (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
        qr_data JSONB NOT NULL,
        signature TEXT NOT NULL,
        is_valid BOOLEAN DEFAULT true,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    const { error: sessionError } = await supabase.rpc('exec_sql', { sql: createSessionsSQL })
    if (sessionError) {
      console.warn('⚠️  Erreur clock_sessions:', sessionError.message)
    } else {
      console.log('✅ Table clock_sessions créée')
    }
    
    // 4. Créer la table clock_photos
    console.log('\n4. Création de la table clock_photos...')
    const createPhotosSQL = `
      CREATE TABLE IF NOT EXISTS public.clock_photos (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
        shift_id BIGINT REFERENCES public.shifts(id) ON DELETE CASCADE,
        photo_data TEXT NOT NULL,
        photo_url TEXT,
        timestamp TIMESTAMPTZ NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    const { error: photoError } = await supabase.rpc('exec_sql', { sql: createPhotosSQL })
    if (photoError) {
      console.warn('⚠️  Erreur clock_photos:', photoError.message)
    } else {
      console.log('✅ Table clock_photos créée')
    }
    
    // 5. Créer la table app_settings
    console.log('\n5. Création de la table app_settings...')
    const createSettingsSQL = `
      CREATE TABLE IF NOT EXISTS public.app_settings (
        id TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    const { error: settingsError } = await supabase.rpc('exec_sql', { sql: createSettingsSQL })
    if (settingsError) {
      console.warn('⚠️  Erreur app_settings:', settingsError.message)
    } else {
      console.log('✅ Table app_settings créée')
    }
    
    // 6. Insérer les données de test
    console.log('\n6. Insertion des données de test...')
    const testEmployees = [
      {
        id: 'emp_1',
        name: 'Marie Dubois',
        email: 'marie.dubois@restaurant.com',
        position: 'Chef de cuisine',
        role: 'manager',
        pin_code: '1234',
        work_schedule: { startTime: '08:00', endTime: '18:00', days: [1,2,3,4,5] }
      },
      {
        id: 'emp_2',
        name: 'Jean Martin',
        email: 'jean.martin@restaurant.com',
        position: 'Serveur',
        role: 'employee',
        pin_code: '5678',
        work_schedule: { startTime: '09:00', endTime: '17:00', days: [1,2,3,4,5] }
      },
      {
        id: 'emp_3',
        name: 'Sophie Laurent',
        email: 'sophie.laurent@restaurant.com',
        position: 'Cuisinière',
        role: 'employee',
        pin_code: '9012',
        work_schedule: { startTime: '07:00', endTime: '16:00', days: [1,2,3,4,5] }
      },
      {
        id: 'emp_4',
        name: 'Pierre Moreau',
        email: 'pierre.moreau@restaurant.com',
        position: 'Barman',
        role: 'employee',
        pin_code: '3456',
        work_schedule: { startTime: '18:00', endTime: '02:00', days: [1,2,3,4,5] }
      },
      {
        id: 'emp_5',
        name: 'Claire Petit',
        email: 'claire.petit@restaurant.com',
        position: 'Hôtesse',
        role: 'employee',
        pin_code: '7890',
        work_schedule: { startTime: '10:00', endTime: '16:00', days: [1,2,3,4,5] }
      }
    ]
    
    const { error: insertError } = await supabase
      .from('employees')
      .upsert(testEmployees)
    
    if (insertError) {
      console.warn('⚠️  Erreur insertion employés:', insertError.message)
    } else {
      console.log('✅ Employés de test insérés')
    }
    
    // 7. Vérifier les tables créées
    console.log('\n7. Vérification des tables...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['employees', 'shifts', 'clock_sessions', 'clock_photos', 'app_settings'])
    
    if (tablesError) {
      console.error('❌ Erreur vérification tables:', tablesError.message)
    } else {
      console.log('✅ Tables trouvées:', tables.map(t => t.table_name))
    }
    
    // 8. Vérifier les employés
    console.log('\n8. Vérification des employés...')
    const { data: employees, error: empCheckError } = await supabase
      .from('employees')
      .select('id, name, role')
      .limit(5)
    
    if (empCheckError) {
      console.error('❌ Erreur vérification employés:', empCheckError.message)
    } else {
      console.log('✅ Employés trouvés:', employees.length)
      employees.forEach(emp => {
        console.log(`   - ${emp.name} (${emp.role})`)
      })
    }
    
    console.log('\n🎉 Configuration Supabase terminée avec succès !')
    console.log('\n📋 Prochaines étapes :')
    console.log('1. Configurez vos variables d\'environnement dans .env.local')
    console.log('2. Testez la connexion avec: npm run test-supabase')
    console.log('3. Lancez l\'application avec: npm run dev')
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message)
    process.exit(1)
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  setupSupabaseTables()
}

module.exports = { setupSupabaseTables }
