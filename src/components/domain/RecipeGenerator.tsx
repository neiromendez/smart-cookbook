'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Utensils, Leaf, Zap, Heart, Drumstick, Trash2, RefreshCw, Users, AlertCircle, ChevronDown, ChevronUp, BookOpen, Clock, ShoppingCart, Info, RotateCcw, Timer, Minus, Maximize2, Lightbulb, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { RequestStatusBar } from './RequestStatusBar';
import { ErrorCard } from './ErrorCard';
import { Disclaimer } from './Disclaimer';
import { RecipeView } from './RecipeView';
import { MissingIngredientsDialog } from './MissingIngredientsDialog';
import { RecipeIdeasList } from './RecipeIdeasList';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRecipeGeneration } from '@/lib/hooks/useRecipeGeneration';
import { useRecipeIdeas } from '@/lib/hooks/useRecipeIdeas';
import { StorageService } from '@/lib/services/storage.service';
import type { AIProviderKey, ChefProfile, Recipe, MealType } from '@/types';
import { cn } from '@/lib/utils/cn';

interface RecipeGeneratorProps {
  selectedProvider: string;
  apiKeys: AIProviderKey[];
  chefProfile?: ChefProfile;
  onSwitchProvider: (providerId: string) => void;
  loadedRecipe?: Recipe | null; // Receta cargada desde el historial
  onRecipeLoaded?: () => void; // Callback cuando la receta se ha mostrado
}

// Tipos de comida segun momento del dia
const MEAL_TYPES = [
  { id: 'breakfast', label: { es: 'Desayuno', en: 'Breakfast' }, emoji: '🌅' },
  { id: 'lunch', label: { es: 'Almuerzo', en: 'Lunch' }, emoji: '☀️' },
  { id: 'dinner', label: { es: 'Cena', en: 'Dinner' }, emoji: '🌙' },
  { id: 'snack', label: { es: 'Snack', en: 'Snack' }, emoji: '🍿' },
  { id: 'dessert', label: { es: 'Postre', en: 'Dessert' }, emoji: '🍰' },
];

// Categorias de recetas (vibes)
const VIBES = [
  { id: 'protein', label: { es: 'Alto en Proteína', en: 'High Protein' }, icon: Drumstick, emoji: '🥩' },
  { id: 'veggie', label: { es: 'Vegetariano', en: 'Vegetarian' }, icon: Leaf, emoji: '🥗' },
  { id: 'quick', label: { es: 'Rápido (<15 min)', en: 'Quick (<15 min)' }, icon: Zap, emoji: '⚡' },
  { id: 'healthy', label: { es: 'Saludable', en: 'Healthy' }, icon: Heart, emoji: '🧘' },
];

/**
 * RecipeGenerator - Componente principal para generar recetas
 */
