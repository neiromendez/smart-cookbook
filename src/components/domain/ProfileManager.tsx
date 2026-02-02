'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  X,
  Save,
  AlertTriangle,
  Heart,
  ChefHat,
  MapPin,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StorageService } from '@/lib/services/storage.service';
import type { ChefProfile, DietType, SkillLevel } from '@/types';
import { cn } from '@/lib/utils/cn';

interface ProfileManagerProps {
  profile: ChefProfile;
  onSave: (profile: ChefProfile) => void;
  onClose?: () => void;
}

const DIET_OPTIONS: { value: DietType; label: { es: string; en: string }; emoji: string }[] = [
  { value: 'any', label: { es: 'Sin restricciones', en: 'No restrictions' }, emoji: '🍽️' },
  { value: 'omnivore', label: { es: 'Omnívoro', en: 'Omnivore' }, emoji: '🥩' },
  { value: 'vegetarian', label: { es: 'Vegetariano', en: 'Vegetarian' }, emoji: '🥗' },
  { value: 'vegan', label: { es: 'Vegano', en: 'Vegan' }, emoji: '🌱' },
  { value: 'keto', label: { es: 'Keto', en: 'Keto' }, emoji: '🥑' },
  { value: 'paleo', label: { es: 'Paleo', en: 'Paleo' }, emoji: '🦴' },
  { value: 'gluten-free', label: { es: 'Sin Gluten', en: 'Gluten-free' }, emoji: '🌾' },
];

const SKILL_OPTIONS: { value: SkillLevel; label: { es: string; en: string }; emoji: string }[] = [
  { value: 'novice', label: { es: 'Principiante', en: 'Novice' }, emoji: '🌱' },
  { value: 'home-cook', label: { es: 'Cocinero Casero', en: 'Home Cook' }, emoji: '👨‍🍳' },
  { value: 'pro', label: { es: 'Profesional', en: 'Pro Chef' }, emoji: '⭐' },
];

const COMMON_ALLERGIES = [
  { id: 'gluten', label: { es: 'Gluten', en: 'Gluten' } },
  { id: 'lactose', label: { es: 'Lactosa', en: 'Lactose' } },
  { id: 'nuts', label: { es: 'Frutos secos', en: 'Nuts' } },
  { id: 'shellfish', label: { es: 'Mariscos', en: 'Shellfish' } },
  { id: 'eggs', label: { es: 'Huevos', en: 'Eggs' } },
  { id: 'soy', label: { es: 'Soja', en: 'Soy' } },
];

const COMMON_CONDITIONS = [
  { id: 'diabetes', label: { es: 'Diabetes', en: 'Diabetes' } },
  { id: 'hypertension', label: { es: 'Hipertensión', en: 'Hypertension' } },
  { id: 'celiac', label: { es: 'Celiaquía', en: 'Celiac Disease' } },
  { id: 'ibs', label: { es: 'Colon irritable', en: 'IBS' } },
  { id: 'gerd', label: { es: 'Reflujo', en: 'GERD' } },
];

/**
 * ProfileManager - Componente para editar el perfil del chef
 *
 * Permite editar:
 * - Nombre
 * - Dieta
 * - Nivel de habilidad
 * - Alergias
 * - Condiciones médicas
 * - Ingredientes que no le gustan
 */
