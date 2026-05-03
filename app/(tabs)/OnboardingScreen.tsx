import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {
  completeOnboarding,
  type GenderType,
  type StyleV2Type,
  type CategoryV2Type,
  type PriceRangeType,
  type DiscoveryAffinityType,
} from '../../store/preferences-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const colors = {
  noir: '#1a1714',
  espresso: '#3d3630',
  taupe: '#8a7f72',
  sand: '#c9a882',
  linen: '#e8ddd0',
  creme: '#f5f0ea',
  forest: '#2e4a3e',
};

// --- Typen ---

type AnswersV2 = {
  genders: GenderType[];
  stylesV2: StyleV2Type[];
  categoriesV2: CategoryV2Type[];
  priceRange: PriceRangeType | null;
  discoveryAffinity: DiscoveryAffinityType | null;
};

type QuestionConfig =
  | {
      id: 'genders';
      title: string;
      subtitle: string;
      multi: true;
      maxSelect?: number;
      skippable?: false;
      options: { label: string; value: GenderType }[];
    }
  | {
      id: 'stylesV2';
      title: string;
      subtitle: string;
      multi: true;
      maxSelect: 3;
      skippable?: false;
      options: { label: string; value: StyleV2Type }[];
    }
  | {
      id: 'categoriesV2';
      title: string;
      subtitle: string;
      multi: true;
      maxSelect?: number;
      skippable?: false;
      options: { label: string; value: CategoryV2Type }[];
    }
  | {
      id: 'priceRange';
      title: string;
      subtitle: string;
      multi: false;
      skippable?: false;
      options: { label: string; sub?: string; value: PriceRangeType }[];
    }
  | {
      id: 'discoveryAffinity';
      title: string;
      subtitle: string;
      multi: false;
      skippable: true;
      options: { label: string; sub?: string; value: DiscoveryAffinityType }[];
    };

// --- Fragen-Definitionen (exakt nach CLAUDE.md Spec) ---

const questions: QuestionConfig[] = [
  {
    id: 'genders',
    title: 'Wer trägt\'s?',
    subtitle: 'Mehrere möglich.',
    multi: true,
    options: [
      { label: 'Damen', value: 'damen' },
      { label: 'Herren', value: 'herren' },
      { label: 'Unisex', value: 'unisex' },
    ],
  },
  {
    id: 'stylesV2',
    title: 'Dein Stil —\nwähle bis zu drei.',
    subtitle: 'Ondeya lernt, was zu dir passt.',
    multi: true,
    maxSelect: 3,
    options: [
      { label: 'Casual', value: 'casual' },
      { label: 'Elegant', value: 'elegant' },
      { label: 'Party', value: 'party' },
      { label: 'Streetwear', value: 'streetwear' },
      { label: 'Minimalistisch', value: 'minimalistisch' },
      { label: 'Vintage', value: 'vintage' },
      { label: 'Sportlich', value: 'sportlich' },
    ],
  },
  {
    id: 'categoriesV2',
    title: 'Worauf hast du\ngerade Lust?',
    subtitle: 'Mehrere möglich.',
    multi: true,
    options: [
      { label: 'Kleidung', value: 'kleidung' },
      { label: 'Schuhe', value: 'schuhe' },
      { label: 'Schmuck', value: 'schmuck' },
      { label: 'Alles ist okay', value: 'alle' },
    ],
  },
  {
    id: 'priceRange',
    title: 'Preisrahmen\npro Stück?',
    subtitle: 'Ondeya zeigt dir passende Stücke.',
    multi: false,
    options: [
      { label: 'Bis 50 €', value: 'bis50' },
      { label: '50 – 150 €', value: '50bis150' },
      { label: '150 – 300 €', value: '150bis300' },
      { label: 'Über 300 €', value: 'ueber300' },
      { label: 'Egal — guter Stil > Preis', value: 'egal' },
    ],
  },
  {
    id: 'discoveryAffinity',
    title: 'Wie experimentier-\nfreudig bist du?',
    subtitle: 'Ondeya zeigt dir gerne Marken, die du noch nicht kennst. Wieviel davon willst du?',
    multi: false,
    skippable: true,
    options: [
      { label: 'Lieber bekannte Marken', value: 0 },
      { label: 'Mix aus beidem', value: 1 },
      { label: 'Zeig mir, was ich noch nicht kenne', value: 2 },
    ],
  },
];

// --- Helpers ---

function getInitialAnswers(): AnswersV2 {
  return {
    genders: [],
    stylesV2: [],
    categoriesV2: [],
    priceRange: null,
    discoveryAffinity: null,
  };
}

function isMultiAnswer(id: string): id is 'genders' | 'stylesV2' | 'categoriesV2' {
  return ['genders', 'stylesV2', 'categoriesV2'].includes(id);
}