export function RecipeGenerator({
  selectedProvider,
  apiKeys,
  chefProfile,
  onSwitchProvider,
  loadedRecipe,
  onRecipeLoaded,
}: RecipeGeneratorProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  const [ingredients, setIngredients] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [servings, setServings] = useState(1);
  const [guestRestrictions, setGuestRestrictions] = useState('');
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});

  // Updated state for multiple timers
  const [activeTimers, setActiveTimers] = useState<{ id: string; seconds: number; total: number; label: string; minimized: boolean }[]>([]);

  const [displayedRecipe, setDisplayedRecipe] = useState<Recipe | null>(null); // Receta del historial a mostrar
  const [missingIngDialog, setMissingIngDialog] = useState<{ isOpen: boolean; ingredients: { name: string; amount?: string }[] }>({ isOpen: false, ingredients: [] });

  // Obtener API key y modelo seleccionado del proveedor
  const providerKey = apiKeys.find(k => k.provider === selectedProvider);
  const apiKey = providerKey?.key || '';
  const selectedModel = providerKey?.selectedModel;

  const {
    status,
    recipe,
    chatHistory,
    generateRecipe,
    retry,
    reset,
    clearHistory,
  } = useRecipeGeneration({
    provider: selectedProvider,
    apiKey,
    model: selectedModel, // Pasar el modelo seleccionado por el usuario
    locale: lang,
    chefProfile: chefProfile as ChefProfile | undefined,
  });

  // Hook para generar ideas de recetas
  const {
    status: ideasStatus,
    ideas,
    savedIdeas,
    selectedIdea,
    isGenerating: isGeneratingIdeas,
    generateIdeas,
    selectIdea,
    reset: resetIdeas,
  } = useRecipeIdeas({
    provider: selectedProvider,
    apiKey,
    model: selectedModel,
    locale: lang,
    chefProfile: chefProfile as ChefProfile | undefined,
  });

  // Obtener recetas del historial para verificar cuales prompts generaron recetas
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  useEffect(() => {
    setSavedRecipes(StorageService.getHistory());
  }, [status.state]); // Actualizar cuando cambia el estado (por si se genero una nueva receta)

  // Verificar si un mensaje de usuario genero una receta
  const hasRecipeForPrompt = (promptId: string): boolean => {
    return savedRecipes.some(r => r.promptId === promptId);
  };

  // Efecto para cargar receta del historial
  useEffect(() => {
    if (loadedRecipe) {
      setDisplayedRecipe(loadedRecipe);
      // Rellenar el formulario con los ingredientes de la receta
      const ingredientNames = loadedRecipe.ingredients.map(i => i.name).join(', ');
      setIngredients(ingredientNames);
      setServings(loadedRecipe.servings);
      // Notificar que se ha cargado
      if (onRecipeLoaded) {
        onRecipeLoaded();
      }
    }
  }, [loadedRecipe, onRecipeLoaded]);

  // Timer loop for multiple timers
  useEffect(() => {
    if (activeTimers.length === 0) return;

    const interval = setInterval(() => {
      setActiveTimers(prevTimers =>
        prevTimers.map(timer => {
          if (timer.seconds > 0) {
            return { ...timer, seconds: timer.seconds - 1 };
          } else if (timer.seconds === 0 && timer.total > 0) { // Only play sound once when hitting 0
            // Notificar (audio o visual)
            if (typeof window !== 'undefined') {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play().catch(() => { });
            }
            return { ...timer, seconds: 0, total: -1 }; // Mark as finished to avoid repeated sounds
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers]); // Depend on activeTimers length changes mainly

  // Auto-activar expansión de mensajes al terminar
  useEffect(() => {
    if (status.state === 'completed' && chatHistory.length > 0) {
      const lastMsg = chatHistory[chatHistory.length - 1];
      if (lastMsg.role === 'assistant') {
        setExpandedMessages(prev => ({ ...prev, [lastMsg.id]: true }));
      }
    }
  }, [status.state, chatHistory]);

  const addTimer = (minutes: number, label: string) => {
    const id = Date.now().toString() + Math.random().toString();

    setActiveTimers(prev => [
      ...prev,
      {
        id,
        label: label || (lang === 'es' ? 'Cronómetro' : 'Timer'),
        seconds: minutes * 60,
        total: minutes * 60,
        minimized: false
      }
    ]);
  };

  const removeTimer = (id: string) => {
    setActiveTimers(prev => prev.filter(t => t.id !== id));
  };

  const addTimeToTimer = (id: string, minutes: number) => {
    setActiveTimers(prev =>
      prev.map(timer => {
        if (timer.id === id) {
          const newSeconds = timer.seconds + (minutes * 60);
          const newTotal = timer.total > 0 ? timer.total + (minutes * 60) : minutes * 60;
          return {
            ...timer,
            seconds: newSeconds,
            total: newTotal
          };
        }
        return timer;
      })
    );
  };

  const toggleTimerMinimized = (id: string) => {
    setActiveTimers(prev =>
      prev.map(timer =>
        timer.id === id ? { ...timer, minimized: !timer.minimized } : timer
      )
    );
  };

  // Generar IDEAS de recetas (paso 1 del flujo)
  const handleGenerateIdeas = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ingredients.trim()) return;

    await generateIdeas({
      ingredients,
      mealType: selectedMealType as MealType | null,
      vibes: selectedVibes,
      servings,
    });
  }, [ingredients, selectedMealType, selectedVibes, servings, generateIdeas]);

  // Generar RECETA COMPLETA desde una idea seleccionada (paso 2 del flujo)
  const handleGenerateRecipeFromIdea = useCallback(async () => {
    if (!selectedIdea) return;

    const isSpanish = lang === 'es';

    // Construir prompt específico para la idea seleccionada
    let prompt = isSpanish
      ? `Quiero preparar: "${selectedIdea.title}" - ${selectedIdea.description}`
      : `I want to prepare: "${selectedIdea.title}" - ${selectedIdea.description}`;

    // Solo agregar ingredientes si hay alguno
    if (selectedIdea.ingredients.length > 0) {
      prompt += isSpanish
        ? `. Ingredientes disponibles: ${selectedIdea.ingredients.join(', ')}.`
        : `. Available ingredients: ${selectedIdea.ingredients.join(', ')}.`;
    }

    // Agregar tipo de comida
    const mealLabel = MEAL_TYPES.find(m => m.id === selectedIdea.mealType)?.label[lang];
    if (mealLabel) {
      prompt += isSpanish
        ? ` Es para ${mealLabel.toLowerCase()}.`
        : ` This is for ${mealLabel.toLowerCase()}.`;
    }

    // Agregar vibes/características
    if (selectedIdea.vibes.length > 0) {
      const vibeLabels = selectedIdea.vibes
        .map(v => VIBES.find(vibe => vibe.id === v)?.label[lang])
        .filter(Boolean);

      if (vibeLabels.length > 0) {
        prompt += isSpanish
          ? ` Quiero que sea ${vibeLabels.join(', ')}.`
          : ` I want it to be ${vibeLabels.join(', ')}.`;
      }
    }

    // Añadir porciones
    prompt += isSpanish
      ? ` Cocina para ${selectedIdea.servings} ${selectedIdea.servings === 1 ? 'persona' : 'personas'}.`
      : ` Cook for ${selectedIdea.servings} ${selectedIdea.servings === 1 ? 'person' : 'people'}.`;

    // Restricciones de invitados si hay
    if (guestRestrictions.trim()) {
      prompt += isSpanish
        ? ` Importante: un invitado tiene estas restricciones: ${guestRestrictions}.`
        : ` Important: a guest has these restrictions: ${guestRestrictions}.`;
    }

    // Limpiar selección ANTES de generar (el botón desaparece inmediatamente)
    selectIdea(null);

    await generateRecipe(prompt);

    // La idea se marca como usada automáticamente cuando la receta se guarda
  }, [selectedIdea, lang, guestRestrictions, generateRecipe, selectIdea]);

  // Legacy: Generar receta directamente (sin ideas) - para chat continuo
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ingredients.trim()) return;

    // Construir el prompt con ingredientes, tipo de comida y vibes
    const isSpanish = lang === 'es';
    let prompt = isSpanish
      ? `Tengo estos ingredientes: ${ingredients}.`
      : `I have these ingredients: ${ingredients}.`;

    // Agregar tipo de comida (desayuno, almuerzo, cena, etc.)
    if (selectedMealType) {
      const mealLabel = MEAL_TYPES.find(m => m.id === selectedMealType)?.label[lang];
      prompt += isSpanish
        ? ` Quiero preparar un ${mealLabel?.toLowerCase()}.`
        : ` I want to prepare ${mealLabel?.toLowerCase()}.`;
    }

    if (selectedVibes.length > 0) {
      const vibeLabels = selectedVibes
        .map(v => VIBES.find(vibe => vibe.id === v)?.label[lang])
        .filter(Boolean);

      prompt += isSpanish
        ? ` Quiero una receta ${vibeLabels.join(', ')}.`
        : ` I want a ${vibeLabels.join(', ')} recipe.`;
    }

    prompt += isSpanish ? ' ¿Qué puedo cocinar?' : ' What can I cook?';

    // Añadir porciones y restricciones de invitados
    prompt += isSpanish
      ? ` Cocina para ${servings} ${servings === 1 ? 'persona' : 'personas'}.`
      : ` Cook for ${servings} ${servings === 1 ? 'person' : 'people'}.`;

    if (guestRestrictions.trim()) {
      prompt += isSpanish
        ? ` Importante: un invitado tiene estas restricciones: ${guestRestrictions}.`
        : ` Important: a guest has these restrictions: ${guestRestrictions}.`;
    }

    await generateRecipe(prompt);
  }, [ingredients, selectedMealType, selectedVibes, servings, guestRestrictions, generateRecipe, lang]);

  const toggleVibe = (vibeId: string) => {
    setSelectedVibes(prev =>
      prev.includes(vibeId)
        ? prev.filter(v => v !== vibeId)
        : [...prev, vibeId]
    );
  };

  const handleSwitchProvider = (providerId: string) => {
    onSwitchProvider(providerId);
    if (status.state === 'error') {
      reset();
    }
  };

  const isGeneratingRecipe = status.state === 'validating' ||
    status.state === 'connecting' ||
    status.state === 'streaming';

  // Cualquier tipo de generación activa
  const isGenerating = isGeneratingRecipe || isGeneratingIdeas;

  // Extrae el título de la receta del contenido
  const extractRecipeTitle = (content: string): string => {
    // Buscar título en la primera línea (## 🍽️ Título)
    const titleMatch = content.match(/^##\s*🍽️?\s*(.+)/m);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    // Buscar cualquier header de nivel 2 al inicio
    const headerMatch = content.match(/^##\s*(.+)/m);
    if (headerMatch) {
      return headerMatch[1].trim();
    }
    return '';
  };

  // Extrae ingredientes del contenido de la receta de forma robusta
  // Soporta múltiples formatos de headers
  const extractIngredients = (content: string): { name: string; amount: string; recipeTitle?: string }[] => {
    // Extraer título de la receta
    const recipeTitle = extractRecipeTitle(content);

    // Buscar la sección de ingredientes con múltiples patrones
    const patterns = [
      /#{2,3}\s*📦\s*(?:Ingredientes|Ingredients)/i,
      /#{2,3}\s*(?:Ingredientes|Ingredients)/i,
      /\*\*(?:📦\s*)?(?:Ingredientes|Ingredients)\*\*/i,
    ];

    let ingredientSection = '';

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match.index !== undefined) {
        // Extraer desde el match hasta el siguiente header (##, ###) o fin del contenido
        const startIndex = match.index + match[0].length;
        const rest = content.substring(startIndex);
        // Buscar el siguiente header
        const nextHeaderMatch = rest.match(/\n#{2,3}\s/);
        ingredientSection = nextHeaderMatch && nextHeaderMatch.index !== undefined
          ? rest.substring(0, nextHeaderMatch.index)
          : rest;
        break;
      }
    }

    if (!ingredientSection) {
      console.warn('[extractIngredients] No se encontró sección de ingredientes');
      return [];
    }

    // Extraer líneas que parecen ingredientes (empiezan con -, *, o número)
    const lines = ingredientSection.split('\n');
    const ingredients: { name: string; amount: string; recipeTitle?: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Verificar si es un item de lista
      if (/^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
        // Limpiar el prefijo de lista
        let cleaned = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();

        // Extraer cantidad si está entre paréntesis al final
        const amountMatch = cleaned.match(/\(([^)]+)\)\s*$/);
        let amount = '';
        let name = cleaned;

        if (amountMatch) {
          amount = amountMatch[1];
          name = cleaned.replace(/\([^)]+\)\s*$/, '').trim();
        }

        // También buscar cantidades al inicio (ej: "200g pollo")
        const prefixAmountMatch = name.match(/^(\d+\s*(?:g|kg|ml|l|oz|lb|cups?|tbsp|tsp|pcs?|unidades?|piezas?)?)\s+(.+)/i);
        if (prefixAmountMatch && !amount) {
          amount = prefixAmountMatch[1];
          name = prefixAmountMatch[2];
        }

        if (name) {
          ingredients.push({ name, amount, recipeTitle: recipeTitle || undefined });
        }
      }
    }

    return ingredients;
  };

  // Extrae todos los tiempos del texto con sus contextos/labels
  // Soporta español e inglés según el locale
  const extractTimersFromText = (text: string): { minutes: number; label: string; id: string }[] => {
    const timers: { minutes: number; label: string; id: string }[] = [];
    const seenKeys = new Set<string>();

    // Regex que captura tiempos en español e inglés
    // Patrones: "X minutos", "X min", "X minutes", "por X min", "during X minutes", etc.
    const timePatterns = lang === 'es'
      ? /(?:(?:por|durante|unos?|aproximadamente)\s+)?(\d+)\s*(minutos?|min)\b/gi
      : /(?:(?:for|about|around|approximately)\s+)?(\d+)\s*(minutes?|min)\b/gi;

    const lines = text.split('\n');

    lines.forEach((line, lineIndex) => {
      // Resetear el regex para cada línea
      let match;
      const regex = new RegExp(timePatterns.source, 'gi');

      while ((match = regex.exec(line)) !== null) {
        const minutes = parseInt(match[1]);
        if (minutes <= 0 || minutes > 720) continue; // Ignorar valores inválidos (max 12 horas)

        // Extraer contexto de la línea
        let label = extractLabelFromLine(line, match.index);

        // Crear key única para evitar duplicados
        const key = `${minutes}-${label}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        timers.push({
          minutes,
          label,
          id: `timer-${lineIndex}-${match.index}`
        });
      }
    });

    // Ordenar por orden de aparición y luego por duración
    return timers;
  };

  // Extrae un label significativo de una línea de texto
  const extractLabelFromLine = (line: string, matchIndex: number): string => {
    // Limpiar la línea de markdown
    let cleanLine = line
      .replace(/^[\d.)\-*#]+\s*/, '') // Remover numeración de lista y headers
      .replace(/\*\*/g, '') // Remover negritas
      .replace(/\*/g, '') // Remover itálicas
      .replace(/`/g, '') // Remover código inline
      .trim();

    // Buscar verbos de cocina para crear un label más significativo
    const cookingVerbs = lang === 'es'
      ? /(precalentar|calentar|hornear|cocinar|hervir|freír|saltear|dorar|asar|marinar|reposar|dejar|esperar|cocer|batir|mezclar|remover|revolver|tapar|cubrir|enfriar|refrigerar)/i
      : /(preheat|heat|bake|cook|boil|fry|sauté|brown|roast|marinate|rest|let|wait|simmer|stir|mix|cover|cool|refrigerate|chill)/i;

    const verbMatch = cleanLine.match(cookingVerbs);

    if (verbMatch && verbMatch.index !== undefined) {
      // Tomar desde el verbo hasta el final de la línea
      const fromVerb = cleanLine.substring(verbMatch.index);
      // Remover solo la parte del tiempo en minutos (ej: "por 5 minutos")
      const withoutTime = fromVerb.replace(/\s*(?:por|durante|for|about|around)?\s*\d+\s*(minutos?|minutes?|min)\b[.,]?/gi, '').trim();

      if (withoutTime.length > 0) {
        // Capitalizar primera letra
        return withoutTime.charAt(0).toUpperCase() + withoutTime.slice(1);
      }
    }

    // Si no encontramos verbo, tomar toda la línea limpia
    // Remover solo la parte del tiempo en minutos
    let label = cleanLine.replace(/\s*(?:por|durante|for|about|around)?\s*\d+\s*(minutos?|minutes?|min)\b[.,]?/gi, '').trim();
    if (label.length > 3) {
      return label.charAt(0).toUpperCase() + label.slice(1);
    }

    return lang === 'es' ? 'Cronómetro' : 'Timer';
  };

  // Componente para mostrar los timers extraídos
  const TimerButtons = ({ content }: { content: string }) => {
    const timers = extractTimersFromText(content);

    if (timers.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl border border-orange-200 dark:border-orange-800/50">
        <div className="flex items-center gap-2 mr-2">
          <Timer className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wide">
            {lang === 'es' ? 'Cronómetros' : 'Timers'}
          </span>
        </div>
        {timers.map((timer) => (
          <button
            key={timer.id}
            onClick={() => addTimer(timer.minutes, timer.label)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-white dark:bg-gray-800 border-2 border-orange-300 dark:border-orange-700",
              "text-sm text-gray-800 dark:text-gray-200",
              "hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:border-orange-500",
              "hover:scale-[1.02] active:scale-[0.98]",
              "transition-all duration-200 shadow-sm hover:shadow-md"
            )}
            title={`${lang === 'es' ? 'Iniciar cronómetro:' : 'Start timer:'} ${timer.label}`}
          >
            <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <span className="font-bold text-orange-600 dark:text-orange-400 flex-shrink-0">{timer.minutes} min</span>
            <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">
              {timer.label}
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🥕 {lang === 'es' ? '¿Qué hay en tu nevera?' : "What's in your fridge?"}
              </label>
              <div className="relative">
                <textarea
                  value={ingredients}
                  onChange={e => setIngredients(e.target.value)}
                  placeholder={lang === 'es'
                    ? 'Ej: pollo, arroz, tomates, cebolla, ajo...'
                    : 'Ex: chicken, rice, tomatoes, onion, garlic...'}
                  className={cn(
                    'w-full rounded-lg border border-gray-300 bg-white px-4 py-3',
                    'text-gray-900 placeholder:text-gray-400',
                    'focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none',
                    'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
                    'dark:placeholder:text-gray-500 dark:focus:border-orange-400',
                    'resize-none transition-colors duration-200'
                  )}
                  rows={3}
                  maxLength={500}
                  disabled={isGenerating}
                />
                <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {ingredients.length}/500
                </span>
              </div>
            </div>

            {/* Selector de tipo de comida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🍽️ {lang === 'es' ? '¿Para qué momento del día?' : 'What time of day?'}
              </label>
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map(meal => {
                  const isSelected = selectedMealType === meal.id;
                  return (
                    <button
                      key={meal.id}
                      type="button"
                      onClick={() => setSelectedMealType(isSelected ? null : meal.id)}
                      disabled={isGenerating}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium',
                        'border-2 transition-all duration-200',
                        isSelected
                          ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <span>{meal.emoji}</span>
                      <span>{meal.label[lang]}</span>
                      {isSelected && <X className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de vibes/caracteristicas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ✨ {lang === 'es' ? '¿Qué características?' : 'What characteristics?'}
              </label>
              <div className="flex flex-wrap gap-2">
                {VIBES.map(vibe => {
                  const isSelected = selectedVibes.includes(vibe.id);
                  return (
                    <button
                      key={vibe.id}
                      type="button"
                      onClick={() => toggleVibe(vibe.id)}
                      disabled={isGenerating}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium',
                        'border-2 transition-all duration-200',
                        isSelected
                          ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <span>{vibe.emoji}</span>
                      <span>{vibe.label[lang]}</span>
                      {isSelected && <X className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  👥 {lang === 'es' ? '¿Cuántas personas?' : 'How many people?'}
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 6].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setServings(num)}
                      disabled={isGenerating}
                      className={cn(
                        'w-10 h-10 rounded-lg text-sm font-bold border-2 transition-all',
                        servings === num
                          ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                          : 'border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800'
                      )}
                    >
                      {num}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{servings}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🩹 {lang === 'es' ? 'Restricciones de invitados' : 'Guest restrictions'}
                </label>
                <Input
                  value={guestRestrictions}
                  onChange={e => setGuestRestrictions(e.target.value)}
                  placeholder={lang === 'es' ? 'Ej: "Un invitado no come picante"' : 'Ex: "One guest is vegan"'}
                  disabled={isGenerating}
                  icon={<AlertCircle className="h-4 w-4" />}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {/* Botón principal: Generar Ideas (nuevo flujo) */}
              {chatHistory.length === 0 && ideas.length === 0 && (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  disabled={!ingredients.trim() || isGenerating}
                  loading={isGeneratingIdeas}
                  icon={!isGeneratingIdeas && <Lightbulb className="h-5 w-5" />}
                  onClick={handleGenerateIdeas}
                >
                  {isGeneratingIdeas
                    ? (lang === 'es' ? 'Generando ideas...' : 'Generating ideas...')
                    : (lang === 'es' ? 'Generar Ideas' : 'Generate Ideas')}
                </Button>
              )}

              {/* Botón secundario: Chat continuo (después de tener ideas o conversación) */}
              {(chatHistory.length > 0 || ideas.length > 0) && (
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  disabled={!ingredients.trim() || isGenerating}
                  loading={isGeneratingRecipe}
                  icon={!isGeneratingRecipe && <Utensils className="h-5 w-5" />}
                >
                  {isGeneratingRecipe
                    ? (lang === 'es' ? 'Cocinando...' : 'Cooking...')
                    : (lang === 'es' ? 'Enviar Mensaje' : 'Send Message')}
                </Button>
              )}

              {/* Botón de reset */}
              {(chatHistory.length > 0 || ideas.length > 0) && !isGenerating && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setIngredients('');
                    setSelectedMealType(null);
                    setSelectedVibes([]);
                    reset();
                    resetIdeas();
                  }}
                  title={lang === 'es' ? 'Nueva Búsqueda' : 'New Search'}
                  icon={<RefreshCw className="h-5 w-5" />}
                />
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Status bar para generación de IDEAS */}
      <AnimatePresence>
        {ideasStatus.state !== 'idle' && ideasStatus.state !== 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <RequestStatusBar status={ideasStatus} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error card para IDEAS */}
      <AnimatePresence>
        {ideasStatus.state === 'error' && (
          <ErrorCard
            error={ideasStatus.error}
            onRetry={() => handleGenerateIdeas({ preventDefault: () => {} } as React.FormEvent)}
            onSwitchProvider={handleSwitchProvider}
            provider={selectedProvider}
          />
        )}
      </AnimatePresence>

      {/* Lista de IDEAS generadas */}
      <AnimatePresence>
        {(ideas.length > 0 || savedIdeas.length > 0) && ideasStatus.state !== 'error' && (
          <RecipeIdeasList
            ideas={ideas}
            savedIdeas={savedIdeas}
            selectedIdea={selectedIdea}
            onSelectIdea={selectIdea}
            onGenerateRecipe={handleGenerateRecipeFromIdea}
            isGenerating={isGeneratingRecipe}
            locale={lang}
          />
        )}
      </AnimatePresence>

      {/* Status bar para generación de RECETAS */}
      <AnimatePresence>
        {status.state !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <RequestStatusBar status={status} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error card para RECETAS */}
      <AnimatePresence>
        {status.state === 'error' && (
          <ErrorCard
            error={status.error}
            onRetry={retry}
            onSwitchProvider={handleSwitchProvider}
            provider={selectedProvider}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {(recipe || chatHistory.length > 0) && status.state !== 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {chatHistory.length > 0 && (
              <div className="space-y-4">
                {chatHistory.map((msg, index) => (
                  <div
                    key={`${msg.id}-${index}`}
                    className={cn(
                      "flex flex-col gap-2 p-4 rounded-2xl max-w-[85%]",
                      msg.role === 'user'
                        ? "bg-orange-100 dark:bg-orange-900/20 ml-auto border-r-4 border-orange-500 rounded-tr-none"
                        : "bg-white dark:bg-gray-800 border-l-4 border-gray-300 dark:border-gray-600 rounded-tl-none shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {msg.role === 'user' ? (chefProfile?.name || (lang === 'es' ? 'Yo' : 'Me')) : (lang === 'es' ? 'Chef' : 'Chef')}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {/* Indicador de que este prompt genero una receta */}
                      {msg.role === 'user' && hasRecipeForPrompt(msg.id) && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full">
                          <BookOpen className="h-3 w-3" />
                          {lang === 'es' ? 'Receta guardada' : 'Recipe saved'}
                        </span>
                      )}
                    </div>

                    {msg.role === 'assistant' && msg.content.includes('##') ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => setExpandedMessages(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                          className="flex items-center justify-between w-full p-3 rounded-xl bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-5 w-5 text-orange-500" />
                            <span className="font-bold text-gray-900 dark:text-white text-left">
                              {msg.content.split('\n')[0].replace(/##\s*🍽️?\s*/, '') || (lang === 'es' ? 'Receta sugerida' : 'Suggested Recipe')}
                            </span>
                          </div>
                          {expandedMessages[msg.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        <AnimatePresence>
                          {expandedMessages[msg.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[10px]"
                                  onClick={() => {
                                    const ingredients = extractIngredients(msg.content);
                                    if (ingredients.length > 0) {
                                      setMissingIngDialog({ isOpen: true, ingredients });
                                    }
                                  }}
                                >
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  {lang === 'es' ? 'Lista de Compras' : 'Shopping List'}
                                </Button>
                              </div>

                              {/* Barra de Timers extraídos del contenido - con separación */}
                              <div className="mt-4">
                                <TimerButtons content={msg.content} />
                              </div>

                              <div className="recipe-content prose prose-sm dark:prose-invert max-w-none mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content.replace(/\*\*(.*?)\*\*/g, '**$1**')}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {status.state === 'streaming' && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-l-4 border-orange-500 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                  <span className="text-xs font-bold uppercase text-orange-500">
                    Chef {lang === 'es' ? 'escribiendo...' : 'writing...'}
                  </span>
                </div>
                {/* Mostrar timers mientras se genera */}
                <TimerButtons content={recipe} />
                <div className="prose prose-orange dark:prose-invert max-w-none mt-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {recipe}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {chatHistory.length > 0 && !isGenerating && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {lang === 'es' ? 'Limpiar conversación' : 'Clear conversation'}
                </Button>
              </div>
            )}

            <Disclaimer />

            {/* Float Timer Overlay - Stacked for multiple timers */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-[90vw]">
              <AnimatePresence>
                {activeTimers.map((timer) => {
                  const isFinished = timer.seconds === 0;
                  const isMinimized = timer.minimized;

                  // Vista minimizada
                  if (isMinimized) {
                    return (
                      <motion.div
                        key={timer.id}
                        initial={{ scale: 0.8, x: 50, opacity: 0 }}
                        animate={{ scale: 1, x: 0, opacity: isFinished ? [1, 0.5, 1] : 1 }}
                        exit={{ scale: 0.8, x: 50, opacity: 0 }}
                        transition={isFinished ? { opacity: { duration: 0.8, repeat: Infinity } } : undefined}
                        layout
                        className={cn(
                          "shadow-lg rounded-full px-3 py-2 flex items-center gap-2 cursor-pointer",
                          isFinished
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700"
                        )}
                        onClick={() => toggleTimerMinimized(timer.id)}
                        title={timer.label}
                      >
                        <Clock className={cn(
                          "h-4 w-4",
                          isFinished ? "text-white animate-ping" : "text-orange-500 animate-pulse"
                        )} />
                        <span className={cn(
                          "text-sm font-bold tabular-nums",
                          isFinished ? "text-white" : "text-gray-900 dark:text-white"
                        )}>
                          {isFinished ? "0:00" : `${Math.floor(timer.seconds / 60)}:${(timer.seconds % 60).toString().padStart(2, '0')}`}
                        </span>
                        {isFinished && <span>🔔</span>}
                        <Maximize2 className={cn(
                          "h-3 w-3",
                          isFinished ? "text-white/70" : "text-gray-400"
                        )} />
                      </motion.div>
                    );
                  }

                  // Vista expandida
                  return (
                    <motion.div
                      key={timer.id}
                      initial={{ scale: 0.8, x: 50, opacity: 0 }}
                      animate={{
                        scale: 1,
                        x: 0,
                        opacity: isFinished ? [1, 0.5, 1] : 1,
                      }}
                      exit={{ scale: 0.8, x: 50, opacity: 0 }}
                      transition={isFinished ? { opacity: { duration: 0.8, repeat: Infinity } } : undefined}
                      layout
                      className={cn(
                        "shadow-xl rounded-xl p-3 min-w-[200px] max-w-[280px] relative",
                        isFinished
                          ? "bg-orange-100 dark:bg-orange-900/50 border-2 border-orange-500 ring-2 ring-orange-500/50"
                          : "bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <Clock className={cn(
                            "h-4 w-4 flex-shrink-0 mt-0.5",
                            isFinished ? "text-orange-600 animate-ping" : "text-orange-500 animate-pulse"
                          )} />
                          <span
                            className={cn(
                              "text-xs font-semibold leading-tight",
                              isFinished ? "text-orange-700 dark:text-orange-300" : "text-gray-700 dark:text-gray-300"
                            )}
                          >
                            {timer.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleTimerMinimized(timer.id)}
                            className="text-gray-400 hover:text-orange-500 transition-colors"
                            title={lang === 'es' ? 'Minimizar' : 'Minimize'}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removeTimer(timer.id)}
                            className={cn(
                              "transition-colors",
                              isFinished ? "text-orange-600 hover:text-red-500" : "text-gray-400 hover:text-red-500"
                            )}
                            title={lang === 'es' ? 'Cerrar' : 'Close'}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between mb-1">
                        <div className={cn(
                          "text-2xl font-black tabular-nums",
                          isFinished ? "text-orange-600 dark:text-orange-400" : "text-gray-900 dark:text-white"
                        )}>
                          {isFinished ? "0:00" : `${Math.floor(timer.seconds / 60)}:${(timer.seconds % 60).toString().padStart(2, '0')}`}
                        </div>
                        {isFinished && (
                          <span className="text-sm font-bold text-orange-600 dark:text-orange-400 animate-pulse">
                            ¡Listo! 🔔
                          </span>
                        )}
                      </div>

                      <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                          initial={false}
                          animate={{
                            width: isFinished ? '100%' : `${(timer.total > 0 ? timer.seconds / timer.total : 0) * 100}%`,
                            backgroundColor: isFinished ? '#ea580c' : '#f97316'
                          }}
                          className="h-full"
                        />
                      </div>

                      {/* Botones para agregar tiempo */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {lang === 'es' ? 'Agregar:' : 'Add:'}
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 5].map((mins) => (
                            <button
                              key={mins}
                              onClick={() => addTimeToTimer(timer.id, mins)}
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold",
                                "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
                                "hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:text-orange-600 dark:hover:text-orange-400",
                                "transition-colors"
                              )}
                            >
                              +{mins}m
                            </button>
                          ))}
                        </div>
                      </div>

                      {isFinished && (
                        <div className="mt-2 text-[10px] text-center text-orange-600 dark:text-orange-400 font-medium">
                          {lang === 'es' ? 'Toca X para cerrar' : 'Tap X to close'}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Mostrar receta cargada del historial */}
      <AnimatePresence>
        {displayedRecipe && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <RecipeView
              recipe={displayedRecipe}
              onClose={() => setDisplayedRecipe(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {missingIngDialog.isOpen && (
          <MissingIngredientsDialog
            ingredients={missingIngDialog.ingredients}
            onClose={() => setMissingIngDialog(prev => ({ ...prev, isOpen: false }))}
            onConfirm={(selected) => {
              selected.forEach(ing => StorageService.addToShoppingList({ ...ing, amount: ing.amount || '' }));
              setMissingIngDialog(prev => ({ ...prev, isOpen: false }));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
