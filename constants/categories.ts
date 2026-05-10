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
export type ApparelTypeValue =
  | 'jeans' | 'hosen' | 'kurze_hosen'
  | 't_shirts' | 'tops' | 'pullover'
  | 'hemden_polos' | 'kleider' | 'caps'
  | 'jacken_maentel' | 'sweatshirts_hoodies' | 'roecke'
  | 'bademode' | 'sonstiges';

export interface ApparelTypeDefinition {
  value: ApparelTypeValue;
  label: string;
}

export const APPAREL_TYPES: ApparelTypeDefinition[] = [
  { value: 'jeans', label: 'Jeans' },
  { value: 'hosen', label: 'Hosen' },
  { value: 'kurze_hosen', label: 'Kurze Hosen' },
  { value: 't_shirts', label: 'T-Shirts' },
  { value: 'tops', label: 'Tops' },
  { value: 'pullover', label: 'Pullover' },
  { value: 'hemden_polos', label: 'Hemden / Polos' },
  { value: 'kleider', label: 'Kleider' },
  { value: 'caps', label: 'Caps' },
  { value: 'jacken_maentel', label: 'Jacken / Mäntel' },
  { value: 'sweatshirts_hoodies', label: 'Sweatshirts / Hoodies' },
  { value: 'roecke', label: 'Röcke' },
  { value: 'bademode', label: 'Bademode' },
  { value: 'sonstiges', label: 'Sonstiges' },
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