// --- Komponente ---

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswersV2>(getInitialAnswers());
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const q = questions[step];
  const isLast = step === questions.length - 1;

  const getMultiAnswer = (id: 'genders' | 'stylesV2' | 'categoriesV2'): string[] =>
    answers[id] as string[];

  const canProceed = (): boolean => {
    if (q.id === 'genders') return answers.genders.length > 0;
    if (q.id === 'stylesV2') return answers.stylesV2.length > 0;
    if (q.id === 'categoriesV2') return answers.categoriesV2.length > 0;
    if (q.id === 'priceRange') return answers.priceRange !== null;
    if (q.id === 'discoveryAffinity') return answers.discoveryAffinity !== null;
    return false;
  };

  const isSelected = (value: string | number): boolean => {
    if (isMultiAnswer(q.id)) {
      return (getMultiAnswer(q.id) as (string | number)[]).includes(value);
    }
    return (answers as any)[q.id] === value;
  };

  const handleSelect = (value: string | number) => {
    if (q.id === 'genders') {
      const v = value as GenderType;
      const cur = answers.genders;
      setAnswers({ ...answers, genders: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });

    } else if (q.id === 'stylesV2') {
      const v = value as StyleV2Type;
      const cur = answers.stylesV2;
      const maxSelect = (q as { maxSelect?: number }).maxSelect ?? 999;
      if (cur.includes(v)) {
        setAnswers({ ...answers, stylesV2: cur.filter((x) => x !== v) });
      } else if (cur.length < maxSelect) {
        setAnswers({ ...answers, stylesV2: [...cur, v] });
      }

    } else if (q.id === 'categoriesV2') {
      const v = value as CategoryV2Type;
      const cur = answers.categoriesV2;
      if (v === 'alle') {
        // "Alles ist okay" deselektiert alle anderen und togglet sich selbst
        setAnswers({ ...answers, categoriesV2: cur.includes('alle') ? [] : ['alle'] });
      } else {
        // spezifische Auswahl entfernt 'alle' automatisch
        const without_alle = cur.filter((x) => x !== 'alle');
        setAnswers({
          ...answers,
          categoriesV2: without_alle.includes(v)
            ? without_alle.filter((x) => x !== v)
            : [...without_alle, v],
        });
      }

    } else if (q.id === 'priceRange') {
      setAnswers({ ...answers, priceRange: value as PriceRangeType });

    } else if (q.id === 'discoveryAffinity') {
      setAnswers({ ...answers, discoveryAffinity: value as DiscoveryAffinityType });
    }
  };

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

  const goNext = () => {
    animate('forward', () => {
      if (isLast) {
        completeOnboarding(answers);
        onComplete();
      } else {
        setStep((s) => s + 1);
      }
    });
  };

  const skipQuestion = () => {
    animate('forward', () => {
      if (isLast) {
        completeOnboarding(answers);
        onComplete();
      } else {
        setStep((s) => s + 1);
      }
    });
  };

  const goBack = () => {
    if (step === 0) return;
    animate('back', () => setStep((s) => s - 1));
  };

  const maxSelectLabel = q.id === 'stylesV2' ? ' — wähle bis zu 3' : q.multi ? ' — wähle mehrere' : '';

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {step > 0 && (
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.progressBar}>
          {questions.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < step && styles.progressDotDone,
                i === step && styles.progressDotCurrent,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Logo */}
      <Text style={styles.logo}>ONDEYA</Text>

      {/* Frage */}
      <Animated.View
        style={[
          styles.questionContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.stepLabel}>{step + 1} / {questions.length}{maxSelectLabel}</Text>
        <Text style={styles.questionTitle}>{q.title}</Text>
        {q.subtitle && <Text style={styles.questionSubtitle}>{q.subtitle}</Text>}

        <ScrollView
          style={styles.optionsScroll}
          contentContainerStyle={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {(q.options as { label: string; sub?: string; value: string | number }[]).map((option) => {
            const selected = isSelected(option.value);
            const atMax =
              q.id === 'stylesV2' &&
              answers.stylesV2.length >= 3 &&
              !selected;

            return (
              <TouchableOpacity
                key={String(option.value)}
                style={[
                  styles.option,
                  selected && styles.optionSelected,
                  atMax && styles.optionDisabled,
                ]}
                onPress={() => handleSelect(option.value)}
                activeOpacity={atMax ? 1 : 0.75}
              >
                <View style={styles.optionLeft}>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected, atMax && styles.optionLabelDisabled]}>
                    {option.label}
                  </Text>
                  {option.sub ? (
                    <Text style={[styles.optionSub, selected && styles.optionSubSelected]}>
                      {option.sub}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.optionCheck, selected && styles.optionCheckSelected]}>
                  {selected && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        {q.skippable && (
          <TouchableOpacity onPress={skipQuestion} style={styles.skipButton}>
            <Text style={styles.skipText}>Überspringen</Text>
          </TouchableOpacity>
        )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.noir,
    paddingHorizontal: 24,
  },
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
  questionContainer: {
    flex: 1,
  },
  stepLabel: {
    color: colors.taupe,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
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
  footer: {
    paddingBottom: 32,
    paddingTop: 12,
    gap: 10,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: colors.taupe,
    fontSize: 14,
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
