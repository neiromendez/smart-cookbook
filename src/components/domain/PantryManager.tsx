'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { StorageService } from '@/lib/services/storage.service';
import { cn } from '@/lib/utils/cn';

/**
 * PantryManager - Gestiona los ingredientes basicos (staples)
 */
export function PantryManager() {
    const { t } = useTranslation();
    const [items, setItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');
    const [search, setSearch] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);

    // Cargar desde storage
    useEffect(() => {
        setItems(StorageService.getPantry());
    }, []);

    const handleAdd = () => {
        if (!newItem.trim()) return;
        const updated = [...new Set([...items, newItem.trim().toLowerCase()])];
        setItems(updated);
        StorageService.setPantry(updated);
        setNewItem('');
    };

    const handleRemove = (itemToRemove: string) => {
        const updated = items.filter(it => it !== itemToRemove);
        setItems(updated);
        StorageService.setPantry(updated);
    };

    const filteredItems = items
        .filter(it => it.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.localeCompare(b));

    const SUGGESTIONS = [
        'salt', 'pepper', 'oliveOil', 'garlic', 'onion',
        'flour', 'sugar', 'rice', 'pasta', 'eggs', 'milk'
    ];

    const availableSuggestions = SUGGESTIONS.filter(s =>
        !items.includes(t(`pantry.items.${s}`).toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-lg text-orange-600">
                    <Package className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{t('pantry.title')}</h3>
                    <p className="text-[10px] text-gray-500">{t('pantry.subtitle')}</p>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-4"
                    >
                        <div className="flex gap-2">
                            <Input
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder={t('pantry.addPlaceholder')}
                                onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                                className="flex-1 min-w-0"
                            />
                            <Button onClick={handleAdd} disabled={!newItem.trim()}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Sugerencias Rápidas */}
                        {availableSuggestions.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                                    {t('pantry.suggestions')}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {availableSuggestions.map(s => {
                                        const localizedName = t(`pantry.items.${s}`);
                                        return (
                                            <button
                                                key={s}
                                                onClick={() => {
                                                    const updated = [...new Set([...items, localizedName.toLowerCase()])];
                                                    setItems(updated);
                                                    StorageService.setPantry(updated);
                                                }}
                                                className="text-[10px] bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full transition-colors border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
                                            >
                                                + {localizedName}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {items.length === 0 && (
                            <div className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-400">
                                    <Search className="h-5 w-5" />
                                </div>
                                <p className="text-xs text-gray-500">{t('pantry.empty')}</p>
                            </div>
                        )}

                        {items.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Search className="h-3 w-3 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={t('pantry.search')}
                                        className="text-xs bg-transparent border-none focus:ring-0 text-gray-600 dark:text-gray-400 w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <AnimatePresence>
                                        {filteredItems.map(item => (
                                            <motion.div
                                                key={item}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                className="flex items-center justify-between gap-1.5 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 shadow-sm"
                                            >
                                                <span className="capitalize truncate flex-1">{item}</span>
                                                <button
                                                    onClick={() => handleRemove(item)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