export function ProfileManager({ profile, onSave, onClose }: ProfileManagerProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  const [editedProfile, setEditedProfile] = useState<ChefProfile>(profile);
  const [customAllergy, setCustomAllergy] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [customDislike, setCustomDislike] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = JSON.stringify(editedProfile) !== JSON.stringify(profile);
    setHasChanges(changed);
  }, [editedProfile, profile]);

  const handleSave = () => {
    StorageService.setProfile(editedProfile);
    onSave(editedProfile);
    if (onClose) onClose();
  };

  const toggleAllergy = (allergy: string) => {
    setEditedProfile(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !editedProfile.allergies.includes(customAllergy.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        allergies: [...prev.allergies, customAllergy.trim()],
      }));
      setCustomAllergy('');
    }
  };

  const toggleCondition = (condition: string) => {
    setEditedProfile(prev => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition],
    }));
  };

  const addCustomCondition = () => {
    if (customCondition.trim() && !editedProfile.conditions.includes(customCondition.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        conditions: [...prev.conditions, customCondition.trim()],
      }));
      setCustomCondition('');
    }
  };

  const addDislike = () => {
    if (customDislike.trim() && !editedProfile.dislikes.includes(customDislike.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        dislikes: [...prev.dislikes, customDislike.trim()],
      }));
      setCustomDislike('');
    }
  };

  const removeDislike = (dislike: string) => {
    setEditedProfile(prev => ({
      ...prev,
      dislikes: prev.dislikes.filter(d => d !== dislike),
    }));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5 text-orange-500" />
            {lang === 'es' ? 'Editar Perfil' : 'Edit Profile'}
          </CardTitle>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            👤 {lang === 'es' ? 'Tu Nombre' : 'Your Name'}
          </label>
          <Input
            value={editedProfile.name || ''}
            onChange={e => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
            placeholder={lang === 'es' ? 'Chef Anónimo' : 'Anonymous Chef'}
          />
        </div>

        {/* Dieta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🥗 {lang === 'es' ? 'Tipo de Dieta' : 'Diet Type'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DIET_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEditedProfile(prev => ({ ...prev, diet: option.value }))}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-center',
                  editedProfile.diet === option.value
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <span className="text-xl">{option.emoji}</span>
                <span className="text-xs font-medium">{option.label[lang]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nivel de habilidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <ChefHat className="h-4 w-4 inline mr-1" />
            {lang === 'es' ? 'Nivel de Habilidad' : 'Skill Level'}
          </label>
          <div className="flex gap-2">
            {SKILL_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEditedProfile(prev => ({ ...prev, skillLevel: option.value }))}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                  editedProfile.skillLevel === option.value
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-xs font-medium">{option.label[lang]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alergias */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <AlertTriangle className="h-4 w-4 inline mr-1 text-red-500" />
            {lang === 'es' ? 'Alergias' : 'Allergies'}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMMON_ALLERGIES.map(allergy => (
              <button
                key={allergy.id}
                type="button"
                onClick={() => toggleAllergy(allergy.label[lang])}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border-2 transition-all',
                  editedProfile.allergies.includes(allergy.label[lang])
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                {allergy.label[lang]}
              </button>
            ))}
          </div>
          {/* Alergias personalizadas */}
          {editedProfile.allergies.filter(a => !COMMON_ALLERGIES.some(ca => ca.label.es === a || ca.label.en === a)).map(a => (
            <span
              key={a}
              className="inline-flex items-center gap-1 mr-2 mb-2 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs"
            >
              {a}
              <button onClick={() => toggleAllergy(a)} className="hover:text-red-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder={lang === 'es' ? 'Otra alergia...' : 'Other allergy...'}
              value={customAllergy}
              onChange={e => setCustomAllergy(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomAllergy()}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={addCustomAllergy}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Condiciones médicas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Heart className="h-4 w-4 inline mr-1 text-pink-500" />
            {lang === 'es' ? 'Condiciones Médicas' : 'Medical Conditions'}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMMON_CONDITIONS.map(condition => (
              <button
                key={condition.id}
                type="button"
                onClick={() => toggleCondition(condition.label[lang])}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border-2 transition-all',
                  editedProfile.conditions.includes(condition.label[lang])
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                {condition.label[lang]}
              </button>
            ))}
          </div>
          {/* Condiciones personalizadas */}
          {editedProfile.conditions.filter(c => !COMMON_CONDITIONS.some(cc => cc.label.es === c || cc.label.en === c)).map(c => (
            <span
              key={c}
              className="inline-flex items-center gap-1 mr-2 mb-2 px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded text-xs"
            >
              {c}
              <button onClick={() => toggleCondition(c)} className="hover:text-pink-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder={lang === 'es' ? 'Otra condición...' : 'Other condition...'}
              value={customCondition}
              onChange={e => setCustomCondition(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomCondition()}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={addCustomCondition}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cosas que no le gustan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            👎 {t('profile.dislikes.label')}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {editedProfile.dislikes.map(dislike => (
              <span
                key={dislike}
                className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs"
              >
                {dislike}
                <button onClick={() => removeDislike(dislike)} className="hover:text-orange-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={t('profile.dislikes.placeholder')}
              value={customDislike}
              onChange={e => setCustomDislike(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDislike()}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={addDislike}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="flex-1">
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1"
            icon={<Save className="h-4 w-4" />}
          >
            {lang === 'es' ? 'Guardar Cambios' : 'Save Changes'}
          </Button>
        </div>

        {/* Nota de privacidad */}
        <p className="text-xs text-gray-500 text-center">
          🔒 {lang === 'es'
            ? 'Tu perfil se guarda solo en tu navegador'
            : 'Your profile is stored only in your browser'}
        </p>
      </CardContent>
    </Card>
  );
}
