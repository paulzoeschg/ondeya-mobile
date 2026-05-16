// 2026-05-14 (Bug B + Bug A): Profil V3 mit zwei parallel sichtbaren
// Setting-Gruppen — Feed-Einstellungen (Manuell-Modus, wirkt im Feed-Tab)
// und Trend-Einstellungen (wirkt im Trends-Tab). Keine Pills, kein
// quizPath-Branching mehr. Schuh-Typ-Sektion rendert direkt unter den
// Warengruppen-Chips und nur wenn 'schuhe' explizit ausgewählt ist.

import React, { useEffect, useState, useCallback } from 'react';
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
  ActivityIndicator,
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
  APPAREL_TYPES,
  filterApparelByGenders,
  KIDS_SUBGENDERS,
  SHOE_TYPES,
  type GenderValue,
  type SubcategoryValue,
  type JewelryTypeValue,
  type ApparelTypeValue,
  type KidsSubGenderValue,
  type ShoeTypeValue,
} from '../../constants/categories';
import { resetWatchlist } from '../../store/watchlist-store';
import { fetchActiveTrends, fetchBrands, type Trend, type BrandInfo } from '../../services/api';
import {
  getProfile,
  setProfile as setProfileStore,
  loadProfile,
} from '../../store/profile-store';

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

// Bug J (2026-05-14): Akkordeon-Pills steuern, welche Setting-Gruppe expanded
// ist. Reine UI-Logik, kein quizPath-Bezug, kein Tab-Wechsel.
type ExpandedGroup = 'feed' | 'trend';
const EXPANDED_GROUP_KEY = '@ondeya_profile_expanded_group';

function GroupTogglePills({
  current,
  onChange,
}: {
  current: ExpandedGroup;
  onChange: (next: ExpandedGroup) => void;
}) {
  return (
    <View style={styles.groupPillRow}>
      <TouchableOpacity
        style={[styles.groupPill, current === 'feed' && styles.groupPillActive]}
        onPress={() => onChange('feed')}
        activeOpacity={0.85}
      >
        <Text style={[styles.groupPillLabel, current === 'feed' && styles.groupPillLabelActive]}>
          Feed-Einstellungen
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.groupPill, current === 'trend' && styles.groupPillActive]}
        onPress={() => onChange('trend')}
        activeOpacity={0.85}
      >
        <Text style={[styles.groupPillLabel, current === 'trend' && styles.groupPillLabelActive]}>
          Trend-Einstellungen
        </Text>
      </TouchableOpacity>
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

