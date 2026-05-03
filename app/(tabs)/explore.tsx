import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getWatchlist, removeFromWatchlist, type Product } from '../../store/watchlist-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const colors = {
  noir: '#1a1714',
  espresso: '#3d3630',
  taupe: '#8a7f72',
  sand: '#c9a882',
  linen: '#e8ddd0',
  forest: '#2e4a3e',
  terracotta: '#4a2e2e',
};

export default function WatchlistScreen() {
  const [items, setItems] = useState<Product[]>([]);

  // Wird jedes Mal neu geladen wenn der Tab fokussiert wird
  useFocusEffect(
    useCallback(() => {
      setItems(getWatchlist());
    }, [])
  );

  const handleRemove = (id: string) => {
    removeFromWatchlist(id);
    setItems(getWatchlist());
  };

  // affiliateUrl ist bereits ein CJ Affiliate Link (vom Backend generiert)
  const handleBuy = (url: string) => {
    Linking.openURL(url);
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
          <View style={styles.card}>
            <Image
              source={{ uri: item.image }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.info}>
              <Text style={styles.brandName}>{item.brand}</Text>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.colorName}>{item.color}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.salePrice}>£{item.salePrice}</Text>
                <Text style={styles.originalPrice}>£{item.originalPrice}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>−{item.discount}%</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={() => handleBuy(item.affiliateUrl)}
                >
                  <Text style={styles.buyButtonText}>Jetzt kaufen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(item.id)}
                >
                  <Text style={styles.removeButtonText}>Entfernen</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

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
  emptyTitle: {
    color: colors.linen,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtitle: {
    color: colors.taupe,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
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
  card: {
    backgroundColor: colors.espresso,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  productImage: {
    width: 110,
    height: 130,
  },
  info: {
    flex: 1,
    padding: 14,
    gap: 3,
    justifyContent: 'space-between',
  },
  brandName: {
    color: colors.taupe,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  productName: {
    color: colors.linen,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
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
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  buyButton: {
    backgroundColor: colors.sand,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  buyButtonText: { color: colors.noir, fontSize: 13, fontWeight: '700' },
  removeButton: {
    borderWidth: 1,
    borderColor: colors.taupe,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  removeButtonText: { color: colors.taupe, fontSize: 13, fontWeight: '500' },
});
