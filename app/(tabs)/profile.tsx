import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  Image,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import {
  getPreferences,
  setPreferences,
  resetPreferences,
  BRAND_PARTNERS,
  type StyleV2Type,
  type PriceRangeType,
} from '../../store/preferences-store';
import {
  GENDERS,
  SUBCATEGORIES,
  JEWELRY_TYPES,
  type GenderValue,
  type SubcategoryValue,
  type JewelryTypeValue,
} from '../../constants/categories';
import { resetWatchlist } from '../../store/watchlist-store';

const PROFILE_STORAGE_KEY = '@ondeya_profile';

type ProfileData = {
  name: string;
  avatarUri: string | null;
};

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

function Avatar({ name, uri, onPress }: { name: string; uri: string | null; onPress: () => void }) {
  const initials = name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <TouchableOpacity style={styles.avatarWrapper} onPress={onPress} activeOpacity={0.8}>
      {uri ? (
        <Image source={{ uri }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitials}>{initials || '?'}</Text>
        </View>
      )}
      <View style={styles.avatarEditBadge}>
        <Text style={styles.avatarEditText}>+</Text>
      </View>
    </TouchableOpacity>
  );
}

async function loadProfile(): Promise<ProfileData> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProfileData;
  } catch (_) {}
  return { name: '', avatarUri: null };
}

async function saveProfile(data: ProfileData): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

