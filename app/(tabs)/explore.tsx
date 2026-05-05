import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  Linking,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { getWatchlist, removeFromWatchlist, type Product } from '../../store/watchlist-store';
import { getPreferences, isProductDisabled } from '../../store/preferences-store';
import { formatEur } from '../../utils/currency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GRID_PADDING = 12;
const GRID_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.35); // leicht hochkant
const SWIPE_THRESHOLD = CARD_WIDTH * 0.35;

const colors = {
  noir: '#1a1714',
  espresso: '#3d3630',
  taupe: '#8a7f72',
  sand: '#c9a882',
  linen: '#e8ddd0',
  forest: '#2e4a3e',
  terracotta: '#4a2e2e',
};

// ── Detail-Sheet ──────────────────────────────────────────────────────────────

function DetailSheet({ item, onClose }: { item: Product; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={sheet.overlay}>
        <TouchableOpacity style={sheet.closeArea} onPress={onClose} activeOpacity={1} />
        <View style={sheet.content}>
          <View style={sheet.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <Image source={{ uri: item.image }} style={sheet.image} resizeMode="cover" />
            <View style={sheet.body}>
              <Text style={sheet.brand}>{item.brand.toUpperCase()}</Text>
              <Text style={sheet.name}>{item.name}</Text>
              {item.color ? <Text style={sheet.color}>{item.color}</Text> : null}

              <View style={sheet.priceRow}>
                <Text style={sheet.salePrice}>{formatEur(item.salePrice)}</Text>
                {item.originalPrice > item.salePrice && (
                  <Text style={sheet.originalPrice}>{formatEur(item.originalPrice)}</Text>
                )}
                {item.discount > 0 && (
                  <View style={sheet.badge}>
                    <Text style={sheet.badgeText}>−{item.discount}%</Text>
                  </View>
                )}
              </View>

              {item.description ? (
                <Text style={sheet.description}>{item.description}</Text>
              ) : null}

              <TouchableOpacity
                style={sheet.buyButton}
                onPress={() => item.affiliateUrl && Linking.openURL(item.affiliateUrl)}
              >
                <Text style={sheet.buyButtonText}>Jetzt kaufen — {formatEur(item.salePrice)}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Swipeable Mini-Karte ──────────────────────────────────────────────────────

function GridCard({
  item,
  onRemove,
  onBuy,
  onTap,
}: {
  item: Product;
  onRemove: () => void;
  onBuy: () => void;
  onTap: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeProgress = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        !isAnimating.current &&
        Math.abs(g.dx) > 6 &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderGrant: () => {
        translateX.setOffset((translateX as any)._value);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
        swipeProgress.setValue(g.dx / CARD_WIDTH);
      },
      onPanResponderRelease: (_, g) => {
        translateX.flattenOffset();
        if (g.dx > SWIPE_THRESHOLD) {
          isAnimating.current = true;
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 220,
            useNativeDriver: true,
          }).start(() => onBuy());
        } else if (g.dx < -SWIPE_THRESHOLD) {
          isAnimating.current = true;
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 220,
            useNativeDriver: true,
          }).start(() => onRemove());
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 8,
          }).start();
          Animated.spring(swipeProgress, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const buyOverlayOpacity = swipeProgress.interpolate({
    inputRange: [0, 0.35],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const removeOverlayOpacity = swipeProgress.interpolate({
    inputRange: [-0.35, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[styles.cardOuter, { transform: [{ translateX }] }]}
      {...panResponder.panHandlers}
    >
      {/* Buy-Overlay (rechts) */}
      <Animated.View style={[styles.swipeOverlay, styles.swipeOverlayRight, { opacity: buyOverlayOpacity }]}>
        <Text style={styles.swipeOverlayText}>→</Text>
      </Animated.View>

      {/* Remove-Overlay (links) */}
      <Animated.View style={[styles.swipeOverlay, styles.swipeOverlayLeft, { opacity: removeOverlayOpacity }]}>
        <Text style={styles.swipeOverlayText}>←</Text>
      </Animated.View>

      {/* Karten-Inhalt */}
      <TouchableOpacity activeOpacity={0.9} onPress={onTap} style={styles.card}>
        <Image
          source={{ uri: item.image }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(26,23,20,0.85)']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0.45 }}
          end={{ x: 0, y: 1 }}
        >
          <Text style={styles.cardBrand} numberOfLines={1}>{item.brand}</Text>
          <Text style={styles.cardPrice}>{formatEur(item.salePrice)}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Watchlist Screen ──────────────────────────────────────────────────────────

export default function WatchlistScreen() {
  const [items, setItems] = useState<Product[]>([]);
  const [detailItem, setDetailItem] = useState<Product | null>(null);

  useFocusEffect(
    useCallback(() => {
      const prefs = getPreferences();
      const all = getWatchlist();
      setItems(all.filter((p) => !isProductDisabled(p.id, prefs.disabledBrands)));
    }, [])
  );

  const handleRemove = (id: string) => {
    removeFromWatchlist(id);
    const prefs = getPreferences();
    const all = getWatchlist();
    setItems(all.filter((p) => !isProductDisabled(p.id, prefs.disabledBrands)));
  };

  const handleBuy = (url: string) => {
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {detailItem && (
        <DetailSheet item={detailItem} onClose={() => setDetailItem(null)} />
      )}

      {items.length === 0 ? (
        <SafeAreaView style={styles.emptyWrapper}>
          <Text style={styles.logo}>ONDEYA</Text>
          <Text style={styles.emptyTitle}>Noch nichts gespeichert.</Text>
          <Text style={styles.emptySubtitle}>
            Entscheide im Feed was dir gefällt{'\n'}und es landet hier.
          </Text>
        </SafeAreaView>
      ) : (
        <>
          <SafeAreaView style={styles.headerWrapper}>
            <Text style={styles.logo}>ONDEYA</Text>
            <Text style={styles.headerCount}>
              {items.length} {items.length === 1 ? 'Produkt' : 'Produkte'}
            </Text>
          </SafeAreaView>

          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <GridCard
                item={item}
                onRemove={() => handleRemove(item.id)}
                onBuy={() => handleBuy(item.affiliateUrl)}
                onTap={() => setDetailItem(item)}
              />
            )}
          />
        </>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noir },

  // Leer-Zustand
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: { color: colors.linen, fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { color: colors.taupe, fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Header
  headerWrapper: { paddingHorizontal: GRID_PADDING, paddingBottom: 8 },
  logo: { color: colors.sand, fontSize: 20, fontWeight: '700', letterSpacing: 6, marginBottom: 2 },
  headerCount: { color: colors.taupe, fontSize: 13 },

  // Grid
  grid: { paddingHorizontal: GRID_PADDING, paddingBottom: 48 },
  row: { gap: GRID_GAP, marginBottom: GRID_GAP },

  // Karte
  cardOuter: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.espresso,
  },
  swipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    justifyContent: 'center',
    zIndex: 1,
  },
  swipeOverlayRight: {
    backgroundColor: colors.forest,
    alignItems: 'flex-end',
    paddingRight: 18,
  },
  swipeOverlayLeft: {
    backgroundColor: colors.terracotta,
    alignItems: 'flex-start',
    paddingLeft: 18,
  },
  swipeOverlayText: {
    color: colors.linen,
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    zIndex: 2,
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 32,
  },
  cardBrand: {
    color: colors.taupe,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardPrice: { color: colors.linen, fontSize: 15, fontWeight: '700' },
});

const sheet = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  closeArea: { flex: 1 },
  content: {
    backgroundColor: colors.espresso,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.taupe,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
    opacity: 0.5,
  },
  image: { width: '100%', height: 300, backgroundColor: colors.noir },
  body: { padding: 20, gap: 6, paddingBottom: 40 },
  brand: { color: colors.taupe, fontSize: 11, fontWeight: '600', letterSpacing: 1.5 },
  name: { color: colors.linen, fontSize: 20, fontWeight: '700', letterSpacing: -0.4, lineHeight: 26 },
  color: { color: colors.taupe, fontSize: 13 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  salePrice: { color: colors.sand, fontSize: 24, fontWeight: '700' },
  originalPrice: { color: colors.taupe, fontSize: 15, textDecorationLine: 'line-through' },
  badge: { backgroundColor: colors.forest, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: colors.linen, fontSize: 12, fontWeight: '700' },
  description: { color: colors.linen, fontSize: 14, lineHeight: 22, marginTop: 6, opacity: 0.85 },
  buyButton: {
    backgroundColor: colors.sand,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buyButtonText: { color: colors.noir, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
});
