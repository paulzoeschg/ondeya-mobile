// 2026-05-14 (Bug F + D2): Wiederverwendbare Card-Swipe-Feed-Komponente.
// Wird vom Feed-Tab (Manuell-Modus) und vom Trends-Tab geteilt — beide
// unterscheiden sich nur in der Datenquelle (loadPage) und dem aktiven
// Nav-Tab. Onboarding/MechanicsIntro-Logik bleibt im Feed-Tab.

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
  Image,
  ImageBackground,
  Linking,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  addToWatchlist,
  getWatchlist,
  getDismissedIds,
  subscribeWatchlist,
  type Product,
} from '../store/watchlist-store';
import {
  getPreferences,
  subscribePreferences,
  isProductDisabled,
} from '../store/preferences-store';
import { formatEur } from '../utils/currency';
import {
  subcategoryLabel,
  genderLabel,
  apparelTypeLabel,
  jewelryTypeLabel,
  shoeTypeLabel,
} from '../constants/categories';
import { BottomNavBar, useBottomNavAnimation, type NavTab } from './BottomNavBar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const PAGE_SIZE = 200;
const LOAD_MORE_THRESHOLD = 10;

const colors = {
  noir: '#1a1714',
  espresso: '#3d3630',
  taupe: '#8a7f72',
  sand: '#c9a882',
  linen: '#e8ddd0',
  forest: '#2e4a3e',
  terracotta: '#4a2e2e',
};

export type LoadPageFn = (params: { page: number; limit: number }) => Promise<Product[]>;

export type CardSwipeFeedProps = {
  current: NavTab;
  loadPage: LoadPageFn;
  /**
   * Signatur der aktuellen Datenquellen-Parameter. Ändert sich → Reset auf Page 1.
   * Beispiel Feed: stringify(preferenceFilters()); Trends: followedTrendIds.join(',').
   */
  signature: string;
  renderEmpty?: () => React.ReactNode;
  /** Optional: ergänzender Subtyp-Description (Feed nutzt das, Trends nicht). */
  buildFilterDescription?: () => string;
};

function applyOrdering(apiProducts: Product[], disabledBrands: string[]): Product[] {
  const watchlistIds = new Set(getWatchlist().map((p) => p.id));
  const dismissed = getDismissedIds();
  const filtered = apiProducts
    .filter((p) => !watchlistIds.has(p.id))
    .filter((p) => !isProductDisabled(p.id, disabledBrands));
  const high = filtered.filter((p) => !dismissed.has(p.id));
  const low = filtered.filter((p) => dismissed.has(p.id));
  return [...high, ...low];
}

// 2026-05-14 (Bug C, Diagnose): Bild der nächsten Karte vorab laden, damit der
// Wechsel nach dem Right-Swipe nicht durch einen Image-Mount flackert.
function prefetchNextImage(next?: Product) {
  if (!next?.image) return;
  Image.prefetch(next.image).catch(() => {
    /* offline / cache-miss — egal, Karte rendert beim Mount halt regulär. */
  });
}

