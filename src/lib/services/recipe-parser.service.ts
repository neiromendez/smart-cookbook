// Servicio para parsear recetas de markdown a objetos estructurados
// Extrae titulo, ingredientes, instrucciones, tiempos, etc.

import type { Recipe, Ingredient, NutritionalValues } from '@/types';

/**
 * RecipeParserService - Parsea respuestas de IA a objetos Recipe
 *
 * Soporta formatos comunes de IA:
 * - Secciones con ## o ###
 * - Listas con - o *
 * - Tiempos como "15 minutos" o "15 min"
 * - Ingredientes con cantidades
 */
class RecipeParserServiceClass {
  /**
   * Parsea el markdown de una receta a un objeto estructurado
   * @param markdown - Contenido markdown de la receta
   * @param provider - Proveedor de IA usado
   * @param promptId - ID del mensaje del usuario que genero la receta (opcional)
   */
  parse(markdown: string, provider: string, promptId?: string): Recipe {
    const id = this.generateId();
    const title = this.extractTitle(markdown);
    const { prepTime, cookTime } = this.extractTimes(markdown);
    const servings = this.extractServings(markdown);
    const ingredients = this.extractIngredients(markdown);
    const instructions = this.extractInstructions(markdown);
    const tips = this.extractTips(markdown);
    const allergenNotice = this.extractAllergenNotice(markdown);
    const nutrients = this.extractNutrients(markdown);

    return {
      id,
      title,
      prepTime,
      cookTime,
      servings,
      ingredients,
      instructions,
      tips,
      allergenNotice,
      generatedAt: new Date(),
      provider,
      nutrients,
      promptId,
    };
  }

