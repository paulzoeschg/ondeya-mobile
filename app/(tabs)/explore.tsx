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
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getWatchlist, removeFromWatchlist, type Product } from '../../store/watchlist-store';
import { formatEur } from '../../utils/currency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const colors = {
  noir: '#1a1714',
  espresso: '#3d3630',
  taupe: '#8a7f72',
  sand: '#c9a882',
  linen: '#e8ddd0',
  forest: '#2e4a3e',
  forestLight: '#4a8a6e',
  terracotta: '#4a2e2e',
  terracottaLight: '#9a5f5f',
};

// --- Detail-Sheet ---

function DetailSheet({ item, onClose }: { item: Product; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={sheet.overlay}>
        <View style={sheet.container}>
          <TouchableOpacity style={sheet.closeArea} onPress={onClose} activeOpacity={1} />
          <View style={sheet.content}>
            <View style={sheet.handle} />
            <TouchableOpacity style={sheet.closeBtn} onPress={onClose}>
              <Text style={sheet.closeBtnText}>✕</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Image source={{ uri: item.image }} style={sheet.image} resizeMode="cover" />
              <View style={sheet.body}>
                <Text style={sheet.brand}>{item.brand}</Text>
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
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- Swipeable Karte ---

function SwipeableCard({
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
  const position = useRef(new Animated.ValueXY()).current;
  const swipeProgress = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        position.setOffset({ x: (position.x as any)._value, y: 0 });
        position.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        position.x.setValue(g.dx);
        swipeProgress.setValue(g.dx / SCREEN_WIDTH);
      },
      onPanResponderRelease: (_, g) => {
        position.flattenOffset();
        if (g.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH * 1.4, y: 0 },
            duration: 250,
            useNativeDriver: true,
          }).start(() => onBuy());
        } else if (g.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH * 1.4, y: 0 },
            duration: 250,
            useNativeDriver: true,
          }).start(() => onRemove());
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
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

  const buyOpacity = swipeProgress.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' });
  const removeOpacity = swipeProgress.interpolate({ inputRange: [-0.3, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <Animated.View
      style={[styles.cardWrapper, { transform: [{ translateX: position.x }] }]}
      {...panResponder.panHandlers}
    >
      {/* Hintergrund-Overlays */}
      <Animated.View style={[styles.overlayRight, { opacity: buyOpacity }]}>
        <Text style={styles.overlayText}>→ Kaufen</Text>
      </Animated.View>
      <Animated.View style={[styles.overlayLeft, { opacity: removeOpacity }]}>
        <Text style={styles.overlayText}>Entfernen ←</Text>
      </Animated.View>

      {/* Karten-Inhalt */}
      <TouchableOpacity activeOpacity={0.9} onPress={onTap} style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
        <View style={styles.info}>
          <Text style={styles.brandName}>{item.brand}</Text>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          {item.color ? <Text style={styles.colorName}>{item.color}</Text> : null}
          <View style={styles.priceRow}>
            <Text style={styles.salePrice}>{formatEur(item.salePrice)}</Text>
            {item.originalPrice > item.salePrice && (
              <Text style={styles.originalPrice}>{formatEur(item.originalPrice)}</Text>
            )}
            {item.discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>−{item.discount}%</Text>
              </View>
            )}
          </View>
          <Text style={styles.swipeHint}>← entfernen · kaufen →</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// --- Watchlist Screen ---

export default function WatchlistScreen() {
  const [items, setItems] = useState<Product[]>([]);
  const [detailItem, setDetailItem] = useState<Product | null>(null);

  useFocusEffect(
    useCallback(() => {
      setItems(getWatchlist());
    }, [])
  );

  const handleRemove = (id: string) => {
    removeFromWatchlist(id);
    setItems(getWatchlist());
  };

  const handleBuy = (url: string) => {
    if (url) Linking.openURL(url);
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.logo}>ONDEYA</Text>
        <Text style={styles.emptyTitle}>Watchlist leer</Text>
        <Text style={styles.emptySubtitle}>
          Entscheide dich für Produkte nach rechts{'\n'}um sie hier zu speichern.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {detailItem && (
        <DetailSheet item={detailItem} onClose={() => setDetailItem(null)} />
      )}

      <View style={styles.header}>
        <Text style={styles.logo}>ONDEYA</Text>
        <Text style={styles.subtitle}>{items.length} {items.length === 1 ? 'Produkt' : 'Produkte'}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <SwipeableCard
            item={item}
            onRemove={() => handleRemove(item.id)}
            onBuy={() => handleBuy(item.affiliateUrl)}
            onTap={() => setDetailItem(item)}
          />
        )}
      />
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noir },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.noir,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { color: colors.linen, fontSize: 20, fontWeight: '600', marginTop: 8 },
  emptySubtitle: { color: colors.taupe, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  header: {
    paddingTop: 64,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  logo: { color: colors.sand, fontSize: 20, fontWeight: '700', letterSpacing: 6 },
  subtitle: { color: colors.taupe, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  separator: { height: 12 },

  cardWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  overlayRight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.forest,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
    zIndex: 1,
  },
  overlayLeft: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.terracotta,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 24,
    zIndex: 1,
  },
  overlayText: {
    color: colors.linen,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.espresso,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    zIndex: 2,
  },
  productImage: { width: 110, height: 130 },
  info: { flex: 1, padding: 14, gap: 3, justifyContent: 'space-between' },
  brandName: {
    color: colors.taupe,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  productName: { color: colors.linen, fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  colorName: { color: colors.taupe, fontSize: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  salePrice: { color: colors.sand, fontSize: 18, fontWeight: '700' },
  originalPrice: { color: colors.taupe, fontSize: 13, textDecorationLine: 'line-through' },
  discountBadge: {
    backgroundColor: colors.forest,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  discountText: { color: colors.linen, fontSize: 11, fontWeight: '700' },
  swipeHint: { color: colors.taupe, fontSize: 11, opacity: 0.6 },
});

const sheet = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { flex: 1, justifyContent: 'flex-end' },
  closeArea: { flex: 1 },
  content: {
    backgroundColor: colors.espresso,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.taupe,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
    opacity: 0.5,
  },
  closeBtn: { position: 'absolute', top: 16, right: 20, padding: 4, zIndex: 10 },
  closeBtnText: { color: colors.taupe, fontSize: 18, fontWeight: '600' },
  image: { width: '100%', height: 280, backgroundColor: colors.noir },
  body: { padding: 20, gap: 6 },
  brand: { color: colors.taupe, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  name: { color: colors.linen, fontSize: 20, fontWeight: '700', letterSpacing: -0.5, lineHeight: 26 },
  color: { color: colors.taupe, fontSize: 13 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 },
  salePrice: { color: colors.sand, fontSize: 24, fontWeight: '700' },
  originalPrice: { color: colors.taupe, fontSize: 15, textDecorationLine: 'line-through' },
  badge: { backgroundColor: colors.forest, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: colors.linen, fontSize: 12, fontWeight: '700' },
  description: { color: colors.linen, fontSize: 14, lineHeight: 22, marginTop: 8, opacity: 0.85 },
});
