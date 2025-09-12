// Fonctions de test pour la validation des créneaux
export interface LaborWarning {
  type: 'error' | 'warning';
  message: string;
  code: string;
}

export interface ShiftValidationResult {
  isValid: boolean;
  warnings: LaborWarning[];
  totalHours: number;
  effectiveHours: number;
  breakHours: number;
}

export function checkShift(start: Date, end: Date, breakMin: number): ShiftValidationResult {
  const warnings: LaborWarning[] = [];
  
  // Vérification de base
  if (start >= end) {
    warnings.push({
      type: 'error',
      message: 'L\'heure de fin doit être après l\'heure de début',
      code: 'INVALID_TIME_RANGE'
    });
  }
  
  const totalMs = end.getTime() - start.getTime();
  const totalHours = totalMs / (1000 * 60 * 60);
  const breakHours = breakMin / 60;
  const effectiveHours = totalHours - breakHours;
  
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

export function runSelfTests(): string {
  const tests = [
    {
      name: 'TC1: Créneau normal (8h-17h, 1h pause)',
      start: new Date('2024-01-01T08:00:00'),
      end: new Date('2024-01-01T17:00:00'),
      breakMin: 60,
      expectedValid: true
    },
    {
      name: 'TC2: Créneau trop long (14h)',
      start: new Date('2024-01-01T08:00:00'),
      end: new Date('2024-01-01T22:00:00'),
      breakMin: 60,
      expectedValid: false
    },
    {
      name: 'TC3: Pause insuffisante (6h travail, 15min pause)',
      start: new Date('2024-01-01T08:00:00'),
      end: new Date('2024-01-01T14:15:00'),
      breakMin: 15,
      expectedValid: true // Valide mais avec avertissement
    },
    {
      name: 'TC4: Heures de nuit (22h-6h)',
      start: new Date('2024-01-01T22:00:00'),
      end: new Date('2024-01-02T06:00:00'),
      breakMin: 60,
      expectedValid: true // Valide mais avec avertissement
    },
    {
      name: 'TC5: Créneau invalide (fin avant début)',
      start: new Date('2024-01-01T17:00:00'),
      end: new Date('2024-01-01T08:00:00'),
      breakMin: 60,
      expectedValid: false
    },
    {
      name: 'TC6: Pause trop longue (50% du temps)',
      start: new Date('2024-01-01T08:00:00'),
      end: new Date('2024-01-01T12:00:00'),
      breakMin: 120, // 2h de pause sur 4h total
      expectedValid: true // Valide mais avec avertissement
    },
    {
      name: 'TC7: Créneau de nuit long (22h-8h)',
      start: new Date('2024-01-01T22:00:00'),
      end: new Date('2024-01-02T08:00:00'),
      breakMin: 60,
      expectedValid: true // Valide mais avec avertissement
    }
  ];

  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  tests.forEach(test => {
    const result = checkShift(test.start, test.end, test.breakMin);
    const isValid = result.isValid;
    const testPassed = isValid === test.expectedValid;
    
    if (testPassed) {
      passed++;
      results.push(`✅ ${test.name}: PASS`);
    } else {
      failed++;
      results.push(`❌ ${test.name}: FAIL (Expected: ${test.expectedValid}, Got: ${isValid})`);
    }
    
    // Afficher les avertissements
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        results.push(`   ${warning.type === 'error' ? '🚫' : '⚠️'} ${warning.message}`);
      });
    }
  });

  const summary = `\n📊 Résultats: ${passed} tests réussis, ${failed} tests échoués sur ${tests.length} tests`;
  return results.join('\n') + summary;
}
