'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Check, AlertCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StorageService } from '@/lib/services/storage.service';
import { cn } from '@/lib/utils/cn';

interface MissingIngredientsDialogProps {
    ingredients: { name: string; amount?: string; recipeTitle?: string }[];
    onClose: () => void;
    onConfirm: (selectedIngredients: { name: string; amount?: string; recipeTitle?: string }[]) => void;
}

export function MissingIngredientsDialog({
    ingredients,
    onClose,
    onConfirm
}: MissingIngredientsDialogProps) {
    const { i18n } = useTranslation();
    const lang = i18n.language as 'es' | 'en';

    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [pantryItems, setPantryItems] = useState<string[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // 1. Cargar despensa
        const pantry = StorageService.getPantry();
        setPantryItems(pantry);

        // 2. Identificar ingredientes faltantes (lógica simple de coincidencia)
        const missingIndices = new Set<number>();

        ingredients.forEach((ing, index) => {
            // Normalización básica para comparación
            const ingName = ing.name.toLowerCase().trim();

            // Verificar si alguna palabra clave del ingrediente está en la despensa
            // Esto es heurístico
            const isPresent = pantry.some(pItem => {
                const pName = pItem.toLowerCase().trim();
                return pName.includes(ingName) || ingName.includes(pName);
            });

            if (!isPresent) {
                missingIndices.add(index);
            }
        });

        setSelectedIndices(missingIndices);
    }, [ingredients]);

    const toggleSelection = (index: number) => {
        setSelectedIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const handleConfirm = () => {
        const selected = ingredients.filter((_, i) => selectedIndices.has(i));
        onConfirm(selected);
        setShowConfirmation(true);

        // Cerrar automáticamente después de mostrar confirmación brevemente
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    const handleCopyList = async () => {
        const selected = ingredients.filter((_, i) => selectedIndices.has(i));
        if (selected.length === 0) return;

        const listText = selected
            .map(ing => ing.amount ? `${ing.name} (${ing.amount})` : ing.name)
            .join('\n');

        const header = lang === 'es' ? '🛒 Lista de Compras:\n' : '🛒 Shopping List:\n';

        try {
            await navigator.clipboard.writeText(header + listText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error al copiar:', err);
        }
    };

    if (showConfirmation) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center text-center max-w-sm w-full shadow-2xl"
                >
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-500">
                        <Check className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {lang === 'es' ? '¡Lista Actualizada!' : 'List Updated!'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {lang === 'es'
                            ? `${selectedIndices.size} ingredientes añadidos a tu lista de compras.`
                            : `${selectedIndices.size} ingredients added to your shopping list.`}
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="w-full max-w-md"
            >
                <Card className="max-h-[85vh] flex flex-col shadow-2xl border-orange-500/20">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-orange-500" />
                            {lang === 'es' ? 'Revisar Lista de Compras' : 'Review Shopping List'}
                        </CardTitle>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-400" />
                        </button>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-0">
                        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 text-sm text-orange-800 dark:text-orange-200 flex gap-3">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p>
                                {lang === 'es'
                                    ? 'Hemos marcado los ingredientes que parecen faltar en tu despensa. Desmarca los que ya tengas.'
                                    : 'We checked items missing from your pantry. Uncheck any you already have.'}
                            </p>
                        </div>

                        <div className="p-2">
                            {ingredients.map((ing, index) => {
                                const isSelected = selectedIndices.has(index);
                                return (
                                    <div
                                        key={index}
                                        onClick={() => toggleSelection(index)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border mb-2",
                                            isSelected
                                                ? "bg-white dark:bg-gray-800 border-orange-500 shadow-sm"
                                                : "bg-gray-50 dark:bg-gray-900 border-transparent opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                            isSelected
                                                ? "bg-orange-500 border-orange-500 text-white"
                                                : "border-gray-300 dark:border-gray-600"
                                        )}>
                                            {isSelected && <Check className="h-4 w-4" />}
                                        </div>

                                        <div className="flex-1">
                                            <span className={cn(
                                                "font-medium block",
                                                isSelected ? "text-gray-900 dark:text-white" : "text-gray-500"
                                            )}>
                                                {ing.name}
                                            </span>
                                            {ing.amount && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 block font-mono">
                                                    {ing.amount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl space-y-3">
                        {/* Botón de copiar */}
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full",
                                copied && "bg-green-50 border-green-500 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            )}
                            onClick={handleCopyList}
                            disabled={selectedIndices.size === 0}
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    {lang === 'es' ? '¡Copiado al portapapeles!' : 'Copied to clipboard!'}
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    {lang === 'es' ? 'Copiar Lista' : 'Copy List'}
                                </>
                            )}
                        </Button>

                        {/* Botones de acción */}
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1" onClick={onClose}>
                                {lang === 'es' ? 'Cancelar' : 'Cancel'}
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-[2]"
                                onClick={handleConfirm}
                                disabled={selectedIndices.size === 0}
                            >
                                {lang === 'es'
                                    ? `Añadir ${selectedIndices.size} Items`
                                    : `Add ${selectedIndices.size} Items`}
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
