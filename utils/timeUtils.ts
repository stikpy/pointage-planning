import { Shift, LaborWarning, ShiftValidation, TimeRange, WeeklyStats } from '../types';

/**
 * Calcule la durée en heures entre deux dates
 */
export function calculateHours(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Calcule les heures effectives (durée totale - pause)
 */
export function calculateEffectiveHours(start: Date, end: Date, breakMinutes: number): number {
  const totalHours = calculateHours(start, end);
  const breakHours = breakMinutes / 60;
  return Math.max(0, totalHours - breakHours);
}

/**
 * Formate une durée en heures en format lisible
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}min`;
  }
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formate une date en format français
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formate une heure en format français
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formate une date et heure complète
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} à ${formatTime(date)}`;
}

/**
 * Obtient la date d'aujourd'hui au format string
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Obtient le début de la semaine (lundi)
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuste pour lundi
  return new Date(d.setDate(diff));
}

/**
 * Obtient la fin de la semaine (dimanche)
 */
export function getWeekEnd(date: Date = new Date()): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Vérifie si une date est dans la semaine courante
 */
export function isInCurrentWeek(date: Date): boolean {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  return date >= weekStart && date <= weekEnd;
}

/**
 * Calcule les statistiques hebdomadaires
 */
export function calculateWeeklyStats(shifts: Shift[]): WeeklyStats {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  
  const weekShifts = shifts.filter(shift => {
    const startDate = shift.start instanceof Date ? shift.start : new Date(shift.start);
    return startDate >= weekStart && startDate <= weekEnd;
  });
  
  const totalHours = weekShifts.reduce((sum, shift) => {
    const startDate = shift.start instanceof Date ? shift.start : new Date(shift.start);
    const endDate = shift.end instanceof Date ? shift.end : new Date(shift.end);
    return sum + calculateEffectiveHours(startDate, endDate, shift.breakMin);
  }, 0);
  
  const warningsCount = weekShifts.reduce((sum, shift) => sum + shift.warnings.length, 0);
  
  return {
    week: `Semaine du ${formatDate(weekStart)}`,
    totalHours,
    shiftsCount: weekShifts.length,
    averageHoursPerShift: weekShifts.length > 0 ? totalHours / weekShifts.length : 0,
    warningsCount
  };
}

/**
 * Calcule les statistiques du tableau de bord
 */
export function calculateDashboardStats(shifts: Shift[]): {
  totalShifts: number;
  totalHours: number;
  averageHoursPerShift: number;
  warningsCount: number;
  blockingWarnings: number;
  weeklyHours: number;
  todayShifts: number;
} {
  const today = new Date();
  const todayString = getTodayString();
  
  const todayShifts = shifts.filter(shift => {
    const startDate = shift.start instanceof Date ? shift.start : new Date(shift.start);
    return startDate.toISOString().split('T')[0] === todayString;
  });
  
  const totalHours = shifts.reduce((sum, shift) => {
    const startDate = shift.start instanceof Date ? shift.start : new Date(shift.start);
    const endDate = shift.end instanceof Date ? shift.end : new Date(shift.end);
    return sum + calculateEffectiveHours(startDate, endDate, shift.breakMin);
  }, 0);
  
  const weeklyStats = calculateWeeklyStats(shifts);
  
  const warningsCount = shifts.reduce((sum, shift) => sum + shift.warnings.length, 0);
  const blockingWarnings = shifts.reduce((sum, shift) => 
    sum + shift.warnings.filter(w => w.type === 'error').length, 0
  );
  
  return {
    totalShifts: shifts.length,
    totalHours,
    averageHoursPerShift: shifts.length > 0 ? totalHours / shifts.length : 0,
    warningsCount,
    blockingWarnings,
    weeklyHours: weeklyStats.totalHours,
    todayShifts: todayShifts.length
  };
}

/**
 * Valide un créneau de travail
 */
export function validateShift(start: Date, end: Date, breakMin: number): ShiftValidation {
  const warnings: LaborWarning[] = [];
  
  // Vérification de base
  if (start >= end) {
    warnings.push({
      type: 'error',
      message: 'L\'heure de fin doit être après l\'heure de début',
      code: 'INVALID_TIME_RANGE'
    });
  }
  
  const totalHours = calculateHours(start, end);
  const effectiveHours = calculateEffectiveHours(start, end, breakMin);
  const breakHours = breakMin / 60;
  
  // Vérification de la durée maximale (12h)
  if (totalHours > 12) {
    warnings.push({
      type: 'error',
      message: 'La durée totale ne peut pas dépasser 12 heures',
      code: 'MAX_DURATION_EXCEEDED'
    });
  }
  
  // Vérification de la pause minimale
  if (totalHours >= 6 && breakMin < 30) {
    warnings.push({
      type: 'warning',
      message: 'Une pause d\'au moins 30 minutes est recommandée pour un travail de 6h ou plus',
      code: 'MIN_BREAK_RECOMMENDED'
    });
  }
  
  // Vérification de la pause maximale
  if (breakHours > totalHours * 0.5) {
    warnings.push({
      type: 'warning',
      message: 'La pause ne devrait pas représenter plus de 50% du temps de travail',
      code: 'BREAK_TOO_LONG'
    });
  }
  
  // Vérification des heures de nuit (22h-6h)
  const startHour = start.getHours();
  const endHour = end.getHours();
  const isNightShift = startHour >= 22 || endHour <= 6 || (startHour >= 22 && endHour <= 6);
  
  if (isNightShift && totalHours > 8) {
    warnings.push({
      type: 'warning',
      message: 'Attention aux heures de nuit : vérifiez les réglementations du travail',
      code: 'NIGHT_SHIFT_WARNING'
    });
  }
  
  return {
    isValid: warnings.filter(w => w.type === 'error').length === 0,
    warnings,
    totalHours,
    effectiveHours,
    breakHours
  };
}

/**
 * Génère un ID unique pour un créneau
 */
export function generateShiftId(): string {
  return `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crée un nouveau créneau avec validation
 */
export function createShift(
  start: Date, 
  end: Date, 
  breakMin: number, 
  employeeId?: string,
  employeeName?: string
): Shift {
  const validation = validateShift(start, end, breakMin);
  
  return {
    id: generateShiftId(),
    start,
    end,
    breakMin,
    warnings: validation.warnings,
    employeeId,
    employeeName,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
