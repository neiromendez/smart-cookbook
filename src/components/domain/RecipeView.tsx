'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Users,
  ChefHat,
  ShoppingCart,
  Printer,
  Share2,
  Heart,
  AlertTriangle,
  Flame,
  CheckCircle,
  Circle,
  Timer,
  Lightbulb,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { StorageService } from '@/lib/services/storage.service';
import type { Recipe, Ingredient } from '@/types';
import { ChefMode } from './chef-mode/ChefMode';
import { cn } from '@/lib/utils/cn';

interface RecipeViewProps {
  recipe: Recipe;
  onClose?: () => void;
  onAddToHistory?: () => void;
}

/**
 * RecipeView - Componente presentacional premium para mostrar recetas
 *
 * Features:
 * - Vista estructurada de la receta
 * - Checkbox para instrucciones completadas
 * - Timers interactivos
 * - Añadir a lista de compras
 * - Compartir/Imprimir
 */
export function RecipeView({ recipe, onClose, onAddToHistory }: RecipeViewProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeTimer, setActiveTimer] = useState<{ label: string; seconds: number; total: number } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isChefModeOpen, setIsChefModeOpen] = useState(false);

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleAddToShoppingList = () => {
    recipe.ingredients.forEach(ing => {
      StorageService.addToShoppingList(ing);
    });
    alert(lang === 'es' ? '¡Ingredientes añadidos a la lista de compras!' : 'Ingredients added to shopping list!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `${recipe.title}\n\nIngredientes:\n${recipe.ingredients.map(i => `- ${i.amount} ${i.name}`).join('\n')}\n\nInstrucciones:\n${recipe.instructions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

    if (navigator.share) {
      await navigator.share({
        title: recipe.title,
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert(lang === 'es' ? 'Receta copiada al portapapeles' : 'Recipe copied to clipboard');
    }
  };

  const startTimer = (minutes: number, label: string) => {
    setActiveTimer({
      label,
      seconds: minutes * 60,
      total: minutes * 60,
    });
  };

  const totalTime = recipe.prepTime + recipe.cookTime;
  const progress = (completedSteps.size / recipe.instructions.length) * 100;

  return (
    <Card className="overflow-hidden print:shadow-none">
      {/* Header con titulo y acciones */}
      <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors print:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <ChefHat className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{recipe.title}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-white/90">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{totalTime} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{recipe.servings} {lang === 'es' ? 'porciones' : 'servings'}</span>
              </div>
              {recipe.nutrients && (
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4" />
                  <span>{recipe.nutrients.calories} kcal</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/80 mb-1">
            <span>{lang === 'es' ? 'Progreso' : 'Progress'}</span>
            <span>{completedSteps.size}/{recipe.instructions.length}</span>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <Button
              size="sm"
              className="bg-white text-orange-600 hover:bg-orange-50 shrink-0 font-bold"
              onClick={() => setIsChefModeOpen(true)}
              icon={<ChefHat className="h-4 w-4" />}
            >
              {t('chefMode.enter')}
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Acciones rapidas */}
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToShoppingList}
            icon={<ShoppingCart className="h-4 w-4" />}
          >
            {lang === 'es' ? 'Lista de Compras' : 'Shopping List'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="h-4 w-4" />}
          >
            {lang === 'es' ? 'Imprimir' : 'Print'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            icon={<Share2 className="h-4 w-4" />}
          >
            {lang === 'es' ? 'Compartir' : 'Share'}
          </Button>
          <Button
            variant={isFavorite ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setIsFavorite(!isFavorite);
              if (!isFavorite && onAddToHistory) {
                onAddToHistory();
              }
            }}
            icon={<Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />}
          >
            {isFavorite ? (lang === 'es' ? 'Guardada' : 'Saved') : (lang === 'es' ? 'Guardar' : 'Save')}
          </Button>
        </div>

        {/* Advertencia de alergenos */}
        {recipe.allergenNotice && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200 text-sm">
                {lang === 'es' ? 'Aviso de Alérgenos' : 'Allergen Notice'}
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm">{recipe.allergenNotice}</p>
            </div>
          </div>
        )}

        {/* Tiempos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">
              {lang === 'es' ? 'Preparación' : 'Prep Time'}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{recipe.prepTime}</p>
            <p className="text-sm text-gray-500">{lang === 'es' ? 'minutos' : 'minutes'}</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">
              {lang === 'es' ? 'Cocción' : 'Cook Time'}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{recipe.cookTime}</p>
            <p className="text-sm text-gray-500">{lang === 'es' ? 'minutos' : 'minutes'}</p>
          </div>
        </div>

        {/* Nutrientes */}
        {recipe.nutrients && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: lang === 'es' ? 'Calorías' : 'Calories', value: recipe.nutrients.calories, unit: 'kcal' },
              { label: lang === 'es' ? 'Proteína' : 'Protein', value: recipe.nutrients.protein, unit: 'g' },
              { label: lang === 'es' ? 'Carbos' : 'Carbs', value: recipe.nutrients.carbs, unit: 'g' },
              { label: lang === 'es' ? 'Grasas' : 'Fat', value: recipe.nutrients.fat, unit: 'g' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-center border border-orange-100 dark:border-orange-900">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">{label}</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{value}</p>
                <p className="text-[10px] text-gray-400">{unit}</p>
              </div>
            ))}
          </div>
        )}

        {/* Ingredientes */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            📦 {lang === 'es' ? 'Ingredientes' : 'Ingredients'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recipe.ingredients.map((ingredient, index) => (
              <IngredientItem key={index} ingredient={ingredient} />
            ))}
          </div>
        </div>

        {/* Instrucciones */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            👨‍🍳 {lang === 'es' ? 'Instrucciones' : 'Instructions'}
          </h3>
          <div className="space-y-3">
            {recipe.instructions.map((instruction, index) => (
              <InstructionStep
                key={index}
                index={index}
                instruction={instruction}
                isCompleted={completedSteps.has(index)}
                onToggle={() => toggleStep(index)}
                onStartTimer={(mins) => startTimer(mins, `Paso ${index + 1}`)}
                lang={lang}
              />
            ))}
          </div>
        </div>

        {/* Tips */}
        {recipe.tips && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm mb-1">
                  💡 {lang === 'es' ? 'Consejos del Chef' : 'Chef Tips'}
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">{recipe.tips}</p>
              </div>
            </div>
          </div>
        )}

        {/* Proveedor */}
        <p className="text-xs text-gray-400 text-center">
          {lang === 'es' ? 'Generada con' : 'Generated with'} {recipe.provider} • {new Date(recipe.generatedAt).toLocaleDateString()}
        </p>
      </CardContent>

      {/* Timer flotante */}
      {activeTimer && (
        <TimerOverlay
          timer={activeTimer}
          onClose={() => setActiveTimer(null)}
          onTick={(seconds) => setActiveTimer(prev => prev ? { ...prev, seconds } : null)}
          lang={lang}
        />
      )}

      {/* Chef Mode Modal */}
      <AnimatePresence>
        {isChefModeOpen && (
          <ChefMode
            recipe={recipe}
            onClose={() => setIsChefModeOpen(false)}
          />
        )}
      </AnimatePresence>
    </Card>
  );
}

