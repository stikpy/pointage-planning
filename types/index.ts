// ===== SYSTÈME DE RÔLES ET PERMISSIONS =====
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin', 
  MANAGER = 'manager',
  USER = 'user'
}

export interface Permission {
  resource: string;  // 'employees', 'shifts', 'reports', 'settings'
  actions: string[]; // ['read', 'write', 'delete', 'approve']
  scope: 'organization' | 'department' | 'team' | 'self';
}

export interface Organization {
  id: string;
  name: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  managerId?: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  departmentId: string;
  name: string;
  teamLeadId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
  departmentId?: string;
  teamId?: string;
  profile: {
    firstName: string;
    lastName: string;
    position: string;
    phone?: string;
    avatar?: string;
  };
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ===== SYSTÈME DE PLANNING =====
export interface PlanningTemplate {
  id: string;
  organizationId: string;
  name: string;
  templateData: {
    shifts: ShiftTemplate[];
    rules: {
      minStaff: number;
      maxConsecutiveHours: number;
      breakRequirements: BreakRule[];
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftTemplate {
  startTime: string;
  endTime: string;
  position: string;
  requiredSkills: string[];
  minExperience: number;
}

export interface BreakRule {
  minDuration: number;
  maxDuration: number;
  frequency: number; // heures
}

// ===== SYSTÈME DE POINTAGE =====
export enum ClockEventType {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
  BREAK_START = 'break_start',
  BREAK_END = 'break_end'
}

export enum BadgeType {
  NFC = 'nfc',
  QR_CODE = 'qr_code',
  BARCODE = 'barcode',
  RFID = 'rfid'
}

export interface Badge {
  id: string;
  employeeId: string;
  badgeType: BadgeType;
  badgeData: Record<string, any>;
  encryptedData?: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ClockEvent {
  id: string;
  employeeId: string;
  shiftId?: string;
  eventType: ClockEventType;
  method: 'qr_code' | 'nfc' | 'manual' | 'biometric';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photoUrl?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

// ===== SYSTÈME DE CRÉNEAUX =====
export interface LaborWarning {
  type: 'error' | 'warning' | 'max_hours_exceeded';
  message: string;
  code: string;
  employeeId?: string;
  employeeName?: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  templateId?: string;
  start: Date;
  end?: Date;
  breakMin: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  warnings: LaborWarning[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ===== COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME =====
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
