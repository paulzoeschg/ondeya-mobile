import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProducts, type FetchProductsParams } from '../../services/api';
import {
  getPreferences,
  isOnboardingDone,
  loadPreferences,
  subscribePreferences,
  type PriceRangeType,
} from '../../store/preferences-store';
import { loadWatchlist } from '../../store/watchlist-store';
import { loadProfile } from '../../store/profile-store';
import OnboardingScreen from './OnboardingScreen';
import MechanicsIntro from '../../components/MechanicsIntro';
import CardSwipeFeed, { buildManualFilterDescription } from '../../components/CardSwipeFeed';

const MECHANICS_INTRO_KEY = '@ondeya_mechanics_intro_seen';

const PRICE_RANGE_TO_MAX: Record<PriceRangeType, number | undefined> = {
  bis50: 50,
  '50bis150': 150,
  '150bis300': 300,
  ueber300: undefined,
  egal: undefined,
};

// Feed-Tab läuft IMMER im Manuell-Modus (Bug F/D2, 2026-05-14). Liest die
// Pool-Filter aus dem preferences-store ab — Trend-Logik kommt nicht hierher,
// die wohnt im Trends-Tab.
function buildFeedFilters(): FetchProductsParams {
  const prefs = getPreferences();
  const filters: FetchProductsParams = {};
  if (prefs.priceRange && prefs.priceRange !== 'egal') {
    const max = PRICE_RANGE_TO_MAX[prefs.priceRange];
    if (max !== undefined) filters.maxPrice = max;
  }
  if (prefs.selectedGenders && prefs.selectedGenders.length > 0) {
    filters.gender = prefs.selectedGenders.join(',');
  }
  if (prefs.selectedSubcategories && prefs.selectedSubcategories.length > 0) {
    filters.subcategory = prefs.selectedSubcategories.join(',');
  }
  if (prefs.selectedJewelryTypes && prefs.selectedJewelryTypes.length > 0) {
    filters.jewelryType = prefs.selectedJewelryTypes.join(',');
  }
  if (prefs.selectedApparelTypes && prefs.selectedApparelTypes.length > 0) {
    filters.apparelType = prefs.selectedApparelTypes.join(',');
  }
  if (prefs.selectedShoeTypes && prefs.selectedShoeTypes.length > 0) {
    filters.shoeType = prefs.selectedShoeTypes.join(',');
  }
  if (
    prefs.selectedGenders.includes('kids') &&
    prefs.selectedKidsSubGenders &&
    prefs.selectedKidsSubGenders.length > 0 &&
    prefs.selectedKidsSubGenders.length < 2
  ) {
    filters.kidsSubGender = prefs.selectedKidsSubGenders.join(',');
  }
  filters.audience = prefs.selectedGenders.includes('kids') || prefs.showKids ? 'erwachsen,kids' : 'erwachsen';
  return filters;
}

export default function FeedScreen() {
  const [isBooting, setIsBooting] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMechanicsIntro, setShowMechanicsIntro] = useState(false);
  const [signature, setSignature] = useState<string>('');

  useEffect(() => {
    async function boot() {
      await Promise.all([loadPreferences(), loadWatchlist(), loadProfile()]);
      const done = isOnboardingDone();
      setShowOnboarding(!done);
      if (done) {
        const seen = await AsyncStorage.getItem(MECHANICS_INTRO_KEY);
        if (!seen) setShowMechanicsIntro(true);
      }
      setSignature(JSON.stringify(buildFeedFilters()));
      setIsBooting(false);
    }
    boot();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribePreferences(() => {
      setShowOnboarding(!isOnboardingDone());
      setSignature(JSON.stringify(buildFeedFilters()));
    });
    return () => { unsubscribe(); };
  }, []);

  if (isBooting) {
    return null;
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={() => {
          setShowOnboarding(false);
          setShowMechanicsIntro(true);
        }}
      />
    );
  }

  const loadPage = async ({ page, limit }: { page: number; limit: number }) => {
    return fetchProducts({ limit, page, ...buildFeedFilters() });
  };

  return (
    <>
      <CardSwipeFeed
        current="feed"
        loadPage={loadPage}
        signature={signature}
        buildFilterDescription={buildManualFilterDescription}
      />
      {showMechanicsIntro && (
        <MechanicsIntro
          onDismiss={async () => {
            await AsyncStorage.setItem(MECHANICS_INTRO_KEY, '1');
            setShowMechanicsIntro(false);
          }}
        />
      )}
    </>
  );
}
