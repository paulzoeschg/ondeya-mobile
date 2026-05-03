import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
  Image,
  Linking,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { addToWatchlist, loadWatchlist, type Product } from '../../store/watchlist-store';
import { fetchProducts, type FetchProductsParams } from '../../services/api';
import {
  getPreferences,
  isOnboardingDone,
  loadPreferences,
  subscribePreferences,
  type BudgetType,
  type DiscountType,
} from '../../store/preferences-store';
import { formatEur } from '../../utils/currency';
import OnboardingScreen from './OnboardingScreen';

// Budget-Buckets der Präferenzen → Maximalpreis (GBP, Sale-Preis)
const BUDGET_TO_MAX_PRICE: Record<BudgetType, number | undefined> = {
  under50: 50,
  '50to150': 150,
  '150to300': 300,
  over300: undefined,
};

function preferenceFilters(): FetchProductsParams {
  const prefs = getPreferences();
  const filters: FetchProductsParams = {};

  if (prefs.budget) {
    const max = BUDGET_TO_MAX_PRICE[prefs.budget];
    if (max !== undefined) filters.maxPrice = max;
  }

  if (prefs.minDiscount) {
    filters.minDiscount = parseInt(prefs.minDiscount as DiscountType, 10);
  }

  // Nur filtern wenn der Nutzer eine Auswahl getroffen hat — leere Liste = alle
  if (prefs.categories.length > 0 && prefs.categories.length < 3) {
    filters.category = prefs.categories.join(',');
  }

  return filters;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const colors = {
  noir: '#1a1714',
  espresso: '#3d3630',
  taupe: '#8a7f72',
  sand: '#c9a882',
  linen: '#e8ddd0',
  creme: '#f5f0ea',
  forest: '#2e4a3e',
  terracotta: '#4a2e2e',
};

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

  React.useEffect(() => {
    if (visible) {
      setActiveImage(0);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!product) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Handle */}
        <View style={styles.sheetHandle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Bildgalerie */}
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
              <Image
                key={i}
                source={{ uri: img }}
                style={styles.sheetImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Bild-Dots */}
          {product.images.length > 1 && (
            <View style={styles.dots}>
              {product.images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeImage && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Produktinfo */}
          <View style={styles.sheetContent}>
            {/* Brand + Kategorie */}
            <View style={styles.sheetBrandRow}>
              <Text style={styles.sheetBrand}>{product.brand.toUpperCase()}</Text>
              <Text style={styles.sheetCategory}>{product.category}</Text>
            </View>

            {/* Name + Farbe */}
            <Text style={styles.sheetName}>{product.name}</Text>
            <Text style={styles.sheetColor}>{product.color}</Text>

            {/* Preis */}
            <View style={styles.sheetPriceRow}>
              <Text style={styles.sheetSalePrice}>{formatEur(product.salePrice)}</Text>
              <Text style={styles.sheetOriginalPrice}>{formatEur(product.originalPrice)}</Text>
              <View style={styles.sheetDiscountBadge}>
                <Text style={styles.sheetDiscountText}>−{product.discount}%</Text>
              </View>
            </View>

            {/* Beschreibung */}
            <Text style={styles.sheetDescription}>{product.description}</Text>

            {/* Details */}
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

            {/* Buttons */}
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

export default function FeedScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [cards, setCards] = useState<Product[]>([]);

  // Beim Start: Präferenzen + Produkte vom Backend laden
  useEffect(() => {
    async function init() {
      await loadPreferences();
      await loadWatchlist();
      setShowOnboarding(!isOnboardingDone());
      try {
        const apiProducts = await fetchProducts({ limit: 50, ...preferenceFilters() });
        setCards(apiProducts);
      } catch (e) {
        console.warn('[Feed] Backend nicht erreichbar:', e);
      }
      setIsLoading(false);
    }
    init();
  }, []);

  // Auf Reset reagieren (Profil-Screen Dev-Button)
  useEffect(() => {
    const unsubscribe = subscribePreferences(() => {
      setShowOnboarding(!isOnboardingDone());
    });
    return () => {
      unsubscribe();
    };
  }, []);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Ref damit PanResponder immer die aktuellen cards sieht
  const cardsRef = useRef<Product[]>([]);
  useEffect(() => { cardsRef.current = cards; }, [cards]);

  // Jede Karte bekommt ihre eigene Animated-Position. So kontaminiert die
  // wegfliegende Karte nicht die nachfolgende — kein Snap, kein Erben einer
  // off-screen-Position.
  const positionsRef = useRef<Map<string, Animated.ValueXY>>(new Map());
  const getPosition = (id: string): Animated.ValueXY => {
    let pos = positionsRef.current.get(id);
    if (!pos) {
      pos = new Animated.ValueXY();
      positionsRef.current.set(id, pos);
    }
    return pos;
  };

  const actionOpacity = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);

  const showActionFeedback = (action: string) => {
    setLastAction(action);
    actionOpacity.setValue(1);
    Animated.timing(actionOpacity, {
      toValue: 0,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => setLastAction(null));
  };

  // Ref damit PanResponder immer die neueste swipeCard-Funktion aufruft
  const swipeCardRef = useRef<(direction: 'left' | 'right' | 'up' | 'down') => void>(() => {});

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = false;
        longPressTimer.current = setTimeout(() => {
          if (!isDragging.current) {
            setSelectedProduct(cardsRef.current[0] ?? null);
            setSheetVisible(true);
          }
        }, 400);
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) {
          isDragging.current = true;
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
          }
        }
        const topId = cardsRef.current[0]?.id;
        if (!topId) return;
        getPosition(topId).setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        if (isDragging.current) {
          if (gesture.dx > SWIPE_THRESHOLD) {
            swipeCardRef.current('right');
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            swipeCardRef.current('left');
          } else if (gesture.dy < -SWIPE_THRESHOLD) {
            swipeCardRef.current('up');
          } else if (gesture.dy > SWIPE_THRESHOLD) {
            swipeCardRef.current('down');
          } else {
            resetPosition();
          }
        }
      },
    })
  ).current;

  const swipeCard = (direction: 'left' | 'right' | 'up' | 'down') => {
    const currentCard = cardsRef.current[0];
    if (!currentCard) return;
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

    const pos = getPosition(currentCard.id);
    Animated.spring(pos, {
      toValue: { x, y },
      useNativeDriver: true,
      speed: 20,
    }).start(() => {
      setCards((prev) => prev.slice(1));
      positionsRef.current.delete(currentCard.id);
    });
  };

  // swipeCardRef immer aktuell halten
  swipeCardRef.current = swipeCard;

  const resetPosition = () => {
    const topId = cardsRef.current[0]?.id;
    if (!topId) return;
    Animated.spring(getPosition(topId), {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  };

  const renderCard = (product: Product, isTop: boolean) => {
    const pos = getPosition(product.id);
    const rotate = pos.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['-8deg', '0deg', '8deg'],
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

    return (
      <Animated.View
        key={product.id}
        style={[
          styles.card,
          {
            transform: [
              { translateX: pos.x },
              { translateY: pos.y },
              { rotate },
            ],
            zIndex: isTop ? 10 : 1,
          },
        ]}
        {...(isTop ? panResponder.panHandlers : {})}
      >
        <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
        <View style={styles.cardFooter}>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>{product.brand}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>−{product.discount}%</Text>
            </View>
          </View>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.colorName}>{product.color}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.salePrice}>{formatEur(product.salePrice)}</Text>
            <Text style={styles.originalPrice}>{formatEur(product.originalPrice)}</Text>
          </View>
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

        {isTop && (
          <View style={styles.holdHint}>
            <Text style={styles.holdHintText}>· · ·  lang drücken für Details</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  if (cards.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 12 }]}>
        <Text style={styles.logo}>ONDEYA</Text>
        <Text style={{ color: colors.linen, fontSize: 18 }}>Alle Deals gesehen.</Text>
        <Text style={{ color: colors.taupe, fontSize: 15 }}>Schau morgen wieder vorbei.</Text>
      </View>
    );
  }

  const visibleCards = cards.slice(0, 2).reverse();

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.logo}>ONDEYA</Text>
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.logo}>ONDEYA</Text>
      </View>

      {lastAction && (
        <Animated.View style={[styles.toast, { opacity: actionOpacity }]}>
          <Text style={styles.toastText}>{lastAction}</Text>
        </Animated.View>
      )}

      <View style={styles.cardContainer}>
        {visibleCards.map((product, index) => {
          const isTop = index === visibleCards.length - 1;
          return renderCard(product, isTop);
        })}
      </View>

      <View style={styles.hints}>
        <Text style={styles.hint}>← Skip</Text>
        <Text style={styles.hint}>↑ Kaufen</Text>
        <Text style={styles.hint}>Watchlist →</Text>
      </View>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noir },
  header: { paddingTop: 64, paddingBottom: 12, alignItems: 'center' },
  logo: { color: colors.sand, fontSize: 20, fontWeight: '700', letterSpacing: 6 },
  toast: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: colors.espresso,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 100,
    borderWidth: 1,
    borderColor: colors.taupe,
  },
  toastText: { color: colors.linen, fontSize: 14, fontWeight: '500' },
  cardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.62,
    borderRadius: 20,
    backgroundColor: colors.espresso,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  productImage: { width: '100%', height: '70%' },
  cardFooter: { flex: 1, paddingHorizontal: 18, paddingVertical: 14, gap: 3 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  brandName: { color: colors.taupe, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  discountBadge: { backgroundColor: colors.forest, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: colors.linen, fontSize: 12, fontWeight: '700' },
  productName: { color: colors.linen, fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  colorName: { color: colors.taupe, fontSize: 13 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  salePrice: { color: colors.sand, fontSize: 22, fontWeight: '700' },
  originalPrice: { color: colors.taupe, fontSize: 15, textDecorationLine: 'line-through' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  likeOverlay: { backgroundColor: 'rgba(46, 74, 62, 0.78)' },
  skipOverlay: { backgroundColor: 'rgba(74, 46, 46, 0.78)' },
  buyOverlay: { backgroundColor: 'rgba(201, 168, 130, 0.88)' },
  overlayText: { color: colors.linen, fontSize: 22, fontWeight: '700', letterSpacing: 3 },
  holdHint: { position: 'absolute', bottom: 14, alignSelf: 'center', zIndex: 5 },
  holdHintText: { color: colors.taupe, fontSize: 11, letterSpacing: 0.5 },
  hints: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 36, paddingBottom: 52 },
  hint: { color: colors.taupe, fontSize: 13, letterSpacing: 0.3 },

  // Detail Sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.espresso,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.taupe,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
    opacity: 0.5,
  },
  sheetImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.taupe,
    opacity: 0.4,
  },
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
