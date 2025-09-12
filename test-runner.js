// Test runner pour la logique de validation des horaires
const H_MAX_JOUR = 10;
const REPOS_JOUR_MIN_H = 11;
const AMPLITUDE_MAX_H = 13;

function checkShift(span, breakMin = 0, prevSpan) {
  const warnings = [];
  const ms = span.end.getTime() - span.start.getTime();
  const h = ms / 3_600_000 - breakMin / 60;
  
  if (h > H_MAX_JOUR)
    warnings.push({ code: "JOUR_MAX", message: `Durée journalière ${h.toFixed(2)}h > ${H_MAX_JOUR}h`, level: "WARN" });

  const amplitudeH = (span.end.getTime() - span.start.getTime()) / 3_600_000;
  if (amplitudeH > AMPLITUDE_MAX_H)
    warnings.push({ code: "AMPLITUDE", message: `Amplitude ${amplitudeH.toFixed(2)}h > ${AMPLITUDE_MAX_H}h`, level: "WARN" });

  if (prevSpan) {
    const restH = (span.start.getTime() - prevSpan.end.getTime()) / 3_600_000;
    if (restH < REPOS_JOUR_MIN_H)
      warnings.push({ code: "REPOS11H", message: `Repos ${restH.toFixed(2)}h < 11h`, level: "BLOCK" });
  }
  return warnings;
}

function assert(condition, msg) {
  if (!condition) throw new Error(`Test failed: ${msg}`);
}

function almostEq(a, b, eps = 1e-9) { 
  return Math.abs(a - b) < eps; 
}

function mkSpan(d, sh, sm, eh, em) {
  const s = new Date(d); s.setHours(sh, sm, 0, 0);
  const e = new Date(d); e.setHours(eh, em, 0, 0);
  return { start: s, end: e };
}

function runSelfTests() {
  const base = new Date("2025-09-12T00:00:00");

  // TC1: 8h de travail + 45min de pause → aucun avertissement
  const span1 = mkSpan(base, 9, 0, 17, 45);
  const w1 = checkShift(span1, 45);
  assert(w1.length === 0, "TC1 doit produire 0 avertissement");

  // TC2: 11h net → dépassement journalier (WARN)
  const span2 = mkSpan(base, 8, 0, 20, 0);
  const w2 = checkShift(span2, 60);
  assert(w2.some(w => w.code === "JOUR_MAX" && w.level === "WARN"), "TC2 doit signaler JOUR_MAX");

  // TC3: Amplitude > 13h (WARN)
  const span3 = mkSpan(base, 6, 0, 20, 30);
  const w3 = checkShift(span3, 30);
  assert(w3.some(w => w.code === "AMPLITUDE"), "TC3 doit signaler AMPLITUDE");

  // TC4: Repos < 11h (BLOCK)
  const span4a = mkSpan(base, 8, 0, 18, 0);
  const nextDay = new Date(base); nextDay.setDate(base.getDate() + 1);
  const span4b = mkSpan(nextDay, 3, 0, 12, 0);
  const w4 = checkShift(span4b, 0, span4a);
  assert(w4.some(w => w.code === "REPOS11H" && w.level === "BLOCK"), "TC4 doit bloquer REPOS11H");

  // TC5: Bord de seuil (exact 10h net & 13h amplitude) → pas d'alerte
  const span5 = mkSpan(base, 8, 0, 21, 0);
  const w5 = checkShift(span5, 180);
  assert(w5.length === 0, "TC5 ne doit produire aucun avertissement (bords inclusifs)");

  // Couverture sanity
  assert(almostEq((span1.end.getTime() - span1.start.getTime()) / 3_600_000, 8.75), "Sanity amplitude");

  return "OK (5 tests)";
}

// Exécution des tests
try {
  console.log(runSelfTests());
} catch (error) {
  console.error("❌ Erreur:", error.message);
  process.exit(1);
}
