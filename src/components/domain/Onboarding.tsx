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
  { id: 'peanuts', label: { es: 'Maní/Cacahuetes', en: 'Peanuts' }, emoji: '🥜' },
  { id: 'tree-nuts', label: { es: 'Frutos secos', en: 'Tree Nuts' }, emoji: '🌰' },
  { id: 'milk', label: { es: 'Lácteos', en: 'Dairy/Milk' }, emoji: '🥛' },
  { id: 'eggs', label: { es: 'Huevos', en: 'Eggs' }, emoji: '🥚' },
  { id: 'wheat', label: { es: 'Trigo/Gluten', en: 'Wheat/Gluten' }, emoji: '🌾' },
  { id: 'soy', label: { es: 'Soja', en: 'Soy' }, emoji: '🫘' },
  { id: 'fish', label: { es: 'Pescado', en: 'Fish' }, emoji: '🐟' },
  { id: 'shellfish', label: { es: 'Mariscos', en: 'Shellfish' }, emoji: '🦐' },
  { id: 'sesame', label: { es: 'Sésamo', en: 'Sesame' }, emoji: '🌱' },
];

// Condiciones de salud
const HEALTH_CONDITIONS = [
  { id: 'diabetes', label: { es: 'Diabetes', en: 'Diabetes' }, emoji: '💉' },
  { id: 'hypertension', label: { es: 'Hipertensión', en: 'Hypertension' }, emoji: '❤️‍🩹' },
  { id: 'fatty-liver', label: { es: 'Hígado graso', en: 'Fatty Liver' }, emoji: '🫁' },
  { id: 'high-cholesterol', label: { es: 'Colesterol alto', en: 'High Cholesterol' }, emoji: '🫀' },
  { id: 'celiac', label: { es: 'Celiaquía', en: 'Celiac Disease' }, emoji: '🚫🌾' },
  { id: 'lactose-intolerance', label: { es: 'Intolerancia lactosa', en: 'Lactose Intolerance' }, emoji: '🥛❌' },
  { id: 'gastritis', label: { es: 'Gastritis/Reflujo', en: 'Gastritis/Reflux' }, emoji: '🔥' },
  { id: 'kidney-disease', label: { es: 'Enfermedad renal', en: 'Kidney Disease' }, emoji: '🫘' },
  { id: 'gout', label: { es: 'Gota', en: 'Gout' }, emoji: '🦶' },
  { id: 'ibs', label: { es: 'Colon irritable', en: 'IBS' }, emoji: '🌀' },
];

// Tipos de dieta
const DIET_TYPES: { id: DietType; label: { es: string; en: string }; emoji: string; desc: { es: string; en: string } }[] = [
  { id: 'any', label: { es: 'Sin preferencias', en: 'No preferences' }, emoji: '🍖🥦', desc: { es: 'Como de todo (carnes y vegetales)', en: 'I eat everything (meat and vegetables)' } },
  { id: 'omnivore', label: { es: 'Omnívoro', en: 'Omnivore' }, emoji: '🍽️', desc: { es: 'Dieta equilibrada estándar', en: 'Standard balanced diet' } },
  { id: 'vegetarian', label: { es: 'Vegetariano', en: 'Vegetarian' }, emoji: '🥗', desc: { es: 'Sin carne ni pescado', en: 'No meat or fish' } },
  { id: 'vegan', label: { es: 'Vegano', en: 'Vegan' }, emoji: '🌱', desc: { es: 'Sin productos animales', en: 'No animal products' } },
  { id: 'keto', label: { es: 'Keto', en: 'Keto' }, emoji: '🥓', desc: { es: 'Bajo en carbohidratos', en: 'Low carb, high fat' } },
  { id: 'paleo', label: { es: 'Paleo', en: 'Paleo' }, emoji: '🦴', desc: { es: 'Alimentos no procesados', en: 'Whole foods only' } },
  { id: 'gluten-free', label: { es: 'Sin gluten', en: 'Gluten-Free' }, emoji: '🚫🌾', desc: { es: 'Evito el gluten', en: 'No gluten' } },
];

// Generos
const GENDERS = [
  { id: 'male', label: { es: 'Masculino', en: 'Male' } },
  { id: 'female', label: { es: 'Femenino', en: 'Female' } },
  { id: 'non-binary', label: { es: 'No binario', en: 'Non-Binary' } },
  { id: 'prefer-not-to-say', label: { es: 'Prefiero no decir', en: 'Prefer not to say' } },
] as const;

