import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  completeOnboarding,
  type GenderType,
  type StyleV2Type,
  type CategoryV2Type,
  type PriceRangeType,
  type QuizPathType,
} from '../../store/preferences-store';
import { SHOE_TYPES, type ShoeTypeValue } from '../../constants/categories';
import { fetchActiveTrends, type Trend } from '../../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const colors = {
  noir: '#1a1714',
  espresso: '#3d3630',
  taupe: '#8a7f72',
  sand: '#c9a882',
  linen: '#e8ddd0',
  creme: '#f5f0ea',
  forest: '#2e4a3e',
};

// --- Step- und Answers-Typen ---

type StepId = 'q1' | 'q2' | 'q3' | 'q4' | 'q5';

type Answers = {
  genders: GenderType[];
  followedTrendIds: string[];
  categoriesV2: CategoryV2Type[];
  stylesV2: StyleV2Type[];
  shoeTypes: ShoeTypeValue[];
  priceRange: PriceRangeType | null;
};

function emptyAnswers(): Answers {
  return {
    genders: [],
    followedTrendIds: [],
    categoriesV2: [],
    stylesV2: [],
    shoeTypes: [],
    priceRange: null,
  };
}

// Optionen-Konstanten
const GENDER_OPTIONS: { label: string; value: GenderType }[] = [
  { label: 'Damen', value: 'damen' },
  { label: 'Herren', value: 'herren' },
  { label: 'Unisex', value: 'unisex' },
];

const CATEGORY_OPTIONS: { label: string; value: CategoryV2Type }[] = [
  { label: 'Bekleidung', value: 'bekleidung' },
  { label: 'Unterwäsche & Loungewear', value: 'unterwaesche' },
  { label: 'Schuhe', value: 'schuhe' },
  { label: 'Schmuck', value: 'schmuck' },
  { label: 'Alles ist okay', value: 'alle' },
];

const STYLE_OPTIONS: { label: string; value: StyleV2Type }[] = [
  { label: 'Casual', value: 'casual' },
  { label: 'Elegant', value: 'elegant' },
  { label: 'Party', value: 'party' },
  { label: 'Streetwear', value: 'streetwear' },
  { label: 'Minimalistisch', value: 'minimalistisch' },
  { label: 'Vintage', value: 'vintage' },
  { label: 'Sportlich', value: 'sportlich' },
];

const PRICE_OPTIONS: { label: string; value: PriceRangeType }[] = [
  { label: 'Bis 50 €', value: 'bis50' },
  { label: '50 – 150 €', value: '50bis150' },
  { label: '150 – 300 €', value: '150bis300' },
  { label: 'Über 300 €', value: 'ueber300' },
  { label: 'Egal — guter Stil > Preis', value: 'egal' },
];

// Q4-B ist sichtbar, wenn Bekleidung, Schuhe oder Alle in Q3-B gewählt sind.
function needsQ4(categoriesV2: CategoryV2Type[]): boolean {
  return (
    categoriesV2.includes('bekleidung') ||
    categoriesV2.includes('schuhe') ||
    categoriesV2.includes('alle')
  );
}

function showApparelBlock(categoriesV2: CategoryV2Type[]): boolean {
  return categoriesV2.includes('bekleidung') || categoriesV2.includes('alle');
}

function showShoeBlock(categoriesV2: CategoryV2Type[]): boolean {
  return categoriesV2.includes('schuhe') || categoriesV2.includes('alle');
}

// Trends auf Q2-A-Gender filtern. unisex ist immer kompatibel.
function filterTrendsByGender(trends: Trend[], genders: GenderType[]): Trend[] {
  if (genders.length === 0) return trends;
  return trends.filter((t) => t.gender === 'unisex' || genders.includes(t.gender as GenderType));
}

