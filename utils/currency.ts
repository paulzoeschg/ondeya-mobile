// Backend liefert Preise ab 2026-05-03 in Euro (siehe backend/src/utils/currency.ts).
// In der UI immer mit deutschem Komma-Format und nachgestelltem Euro-Symbol:
// 89.9 → "89,90 €", 1234 → "1.234,00 €"
export function formatEur(amount: number): string {
  if (!Number.isFinite(amount)) return '— €';
  return `${amount.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}