// Niveles de habilidad
const SKILL_LEVELS = [
  { id: 'novice', label: { es: 'Novato', en: 'Novice' }, desc: { es: 'Estoy aprendiendo lo básico', en: 'I am learning the basics' }, emoji: '🥚' },
  { id: 'home-cook', label: { es: 'Cocinero de Casa', en: 'Home Cook' }, desc: { es: 'Cocino regularmente para mi familia', en: 'I cook regularly for my family' }, emoji: '🍳' },
  { id: 'pro', label: { es: 'Profesional', en: 'Pro' }, desc: { es: 'Manejo técnicas avanzadas y precisión', en: 'I master advanced techniques and precision' }, emoji: '🔪' },
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
                    {lang === 'es' ? '¡Bienvenido a Smart Cookbook!' : 'Welcome to Smart Cookbook!'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {lang === 'es'
                      ? 'Vamos a crear tu perfil de Chef para personalizar las recetas a tus necesidades.'
                      : "Let's create your Chef profile to personalize recipes to your needs."}
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>⚠️ {lang === 'es' ? 'Importante' : 'Important'}:</strong>{' '}
                    {lang === 'es'
                      ? 'Toda la información se guarda SOLO en tu navegador. Nunca se comparte con nadie.'
                      : 'All information is stored ONLY in your browser. It is never shared with anyone.'}
                  </p>
                </div>

                <div className="max-w-xs mx-auto mb-8 space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                      {lang === 'es' ? '¿Cómo te llamas?' : 'What is your name?'}
                    </label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder={lang === 'es' ? 'Ej: Ferran Adrià' : 'Ex: Gordon Ramsay'}
                      className="text-center"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {lang === 'es' ? '¿Dónde te encuentras?' : 'Where are you located?'}
                    </label>
                    <Input
                      value={profile.location || ''}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      placeholder={lang === 'es' ? 'Ej: Bogotá, Colombia' : 'Ex: Paris, France'}
                      className="text-center"
                    />
                    <p className="text-[10px] text-gray-400 text-center italic">
                      {lang === 'es'
                        ? 'Ayuda a sugerir ingredientes locales y ajustar cocción.'
                        : 'Helps suggesting local ingredients and adjusting cooking.'}
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
                    {lang === 'es' ? 'Comenzar' : 'Get Started'}
                  </Button>
                  <Button variant="ghost" onClick={onSkip} className="text-gray-500">
                    {lang === 'es' ? 'Omitir por ahora' : 'Skip for now'}
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
                    {lang === 'es' ? 'Información básica' : 'Basic Information'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {lang === 'es' ? 'Opcional - para ajustar porciones' : 'Optional - to adjust portions'}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Edad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {lang === 'es' ? 'Edad' : 'Age'}
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
                      {lang === 'es' ? 'Altura (cm)' : 'Height (cm)'}
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
                      {lang === 'es' ? 'Género' : 'Gender'}
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
                          {gender.label[lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <NavigationButtons onPrev={prevStep} onNext={nextStep} lang={lang} />
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
                    {lang === 'es' ? 'Tu Nivel de Cocina' : 'Your Cooking Skill'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {lang === 'es'
                      ? 'Esto ajusta la terminología y complejidad de las recetas.'
                      : 'This adjusts recipe terminology and complexity.'}
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
                        <div className="font-bold text-gray-900 dark:text-white">{skill.label[lang]}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{skill.desc[lang]}</div>
                      </div>
                      {profile.skillLevel === skill.id && (
                        <Check className="h-5 w-5 text-orange-500" />
                      )}
                    </button>
                  ))}
                </div>

                <NavigationButtons onPrev={prevStep} onNext={nextStep} lang={lang} />
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
                    {lang === 'es' ? '🛡️ Escudo de Salud: Alergias' : '🛡️ Health Shield: Allergies'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {lang === 'es'
                      ? 'Selecciona tus alergias alimentarias (si tienes)'
                      : 'Select your food allergies (if any)'}
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
                        <span className="flex-1 text-left">{allergy.label[lang]}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>

                {/* Campo "Otro" */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {lang === 'es' ? 'Otro (indica si tienes otra alergia):' : 'Other (specify if you have another allergy):'}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={customAllergyInput}
                      onChange={(e) => setCustomAllergyInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomAllergy()}
                      placeholder={lang === 'es' ? 'Ej: Fresas, Canela...' : 'Ex: Strawberries, Cinnamon...'}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomAllergy}
                      disabled={!customAllergyInput.trim()}
                    >
                      {lang === 'es' ? 'Añadir' : 'Add'}
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
                          <span>{common ? common.label[lang] : a}</span>
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
                      <strong>⚠️</strong> {lang === 'es'
                        ? `La IA evitará estos ${profile.allergies.length} alérgenos en las recetas.`
                        : `AI will avoid these ${profile.allergies.length} allergens in recipes.`}
                    </p>
                  </div>
                )}

                <NavigationButtons onPrev={prevStep} onNext={nextStep} lang={lang} />
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
                    {lang === 'es' ? '⚕️ Condiciones de Salud' : '⚕️ Health Conditions'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {lang === 'es'
                      ? 'Selecciona condiciones que debamos considerar'
                      : 'Select conditions we should consider'}
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
                        <span className="flex-1 text-left">{condition.label[lang]}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>

                {/* Campo "Otro" para condiciones */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {lang === 'es' ? 'Otro (indica si tienes otra condición):' : 'Other (specify if you have another condition):'}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={customConditionInput}
                      onChange={(e) => setCustomConditionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCondition()}
                      placeholder={lang === 'es' ? 'Ej: Hipotiroidismo, Anemia...' : 'Ex: Hypothyroidism, Anemia...'}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomCondition}
                      disabled={!customConditionInput.trim()}
                    >
                      {lang === 'es' ? 'Añadir' : 'Add'}
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
                          <span>{health ? health.label[lang] : c}</span>
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
                    <strong>ℹ️ {lang === 'es' ? 'Nota' : 'Note'}:</strong>{' '}
                    {lang === 'es'
                      ? 'Esta información ayuda a personalizar recetas, pero NO es consejo médico. Consulta siempre a un profesional.'
                      : 'This helps personalize recipes but is NOT medical advice. Always consult a professional.'}
                  </p>
                </div>

                <NavigationButtons onPrev={prevStep} onNext={nextStep} lang={lang} />
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
                    {lang === 'es' ? '🥗 Preferencia Dietética' : '🥗 Dietary Preference'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {lang === 'es' ? '¿Cómo te defines?' : 'How do you define yourself?'}
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
                            {diet.label[lang]}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {diet.desc[lang]}
                          </div>
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-green-500" />}
                      </button>
                    );
                  })}
                </div>

                <NavigationButtons onPrev={prevStep} onNext={nextStep} lang={lang} />
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
                    <X className="h-6 w-6 text-orange-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {lang === 'es' ? '🚫 ¿Qué NO te gusta?' : '🚫 What do you NOT like?'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {lang === 'es'
                      ? 'Dinos qué ingredientes debemos evitar o buscar alternativas'
                      : 'Tell us which ingredients we should avoid or find alternatives for'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={customDislikeInput}
                      onChange={(e) => setCustomDislikeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomDislike()}
                      placeholder={lang === 'es' ? 'Ej: Tomate, Cebolla, Pepino...' : 'Ex: Tomato, Onion, Cucumber...'}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomDislike}
                      disabled={!customDislikeInput.trim()}
                    >
                      {lang === 'es' ? 'Añadir' : 'Add'}
                    </Button>
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

                <NavigationButtons onPrev={prevStep} onNext={nextStep} lang={lang} nextLabel={lang === 'es' ? 'Finalizar' : 'Finish'} />
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
                    {lang === 'es' ? '¡Perfil Creado!' : 'Profile Created!'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {lang === 'es'
                      ? 'Tu Chef ID está listo. Las recetas se personalizarán para ti.'
                      : 'Your Chef ID is ready. Recipes will be personalized for you.'}
                  </p>
                </div>

                {/* Resumen del perfil */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {lang === 'es' ? '📋 Tu perfil:' : '📋 Your profile:'}
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
                        {DIET_TYPES.find(d => d.id === profile.diet)?.label[lang]}
                      </span>
                    </div>

                    {/* Nivel de Habilidad */}
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">🏆</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {SKILL_LEVELS.find(s => s.id === profile.skillLevel)?.label[lang]}
                      </span>
                    </div>

                    {/* Alergias */}
                    {profile.allergies.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">⚠️</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {profile.allergies.map(a =>
                            COMMON_ALLERGIES.find(al => al.id === a)?.label[lang] || a
                          ).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Condiciones */}
                    {profile.conditions.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-pink-500">❤️</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {profile.conditions.map(c =>
                            HEALTH_CONDITIONS.find(h => h.id === c)?.label[lang] || c
                          ).join(', ')}
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
                  {lang === 'es' ? '¡A cocinar!' : "Let's Cook!"}
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
  nextLabel?: string;
}

function NavigationButtons({ onPrev, onNext, lang, nextLabel }: NavigationButtonsProps) {
  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={onPrev} className="flex-1" icon={<ArrowLeft className="h-4 w-4" />}>
        {lang === 'es' ? 'Atrás' : 'Back'}
      </Button>
      <Button onClick={onNext} className="flex-1">
        {nextLabel || (lang === 'es' ? 'Continuar' : 'Continue')}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
