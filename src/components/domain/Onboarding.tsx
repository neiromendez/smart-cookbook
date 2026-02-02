'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  User,
  AlertTriangle,
  Heart,
  Utensils,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Sparkles,
  MapPin,
  Trophy,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { ChefProfile, DietType } from '@/types';

// ============================================
// TIPOS Y CONSTANTES
// ============================================

interface OnboardingProps {
  onComplete: (profile: ChefProfile) => void;
  onSkip: () => void;
}

type OnboardingStep = 'welcome' | 'biometrics' | 'skills' | 'allergies' | 'conditions' | 'diet' | 'dislikes' | 'complete';

const STEPS: OnboardingStep[] = ['welcome', 'biometrics', 'skills', 'allergies', 'conditions', 'diet', 'dislikes', 'complete'];

// Alergias comunes
const COMMON_ALLERGIES = [
  { id: 'peanuts', emoji: '🥜' },
  { id: 'tree-nuts', emoji: '🌰' },
  { id: 'milk', emoji: '🥛' },
  { id: 'eggs', emoji: '🥚' },
  { id: 'wheat', emoji: '🌾' },
  { id: 'soy', emoji: '🫘' },
  { id: 'fish', emoji: '🐟' },
  { id: 'shellfish', emoji: '🦐' },
  { id: 'sesame', emoji: '🌱' },
];

// Condiciones de salud
const HEALTH_CONDITIONS = [
  { id: 'diabetes', emoji: '💉' },
  { id: 'hypertension', emoji: '❤️‍🩹' },
  { id: 'fatty-liver', emoji: '🫁' },
  { id: 'high-cholesterol', emoji: '🫀' },
  { id: 'celiac', emoji: '🚫🌾' },
  { id: 'lactose-intolerance', emoji: '🥛❌' },
  { id: 'gastritis', emoji: '🔥' },
  { id: 'kidney-disease', emoji: '🫘' },
  { id: 'gout', emoji: '🦶' },
  { id: 'ibs', emoji: '🌀' },
];

// Tipos de dieta
const DIET_TYPES: { id: DietType; emoji: string }[] = [
  { id: 'any', emoji: '🍖🥦' },
  { id: 'omnivore', emoji: '🍽️' },
  { id: 'vegetarian', emoji: '🥗' },
  { id: 'vegan', emoji: '🌱' },
  { id: 'keto', emoji: ' Bacon' },
  { id: 'paleo', emoji: '🦴' },
  { id: 'gluten-free', emoji: '🚫🌾' },
];

// Generos
const GENDERS = [
  { id: 'male' },
  { id: 'female' },
  { id: 'non-binary' },
  { id: 'prefer-not-to-say' },
] as const;

