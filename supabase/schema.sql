-- Schéma de base de données pour l'application de pointage
-- Création des tables principales

-- Table des employés
CREATE TABLE public.employees (
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

-- Table des créneaux de travail
CREATE TABLE public.shifts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  break_duration INTEGER DEFAULT 0, -- en minutes
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

-- Table des sessions de pointage (QR codes)
CREATE TABLE public.clock_sessions (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  qr_data JSONB NOT NULL,
  signature TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des photos de pointage
CREATE TABLE public.clock_photos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_id BIGINT REFERENCES public.shifts(id) ON DELETE CASCADE,
  photo_data TEXT NOT NULL, -- base64 ou URL
  photo_url TEXT, -- URL de stockage si stocké dans Supabase Storage
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des paramètres de l'application
CREATE TABLE public.app_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_shifts_employee_id ON public.shifts(employee_id);
CREATE INDEX idx_shifts_start_time ON public.shifts(start_time);
CREATE INDEX idx_clock_sessions_employee_id ON public.clock_sessions(employee_id);
CREATE INDEX idx_clock_sessions_expires_at ON public.clock_sessions(expires_at);
CREATE INDEX idx_clock_photos_employee_id ON public.clock_photos(employee_id);
CREATE INDEX idx_clock_photos_timestamp ON public.clock_photos(timestamp);

-- Activation de Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les employés (lecture publique, modification par les managers)
CREATE POLICY "Employees are viewable by everyone" ON public.employees
  FOR SELECT USING (true);

CREATE POLICY "Only managers can modify employees" ON public.employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = (SELECT auth.jwt() ->> 'sub') 
      AND role = 'manager'
    )
  );

-- Politiques RLS pour les créneaux
CREATE POLICY "Users can view their own shifts" ON public.shifts
  FOR SELECT USING (
    employee_id = (SELECT auth.jwt() ->> 'sub') OR
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = (SELECT auth.jwt() ->> 'sub') 
      AND role = 'manager'
    )
  );

CREATE POLICY "Users can insert their own shifts" ON public.shifts
  FOR INSERT WITH CHECK (
    employee_id = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can update their own shifts" ON public.shifts
  FOR UPDATE USING (
    employee_id = (SELECT auth.jwt() ->> 'sub')
  );

-- Politiques RLS pour les sessions de pointage
CREATE POLICY "Clock sessions are viewable by everyone" ON public.clock_sessions
  FOR SELECT USING (true);

CREATE POLICY "Clock sessions can be inserted by anyone" ON public.clock_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Clock sessions can be updated by anyone" ON public.clock_sessions
  FOR UPDATE USING (true);

-- Politiques RLS pour les photos de pointage
CREATE POLICY "Users can view their own photos" ON public.clock_photos
  FOR SELECT USING (
    employee_id = (SELECT auth.jwt() ->> 'sub') OR
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = (SELECT auth.jwt() ->> 'sub') 
      AND role = 'manager'
    )
  );

CREATE POLICY "Users can insert their own photos" ON public.clock_photos
  FOR INSERT WITH CHECK (
    employee_id = (SELECT auth.jwt() ->> 'sub')
  );

-- Politiques RLS pour les paramètres (managers seulement)
CREATE POLICY "Settings are viewable by managers" ON public.app_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = (SELECT auth.jwt() ->> 'sub') 
      AND role = 'manager'
    )
  );

CREATE POLICY "Settings can be modified by managers" ON public.app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = (SELECT auth.jwt() ->> 'sub') 
      AND role = 'manager'
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion des données de test
INSERT INTO public.employees (id, name, email, position, role, pin_code, work_schedule) VALUES
('emp_1', 'Marie Dubois', 'marie.dubois@restaurant.com', 'Chef de cuisine', 'manager', '1234', '{"startTime": "08:00", "endTime": "18:00", "days": [1,2,3,4,5]}'::jsonb),
('emp_2', 'Jean Martin', 'jean.martin@restaurant.com', 'Serveur', 'employee', '5678', '{"startTime": "09:00", "endTime": "17:00", "days": [1,2,3,4,5]}'::jsonb),
('emp_3', 'Sophie Laurent', 'sophie.laurent@restaurant.com', 'Cuisinière', 'employee', '9012', '{"startTime": "07:00", "endTime": "16:00", "days": [1,2,3,4,5]}'::jsonb),
('emp_4', 'Pierre Moreau', 'pierre.moreau@restaurant.com', 'Barman', 'employee', '3456', '{"startTime": "18:00", "endTime": "02:00", "days": [1,2,3,4,5]}'::jsonb),
('emp_5', 'Claire Petit', 'claire.petit@restaurant.com', 'Hôtesse', 'employee', '7890', '{"startTime": "10:00", "endTime": "16:00", "days": [1,2,3,4,5]}'::jsonb);

-- Insertion des paramètres par défaut
INSERT INTO public.app_settings (id, value, description) VALUES
('app_config', '{"version": "1.0.0", "maintenance_mode": false, "qr_session_duration": 5}'::jsonb, 'Configuration générale de l\'application'),
('work_schedule_default', '{"startTime": "08:00", "endTime": "18:00", "days": [1,2,3,4,5]}'::jsonb, 'Horaires de travail par défaut');
