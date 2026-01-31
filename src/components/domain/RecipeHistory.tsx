'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Trash2,
  X,
  Users,
  ChefHat,
  Search,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RecipeView } from './RecipeView';
import { StorageService } from '@/lib/services/storage.service';
import type { Recipe, ChatMessage } from '@/types';
import { cn } from '@/lib/utils/cn';

interface RecipeHistoryProps {
  onClose?: () => void;
  onLoadRecipe?: (recipe: Recipe) => void;
}

// Filtros de tiempo de preparación
type TimeFilter = 'all' | 'quick' | 'medium' | 'long';

const TIME_FILTERS: { id: TimeFilter; label: { es: string; en: string }; emoji: string }[] = [
  { id: 'quick', label: { es: 'Rápido', en: 'Quick' }, emoji: '⚡' },
  { id: 'medium', label: { es: 'Medio', en: 'Medium' }, emoji: '⏱️' },
  { id: 'long', label: { es: 'Elaborado', en: 'Elaborate' }, emoji: '🍲' },
];

// Filtros de porciones
type ServingsFilter = 'all' | '1-2' | '3-4' | '5+';

const SERVINGS_FILTERS: { id: ServingsFilter; label: { es: string; en: string }; emoji: string }[] = [
  { id: '1-2', label: { es: '1-2 pers.', en: '1-2 ppl' }, emoji: '👤' },
  { id: '3-4', label: { es: '3-4 pers.', en: '3-4 ppl' }, emoji: '👥' },
  { id: '5+', label: { es: '5+ pers.', en: '5+ ppl' }, emoji: '👨‍👩‍👧‍👦' },
];

// Emoji por proveedor
const PROVIDER_EMOJIS: Record<string, string> = {
  openai: '🟢',
  anthropic: '🟣',
  google: '🔵',
  openrouter: '🌐',
  groq: '⚡',
  default: '🤖',
};

