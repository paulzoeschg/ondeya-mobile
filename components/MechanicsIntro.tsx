import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const colors = {
  noir: '#1a1714',
  taupe: '#8a7f72',
  sand: '#c9a882',
  linen: '#e8ddd0',
  forest: '#2e4a3e',
  terracotta: '#4a2e2e',
};

const SWIPE_ACTIONS = [
  { symbol: '→', label: 'Zur Watchlist', color: colors.forest },
  { symbol: '←', label: 'Weiter', color: colors.terracotta },
  { symbol: '↑', label: 'Direkt kaufen', color: colors.sand },
  { symbol: '↓', label: 'Nicht mein Stil', color: colors.taupe },
] as const;

const GESTURE_ACTIONS = [
  { symbol: '◎', label: 'Antippen', sublabel: 'Produktdetails öffnen sich', color: colors.sand },
  { symbol: '⊙', label: 'Lang drücken unten', sublabel: 'Menü erscheint', color: colors.linen },
] as const;

export default function MechanicsIntro({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [overlayOpacity]);

  const goToStep2 = () => {
    Animated.timing(cardOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(1);
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const dismiss = () => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(onDismiss);
  };

  const handleBackdropPress = () => {
    if (step === 0) goToStep2();
    else dismiss();
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleBackdropPress} />

      <Animated.View style={[styles.card, { opacity: cardOpacity }]}>
        <Text style={styles.logo}>ONDEYA</Text>

        {step === 0 ? (
          <>
            <Text style={styles.subtitle}>So funktioniert's</Text>
            <View style={styles.actions}>
              {SWIPE_ACTIONS.map((a) => (
                <View key={a.symbol} style={styles.actionRow}>
                  <Text style={[styles.symbol, { color: a.color }]}>{a.symbol}</Text>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.button} onPress={goToStep2} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Weiter</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>Und noch mehr</Text>
            <View style={styles.actions}>
              {GESTURE_ACTIONS.map((a) => (
                <View key={a.symbol} style={styles.actionRow}>
                  <Text style={[styles.symbol, { color: a.color }]}>{a.symbol}</Text>
                  <View style={styles.actionTextGroup}>
                    <Text style={styles.actionLabel}>{a.label}</Text>
                    <Text style={styles.actionSublabel}>{a.sublabel}</Text>
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.button} onPress={dismiss} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Los geht's</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.dots}>
          <View style={[styles.dot, step === 0 && styles.dotActive]} />
          <View style={[styles.dot, step === 1 && styles.dotActive]} />
        </View>
      </Animated.View>
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
  actions: { gap: 16, marginBottom: 24 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  symbol: { fontSize: 24, width: 32, textAlign: 'center' },
  actionTextGroup: { gap: 2 },
  actionLabel: { color: colors.linen, fontSize: 16, fontWeight: '500' },
  actionSublabel: { color: colors.taupe, fontSize: 13 },
  button: {
    backgroundColor: colors.sand,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: colors.noir,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.taupe,
    opacity: 0.35,
  },
  dotActive: {
    backgroundColor: colors.sand,
    opacity: 1,
  },
});
