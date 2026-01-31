'use client';

import { useState, useCallback, useRef } from 'react';
import type { RequestStatus, ChefProfile, APIError, ChatMessage, Recipe } from '@/types';
import { getAdapter } from '@/lib/adapters';
import { GuardrailsService } from '@/lib/services/guardrails.service';
import { ErrorService } from '@/lib/services/error.service';
import { StorageService } from '@/lib/services/storage.service';
import { RecipeParserService } from '@/lib/services/recipe-parser.service';

interface UseRecipeGenerationOptions {
  provider: string;
  apiKey: string;
  model?: string;
  locale?: 'en' | 'es';
  chefProfile?: ChefProfile;
}

interface UseRecipeGenerationReturn {
  status: RequestStatus;
  recipe: string;
  chatHistory: ChatMessage[];
  lastParsedRecipe: Recipe | null;
  generateRecipe: (prompt: string) => Promise<void>;
  retry: () => void;
  cancel: () => void;
  reset: () => void;
  clearHistory: () => void;
}

/**
 * useRecipeGeneration - Hook principal para generar recetas
 *
 * Maneja el ciclo de vida completo:
 * 1. Validacion de entrada (guardrails)
 * 2. Conexion con el proveedor
 * 3. Streaming de la respuesta
 * 4. Manejo de errores con soluciones
 * 5. Auto-retry cuando corresponde
 */
export function useRecipeGeneration({
  provider,
  apiKey,
  model,
  locale = 'es',
  chefProfile,
}: UseRecipeGenerationOptions): UseRecipeGenerationReturn {
  const [status, setStatus] = useState<RequestStatus>({ state: 'idle' });
  const [recipe, setRecipe] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => StorageService.getChatHistory());
  const [lastParsedRecipe, setLastParsedRecipe] = useState<Recipe | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastPromptRef = useRef<string>('');
  const startTimeRef = useRef<number>(0);

  const generateRecipe = useCallback(async (userPrompt: string) => {
    lastPromptRef.current = userPrompt;
    startTimeRef.current = Date.now();
    setRecipe('');

    // 1. Validacion de entrada
    setStatus({ state: 'validating', message: 'Validando tu petición...' });

    const validation = GuardrailsService.validateInput(userPrompt);
    if (!validation.valid) {
      const error = ErrorService.createPromptInjectionError();
      setStatus({ state: 'error', error });
      return;
    }

    const sanitizedPrompt = validation.sanitizedInput || userPrompt;

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
        title: 'Proveedor no encontrado',
        message: `El proveedor "${provider}" no está disponible.`,
        solutions: [
          'Selecciona otro proveedor de la lista',
          'Prueba con un proveedor multimodelo como OpenRouter',
        ],
        freeAlternatives: ErrorService.getFreeAlternatives(),
      };
      setStatus({ state: 'error', error });
      return;
    }

    // 4. Conectar con el proveedor
    setStatus({ state: 'connecting', provider: adapter.config.name });

    try {
      // Crear abort controller para cancelacion
      abortControllerRef.current = new AbortController();

      // Usar perfil del chef (prioridad al pasado como prop, sino de storage)
      const profile = chefProfile || StorageService.getProfile();

      // Guardar mensaje del usuario en el historial
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: sanitizedPrompt,
        timestamp: new Date(),
      };

      // Guardar en storage primero (tiene protección contra duplicados)
      StorageService.addToChatHistory(userMessage);

      // Calcular historial actualizado de forma síncrona para usar en el contexto
      // Obtener desde storage (ya tiene el mensaje guardado) para evitar problemas de sincronía
      const updatedHistory = StorageService.getChatHistory();

      // Actualizar estado local de React
      setChatHistory(updatedHistory);

      // Generar system prompt blindado con el perfil del usuario
      const pantry = StorageService.getPantry();
      const systemPrompt = GuardrailsService.getSystemPrompt({ ...profile, pantry }, locale);

      // 5. Iniciar streaming
      let content = '';
      let tokenCount = 0;

      // Incluir historial en la llamada (formateado para el proveedor)
      // Nota: Los adaptadores actuales solo aceptan system + user. 
      // Debemos mejorar los adaptadores para soportar mensajes multiples si queremos memoria real.
      // Por ahora, inyectaremos el resumen del historial en el user prompt si el adaptador es basico.

      // IMPORTANTE: Usar el historial ACTUALIZADO (incluyendo el mensaje recien añadido)
      const historyContext = updatedHistory
        .slice(-6) // Ultimos 3 intercambios
        .map(m => `${m.role === 'user' ? 'Usuario' : 'Chef'}: ${m.content}`)
        .join('\n');

      const enrichedUserPrompt = `Historial reciente:\n${historyContext}\n\nNueva petición: ${sanitizedPrompt}`;

      const stream = await adapter.generateRecipe(
        systemPrompt,
        enrichedUserPrompt,
        apiKey,
        { model }
      );

      for await (const chunk of stream) {
        // Verificar si fue cancelado
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        if (chunk.done) {
          break;
        }

        content += chunk.content;
        tokenCount += chunk.content.length; // Aproximacion simple

        setRecipe(content);
        setStatus({
          state: 'streaming',
          tokens: tokenCount,
          content,
        });
      }

      // 6. Validar salida
      const outputValidation = GuardrailsService.validateOutput(content);
      if (!outputValidation.valid) {
        console.warn('[useRecipeGeneration] Output validation warning:', outputValidation.error);
        // No bloqueamos, solo advertimos
      }

      // 7. Completado
      const duration = Date.now() - startTimeRef.current;
      setStatus({
        state: 'completed',
        duration,
        content,
      });

      // Guardar respuesta del asistente
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(), // ID único garantizado
        role: 'assistant',
        content,
        timestamp: new Date(),
      };

      // Guardar en storage (tiene protección contra duplicados)
      StorageService.addToChatHistory(assistantMessage);

      // Actualizar estado local desde storage (fuente de verdad)
      setChatHistory(StorageService.getChatHistory());

      // 8. Parsear y guardar la receta en el historial si tiene estructura de receta
      if (RecipeParserService.hasRecipeStructure(content)) {
        try {
          // Pasar el ID del mensaje del usuario para vincular la receta con el prompt
          const parsedRecipe = RecipeParserService.parse(content, provider, userMessage.id);
          setLastParsedRecipe(parsedRecipe);
          StorageService.addToHistory(parsedRecipe);
          console.info('[useRecipeGeneration] Receta guardada en historial:', parsedRecipe.title);
        } catch (parseError) {
          console.warn('[useRecipeGeneration] No se pudo parsear la receta:', parseError);
        }
      }

    } catch (error) {
      console.error('[useRecipeGeneration] Error:', error);

      // Parsear el error
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
  }, [provider, apiKey, model, locale, chefProfile, chatHistory]);

  const retry = useCallback(() => {
    if (lastPromptRef.current) {
      generateRecipe(lastPromptRef.current);
    }
  }, [generateRecipe]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus({ state: 'idle' });
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus({ state: 'idle' });
    setRecipe('');
    lastPromptRef.current = '';
    setLastParsedRecipe(null);
  }, []);

  const clearHistory = useCallback(() => {
    StorageService.clearChatHistory();
    setChatHistory([]);
  }, []);

  return {
    status,
    recipe,
    chatHistory,
    lastParsedRecipe,
    generateRecipe,
    retry,
    cancel,
    reset,
    clearHistory,
  };
}
