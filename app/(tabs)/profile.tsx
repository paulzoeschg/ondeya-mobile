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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import {
  getPreferences,
  setPreferences,
  resetPreferences,
  type GenderType,
  type StyleV2Type,
  type CategoryV2Type,
  type PriceRangeType,
  type DiscoveryAffinityType,
} from '../../store/preferences-store';
import { ACTIVE_CATEGORIES } from '../../constants/categories';
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

// --- Subkomponenten ---

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

// --- Profil-Daten laden/speichern (lokal, kein Backend) ---

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

// --- Screen ---

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

  // Multi-Select Toggle für Array-Felder
  const toggleMulti = <T extends string>(
    field: 'genders' | 'stylesV2' | 'categoriesV2',
    value: T,
    current: T[]
  ) => {
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setPreferences({ [field]: updated } as any);
    setPrefs(getPreferences());
  };

  const updateSingle = (field: string, value: any) => {
    setPreferences({ [field]: value } as any);
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

  // Optionen
  const genderOptions: { label: string; value: GenderType }[] = [
    { label: 'Damen', value: 'damen' },
    { label: 'Herren', value: 'herren' },
    { label: 'Unisex', value: 'unisex' },
  ];

  const styleOptions: { label: string; value: StyleV2Type }[] = [
    { label: 'Casual', value: 'casual' },
    { label: 'Elegant', value: 'elegant' },
    { label: 'Party', value: 'party' },
    { label: 'Streetwear', value: 'streetwear' },
    { label: 'Minimalistisch', value: 'minimalistisch' },
    { label: 'Vintage', value: 'vintage' },
    { label: 'Sportlich', value: 'sportlich' },
  ];

  const categoryOptions: { label: string; value: CategoryV2Type }[] = [
    { label: 'Kleidung', value: 'kleidung' },
    { label: 'Schuhe', value: 'schuhe' },
    { label: 'Schmuck', value: 'schmuck' },
  ];

  const priceOptions: { label: string; value: PriceRangeType }[] = [
    { label: 'Bis 50 €', value: 'bis50' },
    { label: '50 – 150 €', value: '50bis150' },
    { label: '150 – 300 €', value: '150bis300' },
    { label: 'Über 300 €', value: 'ueber300' },
    { label: 'Egal', value: 'egal' },
  ];

  const discoveryOptions: { label: string; value: DiscoveryAffinityType }[] = [
    { label: 'Bekannte Marken', value: 0 },
    { label: 'Mix', value: 1 },
    { label: 'Neues entdecken', value: 2 },
  ];

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

        {/* V2 Filter-Sektionen */}
        <Section title="Wer trägt's?">
          <View style={styles.chips}>
            {genderOptions.map((o) => (
              <SettingChip
                key={o.value}
                label={o.label}
                selected={prefs.genders.includes(o.value)}
                onPress={() => toggleMulti('genders', o.value, prefs.genders)}
              />
            ))}
          </View>
        </Section>

        <Section title="Dein Stil">
          <View style={styles.chips}>
            {styleOptions.map((o) => (
              <SettingChip
                key={o.value}
                label={o.label}
                selected={prefs.stylesV2.includes(o.value)}
                onPress={() => toggleMulti('stylesV2', o.value, prefs.stylesV2)}
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
                selected={prefs.categoriesV2.includes(o.value) || prefs.categoriesV2.includes('alle')}
                onPress={() => toggleMulti('categoriesV2', o.value, prefs.categoriesV2)}
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
                onPress={() => updateSingle('priceRange', o.value)}
              />
            ))}
          </View>
        </Section>

        <Section title="Entdeckungsfreude">
          <View style={styles.chips}>
            {discoveryOptions.map((o) => (
              <SettingChip
                key={String(o.value)}
                label={o.label}
                selected={prefs.discoveryAffinity === o.value}
                onPress={() => updateSingle('discoveryAffinity', o.value)}
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

  // Account
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

  // Sektionen
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
