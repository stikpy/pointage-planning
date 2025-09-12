import { supabase, type Employee, type Shift, type ClockSession, type ClockPhoto } from './supabase'

// Utilitaires pour les employés
export const employeeUtils = {
  // Récupérer tous les employés
  async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Récupérer un employé par ID
  async getById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  },

  // Créer un employé
  async create(employee: Omit<Employee, 'created_at' | 'updated_at'>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Mettre à jour un employé
  async update(id: string, updates: Partial<Employee>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Supprimer un employé
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Utilitaires pour les créneaux
export const shiftUtils = {
  // Récupérer les créneaux d'un employé
  async getByEmployee(employeeId: string): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_time', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Récupérer les créneaux actifs
  async getActive(): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'active')
      .order('start_time', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Créer un nouveau créneau
  async create(shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>): Promise<Shift> {
    const { data, error } = await supabase
      .from('shifts')
      .insert(shift)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Mettre à jour un créneau
  async update(id: number, updates: Partial<Shift>): Promise<Shift> {
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Terminer un créneau
  async endShift(id: number, endTime: string, breakDuration: number = 0): Promise<Shift> {
    return this.update(id, {
      end_time: endTime,
      break_duration: breakDuration,
      status: 'completed'
    })
  }
}

// Utilitaires pour les sessions de pointage
export const clockSessionUtils = {
  // Créer une session de pointage
  async create(session: Omit<ClockSession, 'created_at'>): Promise<ClockSession> {
    const { data, error } = await supabase
      .from('clock_sessions')
      .insert(session)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Valider une session
  async validate(id: string): Promise<ClockSession | null> {
    const { data, error } = await supabase
      .from('clock_sessions')
      .select('*')
      .eq('id', id)
      .eq('is_valid', true)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (error) return null
    return data
  },

  // Marquer une session comme utilisée
  async markAsUsed(id: string): Promise<void> {
    const { error } = await supabase
      .from('clock_sessions')
      .update({ 
        used_at: new Date().toISOString(),
        is_valid: false 
      })
      .eq('id', id)
    
    if (error) throw error
  }
}

// Utilitaires pour les photos de pointage
export const clockPhotoUtils = {
  // Sauvegarder une photo de pointage
  async save(photo: Omit<ClockPhoto, 'id' | 'created_at'>): Promise<ClockPhoto> {
    const { data, error } = await supabase
      .from('clock_photos')
      .insert(photo)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Récupérer les photos d'un employé
  async getByEmployee(employeeId: string): Promise<ClockPhoto[]> {
    const { data, error } = await supabase
      .from('clock_photos')
      .select('*')
      .eq('employee_id', employeeId)
      .order('timestamp', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Récupérer les photos d'un créneau
  async getByShift(shiftId: number): Promise<ClockPhoto[]> {
    const { data, error } = await supabase
      .from('clock_photos')
      .select('*')
      .eq('shift_id', shiftId)
      .order('timestamp', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}

// Fonction pour initialiser la base de données avec les données de test
export async function initializeDatabase(): Promise<void> {
  try {
    // Vérifier si les employés existent déjà
    const { data: existingEmployees } = await supabase
      .from('employees')
      .select('id')
      .limit(1)
    
    if (existingEmployees && existingEmployees.length > 0) {
      console.log('Base de données déjà initialisée')
      return
    }

    // Insérer les employés de test
    const employees = [
      {
        id: 'emp_1',
        name: 'Marie Dubois',
        email: 'marie.dubois@restaurant.com',
        position: 'Chef de cuisine',
        role: 'manager' as const,
        pin_code: '1234',
        work_schedule: { startTime: '08:00', endTime: '18:00', days: [1,2,3,4,5] }
      },
      {
        id: 'emp_2',
        name: 'Jean Martin',
        email: 'jean.martin@restaurant.com',
        position: 'Serveur',
        role: 'employee' as const,
        pin_code: '5678',
        work_schedule: { startTime: '09:00', endTime: '17:00', days: [1,2,3,4,5] }
      },
      {
        id: 'emp_3',
        name: 'Sophie Laurent',
        email: 'sophie.laurent@restaurant.com',
        position: 'Cuisinière',
        role: 'employee' as const,
        pin_code: '9012',
        work_schedule: { startTime: '07:00', endTime: '16:00', days: [1,2,3,4,5] }
      },
      {
        id: 'emp_4',
        name: 'Pierre Moreau',
        email: 'pierre.moreau@restaurant.com',
        position: 'Barman',
        role: 'employee' as const,
        pin_code: '3456',
        work_schedule: { startTime: '18:00', endTime: '02:00', days: [1,2,3,4,5] }
      },
      {
        id: 'emp_5',
        name: 'Claire Petit',
        email: 'claire.petit@restaurant.com',
        position: 'Hôtesse',
        role: 'employee' as const,
        pin_code: '7890',
        work_schedule: { startTime: '10:00', endTime: '16:00', days: [1,2,3,4,5] }
      }
    ]

    const { error } = await supabase
      .from('employees')
      .insert(employees)

    if (error) throw error
    console.log('Base de données initialisée avec succès')
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error)
    throw error
  }
}