export function RecipeHistory({ onClose, onLoadRecipe }: RecipeHistoryProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [servingsFilter, setServingsFilter] = useState<ServingsFilter>('all');

  useEffect(() => {
    const storedRecipes = StorageService.getHistory();
    const storedChat = StorageService.getChatHistory();
    setRecipes(storedRecipes);
    setChatHistory(storedChat);
  }, []);

  const getPromptForRecipe = useCallback((recipe: Recipe): string | null => {
    if (!recipe.promptId) return null;
    const prompt = chatHistory.find(m => m.id === recipe.promptId);
    return prompt?.content || null;
  }, [chatHistory]);

  const handleDelete = useCallback((recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMessage = lang === 'es'
      ? '¿Eliminar esta receta del historial?'
      : 'Remove this recipe from history?';

    if (confirm(confirmMessage)) {
      StorageService.removeFromHistory(recipeId);
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
    }
  }, [lang]);

  const handleClearAll = useCallback(() => {
    const confirmMessage = lang === 'es'
      ? '¿Borrar todo el historial de recetas?'
      : 'Clear all recipe history?';

    if (confirm(confirmMessage)) {
      recipes.forEach(r => StorageService.removeFromHistory(r.id));
      setRecipes([]);
    }
  }, [recipes, lang]);

  // Filtrar recetas
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      // Filtro de búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = recipe.title.toLowerCase().includes(query);
        const matchesIngredient = recipe.ingredients.some(i =>
          i.name.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesIngredient) return false;
      }

      // Filtro de tiempo
      const totalTime = recipe.prepTime + recipe.cookTime;
      if (timeFilter === 'quick' && totalTime > 30) return false;
      if (timeFilter === 'medium' && (totalTime <= 30 || totalTime > 60)) return false;
      if (timeFilter === 'long' && totalTime <= 60) return false;

      // Filtro de porciones
      if (servingsFilter === '1-2' && recipe.servings > 2) return false;
      if (servingsFilter === '3-4' && (recipe.servings < 3 || recipe.servings > 4)) return false;
      if (servingsFilter === '5+' && recipe.servings < 5) return false;

      return true;
    });
  }, [recipes, searchQuery, timeFilter, servingsFilter]);

  const clearFilters = () => {
    setTimeFilter('all');
    setServingsFilter('all');
    setSearchQuery('');
  };

  const hasFilters = timeFilter !== 'all' || servingsFilter !== 'all' || searchQuery !== '';

  // Calcular filtros disponibles basados en las recetas guardadas
  const availableTimeFilters = useMemo(() => {
    const available: TimeFilter[] = [];
    const hasQuick = recipes.some(r => (r.prepTime + r.cookTime) <= 30);
    const hasMedium = recipes.some(r => {
      const total = r.prepTime + r.cookTime;
      return total > 30 && total <= 60;
    });
    const hasLong = recipes.some(r => (r.prepTime + r.cookTime) > 60);

    if (hasQuick) available.push('quick');
    if (hasMedium) available.push('medium');
    if (hasLong) available.push('long');

    return available;
  }, [recipes]);

  const availableServingsFilters = useMemo(() => {
    const available: ServingsFilter[] = [];
    const has1to2 = recipes.some(r => r.servings <= 2);
    const has3to4 = recipes.some(r => r.servings >= 3 && r.servings <= 4);
    const has5plus = recipes.some(r => r.servings >= 5);

    if (has1to2) available.push('1-2');
    if (has3to4) available.push('3-4');
    if (has5plus) available.push('5+');

    return available;
  }, [recipes]);

  // Obtener tiempo de preparación con emoji
  const getTimeDisplay = (recipe: Recipe) => {
    const total = recipe.prepTime + recipe.cookTime;
    if (total <= 30) return { emoji: '⚡', color: 'text-green-600 dark:text-green-400' };
    if (total <= 60) return { emoji: '⏱️', color: 'text-yellow-600 dark:text-yellow-400' };
    return { emoji: '🍲', color: 'text-orange-600 dark:text-orange-400' };
  };

  if (selectedRecipe) {
    return (
      <RecipeView
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      />
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium mb-2">
          {lang === 'es' ? 'Sin recetas guardadas' : 'No saved recipes'}
        </p>
        <p className="text-sm text-gray-400">
          {lang === 'es'
            ? 'Las recetas que generes aparecerán aquí'
            : 'Recipes you generate will appear here'}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {lang === 'es' ? 'Historial de Recetas' : 'Recipe History'}
          </h3>
          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-bold rounded-full">
            {filteredRecipes.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-red-500 hover:text-red-600 text-xs"
            icon={<Trash2 className="h-3 w-3" />}
          >
            {lang === 'es' ? 'Limpiar' : 'Clear'}
          </Button>
          {onClose && (
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {(availableTimeFilters.length > 0 || availableServingsFilters.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-500">
            {lang === 'es' ? 'Filtrar:' : 'Filter:'}
          </span>

          {/* Filtros de tiempo - solo los disponibles */}
          {TIME_FILTERS.filter(f => availableTimeFilters.includes(f.id)).map(filter => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(timeFilter === filter.id ? 'all' : filter.id)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
                timeFilter === filter.id
                  ? "bg-orange-500 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/30"
              )}
            >
              <span>{filter.emoji}</span>
              <span>{filter.label[lang]}</span>
            </button>
          ))}

          {/* Separador solo si hay ambos tipos de filtros */}
          {availableTimeFilters.length > 0 && availableServingsFilters.length > 0 && (
            <span className="text-gray-300 dark:text-gray-600">|</span>
          )}

          {/* Filtros de porciones - solo los disponibles */}
          {SERVINGS_FILTERS.filter(f => availableServingsFilters.includes(f.id)).map(filter => (
            <button
              key={filter.id}
              onClick={() => setServingsFilter(servingsFilter === filter.id ? 'all' : filter.id)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
                servingsFilter === filter.id
                  ? "bg-purple-500 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              )}
            >
              <span>{filter.emoji}</span>
              <span>{filter.label[lang]}</span>
            </button>
          ))}

          {/* Limpiar filtros */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Grid de recetas */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm mb-2">
            {lang === 'es' ? 'No hay recetas con estos filtros' : 'No recipes match these filters'}
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {lang === 'es' ? 'Limpiar filtros' : 'Clear filters'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {filteredRecipes.map((recipe, index) => {
              const timeDisplay = getTimeDisplay(recipe);
              const providerEmoji = PROVIDER_EMOJIS[recipe.provider] || PROVIDER_EMOJIS.default;
              const prompt = getPromptForRecipe(recipe);

              return (
                <motion.button
                  key={recipe.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={cn(
                    "relative p-4 rounded-xl text-left transition-all duration-200 group",
                    "border-2 hover:shadow-md",
                    "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300"
                  )}
                >
                  {/* Header con emoji y título */}
                  <div className="flex items-start gap-2 mb-2 pr-12">
                    <span className="text-2xl flex-shrink-0">🍽️</span>
                    <h4 className="font-bold text-gray-900 dark:text-white leading-tight">
                      {recipe.title}
                    </h4>
                  </div>

                  {/* Prompt original */}
                  {prompt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {prompt}
                    </p>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                      "bg-gray-100 dark:bg-gray-700"
                    )}>
                      <span>{timeDisplay.emoji}</span>
                      <span className={timeDisplay.color}>{recipe.prepTime + recipe.cookTime} min</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-medium rounded-full">
                      <Users className="h-3 w-3" />
                      {recipe.servings}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-medium rounded-full">
                      {providerEmoji} {recipe.provider}
                    </span>
                  </div>

                  {/* Acciones hover */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onLoadRecipe && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoadRecipe(recipe);
                          if (onClose) onClose();
                        }}
                        className="p-1.5 text-gray-400 hover:text-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                        title={lang === 'es' ? 'Cargar en chat' : 'Load in chat'}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </span>
                    )}
                    <span
                      role="button"
                      onClick={(e) => handleDelete(recipe.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                      title={lang === 'es' ? 'Eliminar' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
