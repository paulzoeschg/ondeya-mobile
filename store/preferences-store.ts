import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  SubcategoryValue,
  JewelryTypeValue,
  GenderValue,
  ApparelTypeValue,
  KidsSubGenderValue,
  ShoeTypeValue,
} from '../constants/categories';

// V2 Typen (Quiz V2, 2026-04-29 — Onboarding-Antworten)
export type GenderType = GenderValue;
export type StyleV2Type = 'casual' | 'elegant' | 'party' | 'streetwear' | 'minimalistisch' | 'vintage' | 'sportlich';
// CategoryV2Type entspricht jetzt der finalen Warengruppen-Taxonomie + "alle"-Option im Onboarding.
export type CategoryV2Type = SubcategoryValue | 'alle';
export type PriceRangeType = 'bis50' | '50bis150' | '150bis300' | 'ueber300' | 'egal';

// V3 Typen (Quiz V3, 2026-05-12 — Trends an den Anfang)
export type QuizPathType = 'trends' | 'manuell';

// Ältere Typen — bleiben für Watchlist-Store und Rückwärtskompatibilität erhalten
export type StyleType = 'classic' | 'casual' | 'sporty' | 'mix';
export type CategoryType = 'mode' | 'living' | 'lifestyle';
export type BudgetType = 'under50' | '50to150' | '150to300' | 'over300';
export type DiscountType = '20' | '30' | '40' | '50';
export type SizeType = 'xs_s' | 'm' | 'l_xl' | 'xxl';

export type Preferences = {
  // V3 Felder (Quiz V3, 2026-05-12 — Trends an den Anfang)
  quizPath: QuizPathType | null;
  followedTrendIds: string[];          // Liste der gefolgten Trend-IDs (aus Q3-A)
  selectedShoeTypes: ShoeTypeValue[];  // Schuh-Subtyp-Filter (aus Q4-B Block B + Profil)

  // V3.1 Felder (Bug B/F, 2026-05-14 — Profil mit getrennten Feed-/Trend-
  // Settings). Eigene Trend-Gender und Trend-Preisrahmen, parallel zu den
  // Feed-Settings. Backend D1 ignoriert diese aktuell — die Felder dienen
  // primär der UI/Trend-Sektion und dem Trends-Tab-Empty-State-Filter.
  trendGenders: GenderValue[];         // Nur 'damen' / 'herren' im UI
  trendPriceRange: PriceRangeType | null;

  // V2 Felder (Onboarding-Antworten)
  genders: GenderType[];
  stylesV2: StyleV2Type[];
  categoriesV2: CategoryV2Type[];
  priceRange: PriceRangeType | null;
  disabledBrands: string[]; // Partner-Namen die im Feed ausgeblendet werden

  // Taxonomie-Filter (Filter & Kategorie-Overhaul, 2026-05-08, erweitert 2026-05-09)
  // Diese Felder steuern den Feed direkt, gespeist aus Profil-Screen + Onboarding.
  selectedGenders: GenderValue[];
  selectedSubcategories: SubcategoryValue[];
  selectedJewelryTypes: JewelryTypeValue[];
  selectedApparelTypes: ApparelTypeValue[];
  selectedKidsSubGenders: KidsSubGenderValue[]; // wirksam nur wenn 'kids' in selectedGenders
  showKids: boolean; // legacy, bleibt vorerst für Kompatibilität

  // Veraltete Felder — nicht mehr im Onboarding, noch im Profil lesbar
  style: StyleType | null;
  categories: CategoryType[];
  budget: BudgetType | null;
  minDiscount: DiscountType | null;
  size: SizeType | null;

  onboardingDone: boolean;
};

const STORAGE_KEY = '@ondeya_preferences';

