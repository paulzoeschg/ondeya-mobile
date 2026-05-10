// Backend liefert Preise ab 2026-05-03 in Euro (siehe backend/src/utils/currency.ts).
// 2026-05-10 (Briefing v2 Aufgabe A): Alle Preise ganzzahlig anzeigen — UI-Konsistenz
// schlägt psychologisches 9,99 €-Pricing. Backend rundet bereits, App formatiert nur.
// Beispiel: 81 → "81 €", 1234 → "1.234 €".
export function formatEur(amount: number): string {
  if (!Number.isFinite(amount)) return '— €';
  return `${Math.round(amount).toLocaleString('de-DE')} €`;
}
