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
  gender: 'herren' | 'damen' | 'unisex' | 'pending';
  audience: 'erwachsen' | 'kids';
  subcategory: 'bekleidung' | 'unterwaesche' | 'schuhe' | 'schmuck';
  jewelryType?: 'ringe' | 'ketten' | 'armbaender' | 'ohrringe' | 'anhaenger' | 'sonstiges';
  details?: string[];
};

const STORAGE_KEY = '@ondeya_watchlist';

let items: Product[] = [];
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

export async function loadWatchlist(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      items = JSON.parse(stored).filter((p: unknown) => p != null && typeof p === 'object');
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

export function addToWatchlist(product: Product | null | undefined) {
  if (!product?.id) return;
  if (!items.find((p) => p?.id === product.id)) {
    items.push(product);
    notify();
    save();
  }
}

export function removeFromWatchlist(id: string) {
  items = items.filter((p) => p.id !== id);
  notify();
  save();
}

export function getWatchlist(): Product[] {
  return [...items];
}

export function subscribeWatchlist(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function resetWatchlist(): Promise<void> {
  items = [];
  notify();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.log('Watchlist reset error:', e);
  }
}