// Componente para cada ingrediente
function IngredientItem({ ingredient }: { ingredient: Ingredient }) {
  return (
    <div className={cn(
      'flex items-center gap-2 p-2 rounded-lg',
      ingredient.isAllergen
        ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
        : 'bg-gray-50 dark:bg-gray-800'
    )}>
      {ingredient.isAllergen && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
      <span className="font-medium text-gray-900 dark:text-white text-sm flex-1">
        {ingredient.name}
      </span>
      {ingredient.amount && (
        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
          {ingredient.amount}
        </span>
      )}
    </div>
  );
}

// Componente para cada paso de instruccion
interface InstructionStepProps {
  index: number;
  instruction: string;
  isCompleted: boolean;
  onToggle: () => void;
  onStartTimer: (minutes: number) => void;
  lang: 'es' | 'en';
}

function InstructionStep({
  index,
  instruction,
  isCompleted,
  onToggle,
  onStartTimer,
  lang,
}: InstructionStepProps) {
  // Detectar tiempos en la instruccion
  const timeMatch = instruction.match(/(\d+)\s*(?:min|minutos?|minutes?)/i);
  const timeMinutes = timeMatch ? parseInt(timeMatch[1], 10) : null;

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        isCompleted
          ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
      )}
      onClick={onToggle}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isCompleted ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-orange-500 uppercase">
            {lang === 'es' ? 'Paso' : 'Step'} {index + 1}
          </span>
          {timeMinutes && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartTimer(timeMinutes);
              }}
              className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded text-xs font-medium hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors print:hidden"
            >
              <Timer className="h-3 w-3" />
              {timeMinutes} min
            </button>
          )}
        </div>
        <p className={cn(
          'text-sm',
          isCompleted ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'
        )}>
          {instruction}
        </p>
      </div>
    </div>
  );
}

// Overlay del timer
interface TimerOverlayProps {
  timer: { label: string; seconds: number; total: number };
  onClose: () => void;
  onTick: (seconds: number) => void;
  lang: 'es' | 'en';
}

function TimerOverlay({ timer, onClose, onTick, lang }: TimerOverlayProps) {
  // Timer effect
  useState(() => {
    const interval = setInterval(() => {
      if (timer.seconds > 0) {
        onTick(timer.seconds - 1);
      } else {
        // Notificar
        if (typeof window !== 'undefined') {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => { });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  });

  const minutes = Math.floor(timer.seconds / 60);
  const seconds = timer.seconds % 60;
  const progress = (timer.seconds / timer.total) * 100;

  return (
    <motion.div
      initial={{ scale: 0.8, y: 50, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.8, y: 50, opacity: 0 }}
      className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-4 border-2 border-orange-500 w-48 print:hidden"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={cn('h-4 w-4 text-orange-500', timer.seconds > 0 && 'animate-pulse')} />
          <span className="text-xs font-bold uppercase text-gray-400">{timer.label}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="text-3xl font-black text-center tabular-nums text-gray-900 dark:text-white mb-2">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-orange-500 h-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
      {timer.seconds === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-center text-orange-500 font-bold mt-2 animate-bounce uppercase"
        >
          {lang === 'es' ? '¡Tiempo completado!' : 'Time is up!'} 🔔
        </motion.div>
      )}
    </motion.div>
  );
}
