import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SubcategoryValue, JewelryTypeValue, GenderValue } from '../constants/categories';

// V2 Typen (Quiz V2, 2026-04-29 — Onboarding-Antworten)
export type GenderType = GenderValue;
export type StyleV2Type = 'casual' | 'elegant' | 'party' | 'streetwear' | 'minimalistisch' | 'vintage' | 'sportlich';
// CategoryV2Type entspricht jetzt der finalen Warengruppen-Taxonomie + "alle"-Option im Onboarding.
export type CategoryV2Type = SubcategoryValue | 'alle';
export type PriceRangeType = 'bis50' | '50bis150' | '150bis300' | 'ueber300' | 'egal';

// Ältere Typen — bleiben für Watchlist-Store und Rückwärtskompatibilität erhalten
export type StyleType = 'classic' | 'casual' | 'sporty' | 'mix';
export type CategoryType = 'mode' | 'living' | 'lifestyle';
export type BudgetType = 'under50' | '50to150' | '150to300' | 'over300';
export type DiscountType = '20' | '30' | '40' | '50';
export type SizeType = 'xs_s' | 'm' | 'l_xl' | 'xxl';

export type Preferences = {
  // V2 Felder (Onboarding-Antworten)
  genders: GenderType[];
  stylesV2: StyleV2Type[];
  categoriesV2: CategoryV2Type[];
  priceRange: PriceRangeType | null;
  disabledBrands: string[]; // Partner-Namen die im Feed ausgeblendet werden

  // Taxonomie-Filter (Filter & Kategorie-Overhaul, 2026-05-08)
  // Diese Felder steuern den Feed direkt, gespeist aus Profil-Screen + Onboarding.
  selectedGenders: GenderValue[];
  selectedSubcategories: SubcategoryValue[];
  selectedJewelryTypes: JewelryTypeValue[];
  showKids: boolean; // Kids-Inhalte opt-in, default false

  // Veraltete Felder — nicht mehr im Onboarding, noch im Profil lesbar
  style: StyleType | null;
  categories: CategoryType[];
  budget: BudgetType | null;
  minDiscount: DiscountType | null;
  size: SizeType | null;

  onboardingDone: boolean;
};

const STORAGE_KEY = '@ondeya_preferences';

// Partner (Quellen) im System — Key = angezeigter Name, Value = Produkt-ID-Präfix
export const BRAND_PARTNERS: { label: string; idPrefix: string }[] = [
  { label: 'Lyle & Scott', idPrefix: 'lyle-scott-' },
  { label: 'Undiemeister', idPrefix: 'undiemeister-' },
  { label: 'Shoes for Crews', idPrefix: 'shoesforcrews-' },
  { label: 'DiamondOro', idPrefix: 'diamondoro-' },
  { label: 'Footshop', idPrefix: 'footshop-' },
  { label: 'TOUS', idPrefix: 'tous-' },
  { label: 'Darienzo Collezioni', idPrefix: 'darienzo-' },
];

export function getPartnerLabel(productId: string): string {
  const partner = BRAND_PARTNERS.find((b) => productId.startsWith(b.idPrefix));
  return partner?.label ?? '';
}

export function isProductDisabled(productId: string, disabledBrands: string[]): boolean {
  if (disabledBrands.length === 0) return false;
  const label = getPartnerLabel(productId);
  return label !== '' && disabledBrands.includes(label);
}

const defaultPreferences: Preferences = {
  genders: [],
  stylesV2: [],
  categoriesV2: [],
  priceRange: null,
  disabledBrands: [],
  selectedGenders: [],
  selectedSubcategories: [],
  selectedJewelryTypes: [],
  showKids: false,

  style: null,
  categories: [],
  budget: null,
  minDiscount: null,
  size: null,

  onboardingDone: false,
};

let preferences: Preferences = { ...defaultPreferences };
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

// Migrationen für alte AsyncStorage-Werte:
// - Alte 'kleidung' → 'bekleidung'
// - Alte 'accessoires' wurde gestrichen → entfernen
// - Alte 'halsketten' → 'ketten', 'armbänder' → 'armbaender'
function migrate(stored: Partial<Preferences> & Record<string, unknown>): Partial<Preferences> {
  const migrated: Partial<Preferences> & Record<string, unknown> = { ...stored };

  if (Array.isArray(migrated.selectedSubcategories)) {
    migrated.selectedSubcategories = (migrated.selectedSubcategories as string[])
      .map((v) => (v === 'kleidung' ? 'bekleidung' : v))
      .filter((v): v is SubcategoryValue =>
        ['bekleidung', 'unterwaesche', 'schuhe', 'schmuck'].includes(v)
      );
  }

  if (Array.isArray(migrated.categoriesV2)) {
    migrated.categoriesV2 = (migrated.categoriesV2 as string[])
      .map((v) => (v === 'kleidung' ? 'bekleidung' : v))
      .filter((v): v is CategoryV2Type =>
        ['bekleidung', 'unterwaesche', 'schuhe', 'schmuck', 'alle'].includes(v)
      );
  }

  if (Array.isArray(migrated.selectedJewelryTypes)) {
    migrated.selectedJewelryTypes = (migrated.selectedJewelryTypes as string[])
      .map((v) => {
        if (v === 'halsketten') return 'ketten';
        if (v === 'armbänder') return 'armbaender';
        return v;
      })
      .filter((v): v is JewelryTypeValue =>
        ['ringe', 'ketten', 'armbaender', 'ohrringe', 'anhaenger', 'sonstiges'].includes(v)
      );
  }

  // discoveryAffinity ist gestrichen — falls vorhanden, ignorieren
  delete migrated.discoveryAffinity;

  return migrated as Partial<Preferences>;
}

export async function loadPreferences(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Preferences> & Record<string, unknown>;
      preferences = { ...defaultPreferences, ...migrate(parsed) };
    }
  } catch (e) {
    console.log('Preferences load error:', e);
  }
}

async function save() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (e) {
    console.log('Preferences save error:', e);
  }
}

export function getPreferences(): Preferences {
  return { ...preferences };
}

export function setPreferences(updates: Partial<Preferences>) {
  preferences = { ...preferences, ...updates };
  notify();
  save();
}

export type OnboardingAnswersV2 = {
  genders: GenderType[];
  stylesV2: StyleV2Type[];
  categoriesV2: CategoryV2Type[];
  priceRange: PriceRangeType | null;
};

// Onboarding-Antworten füttern direkt die Feed-Filter (selectedGenders/selectedSubcategories),
// damit der Feed nach dem Quiz sofort relevant ist.
export function completeOnboarding(answers: OnboardingAnswersV2) {
  const selectedGenders = [...answers.genders];
  const selectedSubcategories: SubcategoryValue[] = answers.categoriesV2.includes('alle')
    ? []
    : (answers.categoriesV2.filter((c) => c !== 'alle') as SubcategoryValue[]);

  preferences = {
    ...preferences,
    ...answers,
    selectedGenders,
    selectedSubcategories,
    onboardingDone: true,
  };
  notify();
  save();
}

export function isOnboardingDone(): boolean {
  return preferences.onboardingDone;
}

export function subscribePreferences(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function resetPreferences(): Promise<void> {
  preferences = { ...defaultPreferences };
  notify();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.log('Preferences reset error:', e);
  }
}
