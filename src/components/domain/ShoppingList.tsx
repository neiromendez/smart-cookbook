'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Check,
  X,
  Share2,
  CheckCircle,
  Circle,
  Copy,
  ChefHat,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StorageService } from '@/lib/services/storage.service';
import type { Ingredient } from '@/types';
import { cn } from '@/lib/utils/cn';

interface ShoppingListProps {
  onClose?: () => void;
}

interface GroupedIngredients {
  recipeTitle: string;
  items: (Ingredient & { originalIndex: number })[];
}

/**
 * ShoppingList - UI para gestionar la lista de compras
 *
 * Features:
 * - Ver ingredientes agrupados por receta
 * - Marcar como comprados
 * - Copiar lista por receta
 * - Añadir items manualmente
 * - Exportar/Compartir lista completa
 * - Limpiar lista
 */
export function ShoppingList({ onClose }: ShoppingListProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  const [items, setItems] = useState<Ingredient[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [copiedRecipe, setCopiedRecipe] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Cargar items del storage
  useEffect(() => {
    const storedItems = StorageService.getShoppingList();
    setItems(storedItems);
    // Expandir todos los grupos por defecto
    const noRecipeKey = lang === 'es' ? 'Sin receta' : 'No recipe';
    const allGroups = new Set<string>();
    storedItems.forEach(item => {
      allGroups.add(item.recipeTitle || noRecipeKey);
    });
    setExpandedGroups(allGroups);
  }, [lang]);

  // Toggle para expandir/colapsar grupo
  const toggleGroup = useCallback((recipeTitle: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(recipeTitle)) {
        next.delete(recipeTitle);
      } else {
        next.add(recipeTitle);
      }
      return next;
    });
  }, []);

  // Agrupar ingredientes por receta
  const groupedItems = useMemo((): GroupedIngredients[] => {
    const groups: Record<string, (Ingredient & { originalIndex: number })[]> = {};
    const noRecipeKey = lang === 'es' ? 'Sin receta' : 'No recipe';

    items.forEach((item, index) => {
      const key = item.recipeTitle || noRecipeKey;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push({ ...item, originalIndex: index });
    });

    // Ordenar: recetas con nombre primero, "Sin receta" al final
    return Object.entries(groups)
      .sort(([a], [b]) => {
        if (a === noRecipeKey) return 1;
        if (b === noRecipeKey) return -1;
        return a.localeCompare(b);
      })
      .map(([recipeTitle, items]) => ({ recipeTitle, items }));
  }, [items, lang]);

  const handleAddItem = useCallback(() => {
    if (!newItemName.trim()) return;

    const newItem: Ingredient = {
      name: newItemName.trim(),
      amount: newItemAmount.trim() || '',
    };

    StorageService.addToShoppingList(newItem);
    setItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemAmount('');
    setIsAddingItem(false);
  }, [newItemName, newItemAmount]);

  const handleRemoveItem = useCallback((index: number) => {
    StorageService.removeFromShoppingList(index);
    setItems(prev => prev.filter((_, i) => i !== index));
    setCheckedItems(prev => {
      const next = new Set<number>();
      prev.forEach(i => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  }, []);

  const handleToggleItem = useCallback((index: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleClearChecked = useCallback(() => {
    // Eliminar items marcados (de mayor a menor para no romper indices)
    const sortedChecked = Array.from(checkedItems).sort((a, b) => b - a);
    sortedChecked.forEach(index => {
      StorageService.removeFromShoppingList(index);
    });
    setItems(prev => prev.filter((_, i) => !checkedItems.has(i)));
    setCheckedItems(new Set());
  }, [checkedItems]);

  const handleClearAll = useCallback(() => {
    const confirmMessage = lang === 'es'
      ? '¿Borrar toda la lista de compras?'
      : 'Clear entire shopping list?';

    if (confirm(confirmMessage)) {
      StorageService.clearShoppingList();
      setItems([]);
      setCheckedItems(new Set());
    }
  }, [lang]);

  // Copiar lista de una receta específica
  const handleCopyRecipe = useCallback(async (group: GroupedIngredients) => {
    const text = group.items
      .map(item => `${checkedItems.has(item.originalIndex) ? '✓' : '○'} ${item.amount ? item.amount + ' ' : ''}${item.name}`)
      .join('\n');

    const header = `🍽️ ${group.recipeTitle}\n${'─'.repeat(20)}\n`;
    const fullText = header + text;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedRecipe(group.recipeTitle);
      setTimeout(() => setCopiedRecipe(null), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    }
  }, [checkedItems]);

  // Exportar lista completa
  const handleExport = useCallback(async () => {
    const sections = groupedItems.map(group => {
      const itemsText = group.items
        .map(item => `${checkedItems.has(item.originalIndex) ? '✓' : '○'} ${item.amount ? item.amount + ' ' : ''}${item.name}`)
        .join('\n');
      return `🍽️ ${group.recipeTitle}\n${itemsText}`;
    }).join('\n\n');

    const title = lang === 'es' ? '🛒 Lista de Compras' : '🛒 Shopping List';
    const fullText = `${title}\n${'═'.repeat(20)}\n\n${sections}`;

    if (navigator.share) {
      await navigator.share({
        title: lang === 'es' ? 'Lista de Compras' : 'Shopping List',
        text: fullText,
      });
    } else {
      await navigator.clipboard.writeText(fullText);
      alert(lang === 'es' ? 'Lista copiada al portapapeles' : 'List copied to clipboard');
    }
  }, [groupedItems, checkedItems, lang]);

  const pendingCount = items.length - checkedItems.size;
  const checkedCount = checkedItems.size;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-orange-500" />
            {lang === 'es' ? 'Lista de Compras' : 'Shopping List'}
            {items.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-full">
                {pendingCount}
              </span>
            )}
          </CardTitle>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Acciones */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingItem(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            {lang === 'es' ? 'Añadir' : 'Add'}
          </Button>
          {checkedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChecked}
              icon={<Check className="h-4 w-4" />}
            >
              {lang === 'es' ? 'Limpiar Marcados' : 'Clear Checked'} ({checkedCount})
            </Button>
          )}
          {items.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                icon={<Share2 className="h-4 w-4" />}
              >
                {lang === 'es' ? 'Compartir Todo' : 'Share All'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-red-500 hover:text-red-600"
                icon={<Trash2 className="h-4 w-4" />}
              >
                {lang === 'es' ? 'Borrar Todo' : 'Clear All'}
              </Button>
            </>
          )}
        </div>

        {/* Formulario para añadir item */}
        <AnimatePresence>
          {isAddingItem && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                <Input
                  placeholder={lang === 'es' ? 'Nombre del producto...' : 'Product name...'}
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Input
                    placeholder={lang === 'es' ? 'Cantidad (opcional)' : 'Amount (optional)'}
                    value={newItemAmount}
                    onChange={e => setNewItemAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddItem}
                    disabled={!newItemName.trim()}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    {lang === 'es' ? 'Añadir' : 'Add'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingItem(false);
                      setNewItemName('');
                      setNewItemAmount('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de items agrupada por receta */}
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {lang === 'es' ? 'Tu lista de compras está vacía' : 'Your shopping list is empty'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {lang === 'es'
                ? 'Los ingredientes de las recetas aparecerán aquí'
                : 'Recipe ingredients will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {groupedItems.map((group) => {
                const isExpanded = expandedGroups.has(group.recipeTitle);
                const checkedInGroup = group.items.filter(i => checkedItems.has(i.originalIndex)).length;

                return (
                  <motion.div
                    key={group.recipeTitle}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden"
                  >
                    {/* Header de la receta - clickeable para expandir/colapsar */}
                    <div
                      className={cn(
                        "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors",
                        "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
                        "hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-950/50 dark:hover:to-amber-950/50",
                        !isExpanded && "rounded-xl"
                      )}
                      onClick={() => toggleGroup(group.recipeTitle)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Chevron para indicar estado */}
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        )}
                        <ChefHat className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                          {group.recipeTitle}
                        </span>
                        <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 text-[10px] font-bold rounded-full flex-shrink-0">
                          {checkedInGroup > 0 ? `${checkedInGroup}/${group.items.length}` : group.items.length}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyRecipe(group);
                        }}
                        className={cn(
                          "h-7 px-2 text-xs flex-shrink-0",
                          copiedRecipe === group.recipeTitle && "text-green-600 dark:text-green-400"
                        )}
                      >
                        {copiedRecipe === group.recipeTitle ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            {lang === 'es' ? '¡Copiado!' : 'Copied!'}
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            {lang === 'es' ? 'Copiar' : 'Copy'}
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Items de la receta - con animación de colapso */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-2 space-y-1 border-t border-orange-100 dark:border-orange-900/30">
                            {group.items.map((item) => {
                              const isChecked = checkedItems.has(item.originalIndex);
                              return (
                                <motion.div
                                  key={`${item.name}-${item.originalIndex}`}
                                  layout
                                  className={cn(
                                    'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group',
                                    isChecked
                                      ? 'bg-green-50 dark:bg-green-950/30'
                                      : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  )}
                                  onClick={() => handleToggleItem(item.originalIndex)}
                                >
                                  {/* Checkbox */}
                                  <div className="flex-shrink-0">
                                    {isChecked ? (
                                      <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-gray-400" />
                                    )}
                                  </div>

                                  {/* Contenido */}
                                  <div className="flex-1 min-w-0">
                                    <p className={cn(
                                      'text-sm font-medium truncate',
                                      isChecked
                                        ? 'text-gray-500 line-through'
                                        : 'text-gray-900 dark:text-white'
                                    )}>
                                      {item.name}
                                    </p>
                                    {item.amount && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {item.amount}
                                      </p>
                                    )}
                                  </div>

                                  {/* Alergeno */}
                                  {item.isAllergen && (
                                    <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold rounded">
                                      ⚠️
                                    </span>
                                  )}

                                  {/* Eliminar */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveItem(item.originalIndex);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Resumen */}
        {items.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 text-center">
            {groupedItems.length > 1 && (
              <span className="text-orange-600 dark:text-orange-400 mr-2">
                {groupedItems.length} {lang === 'es' ? 'recetas' : 'recipes'}
              </span>
            )}
            {checkedCount > 0 && (
              <span className="text-green-600 dark:text-green-400">
                ✓ {checkedCount} {lang === 'es' ? 'comprados' : 'purchased'}
              </span>
            )}
            {checkedCount > 0 && pendingCount > 0 && ' • '}
            {pendingCount > 0 && (
              <span>
                {pendingCount} {lang === 'es' ? 'pendientes' : 'pending'}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
