'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChefHat, Check, Filter, X, History, Lightbulb, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import type { RecipeIdea, MealType, ProteinType } from '@/types';

interface RecipeIdeasListProps {
  ideas: RecipeIdea[];
  savedIdeas: RecipeIdea[];
  selectedIdea: RecipeIdea | null;
  onSelectIdea: (idea: RecipeIdea | null) => void;
  onGenerateRecipe: () => void;
  onDeleteIdea?: (id: string) => void;
  isGenerating: boolean;
  locale: 'es' | 'en';
}

// Emojis para tipos de proteína
const PROTEIN_EMOJIS: Record<ProteinType, string> = {
  chicken: '🐔',
  beef: '🥩',
  pork: '🐷',
  fish: '🐟',
  seafood: '🦐',
  egg: '🥚',
  tofu: '🌱',
  legumes: '🫘',
  none: '🥗',
};

// Labels para tipos de proteína
const PROTEIN_LABELS: Record<ProteinType, { es: string; en: string }> = {
  chicken: { es: 'Pollo', en: 'Chicken' },
  beef: { es: 'Res', en: 'Beef' },
  pork: { es: 'Cerdo', en: 'Pork' },
  fish: { es: 'Pescado', en: 'Fish' },
  seafood: { es: 'Mariscos', en: 'Seafood' },
  egg: { es: 'Huevo', en: 'Egg' },
  tofu: { es: 'Tofu', en: 'Tofu' },
  legumes: { es: 'Legumbres', en: 'Legumes' },
  none: { es: 'Vegetariano', en: 'Vegetarian' },
};

// Labels para tipos de comida
const MEAL_LABELS: Record<MealType, { es: string; en: string }> = {
  breakfast: { es: 'Desayuno', en: 'Breakfast' },
  lunch: { es: 'Almuerzo', en: 'Lunch' },
  dinner: { es: 'Cena', en: 'Dinner' },
  snack: { es: 'Snack', en: 'Snack' },
  dessert: { es: 'Postre', en: 'Dessert' },
};

const MEAL_EMOJIS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍿',
  dessert: '🍰',
};

