// Tipos principales de Smart-Cookbook

// ============================================
// MEAL & PROTEIN TYPES (Para Ideas de Recetas)
// ============================================
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export type ProteinType = 'chicken' | 'beef' | 'pork' | 'fish' | 'seafood' | 'egg' | 'tofu' | 'legumes' | 'none';

// ============================================
// RECIPE IDEAS (Ideas de Recetas)
// ============================================
export interface RecipeIdea {
  id: string;
  title: string;
  description: string;
  mealType: MealType;
  proteinType: ProteinType;
  ingredients: string[];
  vibes: string[];
  servings: number;
  createdAt: Date;
  isUsed: boolean;
  linkedRecipeId?: string;
}

// ============================================
// CHEF PROFILE (Perfil del Usuario)
// ============================================
export interface ChefProfile {
  name?: string;
  age?: number;
  height?: number;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  allergies: string[];
  conditions: string[];
  diet: DietType;
  location?: string;
  skillLevel?: SkillLevel;
  dislikes: string[];
}

export type SkillLevel = 'novice' | 'home-cook' | 'pro';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export type DietType =
  | 'any'
  | 'omnivore'
  | 'vegetarian'
  | 'vegan'
  | 'keto'
  | 'paleo'
  | 'gluten-free';

// ============================================
// AI PROVIDERS
// ============================================
export interface AIProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  isFree: boolean;
  freeModels?: string[];
  documentation: string;
  dashboardUrl: string;
  requiresCors: boolean; // Si necesita pasar por el proxy Edge
}

export interface AIProviderKey {
  provider: string;
  key: string;
  validated: boolean;
  lastValidated?: Date;
  selectedModel?: string; // Modelo seleccionado por el usuario
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number; // Maximo de tokens que puede generar en una respuesta
  isFree: boolean;
}

// ============================================
// REQUEST STATUS (Estados de Peticion)
// ============================================
export type RequestStatus =
  | { state: 'idle' }
  | { state: 'validating'; message: string }
  | { state: 'connecting'; provider: string }
  | { state: 'streaming'; tokens: number; content: string }
  | { state: 'completed'; duration: number; content: string }
  | { state: 'error'; error: APIError };

// ============================================
// ERROR HANDLING
// ============================================
export type ErrorCode =
  | 'INVALID_API_KEY'
  | 'INSUFFICIENT_QUOTA'
  | 'BILLING_HARD_LIMIT'
  | 'PAYMENT_REQUIRED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'DAILY_LIMIT_REACHED'
  | 'MODEL_NOT_FOUND'
  | 'CONTEXT_LENGTH_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVICE_UNAVAILABLE'
  | 'CONTENT_POLICY_VIOLATION'
  | 'PROMPT_INJECTION_DETECTED'
  | 'CORS_ERROR'
  | 'UNKNOWN_ERROR';

export interface APIError {
  code: ErrorCode;
  icon: string;
  title: string;
  message: string;
  solutions: string[];
  freeAlternatives?: FreeAlternative[];
  actionButton?: ActionButton;
  providerLinks?: Record<string, string>;
  autoRetry?: boolean;
  retryDelay?: number;
}

export interface FreeAlternative {
  provider: string;
  reason: string;
  url: string;
  action: string;
}

export interface ActionButton {
  label: string;
  action: string;
}

// ============================================
// RECIPES
// ============================================
export interface Recipe {
  id: string;
  title: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  tips?: string;
  allergenNotice?: string;
  generatedAt: Date;
  provider: string;
  nutrients?: NutritionalValues;
  promptId?: string; // ID del ChatMessage del usuario que genero esta receta
}

export interface NutritionalValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Ingredient {
  name: string;
  amount: string;
  isAllergen?: boolean;
  recipeTitle?: string; // Título de la receta de donde proviene
}

// ============================================
// STORAGE
// ============================================
export interface StorageSchema {
  'profile': ChefProfile | null;
  'api-keys': AIProviderKey[];
  'preferences': UserPreferences;
  'history': Recipe[];
  'chat-history': ChatMessage[];
  'pantry': string[];
  'shopping-list': Ingredient[];
  'last-provider': string | null; // Ultimo proveedor usado
  'recipe-ideas': RecipeIdea[]; // Ideas de recetas generadas
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  locale: 'en' | 'es';
  rememberKeys: boolean;
}

// ============================================
// PROMPT GUARDRAILS
// ============================================
export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedInput?: string;
}

export interface GuardrailsConfig {
  maxInputLength: number;
  forbiddenPatterns: RegExp[];
  allowedTopics: string[];
}
