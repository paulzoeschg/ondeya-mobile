export type CategoryValue = 'mode' | 'living' | 'lifestyle';

export interface CategoryDefinition {
  value: CategoryValue;
  label: string;
  sub?: string;
  enabled: boolean;
}

// Living und Lifestyle sind im MVP deaktiviert (enabled: false).
// Zum Wiedereinblenden: enabled auf true setzen — kein weiteres Refactor nötig.
export const ALL_CATEGORIES: CategoryDefinition[] = [
  { value: 'mode', label: 'Mode', sub: 'Kleidung, Schuhe, Accessoires', enabled: true },
  { value: 'living', label: 'Living', sub: 'Interior, Möbel, Wohnen', enabled: false },
  { value: 'lifestyle', label: 'Lifestyle', sub: 'Parfum, Sport, Technik', enabled: false },
];

export const ACTIVE_CATEGORIES = ALL_CATEGORIES.filter((c) => c.enabled);