export function RecipeIdeasList({
  ideas,
  savedIdeas,
  selectedIdea,
  onSelectIdea,
  onGenerateRecipe,
  onDeleteIdea,
  isGenerating,
  locale,
}: RecipeIdeasListProps) {
  const [showSavedIdeas, setShowSavedIdeas] = useState(false);
  const [filterProtein, setFilterProtein] = useState<ProteinType | null>(null);
  const [filterMeal, setFilterMeal] = useState<MealType | null>(null);

  const isSpanish = locale === 'es';

  // Combinar ideas actuales con guardadas si se muestra el historial
  // Single-pass filter para mejor rendimiento con muchas ideas
  const displayedIdeas = useMemo(() => {
    const source = showSavedIdeas ? savedIdeas : ideas;

    return source.filter(idea => {
      if (filterProtein && idea.proteinType !== filterProtein) return false;
      if (filterMeal && idea.mealType !== filterMeal) return false;
      return true;
    });
  }, [ideas, savedIdeas, showSavedIdeas, filterProtein, filterMeal]);

  // Obtener tipos de proteína únicos para filtros
  const availableProteins = useMemo(() => {
    const source = showSavedIdeas ? savedIdeas : ideas;
    return [...new Set(source.map(i => i.proteinType))];
  }, [ideas, savedIdeas, showSavedIdeas]);

  // Obtener tipos de comida únicos para filtros
  const availableMeals = useMemo(() => {
    const source = showSavedIdeas ? savedIdeas : ideas;
    return [...new Set(source.map(i => i.mealType))];
  }, [ideas, savedIdeas, showSavedIdeas]);

  const clearFilters = () => {
    setFilterProtein(null);
    setFilterMeal(null);
  };

  const hasFilters = filterProtein !== null || filterMeal !== null;

  if (ideas.length === 0 && savedIdeas.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header con toggle para ideas guardadas */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {showSavedIdeas
              ? (isSpanish ? 'Ideas Guardadas' : 'Saved Ideas')
              : (isSpanish ? 'Ideas de Recetas' : 'Recipe Ideas')}
          </h3>
          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-bold rounded-full">
            {displayedIdeas.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {savedIdeas.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSavedIdeas(!showSavedIdeas);
                clearFilters();
              }}
              icon={<History className="h-4 w-4" />}
              className={cn(
                showSavedIdeas && "bg-orange-50 dark:bg-orange-900/30 text-orange-600"
              )}
            >
              {showSavedIdeas
                ? (isSpanish ? 'Ver Nuevas' : 'View New')
                : (isSpanish ? 'Ver Guardadas' : 'View Saved')}
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {(availableProteins.length > 1 || availableMeals.length > 1) && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-500">
            {isSpanish ? 'Filtrar:' : 'Filter:'}
          </span>

          {/* Filtros de proteína */}
          {availableProteins.map(protein => (
            <button
              key={protein}
              onClick={() => setFilterProtein(filterProtein === protein ? null : protein)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
                filterProtein === protein
                  ? "bg-orange-500 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/30"
              )}
            >
              <span>{PROTEIN_EMOJIS[protein]}</span>
              <span>{PROTEIN_LABELS[protein][locale]}</span>
            </button>
          ))}

          {/* Separador */}
          {availableProteins.length > 0 && availableMeals.length > 0 && (
            <span className="text-gray-300 dark:text-gray-600">|</span>
          )}

          {/* Filtros de tipo de comida */}
          {availableMeals.map(meal => (
            <button
              key={meal}
              onClick={() => setFilterMeal(filterMeal === meal ? null : meal)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
                filterMeal === meal
                  ? "bg-purple-500 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              )}
            >
              <span>{MEAL_EMOJIS[meal]}</span>
              <span>{MEAL_LABELS[meal][locale]}</span>
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

      {/* Grid de ideas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {displayedIdeas.map((idea, index) => {
            const isSelected = selectedIdea?.id === idea.id;

            return (
              <motion.button
                key={idea.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelectIdea(isSelected ? null : idea)}
                className={cn(
                  "relative p-4 rounded-xl text-left transition-all duration-200 group",
                  "border-2 hover:shadow-md",
                  isSelected
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg ring-2 ring-orange-500/30"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300",
                  idea.isUsed && "opacity-60"
                )}
              >
                {/* Indicador de selección */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-md"
                  >
                    <Check className="h-4 w-4 text-white" />
                  </motion.div>
                )}

                {/* Indicador de usada */}
                {idea.isUsed && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold rounded">
                    {isSpanish ? 'Usada' : 'Used'}
                  </span>
                )}

                {/* Emoji de proteína y título */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-2xl flex-shrink-0">{PROTEIN_EMOJIS[idea.proteinType]}</span>
                  <h4 className="font-bold text-gray-900 dark:text-white leading-tight">
                    {idea.title}
                  </h4>
                </div>

                {/* Descripción - completa si está seleccionada, truncada si no */}
                <p className={cn(
                  "text-sm text-gray-600 dark:text-gray-400 mb-3",
                  !isSelected && "line-clamp-2"
                )}>
                  {idea.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-medium rounded-full">
                      {MEAL_EMOJIS[idea.mealType]} {MEAL_LABELS[idea.mealType][locale]}
                    </span>
                    {idea.vibes.slice(0, 2).map(vibe => (
                      <span
                        key={vibe}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-medium rounded-full"
                      >
                        {vibe}
                      </span>
                    ))}
                  </div>
                  {showSavedIdeas && onDeleteIdea && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteIdea(idea.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 rounded"
                      title={isSpanish ? 'Eliminar idea' : 'Delete idea'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mensaje si no hay resultados con filtros */}
      {displayedIdeas.length === 0 && hasFilters && (
        <div className="text-center py-8 text-gray-500">
          <p>{isSpanish ? 'No hay ideas con estos filtros' : 'No ideas match these filters'}</p>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2">
            {isSpanish ? 'Limpiar filtros' : 'Clear filters'}
          </Button>
        </div>
      )}

      {/* Botón de generar receta */}
      <AnimatePresence>
        {selectedIdea && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-4 z-10"
          >
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 rounded-xl shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-white">
                  <ChefHat className="h-6 w-6" />
                  <div>
                    <p className="font-bold">{selectedIdea.title}</p>
                    <p className="text-sm text-orange-100">
                      {isSpanish ? 'Idea seleccionada' : 'Selected idea'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={onGenerateRecipe}
                  loading={isGenerating}
                  icon={!isGenerating && <Sparkles className="h-5 w-5" />}
                  className="bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-lg"
                >
                  {isGenerating
                    ? (isSpanish ? 'Generando...' : 'Generating...')
                    : (isSpanish ? 'Generar Receta Completa' : 'Generate Full Recipe')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
