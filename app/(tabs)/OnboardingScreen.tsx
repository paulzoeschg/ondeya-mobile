import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { completeOnboarding, type StyleType, type CategoryType, type BudgetType, type DiscountType, type SizeType } from '../../store/preferences-store';
import { ACTIVE_CATEGORIES } from '../../constants/categories';

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

type Answers = {
  style: StyleType | null;
  categories: CategoryType[];
  budget: BudgetType | null;
  minDiscount: DiscountType | null;
  size: SizeType | null;
};

const questions = [
  {
    id: 'style',
    title: 'Was beschreibt\ndeinen Stil?',
    subtitle: 'Ondeya passt sich an dich an.',
    multi: false,
    options: [
      { label: 'Classic & Clean', sub: 'Polo, Chino, Blazer', value: 'classic' },
      { label: 'Casual & Lässig', sub: 'Jeans, Sweatshirt, Sneaker', value: 'casual' },
      { label: 'Sporty & Active', sub: 'Funktional, Komfortabel', value: 'sporty' },
      { label: 'Alles — je nach Stimmung', sub: 'Kein fester Stil', value: 'mix' },
    ],
  },
  {
    id: 'categories',
    title: 'Was interessiert\ndich?',
    subtitle: 'Mehrere möglich.',
    multi: true,
    options: [
      ...ACTIVE_CATEGORIES.map((c) => ({ label: c.label, sub: c.sub ?? '', value: c.value })),
    ],
  },
  {
    id: 'budget',
    title: 'Dein Budget\npro Produkt?',
    subtitle: 'Ondeya zeigt dir passende Deals.',
    multi: false,
    options: [
      { label: 'Unter €50', sub: 'Günstige Finds', value: 'under50' },
      { label: '€50 – €150', sub: 'Gutes Preis-Leistungs-Verhältnis', value: '50to150' },
      { label: '€150 – €300', sub: 'Premium-Bereich', value: '150to300' },
      { label: 'Über €300', sub: 'Luxury Finds', value: 'over300' },
    ],
  },
  {
    id: 'minDiscount',
    title: 'Ab wann lohnt\nein Deal?',
    subtitle: 'Du siehst nur Deals ab diesem Rabatt.',
    multi: false,
    options: [
      { label: 'Ab 20% Rabatt', sub: 'Viele Produkte', value: '20' },
      { label: 'Ab 30% Rabatt', sub: 'Gute Auswahl', value: '30' },
      { label: 'Ab 40% Rabatt', sub: 'Echte Deals', value: '40' },
      { label: 'Ab 50% Rabatt', sub: 'Nur die besten', value: '50' },
    ],
  },
  {
    id: 'size',
    title: 'Welche Größe\nträgst du?',
    subtitle: 'Für Kleidungsempfehlungen.',
    multi: false,
    options: [
      { label: 'XS / S', sub: '', value: 'xs_s' },
      { label: 'M', sub: '', value: 'm' },
      { label: 'L / XL', sub: '', value: 'l_xl' },
      { label: 'XXL +', sub: '', value: 'xxl' },
    ],
  },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    style: null,
    categories: [],
    budget: null,
    minDiscount: null,
    size: null,
  });
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[step];
  const isLast = step === questions.length - 1;

  const getAnswer = (questionId: string) => {
    return (answers as any)[questionId];
  };

  const isSelected = (questionId: string, value: string) => {
    const answer = getAnswer(questionId);
    if (Array.isArray(answer)) return answer.includes(value);
    return answer === value;
  };

  const canProceed = () => {
    const answer = getAnswer(currentQuestion.id);
    if (currentQuestion.multi) return Array.isArray(answer) && answer.length > 0;
    return answer !== null && answer !== undefined;
  };

  const handleSelect = (value: string) => {
    if (currentQuestion.multi) {
      const current = (answers as any)[currentQuestion.id] as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [currentQuestion.id]: updated });
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: value });
    }
  };

  const goNext = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      if (isLast) {
        completeOnboarding(answers);
        onComplete();
      } else {
        setStep((s) => s + 1);
        slideAnim.setValue(30);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start();
      }
    });
  };

  const goBack = () => {
    if (step === 0) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep((s) => s - 1);
      slideAnim.setValue(-30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

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
                i <= step && styles.progressDotActive,
                i === step && styles.progressDotCurrent,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Logo */}
      <Text style={styles.logo}>ONDEYA</Text>

      {/* Question */}
      <Animated.View
        style={[
          styles.questionContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.stepLabel}>{step + 1} / {questions.length}</Text>
        <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
        {currentQuestion.subtitle && (
          <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>
        )}

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option) => {
            const selected = isSelected(currentQuestion.id, option.value);
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => handleSelect(option.value)}
                activeOpacity={0.75}
              >
                <View style={styles.optionLeft}>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
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
        </View>
      </Animated.View>

      {/* Weiter-Button */}
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
  backButton: {
    padding: 4,
  },
  backText: {
    color: colors.taupe,
    fontSize: 20,
  },
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
  progressDotActive: {
    backgroundColor: colors.taupe,
  },
  progressDotCurrent: {
    backgroundColor: colors.sand,
  },
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
    marginBottom: 28,
  },
  optionsContainer: {
    gap: 10,
  },
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
  optionLeft: { flex: 1, gap: 2 },
  optionLabel: {
    color: colors.linen,
    fontSize: 16,
    fontWeight: '600',
  },
  optionLabelSelected: { color: colors.sand },
  optionSub: {
    color: colors.taupe,
    fontSize: 12,
  },
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
  optionCheckSelected: {
    backgroundColor: colors.sand,
    borderColor: colors.sand,
  },
  checkMark: { color: colors.noir, fontSize: 12, fontWeight: '700' },
  footer: {
    paddingBottom: 32,
    paddingTop: 16,
  },
  nextButton: {
    backgroundColor: colors.sand,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.espresso,
  },
  nextButtonText: {
    color: colors.noir,
    fontSize: 16,
    fontWeight: '700',
  },
  nextButtonTextDisabled: {
    color: colors.taupe,
  },
});
