-- ===== MIGRATION VERS LE SYSTÈME PROFESSIONNEL =====
-- Création du schéma complet avec hiérarchie d'organisations

-- Types personnalisés
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'user');
CREATE TYPE shift_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
CREATE TYPE clock_event_type AS ENUM ('clock_in', 'clock_out', 'break_start', 'break_end');
CREATE TYPE badge_type AS ENUM ('nfc', 'qr_code', 'barcode', 'rfid');

-- ===== ORGANISATIONS ET HIÉRARCHIE =====
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  manager_id UUID, -- Référence vers users (ajoutée après création de la table)
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  profile JSONB DEFAULT '{}',
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les contraintes de clés étrangères maintenant que la table users existe
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager 
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE teams ADD CONSTRAINT fk_teams_lead 
  FOREIGN KEY (team_lead_id) REFERENCES users(id) ON DELETE SET NULL;

-- ===== SYSTÈME DE PLANNING =====
CREATE TABLE IF NOT EXISTS planning_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  template_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== CRÉNEAUX ET POINTAGE =====
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES planning_templates(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  break_duration INTEGER DEFAULT 0, -- en minutes
  total_hours DECIMAL(4,2), -- calculé automatiquement
  status shift_status DEFAULT 'scheduled',
  location JSONB, -- {latitude, longitude, address}
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== BADGES ET AUTHENTIFICATION =====
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_type badge_type NOT NULL,
  badge_data JSONB NOT NULL,
  encrypted_data TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== ÉVÉNEMENTS DE POINTAGE =====
CREATE TABLE IF NOT EXISTS clock_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  event_type clock_event_type NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('qr_code', 'nfc', 'manual', 'biometric')),
  location JSONB, -- {latitude, longitude, address}
  photo_url TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== PHOTOS DE POINTAGE (COMPATIBILITÉ) =====
CREATE TABLE IF NOT EXISTS clock_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  photo_data TEXT, -- Base64 pour compatibilité
  photo_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== SESSIONS DE POINTAGE (COMPATIBILITÉ) =====
CREATE TABLE IF NOT EXISTS clock_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  qr_data JSONB,
  signature TEXT,
  is_valid BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== PARAMÈTRES DE L'APPLICATION =====
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, key)
);

-- ===== INDEX POUR LES PERFORMANCES =====
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_shifts_employee ON shifts(employee_id);
CREATE INDEX idx_shifts_start_time ON shifts(start_time);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_template ON shifts(template_id);

CREATE INDEX idx_clock_events_employee ON clock_events(employee_id);
CREATE INDEX idx_clock_events_timestamp ON clock_events(timestamp);
CREATE INDEX idx_clock_events_type ON clock_events(event_type);

CREATE INDEX idx_badges_employee ON badges(employee_id);
CREATE INDEX idx_badges_type ON badges(badge_type);
CREATE INDEX idx_badges_active ON badges(is_active);

-- ===== TRIGGERS POUR LES TIMESTAMPS =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planning_templates_updated_at BEFORE UPDATE ON planning_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== ROW LEVEL SECURITY (RLS) =====
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ===== POLITIQUES RLS =====

-- Super Admin peut tout voir
CREATE POLICY "Super admin can do everything" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can do everything" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can do everything" ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can do everything" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'super_admin'
    )
  );

-- Admin peut gérer son organisation
CREATE POLICY "Admin can manage own organization" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
      AND u.organization_id = users.organization_id
    )
  );

-- Manager peut voir son équipe
CREATE POLICY "Manager can see team members" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'manager'
      AND u.team_id = users.team_id
    )
  );

-- Utilisateur peut voir ses propres données
CREATE POLICY "Users can see own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- ===== DONNÉES DE TEST =====
INSERT INTO organizations (id, name, settings) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Restaurant Le Bistrot', '{"timezone": "Europe/Paris", "currency": "EUR"}'),
  ('00000000-0000-0000-0000-000000000002', 'Café Central', '{"timezone": "Europe/Paris", "currency": "EUR"}');

INSERT INTO departments (id, organization_id, name, settings) VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Cuisine', '{}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Service', '{}'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000002', 'Cuisine', '{}');

INSERT INTO teams (id, department_id, name) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Équipe Cuisine'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Équipe Service');

-- Utilisateurs de test (avec mots de passe 'password123')
INSERT INTO users (id, email, role, organization_id, department_id, team_id, profile, is_active) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@lebistrot.com', 'super_admin', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"firstName": "Super", "lastName": "Admin", "position": "Super Administrateur"}', true),
  ('00000000-0000-0000-0000-000000000002', 'admin@cafecentral.com', 'admin', '00000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', null, '{"firstName": "Admin", "lastName": "Central", "position": "Administrateur"}', true),
  ('00000000-0000-0000-0000-000000000003', 'manager@lebistrot.com', 'manager', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"firstName": "Marie", "lastName": "Dubois", "position": "Chef de Cuisine"}', true),
  ('00000000-0000-0000-0000-000000000004', 'jean@lebistrot.com', 'user', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '{"firstName": "Jean", "lastName": "Martin", "position": "Serveur"}', true);

-- Mettre à jour les managers des départements
UPDATE departments SET manager_id = '00000000-0000-0000-0000-000000000003' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE teams SET team_lead_id = '00000000-0000-0000-0000-000000000003' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ===== COMMENTAIRES =====
COMMENT ON TABLE organizations IS 'Organisations multi-tenant du système';
COMMENT ON TABLE departments IS 'Départements au sein des organisations';
COMMENT ON TABLE teams IS 'Équipes au sein des départements';
COMMENT ON TABLE users IS 'Utilisateurs avec système de rôles hiérarchique';
COMMENT ON TABLE planning_templates IS 'Templates de planning réutilisables';
COMMENT ON TABLE shifts IS 'Créneaux de travail des employés';
COMMENT ON TABLE badges IS 'Badges NFC/QR pour le pointage';
COMMENT ON TABLE clock_events IS 'Événements de pointage (entrée/sortie/pause)';
COMMENT ON TABLE clock_photos IS 'Photos de pointage avec horodatage';
COMMENT ON TABLE clock_sessions IS 'Sessions de pointage sécurisées';
COMMENT ON TABLE app_settings IS 'Paramètres de configuration par organisation';