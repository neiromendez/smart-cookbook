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
  Calculator,
  ListFilter,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StorageService } from '@/lib/services/storage.service';
import type { Ingredient } from '@/types';
import { cn } from '@/lib/utils/cn';
import { consolidateIngredients } from '@/lib/utils/ingredient-consolidator';

interface ShoppingListProps {
  onClose?: () => void;
}

interface GroupedIngredients {
  recipeTitle: string;
  items: (Ingredient & { originalIndex: number })[];
}

/**
 * ProgressRing - Visualiza el progreso circular
 */
function ProgressRing({ completion }: { completion: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completion / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          className="text-orange-500"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-gray-700 dark:text-gray-300">
        {Math.round(completion)}%
      </span>
    </div>
  );
}

export function ShoppingList({ onClose }: ShoppingListProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';
  const [items, setItems] = useState<Ingredient[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'recipe' | 'consolidated'>('recipe');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('unit');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [copiedRecipe, setCopiedRecipe] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Cargar items del storage
  useEffect(() => {
    const storedItems = StorageService.getShoppingList();
    setItems(storedItems);
    const allGroups = new Set<string>();
    storedItems.forEach(item => {
      allGroups.add(item.recipeTitle || t('shoppingList.views.recipe'));
    });
    setExpandedGroups(allGroups);
  }, [t]);

  const toggleGroup = useCallback((recipeTitle: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(recipeTitle)) next.delete(recipeTitle);
      else next.add(recipeTitle);
      return next;
    });
  }, []);

  // Vista Agrupada por Receta
  const groupedItems = useMemo((): GroupedIngredients[] => {
    const groups: Record<string, (Ingredient & { originalIndex: number })[]> = {};
    const noRecipeKey = t('shoppingList.views.recipe');

    items.forEach((item, index) => {
      const key = item.recipeTitle || noRecipeKey;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ...item, originalIndex: index });
    });

    return Object.entries(groups)
      .sort(([a], [b]) => {
        if (a === noRecipeKey) return 1;
        if (b === noRecipeKey) return -1;
        return a.localeCompare(b);
      })
      .map(([recipeTitle, items]) => ({ recipeTitle, items }));
  }, [items, t]);

  // Vista Consolidada
  const consolidatedItems = useMemo(() => {
    return consolidateIngredients(items);
  }, [items]);

  const handleAddItem = useCallback(() => {
    let name = newItemName.trim();
    let quantity = newItemQuantity.trim();

    if (!name) return;

    // Determinar la etiqueta de la unidad para mostrar
    let unitLabel = selectedUnit;
    if (selectedUnit === 'unit') {
      unitLabel = lang === 'es' ? 'unidades' : 'units';
    }

    // Combinamos la cantidad con la unidad seleccionada
    const amount = quantity ? `${quantity} ${unitLabel}`.trim() : '';

    const newItem: Ingredient = {
      name,
      amount,
    };
    StorageService.addToShoppingList(newItem);
    setItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemQuantity('');
    setIsAddingItem(false);
  }, [newItemName, newItemQuantity, selectedUnit, lang]);

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

  const handleRemoveConsolidated = useCallback((name: string) => {
    if (confirm(t('shoppingList.actions.clearAll') + ` "${name}"?`)) {
      const lowerName = name.toLowerCase().trim();
      const indicesToRemove = items
        .map((item, index) => ({ name: item.name.toLowerCase().trim(), index }))
        .filter(item => item.name === lowerName)
        .map(item => item.index)
        .sort((a, b) => b - a);

      indicesToRemove.forEach(index => StorageService.removeFromShoppingList(index));
      setItems(prev => prev.filter(item => item.name.toLowerCase().trim() !== lowerName));
      setCheckedItems(new Set()); // Reset checks to avoid index mismatch
    }
  }, [items, t]);

  const handleRemoveRecipe = useCallback((recipeTitle: string) => {
    if (confirm(t('shoppingList.actions.clearAll') + ` "${recipeTitle}"?`)) {
      // Filtrar items que no pertenezcan a esta receta
      const newItems = items.filter(item => (item.recipeTitle || t('shoppingList.views.recipe')) !== recipeTitle);

      // Actualizar localStorage completamente para mantener consistencia
      StorageService.clearShoppingList();
      newItems.forEach(item => StorageService.addToShoppingList(item));

      setItems(newItems);
      setCheckedItems(new Set()); // Reset checks for simplicity
    }
  }, [items, t]);

  const handleToggleItem = useCallback((index: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleClearChecked = useCallback(() => {
    const sortedChecked = Array.from(checkedItems).sort((a, b) => b - a);
    sortedChecked.forEach(index => StorageService.removeFromShoppingList(index));
    setItems(prev => prev.filter((_, i) => !checkedItems.has(i)));
    setCheckedItems(new Set());
  }, [checkedItems]);

  const handleClearAll = useCallback(() => {
    if (confirm(t('shoppingList.actions.clearAll') + '?')) {
      StorageService.clearShoppingList();
      setItems([]);
      setCheckedItems(new Set());
    }
  }, [t]);

  const handleCopyRecipe = useCallback(async (group: GroupedIngredients) => {
    const text = group.items
      .map(item => `${checkedItems.has(item.originalIndex) ? '✓' : '○'} ${item.amount ? item.amount + ' ' : ''}${item.name}`)
      .join('\n');
    const header = `🍽️ ${group.recipeTitle}\n${'─'.repeat(20)}\n`;
    try {
      await navigator.clipboard.writeText(header + text);
      setCopiedRecipe(group.recipeTitle);
      setTimeout(() => setCopiedRecipe(null), 2000);
    } catch (err) { console.error('Error copying:', err); }
  }, [checkedItems]);

  const handleCopyConsolidated = useCallback(async () => {
    const text = consolidatedItems
      .map(item => `○ ${item.amount ? item.amount + ' ' : ''}${item.name}`)
      .join('\n');
    const header = `📋 ${t('shoppingList.tabs.consolidated')}\n${'─'.repeat(20)}\n`;
    try {
      await navigator.clipboard.writeText(header + text);
      setCopiedRecipe('consolidated');
      setTimeout(() => setCopiedRecipe(null), 2000);
    } catch (err) { console.error('Error copying:', err); }
  }, [consolidatedItems, t]);

  const completionRate = items.length > 0 ? (checkedItems.size / items.length) * 100 : 0;
  const pendingCount = items.length - checkedItems.size;

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="pb-4 px-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <ProgressRing completion={completionRate} />
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                {t('shoppingList.title')}
              </CardTitle>
              <p className="text-xs text-gray-500">
                {pendingCount} {t('shoppingList.stats.pending')}
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-8 w-8 p-0">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* View Switcher */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4">
          <button
            onClick={() => setActiveTab('recipe')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === 'recipe'
                ? "bg-white dark:bg-gray-700 text-orange-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <ListFilter className="h-4 w-4" />
            {t('shoppingList.views.recipe')}
          </button>
          <button
            onClick={() => setActiveTab('consolidated')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === 'consolidated'
                ? "bg-white dark:bg-gray-700 text-orange-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <Calculator className="h-4 w-4" />
            {t('shoppingList.views.consolidated')}
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddingItem(true)}
            className="rounded-full bg-orange-500 hover:bg-orange-600 text-white shrink-0"
            icon={<Plus className="h-4 w-4" />}
          >
            {t('shoppingList.actions.add')}
          </Button>
          <div className="flex gap-2 shrink-0">
            {checkedItems.size > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearChecked} className="rounded-full">
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleClearAll} className="rounded-full text-red-500 border-red-200 dark:border-red-900/50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 space-y-4">
        <AnimatePresence>
          {isAddingItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30"
            >
              <div className="space-y-3">
                <Input
                  placeholder={t('shoppingList.actions.add')}
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                  className="bg-white dark:bg-gray-800 border-none shadow-sm"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['g', 'kg', 'ml', 'L', 'lb', 'oz', 'unit', 'taza', 'cda'].map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setSelectedUnit(u)}
                      className={cn(
                        "px-2 py-1 text-[10px] font-bold rounded-md border transition-all",
                        selectedUnit === u
                          ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-500 hover:text-orange-500"
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.5, 1, 250..."
                    value={newItemQuantity}
                    onChange={(e) => {
                      // Permitir solo números y punto/diagonal para fracciones
                      const val = e.target.value.replace(/[^0-9./]/g, '');
                      setNewItemQuantity(val);
                    }}
                    className="flex-1 bg-white dark:bg-gray-800 border-none shadow-sm"
                  />
                  <Button variant="primary" size="sm" onClick={handleAddItem} disabled={!newItemName.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsAddingItem(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-[300px] max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-orange-200 dark:scrollbar-thumb-orange-900/30">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-10 w-10 opacity-20" />
              </div>
              <p className="font-medium text-gray-600 dark:text-gray-300">{t('shoppingList.empty.title')}</p>
              <p className="text-xs px-8 mt-1">{t('shoppingList.empty.subtitle')}</p>
            </div>
          ) : activeTab === 'recipe' ? (
            /* VISTA POR RECETA */
            <div className="space-y-3">
              {groupedItems.map((group) => {
                const isExpanded = expandedGroups.has(group.recipeTitle);
                const checkedInGroup = group.items.filter(i => checkedItems.has(i.originalIndex)).length;
                return (
                  <div key={group.recipeTitle} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={() => toggleGroup(group.recipeTitle)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                          <ChefHat className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{group.recipeTitle}</p>
                          <p className="text-[10px] text-gray-500">
                            {checkedInGroup} / {group.items.length} {t('shoppingList.stats.purchased')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleCopyRecipe(group); }} className="h-8 w-8 p-0 text-gray-400">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleRemoveRecipe(group.recipeTitle); }}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-gray-50 dark:border-gray-700/50">
                          <div className="p-1">
                            {group.items.map((item) => (
                              <IngredientItem
                                key={item.originalIndex}
                                item={item}
                                isChecked={checkedItems.has(item.originalIndex)}
                                onToggle={() => handleToggleItem(item.originalIndex)}
                                onRemove={() => handleRemoveItem(item.originalIndex)}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VISTA CONSOLIDADA */
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex gap-3 items-start border border-blue-100 dark:border-blue-900/30">
                  <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-600 dark:text-blue-400">
                    {t('shoppingList.consolidatedInfo')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyConsolidated}
                  className={cn(
                    "rounded-xl h-auto py-2 transition-all shrink-0",
                    copiedRecipe === 'consolidated' && "bg-green-50 border-green-500 text-green-600 dark:bg-green-900/10"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {copiedRecipe === 'consolidated' ? (
                      <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <CheckCircle className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Copy className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {consolidatedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 font-bold">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{item.name}</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">{item.amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.sources.length > 1 && (
                        <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-[8px] font-bold text-gray-500 uppercase tracking-tight">
                          {item.sources.length} {t('shoppingList.stats.recipes')}
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveConsolidated(item.name)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface IngredientItemProps {
  item: Ingredient & { originalIndex?: number };
  isChecked: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

/**
 * Sub-componente para cada item de la lista
 */
function IngredientItem({ item, isChecked, onToggle, onRemove }: IngredientItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer group",
        isChecked ? "opacity-50" : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
      )}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
          isChecked ? "bg-green-500 border-green-500 text-white" : "border-gray-300 dark:border-gray-600"
        )}>
          {isChecked && <Check className="h-3 w-3" />}
        </div>
        <div className="min-w-0">
          <p className={cn(
            "text-sm font-medium truncate",
            isChecked && "line-through text-gray-400"
          )}>
            {item.name}
          </p>
          {item.amount && (
            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-950/30 px-1 rounded inline-block">
              {item.amount}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {item.isAllergen && (
          <span className="text-xs bg-red-100 p-0.5 rounded" title="Allergen">⚠️</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
