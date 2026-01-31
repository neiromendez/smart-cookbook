'use client';

import { useState, useCallback, useRef } from 'react';
import type { RequestStatus, ChefProfile, APIError, RecipeIdea, MealType, ProteinType } from '@/types';
import { getAdapter } from '@/lib/adapters';
import { GuardrailsService } from '@/lib/services/guardrails.service';
import { ErrorService } from '@/lib/services/error.service';
import { StorageService } from '@/lib/services/storage.service';

interface UseRecipeIdeasOptions {
  provider: string;
  apiKey: string;
  model?: string;
  locale?: 'en' | 'es';
  chefProfile?: ChefProfile;
}

interface GenerateIdeasParams {
  ingredients: string;
  mealType: MealType | null;
  vibes: string[];
  servings: number;
}

interface UseRecipeIdeasReturn {
  status: RequestStatus;
  ideas: RecipeIdea[];
  savedIdeas: RecipeIdea[];
  selectedIdea: RecipeIdea | null;
  isGenerating: boolean;
  generateIdeas: (params: GenerateIdeasParams) => Promise<void>;
  selectIdea: (idea: RecipeIdea | null) => void;
  clearSelection: () => void;
  getSavedIdeas: () => RecipeIdea[];
  filterSavedIdeas: (filters: { mealType?: MealType; proteinType?: ProteinType }) => RecipeIdea[];
  reset: () => void;
}

/**
 * useRecipeIdeas - Hook para generar y manejar ideas de recetas
 *
 * Genera 15-20 ideas de recetas usando un prompt optimizado (menos tokens)
 * Las ideas se guardan en localStorage para reutilización
 */
export function useRecipeIdeas({
  provider,
  apiKey,
  model,
  locale = 'es',
  chefProfile,
}: UseRecipeIdeasOptions): UseRecipeIdeasReturn {
  const [status, setStatus] = useState<RequestStatus>({ state: 'idle' });
  const [ideas, setIdeas] = useState<RecipeIdea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<RecipeIdea[]>(() => {
    // Evitar llamar a localStorage durante SSR
    if (typeof window === 'undefined') return [];
    return StorageService.getRecipeIdeas();
  });
  const [selectedIdea, setSelectedIdea] = useState<RecipeIdea | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  const generateIdeas = useCallback(async (params: GenerateIdeasParams) => {
    const { ingredients, mealType, vibes, servings } = params;
    startTimeRef.current = Date.now();
    setIdeas([]);
    setSelectedIdea(null);

    // 1. Validacion de entrada
    setStatus({ state: 'validating', message: locale === 'es' ? 'Validando tu petición...' : 'Validating your request...' });

    const validation = GuardrailsService.validateInput(ingredients);
    if (!validation.valid) {
      const error = ErrorService.createPromptInjectionError();
      setStatus({ state: 'error', error });
      return;
    }

    // 2. Verificar API key
    if (!apiKey) {
      const error: APIError = {
        code: 'INVALID_API_KEY',
        icon: '🔑',
        title: 'errors.missingKey.title',
        message: 'errors.missingKey.message',
        solutions: [
          'errors.missingKey.solution1',
          'errors.missingKey.solution2',
        ],
        freeAlternatives: ErrorService.getFreeAlternatives(),
        actionButton: {
          label: 'errors.missingKey.action',
          action: 'show-api-key-form',
        },
      };
      setStatus({ state: 'error', error });
      return;
    }

    // 3. Obtener adaptador
    const adapter = getAdapter(provider);
    if (!adapter) {
      const error: APIError = {
        code: 'UNKNOWN_ERROR',
        icon: '❓',
        title: locale === 'es' ? 'Proveedor no encontrado' : 'Provider not found',
        message: locale === 'es'
          ? `El proveedor "${provider}" no está disponible.`
          : `Provider "${provider}" is not available.`,
        solutions: [
          locale === 'es' ? 'Selecciona otro proveedor de la lista' : 'Select another provider from the list',
        ],
        freeAlternatives: ErrorService.getFreeAlternatives(),
      };
      setStatus({ state: 'error', error });
      return;
    }

    // 4. Conectar con el proveedor
    setStatus({ state: 'connecting', provider: adapter.config.name });

    try {
      abortControllerRef.current = new AbortController();

      // Obtener perfil del usuario
      const profile = chefProfile || StorageService.getProfile();
      const pantry = StorageService.getPantry();

      // Generar system prompt optimizado para ideas con todo el perfil del usuario
      const systemPrompt = GuardrailsService.getIdeasSystemPrompt({
        name: profile.name,
        allergies: profile.allergies,
        conditions: profile.conditions,
        diet: profile.diet,
        dislikes: profile.dislikes,
        skillLevel: profile.skillLevel,
        location: profile.location,
        pantry,
      }, locale);

      // Construir user prompt
      const isSpanish = locale === 'es';
      let userPrompt = isSpanish
        ? `Ingredientes disponibles: ${ingredients}`
        : `Available ingredients: ${ingredients}`;

      if (mealType) {
        const mealLabels: Record<MealType, { es: string; en: string }> = {
          breakfast: { es: 'desayuno', en: 'breakfast' },
          lunch: { es: 'almuerzo', en: 'lunch' },
          dinner: { es: 'cena', en: 'dinner' },
          snack: { es: 'snack', en: 'snack' },
          dessert: { es: 'postre', en: 'dessert' },
        };
        userPrompt += isSpanish
          ? `. Para: ${mealLabels[mealType].es}`
          : `. For: ${mealLabels[mealType].en}`;
      }

      if (vibes.length > 0) {
        userPrompt += isSpanish
          ? `. Preferencias: ${vibes.join(', ')}`
          : `. Preferences: ${vibes.join(', ')}`;
      }

      userPrompt += isSpanish
        ? `. Porciones: ${servings}`
        : `. Servings: ${servings}`;

      // 5. Llamar a la IA (sin streaming, queremos JSON completo)
      let content = '';
      let tokenCount = 0;

      const stream = await adapter.generateRecipe(
        systemPrompt,
        userPrompt,
        apiKey,
        { model }
      );

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        if (chunk.done) {
          break;
        }

        content += chunk.content;
        tokenCount += chunk.content.length;

        setStatus({
          state: 'streaming',
          tokens: tokenCount,
          content,
        });
      }

      // 6. Parsear respuesta JSON
      const parsedIdeas = parseIdeasResponse(content, mealType, vibes, ingredients.split(',').map(i => i.trim()), servings);

      if (parsedIdeas.length === 0) {
        const error: APIError = {
          code: 'UNKNOWN_ERROR',
          icon: '😕',
          title: isSpanish ? 'No se pudieron generar ideas' : 'Could not generate ideas',
          message: isSpanish
            ? 'La IA no devolvió ideas válidas. Intenta con otros ingredientes.'
            : 'The AI did not return valid ideas. Try different ingredients.',
          solutions: [
            isSpanish ? 'Usa ingredientes más comunes' : 'Use more common ingredients',
            isSpanish ? 'Reduce la cantidad de restricciones' : 'Reduce the number of restrictions',
          ],
        };
        setStatus({ state: 'error', error });
        return;
      }

      // 7. Guardar ideas en storage
      StorageService.addRecipeIdeas(parsedIdeas);
      setSavedIdeas(StorageService.getRecipeIdeas());

      // 8. Actualizar estado
      setIdeas(parsedIdeas);
      const duration = Date.now() - startTimeRef.current;
      setStatus({
        state: 'completed',
        duration,
        content,
      });

      console.info(`[useRecipeIdeas] ${parsedIdeas.length} ideas generadas en ${duration}ms`);

    } catch (error) {
      console.error('[useRecipeIdeas] Error:', error);

      let apiError: APIError;

      if (error instanceof TypeError && error.message.includes('fetch')) {
        apiError = ErrorService.createNetworkError();
      } else if (typeof error === 'object' && error !== null && 'status' in error) {
        const err = error as { status: number; body?: unknown };
        apiError = ErrorService.parseAPIError(err.status, err.body, provider);
      } else {
        apiError = ErrorService.getError('UNKNOWN_ERROR');
      }

      setStatus({ state: 'error', error: apiError });
    }
  }, [provider, apiKey, model, locale, chefProfile]);

  const selectIdea = useCallback((idea: RecipeIdea | null) => {
    setSelectedIdea(idea);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIdea(null);
  }, []);

  const getSavedIdeas = useCallback(() => {
    return StorageService.getRecipeIdeas();
  }, []);

  const filterSavedIdeas = useCallback((filters: { mealType?: MealType; proteinType?: ProteinType }) => {
    return StorageService.filterIdeas(filters);
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus({ state: 'idle' });
    setIdeas([]);
    setSelectedIdea(null);
  }, []);

  const isGenerating = status.state === 'validating' ||
    status.state === 'connecting' ||
    status.state === 'streaming';

  return {
    status,
    ideas,
    savedIdeas,
    selectedIdea,
    isGenerating,
    generateIdeas,
    selectIdea,
    clearSelection,
    getSavedIdeas,
    filterSavedIdeas,
    reset,
  };
}

