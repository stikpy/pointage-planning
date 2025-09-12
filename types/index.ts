export interface LaborWarning {
  type: 'error' | 'warning' | 'max_hours_exceeded';
  message: string;
  code: string;
  employeeId?: string;
  employeeName?: string;
}

export interface Shift {
  id: string;
  start: Date;
  end: Date;
  breakMin: number;
  warnings: LaborWarning[];
  employeeId?: string;
  employeeName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  role: 'employee' | 'manager';
  email: string;
  position: string;
  isActive: boolean;
  maxHoursPerDay?: number;
  maxHoursPerWeek?: number;
  minBreakMinutes?: number;
  pinCode?: string; // Code PIN personnel pour vérification d'identité
  photo?: string; // URL de la photo de profil
  workSchedule?: {
    startTime: string; // Format "09:00"
    endTime: string;   // Format "17:00"
    days: number[];    // [1,2,3,4,5] pour lundi-vendredi
  };
}

export interface ShiftValidation {
  isValid: boolean;
  warnings: LaborWarning[];
  totalHours: number;
  effectiveHours: number;
  breakHours: number;
}

export interface DashboardStats {
  totalShifts: number;
  totalHours: number;
  averageHoursPerShift: number;
  warningsCount: number;
  blockingWarnings: number;
  weeklyHours: number;
  todayShifts: number;
}

export interface AppState {
  currentUser: Employee | null;
  employees: Employee[];
  shifts: Shift[];
  selectedEmployee?: Employee;
  view: 'login' | 'shifts' | 'dashboard' | 'analytics';
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface WeeklyStats {
  week: string;
  totalHours: number;
  shiftsCount: number;
  averageHoursPerShift: number;
  warningsCount: number;
}

export interface ShiftFormData {
  start: Date;
  end: Date;
  breakMin: number;
  employeeId?: string;
}
