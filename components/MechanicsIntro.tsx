import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const colors = {
  noir: '#1a1714',
  taupe: '#8a7f72',
  sand: '#c9a882',
  linen: '#e8ddd0',
  forest: '#2e4a3e',
  terracotta: '#4a2e2e',
};

const ACTIONS = [
  { direction: '→', label: 'Zur Watchlist', color: colors.forest },
  { direction: '←', label: 'Weiter', color: colors.terracotta },
  { direction: '↑', label: 'Direkt kaufen', color: colors.sand },
  { direction: '↓', label: 'Nicht mein Stil', color: colors.taupe },
] as const;

export default function MechanicsIntro({ onDismiss }: { onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const dismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(onDismiss);
  };

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={dismiss} />

      <View style={styles.card}>
        <Text style={styles.logo}>ONDEYA</Text>
        <Text style={styles.subtitle}>So funktioniert's</Text>

        <View style={styles.actions}>
          {ACTIONS.map((a) => (
            <View key={a.direction} style={styles.actionRow}>
              <Text style={[styles.arrow, { color: a.color }]}>{a.direction}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.hint}>Tippen für mehr Details</Text>

        <TouchableOpacity style={styles.button} onPress={dismiss} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Los geht's</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 23, 20, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    width: SCREEN_WIDTH * 0.82,
    backgroundColor: '#2a2520',
    borderRadius: 24,
    padding: 28,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 130, 0.12)',
  },
  logo: {
    color: colors.sand,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 5,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.linen,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  actions: { gap: 14, marginBottom: 20 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  arrow: { fontSize: 26, width: 32, textAlign: 'center' },
  actionLabel: { color: colors.linen, fontSize: 16, fontWeight: '500' },
  hint: {
    color: colors.taupe,
    fontSize: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.sand,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.noir,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
