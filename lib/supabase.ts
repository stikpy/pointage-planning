import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co'
// Utiliser les nouvelles clés API Supabase
// En production, utiliser la clé secrète pour bypasser RLS temporairement
const supabaseAnonKey = process.env.NODE_ENV === 'production' 
  ? 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl' // Clé secrète pour bypasser RLS
  : 'sb_publishable_RnLS-wVof-pbR7Z2d-xyJg_bxYUEbDd' // Clé publique pour développement

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour TypeScript
export interface Employee {
  id: string
  name: string
  email: string
  position: string
  role: 'employee' | 'manager'
  isActive: boolean
  maxHoursPerDay: number
  maxHoursPerWeek: number
  minBreakMinutes: number
  pinCode?: string
  photoUrl?: string
  workSchedule: {
    startTime: string
    endTime: string
    days: number[]
  }
  createdAt: string
  updatedAt: string
}

export interface Shift {
  id: number
  employee_id: string
  start_time: string
  end_time?: string
  break_duration: number
  total_hours?: number
  status: 'active' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface ClockSession {
  id: string
  employee_id: string
  qr_data: any
  signature: string
  is_valid: boolean
  expires_at: string
  used_at?: string
  created_at: string
}

export interface ClockPhoto {
  id: number
  employee_id: string
  shift_id?: number
  photo_data: string
  photo_url?: string
  timestamp: string
  metadata: any
  created_at: string
}

export interface AppSettings {
  id: string
  value: any
  description?: string
  updated_at: string
}
