'use client';

import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '@/lib/services/storage.service';
import type { ChefProfile } from '@/types';

// Perfil por defecto (vacio)
const DEFAULT_PROFILE: ChefProfile = {
  gender: 'prefer-not-to-say',
  allergies: [],
  conditions: [],
  diet: 'any',
  skillLevel: 'home-cook',
  dislikes: [],
};

/**
 * Hook para gestionar el perfil del Chef (Chef ID)
 *
 * Maneja:
 * - Carga inicial desde localStorage
 * - Guardado automatico de cambios
 * - Estado de si el usuario ha completado el onboarding
 */
export function useChefProfile() {
  const [profile, setProfileState] = useState<ChefProfile>(DEFAULT_PROFILE);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar perfil al montar
  useEffect(() => {
    const loadProfile = () => {
      const storedProfile = StorageService.get('profile');

      if (storedProfile) {
        setProfileState(storedProfile);
        setHasCompletedOnboarding(true);
      } else {
        // Verificar si hay algun dato guardado (podria haber omitido onboarding)
        const prefs = StorageService.get('preferences');
        const keys = StorageService.get('api-keys');

        // Si tiene datos pero no perfil, asumimos que omitio el onboarding
        if (prefs || (keys && keys.length > 0)) {
          setHasCompletedOnboarding(true); // Ya esta usando la app
        } else {
          setHasCompletedOnboarding(false); // Primera vez
        }
      }

      setIsLoading(false);
    };

    loadProfile();
  }, []);

  /**
   * Actualiza el perfil y lo guarda en localStorage
   */
  const setProfile = useCallback((newProfile: ChefProfile) => {
    setProfileState(newProfile);
    StorageService.setProfile(newProfile);
    setHasCompletedOnboarding(true);
  }, []);

  /**
   * Actualiza campos especificos del perfil
   */
  const updateProfile = useCallback((updates: Partial<ChefProfile>) => {
    setProfileState(prev => {
      const updated = { ...prev, ...updates };
      StorageService.setProfile(updated);
      return updated;
    });
  }, []);

  /**
   * Marca el onboarding como completado (incluso si se omitio)
   */
  const skipOnboarding = useCallback(() => {
    // Guardar preferencias por defecto para marcar que ya paso por aqui
    StorageService.setPreferences({ theme: 'system', locale: 'es', rememberKeys: false });
    setHasCompletedOnboarding(true);
  }, []);

  /**
   * Resetea el perfil a valores por defecto
   */
  const resetProfile = useCallback(() => {
    setProfileState(DEFAULT_PROFILE);
    StorageService.remove('profile');
  }, []);

  /**
   * Verifica si el usuario tiene alergias configuradas
   */
  const hasAllergies = profile.allergies.length > 0;

  /**
   * Verifica si el usuario tiene condiciones de salud configuradas
   */
  const hasConditions = profile.conditions.length > 0;

  /**
   * Obtiene un resumen del perfil para el prompt de IA
   */
  const getProfileSummary = useCallback(() => {
    const parts: string[] = [];

    if (profile.age) {
      parts.push(`Age: ${profile.age}`);
    }

    if (profile.gender && profile.gender !== 'prefer-not-to-say') {
      parts.push(`Gender: ${profile.gender}`);
    }

    if (profile.height) {
      parts.push(`Height: ${profile.height}cm`);
    }

    if (profile.allergies.length > 0) {
      parts.push(`🚨 Allergies: ${profile.allergies.join(', ')}`);
    }

    if (profile.conditions.length > 0) {
      parts.push(`⚕️ Health Conditions: ${profile.conditions.join(', ')}`);
    }

    parts.push(`🥗 Diet: ${profile.diet}`);
    parts.push(`👨‍🍳 Skill Level: ${profile.skillLevel || 'home-cook'}`);

    if (profile.location) {
      parts.push(`📍 Location: ${profile.location}`);
    }

    if (profile.dislikes && profile.dislikes.length > 0) {
      parts.push(`🚫 Dislikes: ${profile.dislikes.join(', ')}`);
    }

    return parts.join('\n');
  }, [profile]);

  return {
    profile,
    setProfile,
    updateProfile,
    resetProfile,
    hasCompletedOnboarding,
    skipOnboarding,
    hasAllergies,
    hasConditions,
    getProfileSummary,
    isLoading,
  };
}
