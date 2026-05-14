/**
 * Ondeya API Service
 * Verbindet die App mit dem ondeya-backend.
 */

import type { Product } from '../store/watchlist-store';

// Backend läuft auf Railway — gleiche URL für Dev und Prod, damit Expo Go ohne
// lokalen Backend-Start funktioniert. Für lokale Backend-Entwicklung temporär
// auf 'http://<lokale-IP>:3000' umstellen (ifconfig | grep "inet " | grep -v 127).
const DEV_API_URL = 'https://ondeya-app-production.up.railway.app';
const PROD_API_URL = 'https://ondeya-app-production.up.railway.app';

const BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export type { Product };

export interface FetchProductsParams {
  advertiser?: string;
  keywords?: string;
  category?: string;       // 'mode' | 'living' | 'lifestyle' (komma-getrennt)
  maxPrice?: number;       // Sale-Preis Obergrenze
  minDiscount?: number;    // Mindest-Rabatt in Prozent
  gender?: string;         // 'herren' | 'damen' | 'unisex' | 'kids' (komma-getrennt; herren/damen aktiviert auto-unisex im Backend)
  subcategory?: string;    // 'bekleidung' | 'unterwaesche' | 'schuhe' | 'schmuck' (komma-getrennt)
  audience?: string;       // 'erwachsen' | 'kids'
  jewelryType?: string;    // 'ringe' | 'ketten' | 'armbaender' | 'ohrringe' | 'anhaenger' | 'sonstiges' (komma-getrennt)
  apparelType?: string;    // 'jeans' | 'hosen' | ... (komma-getrennt)
  shoeType?: string;       // 'sneaker' | 'business' | 'sport' | 'stiefel' | 'sandalen' | 'pumps' | 'sonstiges' (komma-getrennt)
  kidsSubGender?: string;  // 'maedchen' | 'jungen' (komma-getrennt; nur wirksam wenn gender 'kids' enthält)
  // Bug D1 (2026-05-14): trendIds-Override. Wenn gesetzt, ignoriert das Backend
  // alle anderen Pool-Filter und liefert die Produkte der gewählten Trends in
  // Trend-Reihenfolge.
  trendIds?: string;
  page?: number;
  limit?: number;
}

// Trend-Backend (2026-05-12) — die wöchentlich ausgewählten Trends, an die das
// Quiz V3 in Pfad A „Suche nach aktuellen Trends" andockt.
export interface Trend {
  id: string;
  slug: string;
  title: string;
  heroImage: string;
  description: string;
  gender: 'damen' | 'herren' | 'unisex';
  active: boolean;
  sortOrder: number;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchActiveTrends(): Promise<Trend[]> {
  const response = await fetch(`${BASE_URL}/api/trends/active`);
  if (!response.ok) {
    throw new Error(`API Fehler: ${response.status}`);
  }
  const data = await response.json();
  return data as Trend[];
}

export async function fetchProducts(params: FetchProductsParams = {}): Promise<Product[]> {
  const url = new URL(`${BASE_URL}/api/products`);

  if (params.advertiser) url.searchParams.set('advertiser', params.advertiser);
  if (params.keywords) url.searchParams.set('keywords', params.keywords);
  if (params.category) url.searchParams.set('category', params.category);
  if (params.maxPrice !== undefined) url.searchParams.set('maxPrice', String(params.maxPrice));
  if (params.minDiscount !== undefined) url.searchParams.set('minDiscount', String(params.minDiscount));
  if (params.gender) url.searchParams.set('gender', params.gender);
  if (params.subcategory) url.searchParams.set('subcategory', params.subcategory);
  if (params.audience) url.searchParams.set('audience', params.audience);
  if (params.jewelryType) url.searchParams.set('jewelryType', params.jewelryType);
  if (params.apparelType) url.searchParams.set('apparelType', params.apparelType);
  if (params.shoeType) url.searchParams.set('shoeType', params.shoeType);
  if (params.kidsSubGender) url.searchParams.set('kidsSubGender', params.kidsSubGender);
  if (params.trendIds) url.searchParams.set('trendIds', params.trendIds);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`API Fehler: ${response.status}`);
  }

  const data = await response.json();
  return data.products as Product[];
}