// --- Komponente ---

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<StepId>('q1');
  const [path, setPath] = useState<QuizPathType | null>(null);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers());
  const [trends, setTrends] = useState<Trend[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Schritt-Reihenfolge je Pfad. Q4 nur im Manuell-Pfad, nur wenn nötig.
  const stepsForPath = (): StepId[] => {
    if (path === 'trends') return ['q1', 'q2', 'q3', 'q5'];
    if (path === 'manuell') {
      return needsQ4(answers.categoriesV2)
        ? ['q1', 'q2', 'q3', 'q4', 'q5']
        : ['q1', 'q2', 'q3', 'q5'];
    }
    return ['q1'];
  };

  const steps = stepsForPath();
  const currentIndex = steps.indexOf(step);
  const isLast = step === 'q5';

  const animate = (direction: 'forward' | 'back', callback: () => void) => {
    const outTo = direction === 'forward' ? -30 : 30;
    const inFrom = direction === 'forward' ? 30 : -30;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: outTo, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(inFrom);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  // Trends nachladen, sobald wir Q3 im Trends-Pfad betreten.
  useEffect(() => {
    if (step === 'q3' && path === 'trends' && trends.length === 0 && !trendsLoading && !trendsError) {
      setTrendsLoading(true);
      fetchActiveTrends()
        .then((data) => {
          setTrends(data.filter((t) => t.active).sort((a, b) => a.sortOrder - b.sortOrder));
          setTrendsLoading(false);
        })
        .catch((e: unknown) => {
          console.warn('[Onboarding] Trends laden fehlgeschlagen', e);
          setTrendsError('Trends konnten nicht geladen werden.');
          setTrendsLoading(false);
        });
    }
  }, [step, path, trends.length, trendsLoading, trendsError]);

  const handlePickPath = (chosen: QuizPathType) => {
    setPath(chosen);
    animate('forward', () => setStep('q2'));
  };

  const toggleGender = (v: GenderType) => {
    setAnswers((prev) => ({
      ...prev,
      genders: prev.genders.includes(v) ? prev.genders.filter((x) => x !== v) : [...prev.genders, v],
    }));
  };

  const toggleTrend = (id: string) => {
    setAnswers((prev) => ({
      ...prev,
      followedTrendIds: prev.followedTrendIds.includes(id)
        ? prev.followedTrendIds.filter((x) => x !== id)
        : [...prev.followedTrendIds, id],
    }));
  };

  const toggleCategory = (v: CategoryV2Type) => {
    setAnswers((prev) => {
      const cur = prev.categoriesV2;
      if (v === 'alle') {
        return { ...prev, categoriesV2: cur.includes('alle') ? [] : ['alle'] };
      }
      const without_alle = cur.filter((x) => x !== 'alle');
      return {
        ...prev,
        categoriesV2: without_alle.includes(v)
          ? without_alle.filter((x) => x !== v)
          : [...without_alle, v],
      };
    });
  };

  const toggleStyle = (v: StyleV2Type) => {
    setAnswers((prev) => {
      const cur = prev.stylesV2;
      if (cur.includes(v)) return { ...prev, stylesV2: cur.filter((x) => x !== v) };
      if (cur.length >= 3) return prev; // max 3
      return { ...prev, stylesV2: [...cur, v] };
    });
  };

  const toggleShoeType = (v: ShoeTypeValue) => {
    setAnswers((prev) => ({
      ...prev,
      shoeTypes: prev.shoeTypes.includes(v)
        ? prev.shoeTypes.filter((x) => x !== v)
        : [...prev.shoeTypes, v],
    }));
  };

  const setPrice = (v: PriceRangeType) => {
    setAnswers((prev) => ({ ...prev, priceRange: v }));
  };

  const canProceed = (): boolean => {
    if (step === 'q1') return path !== null;
    if (step === 'q2') return answers.genders.length > 0;
    if (step === 'q3') {
      if (path === 'trends') return answers.followedTrendIds.length > 0;
      return answers.categoriesV2.length > 0;
    }
    if (step === 'q4') {
      const apparelOk = !showApparelBlock(answers.categoriesV2) || answers.stylesV2.length > 0;
      const shoeOk = !showShoeBlock(answers.categoriesV2) || answers.shoeTypes.length > 0;
      return apparelOk && shoeOk;
    }
    if (step === 'q5') return answers.priceRange !== null;
    return false;
  };

  const goNext = () => {
    animate('forward', () => {
      if (isLast) {
        if (!path || !answers.priceRange) return;
        completeOnboarding({
          quizPath: path,
          genders: answers.genders,
          followedTrendIds: path === 'trends' ? answers.followedTrendIds : undefined,
          categoriesV2: path === 'manuell' ? answers.categoriesV2 : undefined,
          stylesV2: path === 'manuell' && showApparelBlock(answers.categoriesV2) ? answers.stylesV2 : undefined,
          shoeTypes: path === 'manuell' && showShoeBlock(answers.categoriesV2) ? answers.shoeTypes : undefined,
          priceRange: answers.priceRange,
        });
        onComplete();
        return;
      }
      const next = steps[currentIndex + 1];
      if (next) setStep(next);
    });
  };

  const goBack = () => {
    if (step === 'q1') return;
    animate('back', () => {
      if (step === 'q2') {
        setPath(null);
        setAnswers(emptyAnswers());
        setStep('q1');
        return;
      }
      const prev = steps[currentIndex - 1];
      if (prev) setStep(prev);
    });
  };

  // --- Renderer pro Step ---

  if (step === 'q1') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.logo}>ONDEYA</Text>
        <View style={styles.q1Container}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.q1Tile, styles.q1TileTop]}
            onPress={() => handlePickPath('trends')}
          >
            <LinearGradient
              colors={[colors.forest, '#1f3329']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.q1Accent} />
            <View style={styles.q1TileContent}>
              <Text style={styles.q1TileTitle}>Suche nach{'\n'}aktuellen Trends</Text>
              <Text style={styles.q1TileSub}>Diese Woche kuratiert — los geht&apos;s</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.q1Tile, styles.q1TileBottom]}
            onPress={() => handlePickPath('manuell')}
          >
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.espresso }]} />
            <View style={styles.q1TileContent}>
              <Text style={styles.q1TileTitle}>Lass mich{'\n'}manuell filtern</Text>
              <Text style={styles.q1TileSub}>Nach Stil, Warengruppe, Preis</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress + Back */}
      <View style={styles.progressContainer}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          {steps.slice(1).map((s, i) => {
            const idxInVisible = i;
            const currentVisibleIndex = currentIndex - 1;
            return (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  idxInVisible < currentVisibleIndex && styles.progressDotDone,
                  idxInVisible === currentVisibleIndex && styles.progressDotCurrent,
                ]}
              />
            );
          })}
        </View>
      </View>

      <Text style={styles.logo}>ONDEYA</Text>

      <Animated.View
        style={[
          styles.questionContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {step === 'q2' && (
          <QuestionGenders genders={answers.genders} onToggle={toggleGender} />
        )}
        {step === 'q3' && path === 'trends' && (
          <QuestionTrendsA
            trends={filterTrendsByGender(trends, answers.genders)}
            selected={answers.followedTrendIds}
            onToggle={toggleTrend}
            loading={trendsLoading}
            error={trendsError}
            onBackToQ1={() => {
              setPath(null);
              setAnswers(emptyAnswers());
              setStep('q1');
            }}
          />
        )}
        {step === 'q3' && path === 'manuell' && (
          <QuestionCategoriesB categories={answers.categoriesV2} onToggle={toggleCategory} />
        )}
        {step === 'q4' && (
          <QuestionSubtypesB
            categories={answers.categoriesV2}
            stylesV2={answers.stylesV2}
            shoeTypes={answers.shoeTypes}
            onToggleStyle={toggleStyle}
            onToggleShoeType={toggleShoeType}
          />
        )}
        {step === 'q5' && (
          <QuestionPrice price={answers.priceRange} onSelect={setPrice} />
        )}
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={goNext}
          disabled={!canProceed()}
        >
          <Text style={[styles.nextButtonText, !canProceed() && styles.nextButtonTextDisabled]}>
            {isLast ? 'Los geht\'s' : 'Weiter'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Sub-Komponenten je Frage ---

function OptionRow({
  label,
  selected,
  disabled,
  onPress,
  sub,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
  sub?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected, disabled && styles.optionDisabled]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.75}
      disabled={disabled}
    >
      <View style={styles.optionLeft}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected, disabled && styles.optionLabelDisabled]}>
          {label}
        </Text>
        {sub ? (
          <Text style={[styles.optionSub, selected && styles.optionSubSelected]}>{sub}</Text>
        ) : null}
      </View>
      <View style={[styles.optionCheck, selected && styles.optionCheckSelected]}>
        {selected && <Text style={styles.checkMark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

function QuestionGenders({ genders, onToggle }: { genders: GenderType[]; onToggle: (v: GenderType) => void }) {
  return (
    <>
      <Text style={styles.questionTitle}>Ich suche für</Text>
      <Text style={styles.questionSubtitle}>Mehrfachauswahl</Text>
      <ScrollView style={styles.optionsScroll} contentContainerStyle={styles.optionsContainer} showsVerticalScrollIndicator={false}>
        {GENDER_OPTIONS.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={genders.includes(o.value)}
            onPress={() => onToggle(o.value)}
          />
        ))}
      </ScrollView>
    </>
  );
}

function QuestionTrendsA({
  trends,
  selected,
  onToggle,
  loading,
  error,
  onBackToQ1,
}: {
  trends: Trend[];
  selected: string[];
  onToggle: (id: string) => void;
  loading: boolean;
  error: string | null;
  onBackToQ1: () => void;
}) {
  if (loading) {
    return (
      <>
        <Text style={styles.questionTitle}>Welche Trends{'\n'}interessieren dich?</Text>
        <View style={styles.trendsLoader}>
          <ActivityIndicator color={colors.sand} />
          <Text style={styles.trendsLoaderText}>Trends werden geladen…</Text>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Text style={styles.questionTitle}>Welche Trends{'\n'}interessieren dich?</Text>
        <View style={styles.emptyTrendCard}>
          <Text style={styles.emptyTrendTitle}>Verbindung weg.</Text>
          <Text style={styles.emptyTrendText}>{error}</Text>
          <TouchableOpacity style={styles.emptyTrendButton} onPress={onBackToQ1}>
            <Text style={styles.emptyTrendButtonText}>Zurück</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  if (trends.length === 0) {
    return (
      <>
        <Text style={styles.questionTitle}>Welche Trends{'\n'}interessieren dich?</Text>
        <View style={styles.emptyTrendCard}>
          <Text style={styles.emptyTrendTitle}>Diese Woche kuratieren wir gerade.</Text>
          <Text style={styles.emptyTrendText}>
            Wähle solange „Lass mich manuell filtern“ — der erste Trend kommt bald.
          </Text>
          <TouchableOpacity style={styles.emptyTrendButton} onPress={onBackToQ1}>
            <Text style={styles.emptyTrendButtonText}>Zurück</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Text style={styles.questionTitle}>Welche Trends{'\n'}interessieren dich?</Text>
      <Text style={styles.questionSubtitle}>
        Mehrfachauswahl — Ondeya zeigt dir deren Stücke prominent
      </Text>
      <ScrollView style={styles.optionsScroll} contentContainerStyle={styles.trendsContainer} showsVerticalScrollIndicator={false}>
        {trends.map((trend) => {
          const isSelected = selected.includes(trend.id);
          return (
            <TouchableOpacity
              key={trend.id}
              style={[styles.trendTile, isSelected && styles.trendTileSelected]}
              activeOpacity={0.85}
              onPress={() => onToggle(trend.id)}
            >
              <Image source={{ uri: trend.heroImage }} style={styles.trendImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(26,23,20,0.92)']}
                style={styles.trendGradient}
              />
              <View style={styles.trendTextBox}>
                <Text style={styles.trendTitle}>{trend.title}</Text>
                {trend.description ? (
                  <Text style={styles.trendDescription} numberOfLines={2}>
                    {trend.description}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.trendCheck, isSelected && styles.trendCheckSelected]}>
                {isSelected && <Text style={styles.checkMark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );
}

function QuestionCategoriesB({
  categories,
  onToggle,
}: {
  categories: CategoryV2Type[];
  onToggle: (v: CategoryV2Type) => void;
}) {
  return (
    <>
      <Text style={styles.questionTitle}>Worauf hast du{'\n'}gerade Lust?</Text>
      <Text style={styles.questionSubtitle}>Mehrfachauswahl</Text>
      <ScrollView style={styles.optionsScroll} contentContainerStyle={styles.optionsContainer} showsVerticalScrollIndicator={false}>
        {CATEGORY_OPTIONS.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={categories.includes(o.value)}
            onPress={() => onToggle(o.value)}
          />
        ))}
      </ScrollView>
    </>
  );
}

function QuestionSubtypesB({
  categories,
  stylesV2,
  shoeTypes,
  onToggleStyle,
  onToggleShoeType,
}: {
  categories: CategoryV2Type[];
  stylesV2: StyleV2Type[];
  shoeTypes: ShoeTypeValue[];
  onToggleStyle: (v: StyleV2Type) => void;
  onToggleShoeType: (v: ShoeTypeValue) => void;
}) {
  const showApparel = showApparelBlock(categories);
  const showShoes = showShoeBlock(categories);

  return (
    <>
      <Text style={styles.questionTitle}>Etwas genauer{'\n'}bitte</Text>
      <Text style={styles.questionSubtitle}>
        {showApparel && showShoes
          ? 'Stil und Schuh-Typ wählen'
          : showApparel
            ? 'Wähle bis zu 3 Stilrichtungen'
            : 'Welche Schuhe interessieren dich?'}
      </Text>

      <ScrollView style={styles.optionsScroll} contentContainerStyle={styles.optionsContainer} showsVerticalScrollIndicator={false}>
        {showApparel && (
          <View style={styles.subBlock}>
            <Text style={styles.subBlockTitle}>Dein Stil</Text>
            <Text style={styles.subBlockHint}>Wähle bis zu 3</Text>
            {STYLE_OPTIONS.map((o) => {
              const selected = stylesV2.includes(o.value);
              const atMax = stylesV2.length >= 3 && !selected;
              return (
                <OptionRow
                  key={o.value}
                  label={o.label}
                  selected={selected}
                  disabled={atMax}
                  onPress={() => onToggleStyle(o.value)}
                />
              );
            })}
          </View>
        )}
        {showShoes && (
          <View style={[styles.subBlock, showApparel && { marginTop: 24 }]}>
            <Text style={styles.subBlockTitle}>Welche Schuhe?</Text>
            <Text style={styles.subBlockHint}>Mehrfachauswahl</Text>
            {SHOE_TYPES.map((s) => (
              <OptionRow
                key={s.value}
                label={s.label}
                selected={shoeTypes.includes(s.value)}
                onPress={() => onToggleShoeType(s.value)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function QuestionPrice({
  price,
  onSelect,
}: {
  price: PriceRangeType | null;
  onSelect: (v: PriceRangeType) => void;
}) {
  return (
    <>
      <Text style={styles.questionTitle}>Preisrahmen{'\n'}pro Stück?</Text>
      <ScrollView style={styles.optionsScroll} contentContainerStyle={styles.optionsContainer} showsVerticalScrollIndicator={false}>
        {PRICE_OPTIONS.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={price === o.value}
            onPress={() => onSelect(o.value)}
          />
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.noir,
    paddingHorizontal: 24,
  },

  // Progressbar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  backButton: { padding: 4 },
  backText: { color: colors.taupe, fontSize: 20 },
  progressBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    flex: 1,
    height: 3,
    backgroundColor: colors.espresso,
    borderRadius: 2,
  },
  progressDotDone: { backgroundColor: colors.taupe },
  progressDotCurrent: { backgroundColor: colors.sand },

  logo: {
    color: colors.sand,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 5,
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 8,
  },

  // Q1
  q1Container: {
    flex: 1,
    gap: 14,
    paddingBottom: 32,
  },
  q1Tile: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 24,
  },
  q1TileTop: {},
  q1TileBottom: {},
  q1Accent: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(201, 168, 130, 0.18)',
  },
  q1TileContent: { gap: 8 },
  q1TileTitle: {
    color: colors.linen,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  q1TileSub: {
    color: 'rgba(232, 221, 208, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },

  // Frage-Container
  questionContainer: {
    flex: 1,
  },
  questionTitle: {
    color: colors.linen,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 8,
  },
  questionSubtitle: {
    color: colors.taupe,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },

  // Options-Liste
  optionsScroll: { flex: 1 },
  optionsContainer: { gap: 10, paddingBottom: 8 },
  option: {
    backgroundColor: colors.espresso,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: colors.sand,
    backgroundColor: 'rgba(201, 168, 130, 0.08)',
  },
  optionDisabled: { opacity: 0.4 },
  optionLeft: { flex: 1, gap: 2 },
  optionLabel: { color: colors.linen, fontSize: 16, fontWeight: '600' },
  optionLabelSelected: { color: colors.sand },
  optionLabelDisabled: { color: colors.taupe },
  optionSub: { color: colors.taupe, fontSize: 12 },
  optionSubSelected: { color: 'rgba(201, 168, 130, 0.7)' },
  optionCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.taupe,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  optionCheckSelected: { backgroundColor: colors.sand, borderColor: colors.sand },
  checkMark: { color: colors.noir, fontSize: 12, fontWeight: '700' },

  // Q3-A Trends
  trendsContainer: { gap: 14, paddingBottom: 8 },
  trendTile: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.espresso,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  trendTileSelected: {
    borderColor: colors.sand,
  },
  trendImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  trendGradient: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '60%',
  },
  trendTextBox: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 60,
    gap: 4,
  },
  trendTitle: {
    color: colors.linen,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  trendDescription: {
    color: 'rgba(232, 221, 208, 0.78)',
    fontSize: 13,
    lineHeight: 18,
  },
  trendCheck: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.linen,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 23, 20, 0.4)',
  },
  trendCheckSelected: { backgroundColor: colors.sand, borderColor: colors.sand },

  trendsLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: SCREEN_HEIGHT * 0.1,
  },
  trendsLoaderText: { color: colors.taupe, fontSize: 14 },

  emptyTrendCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.espresso,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 130, 0.2)',
  },
  emptyTrendTitle: { color: colors.linen, fontSize: 17, fontWeight: '700' },
  emptyTrendText: { color: colors.taupe, fontSize: 14, lineHeight: 20 },
  emptyTrendButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  emptyTrendButtonText: { color: colors.sand, fontSize: 14, fontWeight: '600' },

  // Q4-B Sub-Blöcke
  subBlock: { gap: 10 },
  subBlockTitle: { color: colors.sand, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  subBlockHint: { color: colors.taupe, fontSize: 12, marginBottom: 4 },

  // Footer
  footer: {
    paddingBottom: 32,
    paddingTop: 12,
  },
  nextButton: {
    backgroundColor: colors.sand,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextButtonDisabled: { backgroundColor: colors.espresso },
  nextButtonText: { color: colors.noir, fontSize: 16, fontWeight: '700' },
  nextButtonTextDisabled: { color: colors.taupe },
});
