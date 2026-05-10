import AsyncStorage from '@react-native-async-storage/async-storage';

export type Product = {
  id: string;
  brand: string;
  name: string;
  color: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  image: string;
  images: string[];
  affiliateUrl: string;
  description: string;
  category: string;
  currency?: string;
  ondeyaCategory?: 'mode' | 'living' | 'lifestyle';
  gender: 'herren' | 'damen' | 'unisex' | 'kids' | 'pending';
  audience: 'erwachsen' | 'kids';
  subcategory: 'bekleidung' | 'unterwaesche' | 'schuhe' | 'schmuck';
  jewelryType?: 'ringe' | 'ketten' | 'armbaender' | 'ohrringe' | 'anhaenger' | 'sonstiges';
  apparelType?: string;
  kidsSubGender?: 'maedchen' | 'jungen' | 'pending';
  details?: string[];
};

const STORAGE_KEY = '@ondeya_watchlist';
const DISMISSED_KEY = '@ondeya_watchlist_dismissed';

let items: Product[] = [];
// Briefing 2026-05-10 (Aufgabe 6): IDs, die der Nutzer aktiv aus der Watchlist
// entfernt hat, dürfen wieder im Feed erscheinen — aber mit niedriger Priorität.
// Watchlist-IDs (in `items`) werden hart aus dem Feed ausgeschlossen.
let dismissedIds: Map<string, number> = new Map();
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

export async function loadWatchlist(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      items = JSON.parse(stored).filter((p: unknown) => p != null && typeof p === 'object');
    }
    const storedDismissed = await AsyncStorage.getItem(DISMISSED_KEY);
    if (storedDismissed) {
      const parsed = JSON.parse(storedDismissed) as Record<string, number>;
      dismissedIds = new Map(Object.entries(parsed));
    }
  } catch (e) {
    console.log('Watchlist load error:', e);
  }
}

async function save() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.log('Watchlist save error:', e);
  }
}

async function saveDismissed() {
  try {
    const obj = Object.fromEntries(dismissedIds.entries());
    await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(obj));
  } catch (e) {
    console.log('Watchlist dismissed save error:', e);
  }
}

export function addToWatchlist(product: Product | null | undefined) {
  if (!product?.id) return;
  if (!items.find((p) => p?.id === product.id)) {
    items.push(product);
    // Wenn das Produkt vorher manuell entfernt wurde, dismissed-Eintrag löschen.
    if (dismissedIds.delete(product.id)) {
      saveDismissed();
    }
    notify();
    save();
  }
}

export function removeFromWatchlist(id: string) {
  const wasInList = items.some((p) => p.id === id);
  items = items.filter((p) => p.id !== id);
  if (wasInList) {
    dismissedIds.set(id, Date.now());
    saveDismissed();
  }
  notify();
  save();
}

export function getWatchlist(): Product[] {
  return [...items];
}

export function getDismissedIds(): Map<string, number> {
  return new Map(dismissedIds);
}

export function subscribeWatchlist(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function resetWatchlist(): Promise<void> {
  items = [];
  dismissedIds = new Map();
  notify();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(DISMISSED_KEY);
  } catch (e) {
    console.log('Watchlist reset error:', e);
  }
}
