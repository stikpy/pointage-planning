import { Employee, Shift } from '../types';
import { createShift } from '../utils/timeUtils';

// Employés de test
export const mockEmployees: Employee[] = [
  {
    id: 'emp_1',
    name: 'Marie Dubois',
    role: 'manager',
    email: 'marie.dubois@restaurant.com',
    position: 'Chef de cuisine',
    isActive: true,
    maxHoursPerDay: 10,
    maxHoursPerWeek: 50,
    minBreakMinutes: 30,
    pinCode: '1234',
    workSchedule: {
      startTime: '08:00',
      endTime: '18:00',
      days: [1, 2, 3, 4, 5] // Lundi à vendredi
    }
  },
  {
    id: 'emp_2',
    name: 'Jean Martin',
    role: 'employee',
    email: 'jean.martin@restaurant.com',
    position: 'Serveur',
    isActive: true,
    maxHoursPerDay: 8,
    maxHoursPerWeek: 40,
    minBreakMinutes: 20,
    pinCode: '5678',
    workSchedule: {
      startTime: '09:00',
      endTime: '17:00',
      days: [1, 2, 3, 4, 5] // Lundi à vendredi
    }
  },
  {
    id: 'emp_3',
    name: 'Sophie Laurent',
    role: 'employee',
    email: 'sophie.laurent@restaurant.com',
    position: 'Cuisinière',
    isActive: true,
    maxHoursPerDay: 9,
    maxHoursPerWeek: 45,
    minBreakMinutes: 30,
    pinCode: '9012',
    workSchedule: {
      startTime: '07:00',
      endTime: '16:00',
      days: [1, 2, 3, 4, 5] // Lundi à vendredi
    }
  },
  {
    id: 'emp_4',
    name: 'Pierre Moreau',
    role: 'employee',
    email: 'pierre.moreau@restaurant.com',
    position: 'Barman',
    isActive: true,
    maxHoursPerDay: 8,
    maxHoursPerWeek: 40,
    minBreakMinutes: 20,
    pinCode: '3456',
    workSchedule: {
      startTime: '18:00',
      endTime: '02:00',
      days: [1, 2, 3, 4, 5, 6] // Lundi à samedi
    }
  },
  {
    id: 'emp_5',
    name: 'Claire Petit',
    role: 'employee',
    email: 'claire.petit@restaurant.com',
    position: 'Hôtesse',
    isActive: false,
    maxHoursPerDay: 6,
    maxHoursPerWeek: 30,
    minBreakMinutes: 15,
    pinCode: '7890',
    workSchedule: {
      startTime: '10:00',
      endTime: '16:00',
      days: [1, 2, 3, 4, 5] // Lundi à vendredi
    }
  }
];

// Créneaux de test
export const mockShifts: Shift[] = [
  // Créneaux d'aujourd'hui
  createShift(
    new Date(2024, 11, 17, 8, 0), // 8h00
    new Date(2024, 11, 17, 16, 0), // 16h00
    60, // 1h de pause
    'emp_2',
    'Jean Martin'
  ),
  createShift(
    new Date(2024, 11, 17, 9, 0), // 9h00
    new Date(2024, 11, 17, 17, 30), // 17h30
    45, // 45min de pause
    'emp_3',
    'Sophie Laurent'
  ),
  createShift(
    new Date(2024, 11, 17, 18, 0), // 18h00
    new Date(2024, 11, 17, 23, 0), // 23h00
    30, // 30min de pause
    'emp_4',
    'Pierre Moreau'
  ),
  
  // Créneaux d'hier
  createShift(
    new Date(2024, 11, 16, 7, 30), // 7h30
    new Date(2024, 11, 16, 15, 30), // 15h30
    60, // 1h de pause
    'emp_1',
    'Marie Dubois'
  ),
  createShift(
    new Date(2024, 11, 16, 8, 0), // 8h00
    new Date(2024, 11, 16, 16, 0), // 16h00
    45, // 45min de pause
    'emp_2',
    'Jean Martin'
  ),
  createShift(
    new Date(2024, 11, 16, 17, 0), // 17h00
    new Date(2024, 11, 16, 22, 0), // 22h00
    30, // 30min de pause
    'emp_3',
    'Sophie Laurent'
  ),
  
  // Créneaux de la semaine dernière
  createShift(
    new Date(2024, 11, 15, 8, 0), // 8h00
    new Date(2024, 11, 15, 16, 0), // 16h00
    60, // 1h de pause
    'emp_1',
    'Marie Dubois'
  ),
  createShift(
    new Date(2024, 11, 14, 9, 0), // 9h00
    new Date(2024, 11, 14, 17, 0), // 17h00
    45, // 45min de pause
    'emp_2',
    'Jean Martin'
  ),
  createShift(
    new Date(2024, 11, 13, 10, 0), // 10h00
    new Date(2024, 11, 13, 18, 0), // 18h00
    30, // 30min de pause
    'emp_3',
    'Sophie Laurent'
  ),
  
  // Créneaux avec avertissements
  createShift(
    new Date(2024, 11, 12, 6, 0), // 6h00
    new Date(2024, 11, 12, 20, 0), // 20h00
    30, // 30min de pause (trop court pour 14h)
    'emp_1',
    'Marie Dubois'
  ),
  createShift(
    new Date(2024, 11, 11, 22, 0), // 22h00
    new Date(2024, 11, 12, 6, 0), // 6h00 du lendemain
    60, // 1h de pause
    'emp_4',
    'Pierre Moreau'
  )
];

// État initial de l'application
export const initialAppState = {
  currentUser: null,
  employees: mockEmployees,
  shifts: mockShifts,
  selectedEmployee: undefined,
  view: 'login' as const
};