export default function ProfileScreen() {
  const [prefs, setPrefs] = useState(getPreferences());
  const [profile, setProfileState] = useState(getProfile());

  useFocusEffect(
    useCallback(() => {
      setPrefs(getPreferences());
      loadProfile().then(() => setProfileState(getProfile()));
    }, [])
  );

  // Bug J: Akkordeon-State für die Profil-Setting-Gruppen. Default „feed",
  // letzte Wahl per AsyncStorage persistiert.
  const [expandedGroup, setExpandedGroup] = useState<ExpandedGroup>('feed');
  useEffect(() => {
    AsyncStorage.getItem(EXPANDED_GROUP_KEY)
      .then((raw) => {
        if (raw === 'feed' || raw === 'trend') setExpandedGroup(raw);
      })
      .catch(() => { /* leere fallback */ });
  }, []);
  const changeExpandedGroup = (next: ExpandedGroup) => {
    setExpandedGroup(next);
    AsyncStorage.setItem(EXPANDED_GROUP_KEY, next).catch(() => { /* ignore */ });
  };

  const updateProfile = (updates: Partial<{ name: string; avatarUri: string | null }>) => {
    setProfileStore(updates);
    setProfileState(getProfile());
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
    const updates: Partial<typeof prefs> = { selectedSubcategories: updated };
    if (value === 'schmuck' && !updated.includes('schmuck')) updates.selectedJewelryTypes = [];
    if (value === 'bekleidung' && !updated.includes('bekleidung')) updates.selectedApparelTypes = [];
    if (value === 'schuhe' && !updated.includes('schuhe')) updates.selectedShoeTypes = [];
    setPreferences(updates);
    setPrefs(getPreferences());
  };

  const toggleJewelryType = (value: JewelryTypeValue) => {
    const curr = prefs.selectedJewelryTypes;
    const updated = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value];
    setPreferences({ selectedJewelryTypes: updated });
    setPrefs(getPreferences());
  };

  const toggleApparelType = (value: ApparelTypeValue) => {
    const curr = prefs.selectedApparelTypes;
    const updated = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value];
    setPreferences({ selectedApparelTypes: updated });
    setPrefs(getPreferences());
  };

  const toggleShoeType = (value: ShoeTypeValue) => {
    const curr = prefs.selectedShoeTypes;
    const updated = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value];
    setPreferences({ selectedShoeTypes: updated });
    setPrefs(getPreferences());
  };

  const toggleKidsSubGender = (value: KidsSubGenderValue) => {
    const curr = prefs.selectedKidsSubGenders;
    const updated = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value];
    setPreferences({ selectedKidsSubGenders: updated });
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

  const toggleTrendGender = (value: GenderValue) => {
    if (value !== 'damen' && value !== 'herren') return;
    const curr = prefs.trendGenders;
    const updated = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value];
    setPreferences({ trendGenders: updated });
    setPrefs(getPreferences());
  };

  const updateTrendPriceRange = (value: PriceRangeType) => {
    setPreferences({ trendPriceRange: value });
    setPrefs(getPreferences());
  };

  const toggleTrendId = (id: string) => {
    const curr = prefs.followedTrendIds;
    const updated = curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id];
    setPreferences({ followedTrendIds: updated });
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

  // Trends nachladen für die Trend-Sektion (Karten zum Toggeln).
  const [availableTrends, setAvailableTrends] = useState<Trend[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  // 2026-05-16 (Punkt 1): Brand-Liste dynamisch aus /api/brands ziehen,
  // damit die Toggle-Liste automatisch synchron mit ACTIVE_SCRAPERS im Backend
  // bleibt. Default = hardcoded BRAND_PARTNERS (label als name, count 0) —
  // so funktioniert die UI auch bei Offline / Backend-Fehler / Cold-Start.
  const [availableBrands, setAvailableBrands] = useState<BrandInfo[]>(() =>
    BRAND_PARTNERS.map((p) => ({ name: p.label, count: 0 }))
  );

  useEffect(() => {
    fetchBrands()
      .then((brands) => {
        if (brands.length > 0) setAvailableBrands(brands);
      })
      .catch((e: unknown) => {
        console.warn('[Profile] Brands laden fehlgeschlagen — Fallback auf hardcoded Liste', e);
      });
  }, []);

  useEffect(() => {
    setTrendsLoading(true);
    fetchActiveTrends()
      .then((data) => {
        setAvailableTrends(data.filter((t) => t.active).sort((a, b) => a.sortOrder - b.sortOrder));
        setTrendsError(null);
      })
      .catch((e: unknown) => {
        console.warn('[Profile] Trends laden fehlgeschlagen', e);
        setTrendsError('Trends gerade nicht erreichbar.');
      })
      .finally(() => setTrendsLoading(false));
  }, []);

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

  // Bug A (2026-05-14): Sub-Listen erscheinen NUR wenn die jeweilige
  // Warengruppe explizit in selectedSubcategories steht. Leere Liste = KEIN
  // Sub-Block.
  const showJewelryTypes = prefs.selectedSubcategories.includes('schmuck');
  const showApparelTypes = prefs.selectedSubcategories.includes('bekleidung');
  const showShoeTypes = prefs.selectedSubcategories.includes('schuhe');
  const showKidsSubGenders = prefs.selectedGenders.includes('kids');
  const displayName = profile.name.trim() || 'Du';

  // Nur ♂/♀ als Trend-Gender, Unisex/Kids ausgeblendet (Briefing 2026-05-14).
  const TREND_GENDERS = GENDERS.filter((g) => g.value === 'damen' || g.value === 'herren');

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

        {/* Bug J: Akkordeon-Pills steuern, welche Setting-Gruppe expanded ist. */}
        <GroupTogglePills current={expandedGroup} onChange={changeExpandedGroup} />

        {/* ───────── Feed-Einstellungen ───────── */}
        {expandedGroup === 'feed' && <>

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
          {showKidsSubGenders && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionLabel}>Kids verfeinern</Text>
              <View style={styles.chips}>
                {KIDS_SUBGENDERS.map((k) => (
                  <SettingChip
                    key={k.value}
                    label={k.label}
                    selected={prefs.selectedKidsSubGenders.includes(k.value)}
                    onPress={() => toggleKidsSubGender(k.value)}
                  />
                ))}
              </View>
            </View>
          )}
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
          {/* Sub-Listen direkt unter den Hauptchips (Bug A). Bekleidung zuerst, dann Schuhe, dann Schmuck. */}
          {showApparelTypes && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionLabel}>Bekleidungs-Arten</Text>
              <View style={styles.chips}>
                {/* 2026-05-16 (Punkt 6): Damen-only-Kategorien (Kleider, Röcke)
                    nur wenn Damen ausgewählt ist, Herren-only (Westen) nur wenn
                    Herren ausgewählt. Keine Gender-Auswahl → alles zeigen. */}
                {filterApparelByGenders(prefs.selectedGenders).map((a) => (
                  <SettingChip
                    key={a.value}
                    label={a.label}
                    selected={prefs.selectedApparelTypes.includes(a.value)}
                    onPress={() => toggleApparelType(a.value)}
                  />
                ))}
              </View>
            </View>
          )}
          {showShoeTypes && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionLabel}>Schuh-Typen</Text>
              <View style={styles.chips}>
                {SHOE_TYPES.map((s) => (
                  <SettingChip
                    key={s.value}
                    label={s.label}
                    selected={prefs.selectedShoeTypes.includes(s.value)}
                    onPress={() => toggleShoeType(s.value)}
                  />
                ))}
              </View>
            </View>
          )}
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

        <Section title="Stilrichtungen">
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
          {availableBrands.map((brand) => {
            const isEnabled = !prefs.disabledBrands.includes(brand.name);
            const label = brand.count > 0 ? `${brand.name} (${brand.count})` : brand.name;
            return (
              <View key={brand.name} style={styles.brandRow}>
                <Text style={styles.brandLabel}>{label}</Text>
                <Switch
                  value={isEnabled}
                  onValueChange={(enabled) => {
                    const updated = enabled
                      ? prefs.disabledBrands.filter((b) => b !== brand.name)
                      : [...prefs.disabledBrands, brand.name];
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

        </>}

        {/* ───────── Trend-Einstellungen ───────── */}
        {expandedGroup === 'trend' && <>

        <Section title="Wer trägt's?">
          <View style={styles.chips}>
            {TREND_GENDERS.map((g) => (
              <SettingChip
                key={g.value}
                label={g.label}
                selected={prefs.trendGenders.includes(g.value)}
                onPress={() => toggleTrendGender(g.value)}
              />
            ))}
          </View>
          <Text style={styles.subHint}>Unisex automatisch mit, Kids nicht im Trends-Pfad.</Text>
        </Section>

        <Section title="Gefolgte Trends">
          {trendsLoading && (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator color={colors.sand} />
            </View>
          )}
          {trendsError && !trendsLoading && (
            <Text style={styles.subHint}>{trendsError}</Text>
          )}
          {!trendsLoading && !trendsError && availableTrends.length === 0 && (
            <Text style={styles.subHint}>
              Diese Woche stellen wir gerade zusammen — der erste Trend kommt bald.
            </Text>
          )}
          {!trendsLoading && !trendsError && availableTrends.length > 0 && (
            <View style={styles.trendCards}>
              {availableTrends.map((t) => {
                const followed = prefs.followedTrendIds.includes(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.trendCard, followed && styles.trendCardActive]}
                    onPress={() => toggleTrendId(t.id)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: t.heroImage }} style={styles.trendCardImage} />
                    <View style={styles.trendCardOverlay} />
                    <View style={styles.trendCardText}>
                      <Text style={styles.trendCardTitle}>{t.title}</Text>
                    </View>
                    {followed && (
                      <View style={styles.trendCardBadge}>
                        <Text style={styles.trendCardBadgeText}>folgst du</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Section>

        <Section title="Preisrahmen">
          <View style={styles.chips}>
            {priceOptions.map((o) => (
              <SettingChip
                key={o.value}
                label={o.label}
                selected={prefs.trendPriceRange === o.value}
                onPress={() => updateTrendPriceRange(o.value)}
              />
            ))}
          </View>
        </Section>

        </>}

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

        <Text style={styles.version}>Ondeya · Beta · v0.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noir },
  header: { paddingTop: 16, paddingHorizontal: 24, paddingBottom: 8 },
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

  // Bug J: Akkordeon-Pills oben über den Setting-Gruppen.
  groupPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  groupPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.taupe,
    alignItems: 'center',
    backgroundColor: 'rgba(26,23,20,0.35)',
  },
  groupPillActive: {
    backgroundColor: colors.sand,
    borderColor: colors.sand,
  },
  groupPillLabel: {
    color: colors.taupe,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  groupPillLabelActive: {
    color: colors.noir,
    fontWeight: '700',
  },

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
  subHint: { color: colors.taupe, fontSize: 13, lineHeight: 18 },
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

  trendCards: { gap: 10 },
  trendCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.noir,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trendCardActive: { borderColor: colors.forest },
  trendCardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  trendCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,23,20,0.32)',
  },
  trendCardText: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
  },
  trendCardTitle: { color: colors.linen, fontSize: 18, fontWeight: '700' },
  trendCardBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.forest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  trendCardBadgeText: { color: colors.linen, fontSize: 11, fontWeight: '700' },

  infoBox: {
    backgroundColor: colors.espresso,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginTop: 24,
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
