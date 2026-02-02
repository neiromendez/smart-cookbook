/**
 * IngredientConsolidator - Utility for merging identical ingredients and summing their amounts.
 */

import type { Ingredient } from '@/types';

interface ConsolidatedIngredient extends Ingredient {
    totalAmount: number;
    unit: string;
    isConsolidated: boolean;
    sources: string[]; // Recipe titles where this ingredient comes from
}

/**
 * Normalizes an amount string like "500g", "1.5 kg", "2 units" into a numeric value and a unit.
 */
function parseAmount(amountStr: string): { value: number; unit: string } {
    const normalized = amountStr.toLowerCase().trim();

    // Match number and unit (e.g., "500g", "1.5 kg", "2", "1/2 cup")
    // Support fractions like 1/2 or 0.5
    const match = normalized.match(/^([\d./]+)\s*(g|gr|gramos|kg|kilos?|ml|l|oz|onzas?|lb|libras?|cups?|tazas?|tbsp|cda|cucharadas?|tsp|cdta|cucharaditas?|items?|units?|unidades?|piezas?|ramitos?)?$/i);

    if (!match) {
        return { value: 0, unit: amountStr }; // Return raw string if not parsable
    }

    let valueStr = match[1];
    let value = 0;

    // Handle fractions like "1/2"
    if (valueStr.includes('/')) {
        const [num, den] = valueStr.split('/').map(Number);
        value = num / den;
    } else {
        value = parseFloat(valueStr);
    }

    let unit = match[2] || '';

    // Normalize units for summing
    if (['kg', 'kilo', 'kilos'].includes(unit)) {
        value *= 1000;
        unit = 'g';
    } else if (unit === 'l') {
        value *= 1000;
        unit = 'ml';
    } else if (['lb', 'libra', 'libras'].includes(unit)) {
        value *= 453.59;
        unit = 'g';
    } else if (['oz', 'onza', 'onzas'].includes(unit)) {
        value *= 28.35;
        unit = 'g';
    } else if (['gr', 'gramos'].includes(unit)) {
        unit = 'g';
    }

    return { value, unit };
}

/**
 * Formats a numeric value back into a readable string.
 */
function formatAmount(value: number, unit: string): string {
    if (value === 0) return unit;

    // Convert back to larger units if appropriate
    if (unit === 'g' && value >= 1000) {
        return `${(value / 1000).toFixed(1).replace(/\.0$/, '')} kg`;
    }
    if (unit === 'ml' && value >= 1000) {
        return `${(value / 1000).toFixed(1).replace(/\.0$/, '')} L`;
    }

    return `${value} ${unit}`.trim();
}

/**
 * Consolidates a list of ingredients.
 */
export function consolidateIngredients(items: Ingredient[]): ConsolidatedIngredient[] {
    const ingredientsMap = new Map<string, ConsolidatedIngredient>();

    items.forEach(item => {
        const nameKey = item.name.toLowerCase().trim();
        const { value, unit } = parseAmount(item.amount);

        if (ingredientsMap.has(nameKey)) {
            const existing = ingredientsMap.get(nameKey)!;

            // Only sum if units are compatible or if one is empty
            if (existing.unit === unit || !existing.unit || !unit) {
                existing.totalAmount += value;
                if (!existing.unit) existing.unit = unit;
            }

            if (item.recipeTitle && !existing.sources.includes(item.recipeTitle)) {
                existing.sources.push(item.recipeTitle);
            }

            existing.isConsolidated = true;
            existing.isAllergen = existing.isAllergen || item.isAllergen;
            existing.amount = formatAmount(existing.totalAmount, existing.unit);
        } else {
            ingredientsMap.set(nameKey, {
                ...item,
                totalAmount: value,
                unit: unit,
                isConsolidated: false,
                sources: item.recipeTitle ? [item.recipeTitle] : [],
            });
        }
    });

    return Array.from(ingredientsMap.values());
}
