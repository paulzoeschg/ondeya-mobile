// Taxonomie 2026-05-08 (Filter & Kategorie-Overhaul)
// Briefing: BRIEFING_2026-05-08_FILTER_OVERHAUL.md
// Accessoires sind komplett gestrichen, nicht ausgeblendet.

export type CategoryValue = 'mode' | 'living' | 'lifestyle';

export interface CategoryDefinition {
  value: CategoryValue;
  label: string;
  sub?: string;
  enabled: boolean;
}

// Living und Lifestyle bleiben im Code als Schalter — UI-seitig disabled.
export const ALL_CATEGORIES: CategoryDefinition[] = [
  { value: 'mode', label: 'Mode', sub: 'Bekleidung, Schuhe, Schmuck', enabled: true },
  { value: 'living', label: 'Living', sub: 'Interior, Möbel, Wohnen', enabled: false },
  { value: 'lifestyle', label: 'Lifestyle', sub: 'Parfum, Sport, Technik', enabled: false },
];

export const ACTIVE_CATEGORIES = ALL_CATEGORIES.filter((c) => c.enabled);

// ── Warengruppen (subcategory) ──────────────────────────────────────────────
export type SubcategoryValue = 'bekleidung' | 'unterwaesche' | 'schuhe' | 'schmuck';

export interface SubcategoryDefinition {
  value: SubcategoryValue;
  label: string;
}

export const SUBCATEGORIES: SubcategoryDefinition[] = [
  { value: 'bekleidung', label: 'Bekleidung' },
  { value: 'unterwaesche', label: 'Unterwäsche & Loungewear' },
  { value: 'schuhe', label: 'Schuhe' },
  { value: 'schmuck', label: 'Schmuck' },
];

// Display-Helper für Produktkarten und Detail-Sheet.
// pending oder unbekannt → leerer String, kein "Mode"-Fallback mehr.
const SUBCATEGORY_LABEL_MAP: Record<string, string> = {
  bekleidung: 'Bekleidung',
  unterwaesche: 'Unterwäsche & Loungewear',
  schuhe: 'Schuhe',
  schmuck: 'Schmuck',
};

export function subcategoryLabel(subcategory: string | undefined): string {
  if (!subcategory) return '';
  return SUBCATEGORY_LABEL_MAP[subcategory] ?? '';
}

// ── Schmuck-Unterkategorien (jewelryType) ───────────────────────────────────
export type JewelryTypeValue = 'ringe' | 'ketten' | 'armbaender' | 'ohrringe' | 'anhaenger' | 'sonstiges';

export interface JewelryTypeDefinition {
  value: JewelryTypeValue;
  label: string;
}

export const JEWELRY_TYPES: JewelryTypeDefinition[] = [
  { value: 'ringe', label: 'Ringe' },
  { value: 'ketten', label: 'Ketten & Halsketten' },
  { value: 'armbaender', label: 'Armbänder' },
  { value: 'ohrringe', label: 'Ohrringe' },
  { value: 'anhaenger', label: 'Anhänger' },
];

// ── Bekleidungs-Subtypen (apparelType) ──────────────────────────────────────
// Briefing 2026-05-09 (Taxonomie-Erweiterung): Bekleidung kriegt analog zu Schmuck
// einen Subtyp-Filter im Profil.
// 2026-05-16 (Punkt 6): 'westen' (Herren-only), 'joggers', 'muetzen', 'sport'
// ergänzt. genderScope steuert, welche Chips im Profil gezeigt werden je nach
// gewähltem Gender — Kleider erscheinen z.B. nicht wenn nur Herren aktiv ist.
export type ApparelTypeValue =
  | 'jeans' | 'hosen' | 'kurze_hosen' | 'joggers'
  | 't_shirts' | 'tops' | 'pullover'
  | 'hemden_polos' | 'kleider' | 'caps' | 'muetzen'
  | 'jacken_maentel' | 'sweatshirts_hoodies' | 'roecke'
  | 'bademode' | 'westen' | 'sport'
  | 'sonstiges';

export type GenderScope = 'damen' | 'herren' | 'beide';

export interface ApparelTypeDefinition {
  value: ApparelTypeValue;
  label: string;
  genderScope: GenderScope;
}

export const APPAREL_TYPES: ApparelTypeDefinition[] = [
  { value: 'jeans', label: 'Jeans', genderScope: 'beide' },
  { value: 'hosen', label: 'Hosen', genderScope: 'beide' },
  { value: 'kurze_hosen', label: 'Kurze Hosen', genderScope: 'beide' },
  { value: 'joggers', label: 'Joggers', genderScope: 'beide' },
  { value: 't_shirts', label: 'T-Shirts', genderScope: 'beide' },
  { value: 'tops', label: 'Tops', genderScope: 'beide' },
  { value: 'pullover', label: 'Pullover', genderScope: 'beide' },
  { value: 'hemden_polos', label: 'Hemden / Polos', genderScope: 'beide' },
  { value: 'kleider', label: 'Kleider', genderScope: 'damen' },
  { value: 'caps', label: 'Caps', genderScope: 'beide' },
  { value: 'muetzen', label: 'Mützen', genderScope: 'beide' },
  { value: 'jacken_maentel', label: 'Jacken / Mäntel', genderScope: 'beide' },
  { value: 'sweatshirts_hoodies', label: 'Sweatshirts / Hoodies', genderScope: 'beide' },
  { value: 'roecke', label: 'Röcke', genderScope: 'damen' },
  { value: 'bademode', label: 'Bademode', genderScope: 'beide' },
  { value: 'westen', label: 'Westen', genderScope: 'herren' },
  { value: 'sport', label: 'Sportbekleidung', genderScope: 'beide' },
  { value: 'sonstiges', label: 'Sonstiges', genderScope: 'beide' },
];

