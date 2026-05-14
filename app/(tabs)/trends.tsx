// 2026-05-14 (Bug F + D2): Trends-Tab. Liefert die Produkte der gefolgten
// Trends. Bei leerer Folger-Liste zeigt er einen Empty-State mit allen aktiven
// Trends zum Antippen.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchProducts, fetchActiveTrends, type Trend } from '../../services/api';
import {
  getPreferences,
  setPreferences,
  subscribePreferences,
  loadPreferences,
} from '../../store/preferences-store';
import { loadProfile } from '../../store/profile-store';
import { loadWatchlist } from '../../store/watchlist-store';
import CardSwipeFeed from '../../components/CardSwipeFeed';
import { BottomNavBar, useBottomNavAnimation } from '../../components/BottomNavBar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const colors = {
  noir: '#1a1714',
  espresso: '#3d3630',
  taupe: '#8a7f72',
  sand: '#c9a882',
  linen: '#e8ddd0',
  forest: '#2e4a3e',
};

export default function TrendsScreen() {
  const [booting, setBooting] = useState(true);
  const [followed, setFollowed] = useState<string[]>([]);
  const [signature, setSignature] = useState('');

  useEffect(() => {
    async function boot() {
      await Promise.all([loadPreferences(), loadWatchlist(), loadProfile()]);
      const prefs = getPreferences();
      setFollowed(prefs.followedTrendIds);
      setSignature(prefs.followedTrendIds.join(','));
      setBooting(false);
    }
    boot();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribePreferences(() => {
      const prefs = getPreferences();
      setFollowed(prefs.followedTrendIds);
      setSignature(prefs.followedTrendIds.join(','));
    });
    return () => { unsubscribe(); };
  }, []);

  if (booting) {
    return null;
  }

  if (followed.length === 0) {
    return <TrendsEmptyState />;
  }

  const loadPage = async ({ page, limit }: { page: number; limit: number }) => {
    return fetchProducts({ page, limit, trendIds: followed.join(',') });
  };

  return (
    <CardSwipeFeed
      current="trends"
      loadPage={loadPage}
      signature={signature}
    />
  );
}

// Empty-State: Auswahl-Screen mit allen aktiven Trends. Sobald >=1 gefolgt
// wird, switcht TrendsScreen automatisch zum Card-Feed.
function TrendsEmptyState() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nav = useBottomNavAnimation();

  useEffect(() => {
    setLoading(true);
    fetchActiveTrends()
      .then((data) => {
        setTrends(data.filter((t) => t.active).sort((a, b) => a.sortOrder - b.sortOrder));
        setError(null);
      })
      .catch((e: unknown) => {
        console.warn('[TrendsTab] Trends laden fehlgeschlagen', e);
        setError('Trends gerade nicht erreichbar.');
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleTrend = (id: string) => {
    const prefs = getPreferences();
    const cur = prefs.followedTrendIds;
    const updated = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    setPreferences({ followedTrendIds: updated });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerWrap}>
        <Text style={styles.logo}>ONDEYA</Text>
        <Text style={styles.title}>Trends</Text>
        <Text style={styles.subtitle}>Wähle Trends, denen du folgen willst.</Text>
      </SafeAreaView>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.sand} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && trends.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Diese Woche stellen wir gerade zusammen.</Text>
          <Text style={styles.emptyText}>Der erste Trend kommt bald.</Text>
        </View>
      )}

      {!loading && !error && trends.length > 0 && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {trends.map((trend) => (
            <TouchableOpacity
              key={trend.id}
              style={styles.tile}
              onPress={() => toggleTrend(trend.id)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: trend.heroImage }} style={styles.tileImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(26,23,20,0.9)']}
                style={styles.tileGradient}
              />
              <View style={styles.tileText}>
                <Text style={styles.tileTitle}>{trend.title}</Text>
                {trend.description ? (
                  <Text style={styles.tileDescription} numberOfLines={2}>{trend.description}</Text>
                ) : null}
              </View>
              <View style={styles.addBadge}>
                <Text style={styles.addBadgeText}>+ Folgen</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tap-Streifen unten Mitte öffnet die Bottom-Nav. */}
      <TouchableOpacity
        style={styles.tapStrip}
        activeOpacity={1}
        onPress={nav.open}
      />

      <BottomNavBar current="trends" visible={nav.visible} anim={nav.anim} onClose={nav.close} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noir },
  headerWrap: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  logo: { color: colors.sand, fontSize: 18, fontWeight: '700', letterSpacing: 5, marginBottom: 14 },
  title: { color: colors.linen, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
  subtitle: { color: colors.taupe, fontSize: 14, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 120, gap: 14 },
  tile: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.espresso,
  },
  tileImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  tileGradient: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '65%',
  },
  tileText: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 100,
    gap: 4,
  },
  tileTitle: { color: colors.linen, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  tileDescription: { color: 'rgba(232,221,208,0.78)', fontSize: 13, lineHeight: 18 },
  addBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: colors.sand,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addBadgeText: { color: colors.noir, fontSize: 12, fontWeight: '700' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  errorText: { color: colors.taupe, fontSize: 14 },
  emptyTitle: { color: colors.linen, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: colors.taupe, fontSize: 14, textAlign: 'center' },
  tapStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Math.max(60, SCREEN_HEIGHT * 0.08),
    backgroundColor: 'transparent',
    zIndex: 50,
  },
});