export default function ProfileScreen() {
  const [prefs, setPrefs] = useState(getPreferences());
  const [profile, setProfile] = useState<ProfileData>({ name: '', avatarUri: null });

  useFocusEffect(
    useCallback(() => {
      setPrefs(getPreferences());
      loadProfile().then(setProfile);
    }, [])
  );

  const updateProfile = (updates: Partial<ProfileData>) => {
    const next = { ...profile, ...updates };
    setProfile(next);
    saveProfile(next);
  };

  const toggleGender = (value: GenderValue) => {
    const curr = prefs.selectedGenders;
    const updated = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value];
    setPreferences({ selectedGenders: updated });
    setPrefs(getPreferences());
  };

  const toggleSubcategory = (value: SubcategoryValue) => {
    const curr = prefs.selectedSubcategories;
    const updated = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value];
    // Wenn Schmuck deaktiviert wird → JewelryType-Filter zurücksetzen, sonst übrig gebliebene Auswahl wirkt weiter.
    const updates: Partial<typeof prefs> = { selectedSubcategories: updated };
    if (value === 'schmuck' && !updated.includes('schmuck')) {
      updates.selectedJewelryTypes = [];
    }
    setPreferences(updates);
    setPrefs(getPreferences());
  };

  const toggleJewelryType = (value: JewelryTypeValue) => {
    const curr = prefs.selectedJewelryTypes;
    const updated = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value];
    setPreferences({ selectedJewelryTypes: updated });
    setPrefs(getPreferences());
  };

  const toggleStyle = (value: StyleV2Type) => {
    const curr = prefs.stylesV2;
    const updated = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value];
    setPreferences({ stylesV2: updated });
    setPrefs(getPreferences());
  };

  const updatePriceRange = (value: PriceRangeType) => {
    setPreferences({ priceRange: value });
    setPrefs(getPreferences());
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Zugriff verweigert', 'Ondeya benötigt Zugriff auf deine Fotos, um ein Profilbild zu setzen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateProfile({ avatarUri: result.assets[0].uri });
    }
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

  const styleOptions: { label: string; value: StyleV2Type }[] = [
    { label: 'Casual', value: 'casual' },
    { label: 'Elegant', value: 'elegant' },
    { label: 'Party', value: 'party' },
    { label: 'Streetwear', value: 'streetwear' },
    { label: 'Minimalistisch', value: 'minimalistisch' },
    { label: 'Vintage', value: 'vintage' },
    { label: 'Sportlich', value: 'sportlich' },
  ];

  const priceOptions: { label: string; value: PriceRangeType }[] = [
    { label: 'Bis 50 €', value: 'bis50' },
    { label: '50 – 150 €', value: '50bis150' },
    { label: '150 – 300 €', value: '150bis300' },
    { label: 'Über 300 €', value: 'ueber300' },
    { label: 'Egal', value: 'egal' },
  ];

  const showJewelryTypes = prefs.selectedSubcategories.includes('schmuck');
  const displayName = profile.name.trim() || 'Du';

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
        {/* Account-Sektion */}
        <View style={styles.accountSection}>
          <Avatar name={displayName} uri={profile.avatarUri} onPress={handlePickAvatar} />
          <View style={styles.accountInfo}>
            <TextInput
              style={styles.nameInput}
              value={profile.name}
              onChangeText={(text) => updateProfile({ name: text })}
              placeholder="Dein Name"
              placeholderTextColor={colors.taupe}
              returnKeyType="done"
              maxLength={40}
            />
            <Text style={styles.accountHint}>Dein Profil bleibt auf deinem Gerät.</Text>
          </View>
        </View>

        <Section title="Wer trägt's?">
          <View style={styles.chips}>
            {GENDERS.map((g) => (
              <SettingChip
                key={g.value}
                label={g.label}
                selected={prefs.selectedGenders.includes(g.value)}
                onPress={() => toggleGender(g.value)}
              />
            ))}
          </View>
        </Section>

        <Section title="Was zeigt dir Ondeya?">
          <View style={styles.chips}>
            {SUBCATEGORIES.map((s) => (
              <SettingChip
                key={s.value}
                label={s.label}
                selected={prefs.selectedSubcategories.includes(s.value)}
                onPress={() => toggleSubcategory(s.value)}
              />
            ))}
          </View>
          {showJewelryTypes && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionLabel}>Schmuck verfeinern</Text>
              <View style={styles.chips}>
                {JEWELRY_TYPES.map((j) => (
                  <SettingChip
                    key={j.value}
                    label={j.label}
                    selected={prefs.selectedJewelryTypes.includes(j.value)}
                    onPress={() => toggleJewelryType(j.value)}
                  />
                ))}
              </View>
            </View>
          )}
        </Section>

        <Section title="Dein Stil">
          <View style={styles.chips}>
            {styleOptions.map((o) => (
              <SettingChip
                key={o.value}
                label={o.label}
                selected={prefs.stylesV2.includes(o.value)}
                onPress={() => toggleStyle(o.value)}
              />
            ))}
          </View>
        </Section>

        <Section title="Preisrahmen">
          <View style={styles.chips}>
            {priceOptions.map((o) => (
              <SettingChip
                key={o.value}
                label={o.label}
                selected={prefs.priceRange === o.value}
                onPress={() => updatePriceRange(o.value)}
              />
            ))}
          </View>
        </Section>

        <View style={styles.section}>
          <View style={styles.brandRow}>
            <Text style={styles.brandLabel}>Auch Kindermode zeigen</Text>
            <Switch
              value={prefs.showKids}
              onValueChange={(val) => {
                setPreferences({ showKids: val });
                setPrefs(getPreferences());
              }}
              trackColor={{ false: 'rgba(138, 127, 114, 0.25)', true: 'rgba(46, 74, 62, 0.6)' }}
              thumbColor={prefs.showKids ? colors.forest : colors.taupe}
              ios_backgroundColor="rgba(138, 127, 114, 0.2)"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diese Marken zeigt dir Ondeya</Text>
          {BRAND_PARTNERS.map((partner) => {
            const isEnabled = !prefs.disabledBrands.includes(partner.label);
            return (
              <View key={partner.label} style={styles.brandRow}>
                <Text style={styles.brandLabel}>{partner.label}</Text>
                <Switch
                  value={isEnabled}
                  onValueChange={(enabled) => {
                    const updated = enabled
                      ? prefs.disabledBrands.filter((b) => b !== partner.label)
                      : [...prefs.disabledBrands, partner.label];
                    setPreferences({ disabledBrands: updated });
                    setPrefs(getPreferences());
                  }}
                  trackColor={{ false: 'rgba(138, 127, 114, 0.25)', true: 'rgba(46, 74, 62, 0.6)' }}
                  thumbColor={isEnabled ? colors.forest : colors.taupe}
                  ios_backgroundColor="rgba(138, 127, 114, 0.2)"
                />
              </View>
            );
          })}
        </View>

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

  accountSection: {
    backgroundColor: colors.espresso,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  avatarWrapper: { position: 'relative' },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2e2a26',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.taupe,
  },
  avatarInitials: { color: colors.sand, fontSize: 22, fontWeight: '700' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditText: { color: colors.noir, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  accountInfo: { flex: 1, gap: 4 },
  nameInput: {
    color: colors.linen,
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 127, 114, 0.3)',
  },
  accountHint: { color: colors.taupe, fontSize: 11 },

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
  subSection: { marginTop: 12, gap: 10 },
  subSectionLabel: {
    color: colors.sand,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 127, 114, 0.1)',
  },
  brandLabel: { color: colors.linen, fontSize: 15, fontWeight: '500' },
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
