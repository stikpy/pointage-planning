-- Migration pour ajouter les tables professionnelles
-- Compatible avec l'existant

-- ===== TYPES =====
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shift_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE clock_event_type AS ENUM ('clock_in', 'clock_out', 'break_start', 'break_end');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE badge_type AS ENUM ('nfc', 'qr_code', 'barcode', 'rfid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===== ORGANISATIONS =====
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== DÉPARTEMENTS =====
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  manager_id UUID, -- Référence vers users (ajoutée après création de la table)
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== ÉQUIPES =====
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  team_lead_id UUID, -- Référence vers users (ajoutée après création de la table)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== UTILISATEURS AVEC RÔLES =====
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Pour l'authentification Supabase
  role user_role NOT NULL DEFAULT 'user',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  profile JSONB DEFAULT '{}', -- {firstName, lastName, position, phone, etc.}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les contraintes de clés étrangères maintenant que la table users existe
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager 
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE teams ADD CONSTRAINT fk_teams_lead 
  FOREIGN KEY (team_lead_id) REFERENCES users(id) ON DELETE SET NULL;

-- ===== BADGES ET AUTHENTIFICATION =====
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_type badge_type NOT NULL,
  badge_data JSONB NOT NULL,
  encrypted_data TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== ÉVÉNEMENTS DE POINTAGE =====
CREATE TABLE IF NOT EXISTS clock_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shift_id UUID, -- Référence vers shifts (sans contrainte pour éviter les conflits)
  event_type clock_event_type NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('qr_code', 'nfc', 'manual', 'biometric')),
  location JSONB, -- {latitude, longitude, address}
  photo_url TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TEMPLATES DE PLANNING =====
CREATE TABLE IF NOT EXISTS planning_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  template_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== PARAMÈTRES DE L'APPLICATION =====
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== DONNÉES DE TEST =====
-- Organisations
INSERT INTO organizations (id, name, settings) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Restaurant Le Bistrot', '{"currency": "EUR", "timezone": "Europe/Paris"}'),
  ('00000000-0000-0000-0000-000000000002', 'Café Central', '{"currency": "EUR", "timezone": "Europe/Paris"}')
ON CONFLICT (id) DO NOTHING;

-- Départements
INSERT INTO departments (id, organization_id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Cuisine'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Service'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000002', 'Cuisine')
ON CONFLICT (id) DO NOTHING;

-- Équipes
INSERT INTO teams (id, department_id, name) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Équipe Cuisine'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Équipe Service')
ON CONFLICT (id) DO NOTHING;

-- Utilisateurs de test
INSERT INTO users (id, email, role, organization_id, department_id, team_id, profile, is_active) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@lebistrot.com', 'super_admin', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"firstName": "Super", "lastName": "Admin", "position": "Super Administrateur"}', true),
  ('00000000-0000-0000-0000-000000000002', 'admin@cafecentral.com', 'admin', '00000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', null, '{"firstName": "Admin", "lastName": "Central", "position": "Administrateur"}', true),
  ('00000000-0000-0000-0000-000000000003', 'manager@lebistrot.com', 'manager', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"firstName": "Marie", "lastName": "Dubois", "position": "Chef de Cuisine"}', true),
  ('00000000-0000-0000-0000-000000000004', 'jean@lebistrot.com', 'user', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '{"firstName": "Jean", "lastName": "Martin", "position": "Serveur"}', true)
ON CONFLICT (id) DO NOTHING;

-- Mettre à jour les managers des départements
UPDATE departments SET manager_id = '00000000-0000-0000-0000-000000000003' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE teams SET team_lead_id = '00000000-0000-0000-0000-000000000003' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ===== COMMENTAIRES =====
COMMENT ON TABLE organizations IS 'Organisations multi-tenant du système';
COMMENT ON TABLE departments IS 'Départements au sein des organisations';
COMMENT ON TABLE teams IS 'Équipes au sein des départements';
COMMENT ON TABLE users IS 'Utilisateurs avec rôles hiérarchiques';
COMMENT ON TABLE badges IS 'Badges NFC/QR pour authentification';
COMMENT ON TABLE clock_events IS 'Événements de pointage détaillés';
COMMENT ON TABLE planning_templates IS 'Templates de planning réutilisables';
COMMENT ON TABLE app_settings IS 'Paramètres de configuration par organisation';