// 2026-05-16 (Punkt 6): Hilfsfunktion fürs Profil — gefiltert nach aktuellen
// Gender-Auswahlen. Keine Gender-Auswahl → alle anzeigen. Nur Damen → ohne
// Westen. Nur Herren → ohne Kleider und Röcke. Beide ausgewählt → alle.
export function filterApparelByGenders(genders: GenderValue[]): ApparelTypeDefinition[] {
  const hasDamen = genders.includes('damen') || genders.includes('unisex') || genders.includes('kids') || genders.length === 0;
  const hasHerren = genders.includes('herren') || genders.includes('unisex') || genders.includes('kids') || genders.length === 0;
  return APPAREL_TYPES.filter((a) => {
    if (a.genderScope === 'beide') return true;
    if (a.genderScope === 'damen') return hasDamen;
    if (a.genderScope === 'herren') return hasHerren;
    return true;
  });
}

// ── Schuh-Subtypen (shoeType) ───────────────────────────────────────────────
// Briefing 2026-05-12 (Backend Schuh-Taxonomie): Schuhe kriegen analog zu
// Bekleidung einen Subtyp-Filter im Quiz V3 und im Profil.
export type ShoeTypeValue =
  | 'sneaker' | 'business' | 'sport'
  | 'stiefel' | 'sandalen' | 'pumps'
  | 'sonstiges';

export interface ShoeTypeDefinition {
  value: ShoeTypeValue;
  label: string;
}

export const SHOE_TYPES: ShoeTypeDefinition[] = [
  { value: 'sneaker', label: 'Sneaker' },
  { value: 'business', label: 'Business' },
  { value: 'sport', label: 'Sport' },
  { value: 'stiefel', label: 'Stiefel' },
  { value: 'sandalen', label: 'Sandalen' },
  { value: 'pumps', label: 'Pumps' },
  { value: 'sonstiges', label: 'Sonstige' },
];

// ── Gender ──────────────────────────────────────────────────────────────────
// Briefing 2026-05-09 (Taxonomie-Erweiterung): Kids als 4. Gender, mit
// Sub-Toggle Mädchen/Jungen.
export type GenderValue = 'herren' | 'damen' | 'unisex' | 'kids';

export interface GenderDefinition {
  value: GenderValue;
  label: string;
}

export const GENDERS: GenderDefinition[] = [
  { value: 'damen', label: 'Damen' },
  { value: 'herren', label: 'Herren' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'kids', label: 'Kids' },
];

// ── Kids-Subgender ──────────────────────────────────────────────────────────
export type KidsSubGenderValue = 'maedchen' | 'jungen';

export interface KidsSubGenderDefinition {
  value: KidsSubGenderValue;
  label: string;
}

export const KIDS_SUBGENDERS: KidsSubGenderDefinition[] = [
  { value: 'maedchen', label: 'Mädchen' },
  { value: 'jungen', label: 'Jungen' },
];

// ── Label-Helper für Filter-Chips & Detail-Sheet (2026-05-10) ───────────────
const APPAREL_LABEL_MAP: Record<string, string> = APPAREL_TYPES.reduce((acc, t) => {
  acc[t.value] = t.label;
  return acc;
}, {} as Record<string, string>);

const JEWELRY_LABEL_MAP: Record<string, string> = JEWELRY_TYPES.reduce((acc, t) => {
  acc[t.value] = t.label;
  return acc;
}, {} as Record<string, string>);

const SHOE_LABEL_MAP: Record<string, string> = SHOE_TYPES.reduce((acc, t) => {
  acc[t.value] = t.label;
  return acc;
}, {} as Record<string, string>);

const GENDER_LABEL_MAP: Record<string, string> = GENDERS.reduce((acc, g) => {
  acc[g.value] = g.label;
  return acc;
}, {} as Record<string, string>);

const KIDS_SUB_LABEL_MAP: Record<string, string> = KIDS_SUBGENDERS.reduce((acc, k) => {
  acc[k.value] = k.label;
  return acc;
}, {} as Record<string, string>);

export function apparelTypeLabel(value: string | undefined): string {
  if (!value) return '';
  return APPAREL_LABEL_MAP[value] ?? '';
}

export function jewelryTypeLabel(value: string | undefined): string {
  if (!value) return '';
  return JEWELRY_LABEL_MAP[value] ?? '';
}

export function shoeTypeLabel(value: string | undefined): string {
  if (!value) return '';
  return SHOE_LABEL_MAP[value] ?? '';
}

export function genderLabel(value: string | undefined): string {
  if (!value) return '';
  return GENDER_LABEL_MAP[value] ?? '';
}

export function kidsSubGenderLabel(value: string | undefined): string {
  if (!value) return '';
  return KIDS_SUB_LABEL_MAP[value] ?? '';
}

const PRICE_RANGE_LABELS: Record<string, string> = {
  bis50: 'Bis 50 €',
  '50bis150': '50–150 €',
  '150bis300': '150–300 €',
  ueber300: 'Über 300 €',
  egal: 'Preis egal',
};

export function priceRangeLabel(value: string | null | undefined): string {
  if (!value) return '';
  return PRICE_RANGE_LABELS[value] ?? '';
}
