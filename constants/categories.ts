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

// ── Gender ──────────────────────────────────────────────────────────────────
export type GenderValue = 'herren' | 'damen' | 'unisex';

export interface GenderDefinition {
  value: GenderValue;
  label: string;
}

export const GENDERS: GenderDefinition[] = [
  { value: 'damen', label: 'Damen' },
  { value: 'herren', label: 'Herren' },
  { value: 'unisex', label: 'Unisex' },
];