// Niveles de habilidad
const SKILL_LEVELS = [
  { id: 'novice', emoji: '🥚' },
  { id: 'home-cook', emoji: '🍳' },
  { id: 'pro', emoji: '🔪' },
] as const;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [customConditionInput, setCustomConditionInput] = useState('');
  const [profile, setProfile] = useState<ChefProfile>({
    name: '',
    gender: 'prefer-not-to-say',
    allergies: [],
    conditions: [],
    diet: 'any',
    skillLevel: 'home-cook',
    dislikes: [],
  });

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex) / (STEPS.length - 1)) * 100;

  const nextStep = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleAddCustomCondition = () => {
    if (!customConditionInput.trim()) return;
    const condition = customConditionInput.trim();
    if (!profile.conditions.includes(condition)) {
      setProfile({
        ...profile,
        conditions: [...profile.conditions, condition]
      });
    }
    setCustomConditionInput('');
  };

  const prevStep = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleComplete = () => {
    onComplete(profile);
  };

  const handleAddCustomAllergy = () => {
    if (!customAllergyInput.trim()) return;
    const allergy = customAllergyInput.trim();
    if (!profile.allergies.includes(allergy)) {
      setProfile({
        ...profile,
        allergies: [...profile.allergies, allergy]
      });
    }
    setCustomAllergyInput('');
  };

  const [customDislikeInput, setCustomDislikeInput] = useState('');

  const handleAddCustomDislike = () => {
    if (!customDislikeInput.trim()) return;
    const dislike = customDislikeInput.trim();
    if (!profile.dislikes.includes(dislike)) {
      setProfile({
        ...profile,
        dislikes: [...profile.dislikes, dislike]
      });
    }
    setCustomDislikeInput('');
  };

  const removeDislike = (dislike: string) => {
    setProfile({
      ...profile,
      dislikes: profile.dislikes.filter(d => d !== dislike)
    });
  };

  const toggleArrayItem = (array: string[], item: string): string[] => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  // Animacion de transicion
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        {currentStep !== 'welcome' && currentStep !== 'complete' && (
          <div className="h-1 bg-gray-200 dark:bg-gray-700">
            <motion.div
              className="h-full bg-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        <CardContent className="p-6">
          <AnimatePresence mode="wait" custom={1}>
            {/* Step: Welcome */}
            {currentStep === 'welcome' && (
              <motion.div
                key="welcome"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={1}
                transition={{ duration: 0.3 }}
                className="text-center space-y-6"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <ChefHat className="h-10 w-10 text-orange-500" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('onboarding.welcome.title')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('onboarding.welcome.subtitle')}
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>⚠️ {t('onboarding.welcome.important')}:</strong>{' '}
                    {t('onboarding.welcome.privacy')}
                  </p>
                </div>

                <div className="max-w-xs mx-auto mb-8 space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                      {t('onboarding.welcome.nameLabel')}
                    </label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder={t('onboarding.welcome.namePlaceholder')}
                      className="text-center"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {t('onboarding.welcome.locationLabel')}
                    </label>
                    <Input
                      value={profile.location || ''}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      placeholder={t('onboarding.welcome.locationPlaceholder')}
                      className="text-center"
                    />
                    <p className="text-[10px] text-gray-400 text-center italic">
                      {t('onboarding.welcome.locationSubtext')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={nextStep}
                    size="lg"
                    className="w-full"
                    icon={<ArrowRight className="h-4 w-4" />}
                    disabled={!profile.name?.trim()}
                  >
                    {t('onboarding.welcome.start')}
                  </Button>
                  <Button variant="ghost" onClick={onSkip} className="text-gray-500">
                    {t('onboarding.welcome.skip')}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step: Biometrics (opcional) */}
            {currentStep === 'biometrics' && (
              <motion.div
                key="biometrics"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={1}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
                    <User className="h-6 w-6 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('onboarding.biometrics.title')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('onboarding.biometrics.subtitle')}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Edad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('onboarding.biometrics.age')}
                    </label>
                    <Input
                      type="number"
                      placeholder={lang === 'es' ? 'Ej: 30' : 'Ex: 30'}
                      value={profile.age || ''}
                      onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || undefined })}
                      min={1}
                      max={120}
                    />
                  </div>

                  {/* Altura */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('onboarding.biometrics.height')}
                    </label>
                    <Input
                      type="number"
                      placeholder={lang === 'es' ? 'Ej: 170' : 'Ex: 170'}
                      value={profile.height || ''}
                      onChange={(e) => setProfile({ ...profile, height: parseInt(e.target.value) || undefined })}
                      min={50}
                      max={250}
                    />
                  </div>

                  {/* Género */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('onboarding.biometrics.gender')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {GENDERS.map(gender => (
                        <button
                          key={gender.id}
                          onClick={() => setProfile({ ...profile, gender: gender.id })}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                            'border',
                            profile.gender === gender.id
                              ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-300'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-300'
                          )}
                        >
                          {t(`profile.gender.${gender.id}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <NavigationButtons onPrev={prevStep} onNext={nextStep} lang={lang} t={t} />
              </motion.div>
            )}

            {/* Step: Skills */}
            {currentStep === 'skills' && (
              <motion.div
                key="skills"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={1}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-3">
                    <Trophy className="h-6 w-6 text-orange-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('onboarding.skills.title')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('onboarding.skills.subtitle')}
                  </p>
                </div>

                <div className="space-y-3">
                  {SKILL_LEVELS.map(skill => (
                    <button
                      key={skill.id}
                      onClick={() => setProfile({ ...profile, skillLevel: skill.id })}
                      className={cn(
                        'w-full flex items-center p-4 rounded-xl border-2 transition-all text-left group',
                        profile.skillLevel === skill.id
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                          : 'border-gray-100 dark:border-gray-800 hover:border-orange-200'
                      )}
                    >
                      <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">{skill.emoji}</span>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 dark:text-white">{t(`profile.skillLevel.${skill.id}`)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t(`profile.skillLevel.${skill.id}Desc`)}</div>
                      </div>
                      {profile.skillLevel === skill.id && (
                        <Check className="h-5 w-5 text-orange-500" />
                      )}
                    </button>
                  ))}
                </div>

                <NavigationButtons onPrev={prevStep} onNext={nextStep} lang={lang} t={t} />
              </motion.div>
            )}

            {/* Step: Allergies */}
            {currentStep === 'allergies' && (
              <motion.div
                key="allergies"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={1}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mb-3">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('onboarding.allergies.title')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('onboarding.allergies.subtitle')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                  {COMMON_ALLERGIES.map(allergy => {
                    const isSelected = profile.allergies.includes(allergy.id);
                    return (
                      <button
                        key={allergy.id}
                        onClick={() => setProfile({
                          ...profile,
                          allergies: toggleArrayItem(profile.allergies, allergy.id)
                        })}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                          'border',
                          isSelected
                            ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300'
                        )}
                      >
                        <span>{allergy.emoji}</span>
                        <span className="flex-1 text-left">{t(`profile.allergies.items.${allergy.id}`)}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>

                {/* Campo "Otro" */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t('onboarding.allergies.otherLabel')}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={customAllergyInput}
                      onChange={(e) => setCustomAllergyInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomAllergy()}
                      placeholder={t('onboarding.allergies.otherPlaceholder')}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomAllergy}
                      disabled={!customAllergyInput.trim()}
                    >
                      {t('onboarding.allergies.add')}
                    </Button>
                  </div>
                </div>

                {/* Mostrar alergias seleccionadas/añadidas */}
                {profile.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.map(a => {
                      const common = COMMON_ALLERGIES.find(ca => ca.id === a);
                      return (
                        <div
                          key={a}
                          className="flex items-center gap-1.5 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-xs border border-red-200 dark:border-red-800"
                        >
                          <span>{common ? common.emoji : '🛡️'}</span>
                          <span>{common ? t(`profile.allergies.items.${a}`) : a}</span>
                          <button
                            onClick={() => setProfile({
                              ...profile,
                              allergies: profile.allergies.filter(item => item !== a)
                            })}
                            className="hover:text-red-900 dark:hover:text-red-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {profile.allergies.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {t('onboarding.allergies.warning', { count: profile.allergies.length })}
                    </p>
                  </div>
                )}

                <NavigationButtons onPrev={prevStep} onNext={nextStep} lang={lang} t={t} />
              </motion.div>
            )}

            {/* Step: Conditions */}
            {currentStep === 'conditions' && (
              <motion.div
                key="conditions"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={1}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full mb-3">
                    <Heart className="h-6 w-6 text-pink-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('onboarding.conditions.title')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('onboarding.conditions.subtitle')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                  {HEALTH_CONDITIONS.map(condition => {
                    const isSelected = profile.conditions.includes(condition.id);
                    return (
                      <button
                        key={condition.id}
                        onClick={() => setProfile({
                          ...profile,
                          conditions: toggleArrayItem(profile.conditions, condition.id)
                        })}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                          'border',
                          isSelected
                            ? 'bg-pink-100 dark:bg-pink-900/30 border-pink-500 text-pink-700 dark:text-pink-300'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-pink-300'
                        )}
                      >
                        <span>{condition.emoji}</span>
                        <span className="flex-1 text-left">{t(`profile.conditions.${condition.id}`)}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>

                {/* Campo "Otro" para condiciones */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t('onboarding.conditions.otherLabel')}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={customConditionInput}
                      onChange={(e) => setCustomConditionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCondition()}
                      placeholder={t('onboarding.conditions.otherPlaceholder')}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomCondition}
                      disabled={!customConditionInput.trim()}
                    >
                      {t('onboarding.conditions.add')}
                    </Button>
                  </div>
                </div>

                {/* Mostrar condiciones seleccionadas/añadidas */}
                {profile.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.conditions.map(c => {
                      const health = HEALTH_CONDITIONS.find(hc => hc.id === c);
                      return (
                        <div
                          key={c}
                          className="flex items-center gap-1.5 px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-md text-xs border border-pink-200 dark:border-pink-800"
                        >
                          <span>{health ? health.emoji : '⚕️'}</span>
                          <span>{health ? t(`profile.conditions.${c}`) : c}</span>
                          <button
                            onClick={() => setProfile({
                              ...profile,
                              conditions: profile.conditions.filter(item => item !== c)
                            })}
                            className="hover:text-pink-900 dark:hover:text-pink-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>ℹ️ {t('onboarding.welcome.important')}</strong>{' '}
                    {t('onboarding.conditions.note')}
                  </p>
                </div>

                <NavigationButtons onPrev={prevStep} onNext={nextStep} lang={lang} t={t} />
              </motion.div>
            )}

            {/* Step: Diet */}
            {currentStep === 'diet' && (
              <motion.div
                key="diet"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={1}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
                    <Utensils className="h-6 w-6 text-green-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('onboarding.diet.title')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('onboarding.diet.subtitle')}
                  </p>
                </div>

                <div className="space-y-2">
                  {DIET_TYPES.map(diet => {
                    const isSelected = profile.diet === diet.id;
                    return (
                      <button
                        key={diet.id}
                        onClick={() => setProfile({ ...profile, diet: diet.id })}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                          'border',
                          isSelected
                            ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300'
                        )}
                      >
                        <span className="text-2xl">{diet.emoji}</span>
                        <div className="flex-1">
                          <div className={cn(
                            'font-medium',
                            isSelected ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'
                          )}>
                            {t(`profile.diet.${diet.id}`)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t(`profile.diet.${diet.id}Desc`)}
                          </div>
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-green-500" />}
                      </button>
                    );
                  })}
                </div>

                <NavigationButtons onPrev={prevStep} onNext={nextStep} lang={lang} t={t} />
              </motion.div>
            )}

            {/* Step: Dislikes */}
            {currentStep === 'dislikes' && (
              <motion.div
                key="dislikes"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={1}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-3">
                    <span className="text-2xl">👎</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('profile.dislikes.label')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('profile.dislikes.description')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={customDislikeInput}
                      onChange={(e) => setCustomDislikeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomDislike()}
                      placeholder={t('profile.dislikes.placeholder')}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomDislike}
                      disabled={!customDislikeInput.trim()}
                      icon={<Plus className="h-5 w-5" />}
                      aria-label={t('profile.dislikes.add')}
                    />
                  </div>

                  {/* Mostrar dislikes añadidos */}
                  {profile.dislikes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.dislikes.map(d => (
                        <div
                          key={d}
                          className="flex items-center gap-1.5 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-md text-xs border border-orange-200 dark:border-orange-800"
                        >
                          <span>🤢</span>
                          <span>{d}</span>
                          <button
                            onClick={() => removeDislike(d)}
                            className="hover:text-orange-900 dark:hover:text-orange-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      <strong>💡</strong> {lang === 'es'
                        ? 'La IA buscará sustitutos o evitará estos ingredientes en tus recetas.'
                        : 'AI will look for substitutes or avoid these ingredients in your recipes.'}
                    </p>
                  </div>
                </div>

                <NavigationButtons onPrev={prevStep} onNext={nextStep} lang={lang} t={t} nextLabel={lang === 'es' ? 'Finalizar' : 'Finish'} />
              </motion.div>
            )}

            {/* Step: Complete */}
            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={1}
                transition={{ duration: 0.3 }}
                className="text-center space-y-6"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Sparkles className="h-10 w-10 text-green-500" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('onboarding.complete.title')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('onboarding.complete.subtitle')}
                  </p>
                </div>

                {/* Resumen del perfil */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t('onboarding.complete.record')}
                  </h3>

                  <div className="text-sm space-y-2">
                    {/* Nombre */}
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500">👨‍🍳</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {profile.name}
                      </span>
                    </div>

                    {/* Ubicación */}
                    {profile.location && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">📍</span>
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {profile.location}
                        </span>
                      </div>
                    )}

                    {/* Dieta */}
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">🥗</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {t(`profile.diet.${profile.diet}`)}
                      </span>
                    </div>

                    {/* Nivel de Habilidad */}
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">🏆</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {t(`profile.skillLevel.${profile.skillLevel}`)}
                      </span>
                    </div>

                    {/* Alergias */}
                    {profile.allergies.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">⚠️</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {profile.allergies.map(a => {
                            const key = `profile.allergies.items.${a}`;
                            return i18n.exists(key) ? t(key) : a;
                          }).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Condiciones */}
                    {profile.conditions.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-pink-500">❤️</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {profile.conditions.map(c => {
                            const key = `profile.conditions.${c}`;
                            return i18n.exists(key) ? t(key) : c;
                          }).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Dislikes */}
                    {profile.dislikes.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">🚫</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {profile.dislikes.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={handleComplete} size="lg" className="w-full" icon={<ChefHat className="h-4 w-4" />}>
                  {t('onboarding.complete.start')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div >
  );
}

// ============================================
// COMPONENTE AUXILIAR: Botones de Navegacion
// ============================================

interface NavigationButtonsProps {
  onPrev: () => void;
  onNext: () => void;
  lang: 'es' | 'en';
  t: any;
  nextLabel?: string;
}

function NavigationButtons({ onPrev, onNext, lang, t, nextLabel }: NavigationButtonsProps) {
  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={onPrev} className="flex-1" icon={<ArrowLeft className="h-4 w-4" />}>
        {t('onboarding.nav.back')}
      </Button>
      <Button onClick={onNext} className="flex-1">
        {nextLabel || t('onboarding.nav.continue')}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