function DetailSheet({
  product,
  visible,
  onClose,
  onAddToWatchlist,
}: {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onAddToWatchlist: () => void;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setActiveImage(0);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 180 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, slideAnim]);

  const swipeCloseResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderRelease: (_, g) => {
        if (g.dy > 60) onClose();
      },
    })
  ).current;

  if (!product) return null;
  const hasDiscount = product.discount > 0 && product.originalPrice > product.salePrice;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop} />
      <View style={[styles.sheetLogoArea, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.sheetLogoText}>ONDEYA</Text>
      </View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandleArea} {...swipeCloseResponder.panHandlers}>
          <View style={styles.sheetHandle} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImage(index);
            }}
          >
            {product.images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.sheetImage} resizeMode="cover" />
            ))}
          </ScrollView>
          {product.images.length > 1 && (
            <View style={styles.dots}>
              {product.images.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
              ))}
            </View>
          )}
          <View style={styles.sheetContent}>
            <View style={styles.sheetBrandRow}>
              <Text style={styles.sheetBrand}>{product.brand.toUpperCase()}</Text>
              <Text style={styles.sheetCategory}>{subcategoryLabel(product.subcategory)}</Text>
            </View>
            <Text style={styles.sheetName}>{product.name}</Text>
            <Text style={styles.sheetColor}>{product.color}</Text>
            <View style={styles.sheetPriceRow}>
              <Text style={styles.sheetSalePrice}>{formatEur(product.salePrice)}</Text>
              {hasDiscount && (
                <>
                  <Text style={styles.sheetOriginalPrice}>{formatEur(product.originalPrice)}</Text>
                  <View style={styles.sheetDiscountBadge}>
                    <Text style={styles.sheetDiscountText}>−{product.discount}%</Text>
                  </View>
                </>
              )}
            </View>
            {product.description ? (
              <Text style={styles.sheetDescription}>{product.description}</Text>
            ) : null}
            {product.details && product.details.length > 0 && (
              <View style={styles.detailsList}>
                {product.details.map((detail, i) => (
                  <View key={i} style={styles.detailItem}>
                    <Text style={styles.detailBullet}>·</Text>
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={styles.buyButtonFull}
              onPress={() => {
                Linking.openURL(product.affiliateUrl);
                onClose();
              }}
            >
              <Text style={styles.buyButtonFullText}>Jetzt kaufen — {formatEur(product.salePrice)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.watchlistButtonFull}
              onPress={() => {
                onAddToWatchlist();
                onClose();
              }}
            >
              <Text style={styles.watchlistButtonFullText}>Zur Watchlist hinzufügen</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

export default function CardSwipeFeed({
  current,
  loadPage,
  signature,
  renderEmpty,
  buildFilterDescription,
}: CardSwipeFeedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<Product[]>([]);

  const currentPageRef = useRef(1);
  const allLoadedRef = useRef(false);
  const loadingRef = useRef(false);
  const signatureRef = useRef<string>(signature);

  const loadFn = async (opts: { reset?: boolean } = {}) => {
    if (loadingRef.current) return;
    const reset = opts.reset !== false;
    if (reset) {
      currentPageRef.current = 1;
      allLoadedRef.current = false;
      signatureRef.current = signature;
    }
    loadingRef.current = true;
    try {
      const page = currentPageRef.current;
      const apiProducts = await loadPage({ page, limit: PAGE_SIZE });
      const prefs = getPreferences();
      const ordered = applyOrdering(apiProducts, prefs.disabledBrands);
      if (apiProducts.length < PAGE_SIZE) {
        allLoadedRef.current = true;
      }
      if (reset) {
        setCards(ordered);
        // Erstes Bild vorab cachen, damit es sofort scharf erscheint.
        prefetchNextImage(ordered[0]);
        prefetchNextImage(ordered[1]);
      } else {
        setCards((prev) => {
          const known = new Set(prev.map((p) => p.id));
          const fresh = ordered.filter((p) => !known.has(p.id));
          return [...prev, ...fresh];
        });
      }
    } catch (e) {
      console.warn('[CardSwipeFeed] Backend nicht erreichbar:', e);
    } finally {
      loadingRef.current = false;
    }
  };

  const loadMore = async () => {
    if (allLoadedRef.current || loadingRef.current) return;
    if (signatureRef.current !== signature) {
      await loadFn({ reset: true });
      return;
    }
    currentPageRef.current += 1;
    await loadFn({ reset: false });
  };

  // Initial-Load + bei Signature-Wechsel resetten.
  useEffect(() => {
    setIsLoading(true);
    loadFn({ reset: true }).then(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // Auf Watchlist-Updates lokal reagieren, damit zur Watchlist hinzugefügte
  // Produkte aus dem Stack verschwinden.
  useEffect(() => {
    const unsubscribe = subscribeWatchlist(() => {
      setCards((prev) => {
        const watchlistIds = new Set(getWatchlist().map((p) => p.id));
        return prev.filter((p) => !watchlistIds.has(p.id));
      });
    });
    return () => { unsubscribe(); };
  }, []);

  // Filter-Beschreibung für die Karten-Unterzeile (Feed nutzt sie, Trends nicht).
  const [filterDescription, setFilterDescription] = useState<string>(
    buildFilterDescription ? buildFilterDescription() : ''
  );
  useEffect(() => {
    if (!buildFilterDescription) return;
    const unsubscribe = subscribePreferences(() => {
      setFilterDescription(buildFilterDescription());
    });
    return () => { unsubscribe(); };
  }, [buildFilterDescription]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const cardsRef = useRef<Product[]>([]);
  useEffect(() => { cardsRef.current = cards; }, [cards]);

  const previousCardRef = useRef<Product | null>(null);

  const positionsRef = useRef<Map<string, Animated.ValueXY>>(new Map());
  const getPosition = (id: string): Animated.ValueXY => {
    let pos = positionsRef.current.get(id);
    if (!pos) {
      pos = new Animated.ValueXY({ x: 0, y: 0 });
      positionsRef.current.set(id, pos);
    }
    return pos;
  };

  const actionOpacity = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const openNavRef = useRef<() => void>(() => {});
  const openDetailSheetRef = useRef<() => void>(() => {});
  const goBackRef = useRef<() => void>(() => {});

  const showActionFeedback = (action: string) => {
    setLastAction(action);
    actionOpacity.setValue(1);
    Animated.timing(actionOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }).start(() => setLastAction(null));
  };

  const nav = useBottomNavAnimation();

  const swipeCardRef = useRef<(direction: 'left' | 'right' | 'up' | 'down') => void>(() => {});

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gesture) => {
        isDragging.current = false;
        touchStartYRef.current = gesture.y0;
        touchStartXRef.current = gesture.x0;
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) {
          isDragging.current = true;
        }
        const topId = cardsRef.current[0]?.id;
        if (!topId) return;
        getPosition(topId).setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (isDragging.current) {
          if (gesture.dx > SWIPE_THRESHOLD) swipeCardRef.current('right');
          else if (gesture.dx < -SWIPE_THRESHOLD) swipeCardRef.current('left');
          else if (gesture.dy < -SWIPE_THRESHOLD) swipeCardRef.current('up');
          else if (gesture.dy > SWIPE_THRESHOLD) swipeCardRef.current('down');
          else resetPosition();
        } else {
          if (touchStartXRef.current < 80 && touchStartYRef.current < 100) {
            goBackRef.current();
          } else if (touchStartYRef.current > SCREEN_HEIGHT * 0.8) {
            openNavRef.current();
          } else {
            openDetailSheetRef.current();
          }
        }
      },
    })
  ).current;

  const swipeCard = (direction: 'left' | 'right' | 'up' | 'down') => {
    const currentCard = cardsRef.current[0];
    if (!currentCard) return;

    previousCardRef.current = currentCard;

    if (direction === 'right') {
      addToWatchlist(currentCard);
      showActionFeedback('Zur Watchlist hinzugefügt');
    } else if (direction === 'up') {
      Linking.openURL(currentCard.affiliateUrl);
      showActionFeedback('Shop wird geöffnet...');
    } else if (direction === 'down') {
      showActionFeedback('Nicht mein Stil');
    }

    const x =
      direction === 'right' ? SCREEN_WIDTH * 1.5 :
      direction === 'left' ? -SCREEN_WIDTH * 1.5 : 0;
    const y =
      direction === 'up' ? -SCREEN_HEIGHT * 1.5 :
      direction === 'down' ? SCREEN_HEIGHT * 1.5 : 0;

    // 2026-05-14 (Bug C): Nächste Karte vorab im Image-Cache halten, damit
    // beim Mount nach dem Swipe kein Flicker entsteht.
    prefetchNextImage(cardsRef.current[1]);
    prefetchNextImage(cardsRef.current[2]);

    const pos = getPosition(currentCard.id);
    Animated.spring(pos, {
      toValue: { x, y },
      useNativeDriver: true,
      speed: 20,
    }).start(() => {
      setCards((prev) => {
        const next = prev.slice(1);
        if (next.length < LOAD_MORE_THRESHOLD && !allLoadedRef.current && !loadingRef.current) {
          loadMore();
        }
        return next;
      });
      positionsRef.current.delete(currentCard.id);
    });
  };

  const goBack = () => {
    const prev = previousCardRef.current;
    if (!prev) return;
    previousCardRef.current = null;
    // 2026-05-14 (Bug C): Re-Mount-Karte startet sauber bei {x:0,y:0}.
    // Falls noch ein Animated.ValueXY für die ID herumliegt, ersetzen.
    positionsRef.current.set(prev.id, new Animated.ValueXY({ x: 0, y: 0 }));
    setCards((current) => [prev, ...current]);
  };

  swipeCardRef.current = swipeCard;
  openNavRef.current = nav.open;
  goBackRef.current = goBack;
  openDetailSheetRef.current = () => {
    setSelectedProduct(cardsRef.current[0] ?? null);
    setSheetVisible(true);
  };

  const resetPosition = () => {
    const topId = cardsRef.current[0]?.id;
    if (!topId) return;
    Animated.spring(getPosition(topId), {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  };

  const insets = useSafeAreaInsets();

  const renderCard = (product: Product, isTop: boolean) => {
    const pos = getPosition(product.id);
    const rotate = pos.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['-6deg', '0deg', '6deg'],
      extrapolate: 'clamp',
    });
    const likeOpacity = pos.x.interpolate({
      inputRange: [0, SCREEN_WIDTH / 4],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    const skipOpacity = pos.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 4, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    const buyOpacity = pos.y.interpolate({
      inputRange: [-SCREEN_HEIGHT / 5, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const hasDiscount = product.discount > 0;

    return (
      <Animated.View
        key={product.id}
        style={[
          styles.card,
          {
            transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }],
            zIndex: isTop ? 10 : 1,
          },
        ]}
        {...(isTop ? panResponder.panHandlers : {})}
      >
        <ImageBackground
          source={{ uri: product.image }}
          style={StyleSheet.absoluteFillObject}
          blurRadius={25}
        >
          <View style={styles.blurOverlay} />
        </ImageBackground>
        <Image source={{ uri: product.image }} style={styles.cardImage} resizeMode="contain" />
        <LinearGradient
          colors={['transparent', 'rgba(26,23,20,0.85)']}
          locations={[0, 1]}
          style={styles.cardGradient}
        />
        <View style={[styles.cardTopBar, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.cardLogo}>ONDEYA</Text>
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.cardPriceRow}>
            <Text style={styles.cardSalePrice}>{formatEur(product.salePrice)}</Text>
            {hasDiscount && (
              <View style={styles.cardDiscountBadge}>
                <Text style={styles.cardDiscountText}>−{product.discount}%</Text>
              </View>
            )}
          </View>
          {subcategoryLabel(product.subcategory) !== '' && (
            <Text style={styles.cardCategoryLabel}>{subcategoryLabel(product.subcategory)}</Text>
          )}
          {filterDescription !== '' && (
            <Text style={styles.cardSubcategoryLabel}>{filterDescription}</Text>
          )}
        </View>
        {isTop && (
          <>
            <Animated.View style={[styles.overlay, styles.likeOverlay, { opacity: likeOpacity }]}>
              <Text style={styles.overlayText}>WATCHLIST →</Text>
            </Animated.View>
            <Animated.View style={[styles.overlay, styles.skipOverlay, { opacity: skipOpacity }]}>
              <Text style={styles.overlayText}>← SKIP</Text>
            </Animated.View>
            <Animated.View style={[styles.overlay, styles.buyOverlay, { opacity: buyOpacity }]}>
              <Text style={[styles.overlayText, { color: colors.noir }]}>↑ KAUFEN</Text>
            </Animated.View>
          </>
        )}
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.feedLogo}>ONDEYA</Text>
      </View>
    );
  }

  if (cards.length === 0) {
    if (renderEmpty) {
      return (
        <View style={styles.container}>
          {renderEmpty()}
          <BottomNavBar current={current} visible={nav.visible} anim={nav.anim} onClose={nav.close} />
        </View>
      );
    }
    const handleEmptyPress = (e: { nativeEvent: { locationY: number } }) => {
      if (e.nativeEvent.locationY > SCREEN_HEIGHT * 0.8) {
        nav.open();
      }
    };
    return (
      <View style={styles.container}>
        <TouchableOpacity
          activeOpacity={1}
          style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', gap: 12 }]}
          onPress={handleEmptyPress}
        >
          <Text style={styles.feedLogo}>ONDEYA</Text>
          <Text style={{ color: colors.linen, fontSize: 18 }}>Alle Stücke gesehen.</Text>
          <Text style={{ color: colors.taupe, fontSize: 15 }}>Schau morgen wieder vorbei.</Text>
          <TouchableOpacity
            onPress={() => { setIsLoading(true); loadFn({ reset: true }).then(() => setIsLoading(false)); }}
            style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: colors.sand }}
          >
            <Text style={{ color: colors.noir, fontSize: 15, fontWeight: '600' }}>Nochmal entdecken</Text>
          </TouchableOpacity>
        </TouchableOpacity>
        <BottomNavBar current={current} visible={nav.visible} anim={nav.anim} onClose={nav.close} />
      </View>
    );
  }

  const visibleCards = cards.slice(0, 2).reverse();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.cardContainer}>
        {visibleCards.map((product, index) => {
          const isTop = index === visibleCards.length - 1;
          return renderCard(product, isTop);
        })}
      </View>

      {lastAction && (
        <Animated.View style={[styles.toast, { opacity: actionOpacity }]}>
          <Text style={styles.toastText}>{lastAction}</Text>
        </Animated.View>
      )}

      <BottomNavBar current={current} visible={nav.visible} anim={nav.anim} onClose={nav.close} />

      <DetailSheet
        product={selectedProduct}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onAddToWatchlist={() => {
          if (selectedProduct) {
            addToWatchlist(selectedProduct);
            showActionFeedback('Zur Watchlist hinzugefügt');
          }
        }}
      />
    </View>
  );
}

// Filter-Beschreibung wird vom Feed-Tab gesetzt — exportiert für Wiederverwendung.
export function buildManualFilterDescription(): string {
  const prefs = getPreferences();
  const parts: string[] = [];
  if (prefs.selectedGenders.length > 0 && prefs.selectedGenders.length < 4) {
    parts.push(prefs.selectedGenders.map((g) => genderLabel(g) || g).join(' / '));
  }
  if (prefs.selectedApparelTypes.length > 0) {
    parts.push(prefs.selectedApparelTypes.map((a) => apparelTypeLabel(a) || a).join(' / '));
  }
  if (prefs.selectedJewelryTypes.length > 0) {
    parts.push(prefs.selectedJewelryTypes.map((j) => jewelryTypeLabel(j) || j).join(' / '));
  }
  if (prefs.selectedShoeTypes.length > 0) {
    parts.push(prefs.selectedShoeTypes.map((s) => shoeTypeLabel(s) || s).join(' / '));
  }
  return parts.join(' · ');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noir },
  feedLogo: { color: colors.sand, fontSize: 20, fontWeight: '700', letterSpacing: 6 },
  toast: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(61, 54, 48, 0.92)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 100,
    borderWidth: 1,
    borderColor: colors.taupe,
  },
  toastText: { color: colors.linen, fontSize: 14, fontWeight: '500' },
  cardContainer: { flex: 1 },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.noir,
    overflow: 'hidden',
  },
  blurOverlay: { flex: 1, backgroundColor: 'rgba(26, 23, 20, 0.5)' },
  cardImage: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: SCREEN_WIDTH * 0.05,
    right: SCREEN_WIDTH * 0.05,
  },
  cardGradient: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '15%',
  },
  cardTopBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal: 24,
    zIndex: 5,
  },
  cardLogo: { color: colors.sand, fontSize: 18, fontWeight: '700', letterSpacing: 5 },
  cardBottom: {
    position: 'absolute',
    bottom: 32, left: 24, right: 24,
    zIndex: 5,
    gap: 4,
  },
  cardPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardSalePrice: { color: colors.linen, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  cardDiscountBadge: {
    backgroundColor: colors.forest,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  cardDiscountText: { color: colors.linen, fontSize: 14, fontWeight: '700' },
  cardCategoryLabel: { color: 'rgba(232, 221, 208, 0.7)', fontSize: 14, lineHeight: 20 },
  cardSubcategoryLabel: { color: 'rgba(232, 221, 208, 0.55)', fontSize: 13, lineHeight: 18 },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 20,
  },
  likeOverlay: { backgroundColor: 'rgba(46, 74, 62, 0.78)' },
  skipOverlay: { backgroundColor: 'rgba(74, 46, 46, 0.78)' },
  buyOverlay: { backgroundColor: 'rgba(201, 168, 130, 0.88)' },
  overlayText: { color: colors.linen, fontSize: 22, fontWeight: '700', letterSpacing: 3 },

  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  sheetLogoArea: { position: 'absolute', top: 0, left: 24, zIndex: 10 },
  sheetLogoText: { color: colors.sand, fontSize: 18, fontWeight: '700', letterSpacing: 5 },
  sheetHandleArea: { paddingVertical: 16, alignItems: 'center' },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: colors.espresso,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.taupe,
    borderRadius: 2,
    opacity: 0.75,
  },
  sheetImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.taupe, opacity: 0.4 },
  dotActive: { backgroundColor: colors.sand, opacity: 1 },
  sheetContent: { padding: 24, gap: 10, paddingBottom: 48 },
  sheetBrandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetBrand: { color: colors.taupe, fontSize: 11, fontWeight: '600', letterSpacing: 2 },
  sheetCategory: { color: colors.taupe, fontSize: 12 },
  sheetName: { color: colors.linen, fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginTop: 2 },
  sheetColor: { color: colors.taupe, fontSize: 14 },
  sheetPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  sheetSalePrice: { color: colors.sand, fontSize: 26, fontWeight: '700' },
  sheetOriginalPrice: { color: colors.taupe, fontSize: 17, textDecorationLine: 'line-through' },
  sheetDiscountBadge: { backgroundColor: colors.forest, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sheetDiscountText: { color: colors.linen, fontSize: 13, fontWeight: '700' },
  sheetDescription: { color: colors.linen, fontSize: 15, lineHeight: 22, opacity: 0.8, marginTop: 4 },
  detailsList: { gap: 6, marginTop: 4 },
  detailItem: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  detailBullet: { color: colors.sand, fontSize: 16 },
  detailText: { color: colors.taupe, fontSize: 14 },
  buyButtonFull: {
    backgroundColor: colors.sand,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buyButtonFullText: { color: colors.noir, fontSize: 16, fontWeight: '700' },
  watchlistButtonFull: {
    borderWidth: 1,
    borderColor: colors.taupe,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  watchlistButtonFullText: { color: colors.linen, fontSize: 15, fontWeight: '500' },
});
