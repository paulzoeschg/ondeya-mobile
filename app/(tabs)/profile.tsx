import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  getPreferences,
  setPreferences,
  resetPreferences,
  type StyleType,
  type BudgetType,
  type DiscountType,
  type SizeType,
  type CategoryType,
} from '../../store/preferences-store';
import { resetWatchlist } from '../../store/watchlist-store';

const colors = {
  noir: '#1a1714',
  espresso: '#3d3630',
  taupe: '#8a7f72',
  sand: '#c9a882',
  linen: '#e8ddd0',
  forest: '#2e4a3e',
  terracotta: '#4a2e2e',
};

function SettingChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ProfileScreen() {
  const [prefs, setPrefs] = useState(getPreferences());

  useFocusEffect(
    useCallback(() => {
      setPrefs(getPreferences());
    }, [])
  );

  const update = (key: string, value: any) => {
    setPreferences({ [key]: value } as any);
    setPrefs(getPreferences());
  };

  const toggleCategory = (cat: CategoryType) => {
    const current = prefs.categories;
    const updated = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    update('categories', updated);
  };

  const handleDevReset = () => {
    Alert.alert(
      'App zurücksetzen',
      'Watchlist und alle Einstellungen werden gelöscht. Das Onboarding startet neu.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Zurücksetzen',
          style: 'destructive',
          onPress: async () => {
            await resetPreferences();
            await resetWatchlist();
            setPrefs(getPreferences());
          },
        },
      ]
    );
  };

  const styleOptions: { label: string; value: StyleType }[] = [
    { label: 'Classic & Clean', value: 'classic' },
    { label: 'Casual & Lässig', value: 'casual' },
    { label: 'Sporty', value: 'sporty' },
    { label: 'Alles', value: 'mix' },
  ];

  const budgetOptions: { label: string; value: BudgetType }[] = [
    { label: 'Unter €50', value: 'under50' },
    { label: '€50–€150', value: '50to150' },
    { label: '€150–€300', value: '150to300' },
    { label: 'Über €300', value: 'over300' },
  ];

  const discountOptions: { label: string; value: DiscountType }[] = [
    { label: 'Ab 20%', value: '20' },
    { label: 'Ab 30%', value: '30' },
    { label: 'Ab 40%', value: '40' },
    { label: 'Ab 50%', value: '50' },
  ];

  const sizeOptions: { label: string; value: SizeType }[] = [
    { label: 'XS / S', value: 'xs_s' },
    { label: 'M', value: 'm' },
    { label: 'L / XL', value: 'l_xl' },
    { label: 'XXL +', value: 'xxl' },
  ];

  const categoryOptions: { label: string; value: CategoryType }[] = [
    { label: 'Mode', value: 'mode' },
    { label: 'Living', value: 'living' },
    { label: 'Lifestyle', value: 'lifestyle' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>ONDEYA</Text>
        <Text style={styles.headerSub}>Mein Profil</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Mein Stil">
          <View style={styles.chips}>
            {styleOptions.map((o) => (
              <SettingChip
                key={o.value}
                label={o.label}
                selected={prefs.style === o.value}
                onPress={() => update('style', o.value)}
              />
            ))}
          </View>
        </Section>

        <Section title="Kategorien">
          <View style={styles.chips}>
            {categoryOptions.map((o) => (
              <SettingChip
                key={o.value}
                label={o.label}
                selected={prefs.categories.includes(o.value)}
                onPress={() => toggleCategory(o.value)}
              />
            ))}
          </View>
        </Section>

        <Section title="Budget pro Produkt">
          <View style={styles.chips}>
            {budgetOptions.map((o) => (
              <SettingChip
                key={o.value}
                label={o.label}
                selected={prefs.budget === o.value}
                onPress={() => update('budget', o.value)}
              />
            ))}
          </View>
        </Section>

        <Section title="Mindest-Rabatt">
          <View style={styles.chips}>
            {discountOptions.map((o) => (
              <SettingChip
                key={o.value}
                label={o.label}
                selected={prefs.minDiscount === o.value}
                onPress={() => update('minDiscount', o.value)}
              />
            ))}
          </View>
        </Section>

        <Section title="Meine Größe">
          <View style={styles.chips}>
            {sizeOptions.map((o) => (
              <SettingChip
                key={o.value}
                label={o.label}
                selected={prefs.size === o.value}
                onPress={() => update('size', o.value)}
              />
            ))}
          </View>
        </Section>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Wie Ondeya lernt</Text>
          <Text style={styles.infoText}>
            Ondeya merkt sich deine Entscheidungen im Feed und passt sich mit der Zeit an deinen Geschmack an — automatisch, ohne dass du etwas tun musst.
          </Text>
        </View>

        {/* ⚠️ DEV ONLY — vor Launch entfernen */}
        <View style={styles.devSection}>
          <Text style={styles.devLabel}>⚠️ Entwicklermodus</Text>
          <TouchableOpacity style={styles.devButton} onPress={handleDevReset}>
            <Text style={styles.devButtonText}>App komplett zurücksetzen</Text>
          </TouchableOpacity>
          <Text style={styles.devHint}>
            Löscht Watchlist + Einstellungen · Onboarding startet neu
          </Text>
        </View>
        {/* ⚠️ DEV ONLY ENDE */}

        <Text style={styles.version}>Ondeya · Beta · v0.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noir },
  header: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  logo: { color: colors.sand, fontSize: 20, fontWeight: '700', letterSpacing: 6, marginBottom: 2 },
  headerSub: { color: colors.taupe, fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60, gap: 8 },
  section: {
    backgroundColor: colors.espresso,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: colors.taupe,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.taupe,
  },
  chipSelected: {
    backgroundColor: 'rgba(201, 168, 130, 0.12)',
    borderColor: colors.sand,
  },
  chipText: { color: colors.taupe, fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: colors.sand, fontWeight: '600' },
  infoBox: {
    backgroundColor: colors.espresso,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 130, 0.15)',
  },
  infoTitle: { color: colors.sand, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  infoText: { color: colors.taupe, fontSize: 13, lineHeight: 20 },

  // Dev Section
  devSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.terracotta,
    gap: 10,
    backgroundColor: 'rgba(74, 46, 46, 0.15)',
  },
  devLabel: {
    color: '#9a5f5f',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  devButton: {
    borderWidth: 1,
    borderColor: '#9a5f5f',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  devButtonText: { color: '#9a5f5f', fontSize: 14, fontWeight: '600' },
  devHint: { color: colors.taupe, fontSize: 12, textAlign: 'center' },

  version: { color: colors.espresso, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
