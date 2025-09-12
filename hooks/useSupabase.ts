import { useState, useEffect } from 'react'
import { supabase, type Employee, type Shift, type ClockPhoto } from '../lib/supabase'
import { employeeUtils, shiftUtils, clockPhotoUtils, initializeDatabase } from '../lib/supabase-utils'

// Hook pour les employés
export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await employeeUtils.getAll()
      setEmployees(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des employés')
    } finally {
      setLoading(false)
    }
  }

  const addEmployee = async (employee: Omit<Employee, 'created_at' | 'updated_at'>) => {
    try {
      const newEmployee = await employeeUtils.create(employee)
      setEmployees(prev => [...prev, newEmployee])
      return newEmployee
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout de l\'employé')
      throw err
    }
  }

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const updatedEmployee = await employeeUtils.update(id, updates)
      setEmployees(prev => prev.map(emp => emp.id === id ? updatedEmployee : emp))
      return updatedEmployee
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'employé')
      throw err
    }
  }

  const deleteEmployee = async (id: string) => {
    try {
      await employeeUtils.delete(id)
      setEmployees(prev => prev.filter(emp => emp.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'employé')
      throw err
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  return {
    employees,
    loading,
    error,
    loadEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee
  }
}

// Hook pour les créneaux
export function useShifts(employeeId?: string) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadShifts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = employeeId 
        ? await shiftUtils.getByEmployee(employeeId)
        : await shiftUtils.getActive()
      setShifts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des créneaux')
    } finally {
      setLoading(false)
    }
  }

  const addShift = async (shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newShift = await shiftUtils.create(shift)
      setShifts(prev => [newShift, ...prev])
      return newShift
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du créneau')
      throw err
    }
  }

  const updateShift = async (id: number, updates: Partial<Shift>) => {
    try {
      const updatedShift = await shiftUtils.update(id, updates)
      setShifts(prev => prev.map(shift => shift.id === id ? updatedShift : shift))
      return updatedShift
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du créneau')
      throw err
    }
  }

  const endShift = async (id: number, endTime: string, breakDuration: number = 0) => {
    try {
      const updatedShift = await shiftUtils.endShift(id, endTime, breakDuration)
      setShifts(prev => prev.map(shift => shift.id === id ? updatedShift : shift))
      return updatedShift
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la fin du créneau')
      throw err
    }
  }

  useEffect(() => {
    loadShifts()
  }, [employeeId])

  return {
    shifts,
    loading,
    error,
    loadShifts,
    addShift,
    updateShift,
    endShift
  }
}

// Hook pour les photos de pointage
export function useClockPhotos(employeeId?: string) {
  const [photos, setPhotos] = useState<ClockPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPhotos = async () => {
    try {
      setLoading(true)
      setError(null)
      if (employeeId) {
        const data = await clockPhotoUtils.getByEmployee(employeeId)
        setPhotos(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des photos')
    } finally {
      setLoading(false)
    }
  }

  const addPhoto = async (photo: Omit<ClockPhoto, 'id' | 'created_at'>) => {
    try {
      const newPhoto = await clockPhotoUtils.save(photo)
      setPhotos(prev => [newPhoto, ...prev])
      return newPhoto
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la photo')
      throw err
    }
  }

  useEffect(() => {
    if (employeeId) {
      loadPhotos()
    }
  }, [employeeId])

  return {
    photos,
    loading,
    error,
    loadPhotos,
    addPhoto
  }
}

// Hook pour l'initialisation de la base de données
export function useDatabaseInit() {
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initDatabase = async () => {
    try {
      setLoading(true)
      setError(null)
      await initializeDatabase()
      setInitialized(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'initialisation de la base de données')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initDatabase()
  }, [])

  return {
    initialized,
    loading,
    error,
    initDatabase
  }
}