  private generateId(): string {
    return `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extrae el titulo de la receta
   * Busca: ## 🍽️ Titulo o primera linea con ##
   */
  private extractTitle(markdown: string): string {
    // Patron: ## emoji? Titulo
    const titleMatch = markdown.match(/^##\s*[🍽️🍳🥘👨‍🍳]?\s*(.+)$/m);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    // Patron: **Titulo:** o **Receta:**
    const boldMatch = markdown.match(/\*\*(?:Receta|Recipe|Título|Title)[:\s]*(.+?)\*\*/i);
    if (boldMatch) {
      return boldMatch[1].trim();
    }

    // Primera linea no vacia
    const firstLine = markdown.split('\n').find(l => l.trim().length > 0);
    return firstLine?.replace(/^#+\s*/, '').trim() || 'Receta Generada';
  }

  /**
   * Extrae tiempos de preparacion y coccion
   */
  private extractTimes(markdown: string): { prepTime: number; cookTime: number } {
    let prepTime = 15; // Default
    let cookTime = 20; // Default

    // Patrones comunes
    const prepPatterns = [
      /preparaci[oó]n[:\s]*(\d+)\s*(?:min|minutos?)/i,
      /prep(?:\s*time)?[:\s]*(\d+)\s*(?:min|minutes?)/i,
      /⏱️?\s*preparaci[oó]n[:\s]*(\d+)/i,
    ];

    const cookPatterns = [
      /cocci[oó]n[:\s]*(\d+)\s*(?:min|minutos?)/i,
      /cook(?:\s*time)?[:\s]*(\d+)\s*(?:min|minutes?)/i,
      /⏱️?\s*cocci[oó]n[:\s]*(\d+)/i,
      /tiempo[:\s]*(\d+)\s*(?:min|minutos?)/i,
    ];

    for (const pattern of prepPatterns) {
      const match = markdown.match(pattern);
      if (match) {
        prepTime = parseInt(match[1], 10);
        break;
      }
    }

    for (const pattern of cookPatterns) {
      const match = markdown.match(pattern);
      if (match) {
        cookTime = parseInt(match[1], 10);
        break;
      }
    }

    // Buscar tiempo total si no hay individual
    const totalMatch = markdown.match(/tiempo\s*total[:\s]*(\d+)\s*(?:min|minutos?)/i);
    if (totalMatch && prepTime === 15 && cookTime === 20) {
      const total = parseInt(totalMatch[1], 10);
      prepTime = Math.round(total * 0.3);
      cookTime = Math.round(total * 0.7);
    }

    return { prepTime, cookTime };
  }

  /**
   * Extrae numero de porciones
   */
  private extractServings(markdown: string): number {
    const patterns = [
      /(\d+)\s*(?:porciones?|raciones?|servings?|personas?)/i,
      /para\s*(\d+)\s*(?:personas?|porciones?)/i,
      /serves?\s*(\d+)/i,
      /👥\s*(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = markdown.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return 2; // Default
  }

  /**
   * Extrae lista de ingredientes
   */
  private extractIngredients(markdown: string): Ingredient[] {
    const ingredients: Ingredient[] = [];

    // Buscar seccion de ingredientes
    const ingredientSection = this.extractSection(markdown, [
      'ingredientes',
      'ingredients',
      '📦 ingredientes',
      '📦 ingredients',
    ]);

    if (!ingredientSection) {
      return ingredients;
    }

    // Parsear lineas con - o *
    const lines = ingredientSection.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('-') && !trimmed.startsWith('*')) continue;

      const content = trimmed.replace(/^[-*]\s*/, '').trim();
      if (!content) continue;

      const ingredient = this.parseIngredientLine(content);
      ingredients.push(ingredient);
    }

    return ingredients;
  }

  /**
   * Parsea una linea de ingrediente
   * Ejemplos:
   * - 200g pollo
   * - 1 taza de arroz
   * - Sal al gusto
   * - 2 huevos (⚠️ alérgeno)
   */
  private parseIngredientLine(line: string): Ingredient {
    // Detectar alergeno
    const isAllergen = /⚠️|alérgeno|allergen/i.test(line);
    const cleanLine = line.replace(/\(.*?⚠️.*?\)/g, '').replace(/⚠️/g, '').trim();

    // Patrones de cantidad
    const quantityPatterns = [
      /^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|taza|tazas|cup|cups|cucharada|cucharadas|tbsp|tsp|unidad|unidades?|piezas?)\s+(?:de\s+)?(.+)$/i,
      /^(\d+(?:[.,]\d+)?)\s+(.+)$/,
      /^(.+?)\s+al\s+gusto$/i,
    ];

    for (const pattern of quantityPatterns) {
      const match = cleanLine.match(pattern);
      if (match) {
        if (match.length === 4) {
          // Cantidad + unidad + nombre
          return {
            name: match[3].trim(),
            amount: `${match[1]} ${match[2]}`,
            isAllergen,
          };
        } else if (match.length === 3) {
          // Cantidad + nombre
          return {
            name: match[2].trim(),
            amount: match[1],
            isAllergen,
          };
        } else {
          // "al gusto"
          return {
            name: match[1].trim(),
            amount: 'al gusto',
            isAllergen,
          };
        }
      }
    }

    // Si no matchea, devolver como esta
    return {
      name: cleanLine,
      amount: '',
      isAllergen,
    };
  }

  /**
   * Extrae instrucciones de preparacion
   */
  private extractInstructions(markdown: string): string[] {
    const instructions: string[] = [];

    const instructionSection = this.extractSection(markdown, [
      'instrucciones',
      'instructions',
      'preparación',
      'preparation',
      'pasos',
      'steps',
      '👨‍🍳 instrucciones',
      '👨‍🍳 preparación',
    ]);

    if (!instructionSection) {
      return instructions;
    }

    // Parsear lineas numeradas o con -
    const lines = instructionSection.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Lineas numeradas: 1. Texto o 1) Texto
      const numberedMatch = trimmed.match(/^(?:\d+[.)]\s*)(.+)$/);
      if (numberedMatch) {
        instructions.push(numberedMatch[1].trim());
        continue;
      }

      // Lineas con - o *
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const content = trimmed.replace(/^[-*]\s*/, '').trim();
        if (content) {
          instructions.push(content);
        }
      }
    }

    return instructions;
  }

  /**
   * Extrae tips o consejos
   */
  private extractTips(markdown: string): string | undefined {
    const tipsSection = this.extractSection(markdown, [
      'tips',
      'consejos',
      'notas',
      'notes',
      '💡 tips',
      '💡 consejos',
    ]);

    if (!tipsSection) return undefined;

    // Limpiar y concatenar
    const lines = tipsSection.split('\n')
      .map(l => l.trim().replace(/^[-*]\s*/, ''))
      .filter(l => l.length > 0);

    return lines.join(' ') || undefined;
  }

  /**
   * Extrae advertencia de alergenos
   */
  private extractAllergenNotice(markdown: string): string | undefined {
    const patterns = [
      /⚠️\s*(?:alerta|warning|alérgeno)[:\s]*(.+?)(?:\n|$)/i,
      /(?:contiene|contains)[:\s]*(.+?)(?:\n|$)/i,
    ];

    for (const pattern of patterns) {
      const match = markdown.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extrae valores nutricionales
   */
  private extractNutrients(markdown: string): NutritionalValues | undefined {
    const nutrientsSection = this.extractSection(markdown, [
      'nutrición',
      'nutrition',
      'valores nutricionales',
      'nutritional values',
      '📊 nutrición',
    ]);

    if (!nutrientsSection) return undefined;

    const calories = this.extractNumber(nutrientsSection, /calorías?[:\s]*(\d+)/i) ||
                     this.extractNumber(nutrientsSection, /calories?[:\s]*(\d+)/i);
    const protein = this.extractNumber(nutrientsSection, /proteína?s?[:\s]*(\d+)/i) ||
                    this.extractNumber(nutrientsSection, /protein[:\s]*(\d+)/i);
    const carbs = this.extractNumber(nutrientsSection, /carbohidratos?[:\s]*(\d+)/i) ||
                  this.extractNumber(nutrientsSection, /carbs?[:\s]*(\d+)/i);
    const fat = this.extractNumber(nutrientsSection, /grasas?[:\s]*(\d+)/i) ||
                this.extractNumber(nutrientsSection, /fat[:\s]*(\d+)/i);

    if (!calories && !protein && !carbs && !fat) {
      return undefined;
    }

    return {
      calories: calories || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
    };
  }

  /**
   * Extrae una seccion del markdown por titulo
   */
  private extractSection(markdown: string, titles: string[]): string | null {
    for (const title of titles) {
      // Buscar ### titulo o ## titulo (case insensitive)
      const pattern = new RegExp(
        `^#{2,3}\\s*${this.escapeRegex(title)}\\s*$([\\s\\S]*?)(?=^#{2,3}|$)`,
        'mi'
      );

      const match = markdown.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractNumber(text: string, pattern: RegExp): number | undefined {
    const match = text.match(pattern);
    return match ? parseInt(match[1], 10) : undefined;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Valida si el markdown parece una receta
   */
  hasRecipeStructure(markdown: string): boolean {
    const hasIngredients = /ingredientes?|ingredients?/i.test(markdown);
    const hasInstructions = /instrucciones?|instructions?|pasos?|steps?|preparación/i.test(markdown);
    return hasIngredients && hasInstructions;
  }
}

export const RecipeParserService = new RecipeParserServiceClass();
