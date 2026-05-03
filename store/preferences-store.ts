import AsyncStorage from '@react-native-async-storage/async-storage';

// V2 Typen (Quiz V2, 2026-04-29)
export type GenderType = 'damen' | 'herren' | 'unisex';
export type StyleV2Type = 'casual' | 'elegant' | 'party' | 'streetwear' | 'minimalistisch' | 'vintage' | 'sportlich';
export type CategoryV2Type = 'kleidung' | 'schuhe' | 'schmuck' | 'alle';
export type PriceRangeType = 'bis50' | '50bis150' | '150bis300' | 'ueber300' | 'egal';
export type DiscoveryAffinityType = 0 | 1 | 2;

// Ältere Typen — bleiben für Watchlist-Store und Rückwärtskompatibilität erhalten
export type StyleType = 'classic' | 'casual' | 'sporty' | 'mix';
export type CategoryType = 'mode' | 'living' | 'lifestyle';
export type BudgetType = 'under50' | '50to150' | '150to300' | 'over300';
export type DiscountType = '20' | '30' | '40' | '50';
export type SizeType = 'xs_s' | 'm' | 'l_xl' | 'xxl';

export type Preferences = {
  // V2 Felder
  genders: GenderType[];
  stylesV2: StyleV2Type[];
  categoriesV2: CategoryV2Type[];
  priceRange: PriceRangeType | null;
  discoveryAffinity: DiscoveryAffinityType | null;

  // Veraltete Felder — nicht mehr im Onboarding, noch im Profil lesbar
  style: StyleType | null;
  categories: CategoryType[];
  budget: BudgetType | null;
  minDiscount: DiscountType | null;
  size: SizeType | null;

  onboardingDone: boolean;
};

const STORAGE_KEY = '@ondeya_preferences';

const defaultPreferences: Preferences = {
  genders: [],
  stylesV2: [],
  categoriesV2: [],
  priceRange: null,
  discoveryAffinity: null,

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

export async function loadPreferences(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      preferences = { ...defaultPreferences, ...JSON.parse(stored) };
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
  discoveryAffinity: DiscoveryAffinityType | null;
};

export function completeOnboarding(answers: OnboardingAnswersV2) {
  preferences = { ...preferences, ...answers, onboardingDone: true };
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