/**
 * Parsea la respuesta JSON de la IA y crea objetos RecipeIdea
 */
function parseIdeasResponse(
  content: string,
  mealType: MealType | null,
  vibes: string[],
  ingredients: string[],
  servings: number
): RecipeIdea[] {
  try {
    // Limpiar contenido: remover markdown code blocks si existen
    let cleanContent = content.trim();

    // Remover ```json y ``` si están presentes
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // Intentar encontrar el array JSON en el contenido
    const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('[parseIdeasResponse] No se encontró array JSON en la respuesta');
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      console.warn('[parseIdeasResponse] La respuesta no es un array');
      return [];
    }

    // Definir interfaz para los items parseados
    interface ParsedIdeaItem {
      title: string;
      description: string;
      proteinType?: string;
    }

    // Filtrar items válidos
    const validItems = parsed.filter((item: unknown): item is ParsedIdeaItem =>
      typeof item === 'object' &&
      item !== null &&
      'title' in item &&
      typeof (item as ParsedIdeaItem).title === 'string' &&
      'description' in item &&
      typeof (item as ParsedIdeaItem).description === 'string'
    );

    // Mapear a RecipeIdea
    const ideas: RecipeIdea[] = validItems.map((item) => ({
      id: crypto.randomUUID(),
      title: item.title,
      description: item.description,
      mealType: mealType || 'lunch', // Default a lunch si no se especificó
      proteinType: validateProteinType(item.proteinType),
      ingredients,
      vibes,
      servings,
      createdAt: new Date(),
      isUsed: false,
    }));

    return ideas;

  } catch (error) {
    console.error('[parseIdeasResponse] Error parsing JSON:', error);
    return [];
  }
}

/**
 * Valida y normaliza el tipo de proteína
 */
function validateProteinType(value?: string): ProteinType {
  const validTypes: ProteinType[] = ['chicken', 'beef', 'pork', 'fish', 'seafood', 'egg', 'tofu', 'legumes', 'none'];

  if (value && validTypes.includes(value as ProteinType)) {
    return value as ProteinType;
  }

  return 'none';
}