// Partner (Quellen) im System — Key = angezeigter Name, Value = Produkt-ID-Präfix.
//
// 2026-05-16: Stand muss synchron mit ACTIVE_SCRAPERS in
//   backend/src/services/products-cache.ts gehalten werden.
// TODO (Punkt 1, eigener Folge-Task): /api/brands-Endpoint im Backend +
//   dynamic fetch im profile.tsx, damit die Toggle-Liste automatisch mit dem
//   tatsächlich aktiven Pool synchron bleibt und diese hardcoded Liste
//   entfällt.
//
// Pausiert/deaktiviert (NICHT in Liste, sind im Backend stillgelegt):
//   shoesforcrews-     (Mode-Fokus, 2026-05-09 deaktiviert)
//   footshop-          (Cloudflare 503 seit 2026-05-09)
//   bademantelparadies-(passt nicht zu Mode, 2026-05-09 deaktiviert)
//   roncato-           (Cloudflare, 2026-05-05 pausiert)
export const BRAND_PARTNERS: { label: string; idPrefix: string }[] = [
  { label: 'Lyle & Scott', idPrefix: 'lyle-scott-' },
  { label: 'Undiemeister', idPrefix: 'undiemeister-' },
  { label: 'Darienzo Collezioni', idPrefix: 'darienzo-' },
  { label: 'DiamondOro', idPrefix: 'diamondoro-' },
  { label: 'TOUS', idPrefix: 'tous-' },
  { label: 'Mimmu', idPrefix: 'mimmu-' },
  { label: 'Engelsrufer', idPrefix: 'engelsrufer-' },
  { label: 'Lebasq', idPrefix: 'lebasq-' },
  { label: 'Stickabush Berlin', idPrefix: 'stickabush-' },
  { label: 'CafeNoir', idPrefix: 'cafenoir-' },
  { label: 'Repeat Cashmere', idPrefix: 'repeat-cashmere-' },
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
  quizPath: null,
  followedTrendIds: [],
  selectedShoeTypes: [],
  trendGenders: [],
  trendPriceRange: null,
  genders: [],
  stylesV2: [],
  categoriesV2: [],
  priceRange: null,
  disabledBrands: [],
  selectedGenders: [],
  selectedSubcategories: [],
  selectedJewelryTypes: [],
  selectedApparelTypes: [],
  selectedKidsSubGenders: ['maedchen', 'jungen'], // Default: beide aktiv wenn Kids gewählt
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

  // V2 → V3 (2026-05-12): Alte User haben kein quizPath. Default auf 'manuell',
  // damit ihr aktueller Feed-Filter sinnvoll bleibt — kein Re-Onboarding.
  if (migrated.onboardingDone && !migrated.quizPath) {
    migrated.quizPath = 'manuell';
    migrated.followedTrendIds = [];
    migrated.selectedShoeTypes = []; // leer = kein Schuh-Filter, alle anzeigen
  }

  // V3 → V3.1 (2026-05-14): trendGenders + trendPriceRange existieren bei
  // Bestandsusern noch nicht. Defaults sind harmlos (leer/null).
  if (!Array.isArray(migrated.trendGenders)) {
    migrated.trendGenders = [];
  } else {
    migrated.trendGenders = (migrated.trendGenders as string[]).filter(
      (v): v is GenderValue => v === 'damen' || v === 'herren'
    );
  }
  if (migrated.trendPriceRange === undefined) {
    migrated.trendPriceRange = null;
  }

  // selectedShoeTypes-Wert säubern (falls aus Vorschau-Build mit anderer Form)
  if (Array.isArray(migrated.selectedShoeTypes)) {
    migrated.selectedShoeTypes = (migrated.selectedShoeTypes as string[]).filter(
      (v): v is ShoeTypeValue =>
        ['sneaker', 'business', 'sport', 'stiefel', 'sandalen', 'pumps', 'sonstiges'].includes(v)
    );
  }

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

export type OnboardingAnswersV3 = {
  quizPath: QuizPathType;
  genders: GenderType[];
  // Trends-Pfad
  followedTrendIds?: string[];
  // Manuell-Pfad
  categoriesV2?: CategoryV2Type[];
  stylesV2?: StyleV2Type[];
  shoeTypes?: ShoeTypeValue[];
  // Beide
  priceRange: PriceRangeType | null;
};

// Onboarding-Antworten füttern direkt die Feed-Filter (selectedGenders/selectedSubcategories),
// damit der Feed nach dem Quiz sofort relevant ist.
//
// Trends-Pfad: selectedSubcategories bleibt leer (alle Warengruppen anzeigen) —
// die spätere Trend-Sektion priorisiert die Stücke der gefolgten Trends.
// Manuell-Pfad: aus categoriesV2 ableiten wie in V2.
export function completeOnboarding(answers: OnboardingAnswersV3) {
  const selectedGenders = [...answers.genders];
  const categoriesV2 = answers.categoriesV2 ?? [];
  const selectedSubcategories: SubcategoryValue[] =
    answers.quizPath === 'trends'
      ? []
      : categoriesV2.includes('alle')
        ? []
        : (categoriesV2.filter((c) => c !== 'alle') as SubcategoryValue[]);

  preferences = {
    ...preferences,
    quizPath: answers.quizPath,
    followedTrendIds: answers.followedTrendIds ?? [],
    selectedShoeTypes: answers.shoeTypes ?? [],
    genders: answers.genders,
    stylesV2: answers.stylesV2 ?? [],
    categoriesV2,
    priceRange: answers.priceRange,
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
