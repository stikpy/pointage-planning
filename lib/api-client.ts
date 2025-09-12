// Client API pour bypasser RLS en utilisant les endpoints Next.js
const API_BASE = '/api'

export interface Employee {
  id: string
  name: string
  email: string
  position: string
  role: string
  is_active: boolean
  max_hours_per_day: number
  max_hours_per_week: number
  min_break_minutes: number
  pin_code: string
  photo_url: string | null
  work_schedule: {
    days: number[]
    startTime: string
    endTime: string
  }
  created_at: string
  updated_at: string
}

export interface Shift {
  id: number
  employee_id: string
  start_time: string
  end_time: string | null
  break_duration: number
  total_hours: number | null
  status: 'active' | 'completed' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClockPhoto {
  id: number
  employee_id: string
  photo_url: string
  photo_data?: string
  timestamp: string
  metadata?: any
  created_at: string
}

// Fonctions pour les employés
export async function getEmployee(id: string): Promise<Employee | null> {
  try {
    const response = await fetch(`${API_BASE}/employees?id=${id}`)
    if (!response.ok) throw new Error('Failed to fetch employee')
    
    const data = await response.json()
    return data[0] || null
  } catch (error) {
    console.error('Error fetching employee:', error)
    return null
  }
}

export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const response = await fetch(`${API_BASE}/employees`)
    if (!response.ok) throw new Error('Failed to fetch employees')
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching employees:', error)
    return []
  }
}

// Fonctions pour les créneaux
export async function getActiveShift(employeeId: string): Promise<Shift | null> {
  try {
    const response = await fetch(`${API_BASE}/shifts?employee_id=${employeeId}&status=active&end_time=null`)
    if (!response.ok) throw new Error('Failed to fetch active shift')
    
    const data = await response.json()
    return data[0] || null
  } catch (error) {
    console.error('Error fetching active shift:', error)
    return null
  }
}

export async function createShift(shift: Partial<Shift>): Promise<Shift | null> {
  try {
    const response = await fetch(`${API_BASE}/shifts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shift)
    })
    
    if (!response.ok) throw new Error('Failed to create shift')
    
    const data = await response.json()
    return data[0] || null
  } catch (error) {
    console.error('Error creating shift:', error)
    return null
  }
}

export async function updateShift(id: number, updates: Partial<Shift>): Promise<Shift | null> {
  try {
    const response = await fetch(`${API_BASE}/shifts`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates })
    })
    
    if (!response.ok) throw new Error('Failed to update shift')
    
    const data = await response.json()
    return data[0] || null
  } catch (error) {
    console.error('Error updating shift:', error)
    return null
  }
}

// Fonctions pour les photos
export async function getClockPhotos(employeeId: string): Promise<ClockPhoto[]> {
  try {
    const response = await fetch(`${API_BASE}/clock-photos?employee_id=${employeeId}`)
    if (!response.ok) throw new Error('Failed to fetch clock photos')
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching clock photos:', error)
    return []
  }
}

export async function createClockPhoto(photo: Partial<ClockPhoto>): Promise<ClockPhoto | null> {
  try {
    const response = await fetch(`${API_BASE}/clock-photos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(photo)
    })
    
    if (!response.ok) throw new Error('Failed to create clock photo')
    
    const data = await response.json()
    return data[0] || null
  } catch (error) {
    console.error('Error creating clock photo:', error)
    return null
  }
}
