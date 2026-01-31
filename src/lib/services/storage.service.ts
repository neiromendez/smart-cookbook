// Servicio de almacenamiento en localStorage
// 100% client-side - Nada sale del navegador

import type { StorageSchema, ChefProfile, AIProviderKey, UserPreferences, Recipe, ChatMessage, Ingredient, RecipeIdea, MealType, ProteinType } from '@/types';

const STORAGE_PREFIX = 'smart-cookbook:';

// Valores por defecto
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  locale: 'es',
  rememberKeys: false,
};

const DEFAULT_PROFILE: ChefProfile = {
  gender: 'prefer-not-to-say',
  allergies: [],
  conditions: [],
  diet: 'any',
  skillLevel: 'home-cook',
  dislikes: [],
};

/**
 * StorageService - Encapsula toda la logica de localStorage
 *
 * GARANTIAS DE PRIVACIDAD:
 * - Todos los datos se guardan SOLO en el navegador del usuario
 * - Nada se envia a ningun servidor (excepto las llamadas a APIs de IA)
 * - El usuario puede borrar todos sus datos en cualquier momento
 */
class StorageServiceClass {
  private isClient = typeof window !== 'undefined';

  /**
   * Guarda un valor en localStorage
   */
  set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): void {
    if (!this.isClient) return;

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(STORAGE_PREFIX + key, serialized);
    } catch (error) {
      console.error(`[StorageService] Error al guardar ${key}:`, error);
    }
  }

  /**
   * Obtiene un valor de localStorage
   */
  get<K extends keyof StorageSchema>(key: K): StorageSchema[K] | null {
    if (!this.isClient) return null;

    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`[StorageService] Error al leer ${key}:`, error);
      return null;
    }
  }

  /**
   * Elimina un valor de localStorage
   */
  remove<K extends keyof StorageSchema>(key: K): void {
    if (!this.isClient) return;
    localStorage.removeItem(STORAGE_PREFIX + key);
  }

  /**
   * BORRA TODOS LOS DATOS de la aplicacion
   * Visible para el usuario como "Borrar Mis Datos"
   */
  clearAll(): void {
    if (!this.isClient) return;

    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .forEach(key => localStorage.removeItem(key));

    console.info('[StorageService] Todos los datos han sido eliminados');
  }

  // ============================================
  // METODOS ESPECIFICOS
  // ============================================

  /**
   * Obtiene el perfil del chef o uno por defecto
   */
  getProfile(): ChefProfile {
    return this.get('profile') ?? DEFAULT_PROFILE;
  }

  /**
   * Guarda el perfil del chef
   */
  setProfile(profile: ChefProfile): void {
    this.set('profile', profile);
  }

  /**
   * Obtiene las preferencias del usuario
   */
  getPreferences(): UserPreferences {
    return this.get('preferences') ?? DEFAULT_PREFERENCES;
  }

  /**
   * Guarda las preferencias
   */
  setPreferences(prefs: Partial<UserPreferences>): void {
    const current = this.getPreferences();
    this.set('preferences', { ...current, ...prefs });
  }

  /**
   * Obtiene las API keys guardadas
   */
  getApiKeys(): AIProviderKey[] {
    return this.get('api-keys') ?? [];
  }

  /**
   * Guarda o actualiza una API key
   */
  setApiKey(providerKey: AIProviderKey): void {
    const keys = this.getApiKeys();
    const existingIndex = keys.findIndex(k => k.provider === providerKey.provider);

    if (existingIndex >= 0) {
      keys[existingIndex] = providerKey;
    } else {
      keys.push(providerKey);
    }

    this.set('api-keys', keys);
  }

  /**
   * Obtiene la API key de un proveedor especifico
   */
  getApiKey(provider: string): AIProviderKey | undefined {
    return this.getApiKeys().find(k => k.provider === provider);
  }

  /**
   * Elimina la API key de un proveedor
   */
  removeApiKey(provider: string): void {
    const keys = this.getApiKeys().filter(k => k.provider !== provider);
    this.set('api-keys', keys);
  }

  /**
   * Obtiene el ultimo proveedor usado
   */
  getLastProvider(): string | null {
    return this.get('last-provider');
  }

  /**
   * Guarda el ultimo proveedor usado
   */
  setLastProvider(provider: string): void {
    this.set('last-provider', provider);
  }

  /**
   * Obtiene el historial de recetas
   */
  getHistory(): Recipe[] {
    return this.get('history') ?? [];
  }

  /**
   * Guarda una receta en el historial
   * Evita duplicados comparando el titulo (normalizado)
   */
  addToHistory(recipe: Recipe): void {
    const history = this.getHistory();

    // Verificar si ya existe una receta con el mismo titulo (normalizado)
    const normalizedTitle = recipe.title.toLowerCase().trim();
    const isDuplicate = history.some(
      r => r.title.toLowerCase().trim() === normalizedTitle
    );

    if (isDuplicate) {
      console.info('[StorageService] Receta duplicada ignorada:', recipe.title);
      return;
    }

    // Limitar a las ultimas 50 recetas
    const updated = [recipe, ...history].slice(0, 50);
    this.set('history', updated);
  }

  /**
   * Elimina una receta del historial
   */
  removeFromHistory(recipeId: string): void {
    const history = this.getHistory().filter(r => r.id !== recipeId);
    this.set('history', history);
  }

  /**
   * Obtiene el historial del chat
   */
  getChatHistory(): ChatMessage[] {
    return this.get('chat-history') ?? [];
  }

  /**
   * Guarda un mensaje en el historial del chat
   * Evita duplicados verificando el ID del mensaje
   */
  addToChatHistory(message: ChatMessage): void {
    const history = this.getChatHistory();

    // Verificar si ya existe un mensaje con el mismo ID (evita duplicados en StrictMode)
    if (history.some(m => m.id === message.id)) {
      console.info('[StorageService] Mensaje duplicado ignorado:', message.id);
      return;
    }

    // Limitar a los ultimos 20 mensajes para estabilidad del contexto
    const updated = [...history, message].slice(-20);
    this.set('chat-history', updated);
  }

  /**
   * Limpia el historial del chat
   */
  clearChatHistory(): void {
    this.set('chat-history', []);
  }

  /**
   * Obtiene la despensa (pantry)
   */
  getPantry(): string[] {
    return this.get('pantry') ?? [];
  }

  /**
   * Guarda la despensa
   */
  setPantry(items: string[]): void {
    this.set('pantry', items);
  }

  /**
   * Obtiene la lista de compras
   */
  getShoppingList(): Ingredient[] {
    return this.get('shopping-list') ?? [];
  }

  /**
   * Añade un ingrediente a la lista de compras
   */
  addToShoppingList(item: Ingredient): void {
    const list = this.getShoppingList();
    this.set('shopping-list', [...list, item]);
  }

  /**
   * Elimina un ingredience de la lista de compras
   */
  removeFromShoppingList(index: number): void {
    const list = this.getShoppingList();
    const updated = list.filter((_, i) => i !== index);
    this.set('shopping-list', updated);
  }

  /**
   * Limpia la lista de compras
   */
  clearShoppingList(): void {
    this.set('shopping-list', []);
  }

  /**
   * Verifica si hay datos guardados
   */
  hasData(): boolean {
    if (!this.isClient) return false;
    return Object.keys(localStorage).some(key => key.startsWith(STORAGE_PREFIX));
  }

  // ============================================
  // RECIPE IDEAS (Ideas de Recetas)
  // ============================================

  /**
   * Obtiene todas las ideas de recetas guardadas
   */
  getRecipeIdeas(): RecipeIdea[] {
    return this.get('recipe-ideas') ?? [];
  }

  /**
   * Agrega ideas de recetas con deduplicación por título
   * Límite máximo: 200 ideas
   */
  addRecipeIdeas(ideas: RecipeIdea[]): void {
    const existing = this.getRecipeIdeas();

    // Normalizar títulos existentes para comparación
    const existingTitles = new Set(
      existing.map(i => i.title.toLowerCase().trim())
    );

    // Filtrar ideas que no son duplicadas
    const newIdeas = ideas.filter(
      idea => !existingTitles.has(idea.title.toLowerCase().trim())
    );

    if (newIdeas.length === 0) {
      console.info('[StorageService] Todas las ideas ya existen, ignorando duplicados');
      return;
    }

    // Combinar y limitar a 200 ideas (las más recientes primero)
    const combined = [...newIdeas, ...existing].slice(0, 200);
    this.set('recipe-ideas', combined);

    console.info(`[StorageService] ${newIdeas.length} ideas agregadas. Total: ${combined.length}`);
  }

  /**
   * Filtra ideas por tipo de comida
   */
  getIdeasByMealType(mealType: MealType): RecipeIdea[] {
    return this.getRecipeIdeas().filter(idea => idea.mealType === mealType);
  }

  /**
   * Filtra ideas por tipo de proteína
   */
  getIdeasByProteinType(proteinType: ProteinType): RecipeIdea[] {
    return this.getRecipeIdeas().filter(idea => idea.proteinType === proteinType);
  }

  /**
   * Filtra ideas por múltiples criterios
   */
  filterIdeas(filters: {
    mealType?: MealType;
    proteinType?: ProteinType;
    isUsed?: boolean;
    vibes?: string[];
  }): RecipeIdea[] {
    let ideas = this.getRecipeIdeas();

    if (filters.mealType) {
      ideas = ideas.filter(i => i.mealType === filters.mealType);
    }

    if (filters.proteinType) {
      ideas = ideas.filter(i => i.proteinType === filters.proteinType);
    }

    if (filters.isUsed !== undefined) {
      ideas = ideas.filter(i => i.isUsed === filters.isUsed);
    }

    if (filters.vibes && filters.vibes.length > 0) {
      const requiredVibes = filters.vibes; // Capturar en const para type narrowing
      ideas = ideas.filter(i =>
        requiredVibes.some(v => i.vibes.includes(v))
      );
    }

    return ideas;
  }

  /**
   * Marca una idea como usada y la vincula con una receta
   */
  markIdeaAsUsed(ideaId: string, recipeId: string): void {
    const ideas = this.getRecipeIdeas();
    const updated = ideas.map(idea =>
      idea.id === ideaId
        ? { ...idea, isUsed: true, linkedRecipeId: recipeId }
        : idea
    );
    this.set('recipe-ideas', updated);
  }

  /**
   * Elimina una idea de receta
   */
  removeRecipeIdea(ideaId: string): void {
    const ideas = this.getRecipeIdeas().filter(i => i.id !== ideaId);
    this.set('recipe-ideas', ideas);
  }

  /**
   * Limpia todas las ideas de recetas
   */
  clearRecipeIdeas(): void {
    this.set('recipe-ideas', []);
  }
}

// Exportar instancia singleton
export const StorageService = new StorageServiceClass();
