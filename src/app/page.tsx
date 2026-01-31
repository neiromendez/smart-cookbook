'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ChefHat, Settings, Trash2, Github, User, History, ShoppingCart, Edit2, Lightbulb, Filter, X } from 'lucide-react';
import { RecipeGenerator } from '@/components/domain/RecipeGenerator';
import { ProviderSelector } from '@/components/domain/ProviderSelector';
import { Onboarding } from '@/components/domain/Onboarding';
import { PantryManager } from '@/components/domain/PantryManager';
import { ShoppingList } from '@/components/domain/ShoppingList';
import { RecipeHistory } from '@/components/domain/RecipeHistory';
import { ProfileManager } from '@/components/domain/ProfileManager';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StorageService } from '@/lib/services/storage.service';
import { useChefProfile } from '@/lib/hooks/useChefProfile';
import { getAdapter } from '@/lib/adapters';
import type { AIProviderKey, ChefProfile, Recipe, RecipeIdea, ProteinType, MealType } from '@/types';

// Vista activa en el sidebar
type SidebarView = 'default' | 'shopping' | 'history' | 'profile' | 'ideas' | 'settings';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  // Perfil del chef
  const {
    profile,
    setProfile,
    hasCompletedOnboarding,
    skipOnboarding,
    isLoading: profileLoading,
  } = useChefProfile();

  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [apiKeys, setApiKeys] = useState<AIProviderKey[]>([]);
  const [sidebarView, setSidebarView] = useState<SidebarView>('settings');
  const [mobileOverlayOpen, setMobileOverlayOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadedRecipe, setLoadedRecipe] = useState<Recipe | null>(null);
  const [savedIdeasCount, setSavedIdeasCount] = useState(0);
  const [savedRecipesCount, setSavedRecipesCount] = useState(0);
  const [savedIdeas, setSavedIdeas] = useState<RecipeIdea[]>([]);

  // Filtros para Ideas Guardadas
  const [ideasFilterProtein, setIdeasFilterProtein] = useState<ProteinType | null>(null);
  const [ideasFilterMeal, setIdeasFilterMeal] = useState<MealType | null>(null);

  // Cargar datos de localStorage y seleccionar proveedor automaticamente
  useEffect(() => {
    setMounted(true);
    const storedKeys = StorageService.getApiKeys();
    setApiKeys(storedKeys);

    // Cargar contadores de ideas y recetas guardadas
    const ideas = StorageService.getRecipeIdeas();
    const recipes = StorageService.getHistory();
    setSavedIdeas(ideas);
    setSavedIdeasCount(ideas.length);
    setSavedRecipesCount(recipes.length);

    // Determinar el proveedor a seleccionar
    const lastProvider = StorageService.getLastProvider();
    const validatedKeys = storedKeys.filter(k => k.validated);

    if (validatedKeys.length > 0) {
      // Si el ultimo proveedor usado tiene key valida, usarlo
      const lastProviderHasKey = lastProvider && validatedKeys.some(k => k.provider === lastProvider);

      if (lastProviderHasKey) {
        setSelectedProvider(lastProvider);
      } else {
        // Si no, usar el primer proveedor con key valida
        setSelectedProvider(validatedKeys[0].provider);
      }
    } else {
      // Si no hay keys validadas, mostrar settings
      setSidebarView('settings');
    }
  }, []);

  const handleSaveApiKey = (provider: string, key: string, selectedModel?: string) => {
    const existingKey = apiKeys.find(k => k.provider === provider);
    const newKey: AIProviderKey = {
      provider,
      key,
      validated: true,
      lastValidated: new Date(),
      selectedModel: selectedModel || existingKey?.selectedModel,
    };
    StorageService.setApiKey(newKey);
    // Guardar como ultimo proveedor usado y seleccionarlo
    StorageService.setLastProvider(provider);
    setSelectedProvider(provider);
    setApiKeys(prev => {
      const filtered = prev.filter(k => k.provider !== provider);
      return [...filtered, newKey];
    });
  };

  const handleSelectModel = (provider: string, model: string) => {
    const existingKey = apiKeys.find(k => k.provider === provider);
    if (existingKey) {
      const updatedKey: AIProviderKey = {
        ...existingKey,
        selectedModel: model,
      };
      StorageService.setApiKey(updatedKey);
      setApiKeys(prev => {
        const filtered = prev.filter(k => k.provider !== provider);
        return [...filtered, updatedKey];
      });
    }
  };

  const handleValidateKey = async (provider: string, key: string): Promise<boolean> => {
    const adapter = getAdapter(provider);
    if (!adapter) return false;

    const result = await adapter.validateApiKey(key);
    return result.valid;
  };

  const handleSwitchProvider = (providerId: string) => {
    setSelectedProvider(providerId);
    // Guardar como ultimo proveedor usado
    StorageService.setLastProvider(providerId);
    // Si no tiene key configurada, mostrar settings
    const hasKey = apiKeys.some(k => k.provider === providerId && k.validated);
    if (!hasKey) {
      setSidebarView('settings');
    }
  };

  const handleDeleteAllData = () => {
    const message = lang === 'es'
      ? '¿Estás seguro? Se borrarán todos tus datos: perfil, API keys e historial.'
      : 'Are you sure? All your data will be deleted: profile, API keys and history.';

    if (confirm(message)) {
      StorageService.clearAll();
      setApiKeys([]);
      setSelectedProvider('openrouter');
      setSidebarView('settings');
      // Recargar para mostrar onboarding de nuevo
      window.location.reload();
    }
  };

  const handleOnboardingComplete = (newProfile: ChefProfile) => {
    setProfile(newProfile);
  };

  const handleOnboardingSkip = () => {
    skipOnboarding();
  };

  const handleProfileSave = (updatedProfile: ChefProfile) => {
    setProfile(updatedProfile);
    setSidebarView('settings');
  };

  // Cargar una receta del historial en el generador
  const handleLoadRecipe = (recipe: Recipe) => {
    setLoadedRecipe(recipe);
    setSidebarView('settings');
  };

  // Limpiar la receta cargada despues de usarla
  const handleRecipeLoaded = () => {
    setLoadedRecipe(null);
  };

  // Helper para cambiar vista del sidebar y abrir overlay en móvil
  const handleSidebarSwitch = (view: SidebarView) => {
    setSidebarView(view);
    // En móvil, abrir el overlay solo si es diferente de 'settings' 
    // (settings ya es la vista por defecto visible en desktop)
    if (view !== 'settings') {
      setMobileOverlayOpen(true);
    }
  };

  // Cerrar overlay móvil
  const closeMobileOverlay = () => {
    setMobileOverlayOpen(false);
    setSidebarView('settings'); // Volver a settings
  };

  // Loading inicial
  if (!mounted || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-orange-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400" suppressHydrationWarning>
            {lang === 'es' ? 'Cargando...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Mostrar Onboarding si no ha sido completado
  if (hasCompletedOnboarding === false) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <ChefHat className="h-7 w-7 sm:h-8 sm:w-8 text-orange-500" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Smart Cookbook
                </h1>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  {profile.name ? `${lang === 'es' ? 'Chef' : 'Chef'} ${profile.name}` : (lang === 'es' ? '100% gratis • 100% privado' : '100% free • 100% private')}
                </p>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-1 sm:gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              {/* Ideas Guardadas - solo visible si hay ideas */}
              {savedIdeasCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarView(sidebarView === 'ideas' ? 'default' : 'ideas')}
                  className={`relative ${sidebarView === 'ideas' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' : ''}`}
                  title={t('nav.savedIdeas')}
                >
                  <Lightbulb className="h-4 w-4" />
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center bg-amber-500 text-white text-[9px] font-bold rounded-full leading-none">
                    {savedIdeasCount > 99 ? '99' : savedIdeasCount}
                  </span>
                </Button>
              )}
              {/* Historial */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSidebarSwitch(sidebarView === 'history' ? 'settings' : 'history')}
                className={`relative ${sidebarView === 'history' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : ''}`}
                title={t('nav.history')}
              >
                <History className="h-4 w-4" />
                {savedRecipesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center bg-blue-500 text-white text-[9px] font-bold rounded-full leading-none">
                    {savedRecipesCount > 99 ? '99' : savedRecipesCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSidebarSwitch(sidebarView === 'shopping' ? 'settings' : 'shopping')}
                className={sidebarView === 'shopping' ? 'bg-gray-100 dark:bg-gray-800' : ''}
                title={lang === 'es' ? 'Lista de Compras' : 'Shopping List'}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSidebarView('settings'); setMobileOverlayOpen(true); }}
                className={sidebarView === 'settings' ? 'bg-gray-100 dark:bg-gray-800' : ''}
                title={lang === 'es' ? 'Configuración' : 'Settings'}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Titulo */}
        <div className="text-center mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            🍳 {profile.name
              ? (lang === 'es' ? `¡Hola, Chef ${profile.name}!` : `Hello, Chef ${profile.name}!`)
              : (lang === 'es' ? '¿Qué hay en tu nevera?' : "What's in your fridge?")}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2">
            {lang === 'es'
              ? 'Dime qué ingredientes tienes y te sugeriré recetas deliciosas'
              : 'Tell me what ingredients you have and I will suggest delicious recipes'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2">
            <RecipeGenerator
              selectedProvider={selectedProvider}
              apiKeys={apiKeys}
              chefProfile={profile}
              onSwitchProvider={handleSwitchProvider}
              loadedRecipe={loadedRecipe}
              onRecipeLoaded={handleRecipeLoaded}
            />
          </div>

          {/* Sidebar - Desktop: columna lateral / Mobile: overlay */}
          {/* Desktop Sidebar */}
          <div className="hidden lg:block space-y-4">
            {/* Vista: Lista de Compras */}
            {sidebarView === 'shopping' && (
              <ShoppingList onClose={() => setSidebarView('settings')} />
            )}

            {/* Vista: Historial */}
            {sidebarView === 'history' && (
              <RecipeHistory
                onClose={() => setSidebarView('settings')}
                onLoadRecipe={handleLoadRecipe}
              />
            )}

            {/* Vista: Ideas Guardadas */}
            {sidebarView === 'ideas' && savedIdeas.length > 0 && (
              <IdeasSidebar
                savedIdeas={savedIdeas}
                filterProtein={ideasFilterProtein}
                filterMeal={ideasFilterMeal}
                onFilterProtein={setIdeasFilterProtein}
                onFilterMeal={setIdeasFilterMeal}
                onClose={() => setSidebarView('settings')}
                lang={lang}
                t={t}
              />
            )}

            {/* Vista: Editar Perfil */}
            {sidebarView === 'profile' && (
              <ProfileManager
                profile={profile}
                onSave={handleProfileSave}
                onClose={() => setSidebarView('settings')}
              />
            )}

            {/* Vista: Configuración */}
            {sidebarView === 'settings' && (
              <div className="space-y-4">
                {/* Perfil del Chef */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-orange-500" />
                        {profile.name || (lang === 'es' ? 'Tu Perfil' : 'Your Profile')}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarView('profile')}
                        title={lang === 'es' ? 'Editar Perfil' : 'Edit Profile'}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <div className="flex flex-wrap gap-2">
                      {/* Dieta */}
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-md text-xs border border-green-200 dark:border-green-800">
                        <span>🥗</span>
                        <span>{t(`profile.diet.${profile.diet}`)}</span>
                      </div>
                      {/* Skill Level */}
                      {profile.skillLevel && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 rounded-md text-xs border border-yellow-200 dark:border-yellow-800">
                          <span>🏆</span>
                          <span>{t(`profile.skillLevel.${profile.skillLevel}`)}</span>
                        </div>
                      )}
                    </div>
                    {/* Condiciones */}
                    {profile.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {profile.conditions.slice(0, 3).map(c => {
                          const key = `profile.conditions.${c}`;
                          return (
                            <span
                              key={c}
                              className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded text-[10px] border border-pink-200 dark:border-pink-800"
                            >
                              {t(key) !== key ? t(key) : c}
                            </span>
                          );
                        })}
                        {profile.conditions.length > 3 && (
                          <span className="text-xs text-gray-500">+{profile.conditions.length - 3}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Mi Despensa */}
                <Card>
                  <CardContent className="pt-6">
                    <PantryManager />
                  </CardContent>
                </Card>

                {/* Proveedor de IA */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      🤖 {lang === 'es' ? 'Proveedor de IA' : 'AI Provider'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProviderSelector
                      selectedProvider={selectedProvider}
                      apiKeys={apiKeys}
                      onSelectProvider={handleSwitchProvider}
                      onSaveApiKey={handleSaveApiKey}
                      onValidateKey={handleValidateKey}
                      onSelectModel={handleSelectModel}
                    />
                  </CardContent>
                </Card>

                {/* Borrar datos y privacidad */}
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteAllData}
                      icon={<Trash2 className="h-4 w-4" />}
                    >
                      {lang === 'es' ? 'Borrar Todo' : 'Delete All'}
                    </Button>
                    <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-800 dark:text-green-200">
                        🔒 <strong>{lang === 'es' ? 'Privacidad' : 'Privacy'}:</strong>{' '}
                        {lang === 'es' ? 'Datos locales' : 'Local data only'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Vista: Default */}
            {sidebarView === 'default' && (
              <>
                {/* Perfil del Chef */}
                {(profile.allergies.length > 0 || profile.conditions.length > 0 || profile.diet !== 'omnivore' || profile.name) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4 text-orange-500" />
                          {profile.name || (lang === 'es' ? 'Tu Perfil' : 'Your Profile')}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSidebarView('profile')}
                          title={lang === 'es' ? 'Editar Perfil' : 'Edit Profile'}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {/* Dieta */}
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-md text-xs border border-green-200 dark:border-green-800">
                          <span>🥗</span>
                          <span>{t(`profile.diet.${profile.diet}`)}</span>
                        </div>

                        {/* Skill Level */}
                        {profile.skillLevel && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 rounded-md text-xs border border-yellow-200 dark:border-yellow-800">
                            <span>🏆</span>
                            <span>{t(`profile.skillLevel.${profile.skillLevel}`)}</span>
                          </div>
                        )}
                      </div>

                      {/* Alergias */}
                      {profile.allergies.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            {t('profile.allergies.label')}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {profile.allergies.map(a => (
                              <span
                                key={a}
                                className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-[10px] border border-red-200 dark:border-red-800"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Condiciones */}
                      {profile.conditions.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            {t('profile.conditions.label')}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {profile.conditions.map(c => {
                              const translationKey = `profile.conditions.${c}`;
                              const translated = t(translationKey);
                              const label = translated === translationKey ? c : translated;

                              return (
                                <span
                                  key={c}
                                  className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded text-[10px] border border-pink-200 dark:border-pink-800"
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Dislikes */}
                      {profile.dislikes && profile.dislikes.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            {t('profile.dislikes.label')}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {profile.dislikes.map(d => (
                              <span
                                key={d}
                                className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-[10px] border border-orange-200 dark:border-orange-800"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Mi Despensa / Kitchen Staples */}
                <Card>
                  <CardContent className="pt-6">
                    <PantryManager />
                  </CardContent>
                </Card>

                {/* Selector de proveedor */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      🤖 {lang === 'es' ? 'Proveedor de IA' : 'AI Provider'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProviderSelector
                      selectedProvider={selectedProvider}
                      apiKeys={apiKeys}
                      onSelectProvider={handleSwitchProvider}
                      onSaveApiKey={handleSaveApiKey}
                      onValidateKey={handleValidateKey}
                      onSelectModel={handleSelectModel}
                    />
                  </CardContent>
                </Card>

                {/* Links */}
                <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>
                    <Link href="/terms" className="hover:text-orange-500">
                      {lang === 'es' ? 'Términos' : 'Terms'}
                    </Link>
                    {' • '}
                    <Link href="/privacy" className="hover:text-orange-500">
                      {lang === 'es' ? 'Privacidad' : 'Privacy'}
                    </Link>
                    {' • '}
                    <Link href="/disclaimer" className="hover:text-orange-500">
                      Disclaimer
                    </Link>
                  </p>
                  <p className="flex items-center justify-center gap-1">
                    <Github className="h-3 w-3" />
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-orange-500"
                    >
                      Open Source
                    </a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 sm:py-6 mt-8 sm:mt-12">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 text-center">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Smart Cookbook © 2026 — {lang === 'es' ? 'Hecho con' : 'Made with'} 🧡 {lang === 'es' ? 'y mucha IA' : 'and lots of AI'}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">
            {lang === 'es'
              ? 'Las recetas son generadas por IA. Verifica siempre los ingredientes para tus necesidades de salud.'
              : 'Recipes are AI-generated. Always verify ingredients for your health needs.'}
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Sheet Overlay - Solo visible en móvil cuando está abierto */}
      {mobileOverlayOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMobileOverlay}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl overflow-hidden animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-2rem)] px-4 pb-8">
              {sidebarView === 'shopping' && (
                <ShoppingList onClose={closeMobileOverlay} />
              )}
              {sidebarView === 'history' && (
                <RecipeHistory
                  onClose={closeMobileOverlay}
                  onLoadRecipe={handleLoadRecipe}
                />
              )}
              {sidebarView === 'ideas' && savedIdeas.length > 0 && (
                <IdeasSidebar
                  savedIdeas={savedIdeas}
                  filterProtein={ideasFilterProtein}
                  filterMeal={ideasFilterMeal}
                  onFilterProtein={setIdeasFilterProtein}
                  onFilterMeal={setIdeasFilterMeal}
                  onClose={closeMobileOverlay}
                  lang={lang}
                  t={t}
                />
              )}
              {sidebarView === 'profile' && (
                <ProfileManager
                  profile={profile}
                  onSave={handleProfileSave}
                  onClose={closeMobileOverlay}
                />
              )}
              {sidebarView === 'settings' && (
                <div className="space-y-4">
                  {/* Header con cerrar */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      ⚙️ {lang === 'es' ? 'Configuración' : 'Settings'}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeMobileOverlay}
                    >
                      ✕
                    </Button>
                  </div>

                  {/* Perfil del Chef */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4 text-orange-500" />
                          {profile.name || (lang === 'es' ? 'Tu Perfil' : 'Your Profile')}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSidebarView('profile')}
                          title={lang === 'es' ? 'Editar Perfil' : 'Edit Profile'}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                      <div className="flex flex-wrap gap-2">
                        {/* Dieta */}
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-md text-xs border border-green-200 dark:border-green-800">
                          <span>🥗</span>
                          <span>{t(`profile.diet.${profile.diet}`)}</span>
                        </div>
                        {/* Skill Level */}
                        {profile.skillLevel && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 rounded-md text-xs border border-yellow-200 dark:border-yellow-800">
                            <span>🏆</span>
                            <span>{t(`profile.skillLevel.${profile.skillLevel}`)}</span>
                          </div>
                        )}
                      </div>
                      {/* Condiciones */}
                      {profile.conditions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {profile.conditions.slice(0, 3).map(c => (
                            <span
                              key={c}
                              className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded text-[10px] border border-pink-200 dark:border-pink-800"
                            >
                              {t(`profile.conditions.${c}`) !== `profile.conditions.${c}` ? t(`profile.conditions.${c}`) : c}
                            </span>
                          ))}
                          {profile.conditions.length > 3 && (
                            <span className="text-xs text-gray-500">+{profile.conditions.length - 3}</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Mi Despensa */}
                  <Card>
                    <CardContent className="pt-6">
                      <PantryManager />
                    </CardContent>
                  </Card>

                  {/* Proveedor de IA */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        🤖 {lang === 'es' ? 'Proveedor de IA' : 'AI Provider'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProviderSelector
                        selectedProvider={selectedProvider}
                        apiKeys={apiKeys}
                        onSelectProvider={handleSwitchProvider}
                        onSaveApiKey={handleSaveApiKey}
                        onValidateKey={handleValidateKey}
                        onSelectModel={handleSelectModel}
                      />
                    </CardContent>
                  </Card>

                  {/* Borrar datos */}
                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {lang === 'es'
                          ? 'Borrar todos mis datos (perfil, API keys, historial)'
                          : 'Delete all my data (profile, API keys, history)'}
                      </p>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteAllData}
                        icon={<Trash2 className="h-4 w-4" />}
                      >
                        {lang === 'es' ? 'Borrar Todo' : 'Delete All'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Componente IdeasSidebar con Filtros
// ============================================
const PROTEIN_EMOJIS: Record<ProteinType, string> = {
  chicken: '🐔', beef: '🥩', pork: '🐷', fish: '🐟',
  seafood: '🦐', egg: '🥚', tofu: '🌱', legumes: '🫘', none: '🥗',
};

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

const MEAL_EMOJIS: Record<MealType, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍿', dessert: '🍰',
};

const MEAL_LABELS: Record<MealType, { es: string; en: string }> = {
  breakfast: { es: 'Desayuno', en: 'Breakfast' },
  lunch: { es: 'Almuerzo', en: 'Lunch' },
  dinner: { es: 'Cena', en: 'Dinner' },
  snack: { es: 'Snack', en: 'Snack' },
  dessert: { es: 'Postre', en: 'Dessert' },
};

interface IdeasSidebarProps {
  savedIdeas: RecipeIdea[];
  filterProtein: ProteinType | null;
  filterMeal: MealType | null;
  onFilterProtein: (v: ProteinType | null) => void;
  onFilterMeal: (v: MealType | null) => void;
  onClose: () => void;
  lang: 'es' | 'en';
  t: (key: string) => string;
}

function IdeasSidebar({
  savedIdeas,
  filterProtein,
  filterMeal,
  onFilterProtein,
  onFilterMeal,
  onClose,
  lang,
  t,
}: IdeasSidebarProps) {
  // Estado local para búsqueda
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar ideas
  const filteredIdeas = useMemo(() => {
    return savedIdeas.filter(idea => {
      if (filterProtein && idea.proteinType !== filterProtein) return false;
      if (filterMeal && idea.mealType !== filterMeal) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return idea.title.toLowerCase().includes(query) ||
          idea.description.toLowerCase().includes(query);
      }
      return true;
    });
  }, [savedIdeas, filterProtein, filterMeal, searchQuery]);

  // Obtener tipos únicos para filtros
  const availableProteins = useMemo(() => {
    return [...new Set(savedIdeas.map(i => i.proteinType))];
  }, [savedIdeas]);

  const availableMeals = useMemo(() => {
    return [...new Set(savedIdeas.map(i => i.mealType))];
  }, [savedIdeas]);

  const hasFilters = filterProtein !== null || filterMeal !== null || searchQuery !== '';

  const clearFilters = () => {
    onFilterProtein(null);
    onFilterMeal(null);
    setSearchQuery('');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            {t('nav.savedIdeas')}
            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full">
              {filteredIdeas.length}
            </span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Campo de búsqueda */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('ideas.search')}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Filtros con tooltips */}
        {(availableProteins.length > 1 || availableMeals.length > 1) && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Filter className="h-3 w-3 text-gray-400" />
            {/* Proteínas con tooltip */}
            {availableProteins.map(protein => (
              <button
                key={protein}
                onClick={() => onFilterProtein(filterProtein === protein ? null : protein)}
                title={t(`ideas.protein.${protein}`)}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${filterProtein === protein
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-amber-50'
                  }`}
              >
                {PROTEIN_EMOJIS[protein]}
              </button>
            ))}
            {availableProteins.length > 0 && availableMeals.length > 0 && (
              <span className="text-gray-300 dark:text-gray-600 text-xs">|</span>
            )}
            {/* Comidas con tooltip */}
            {availableMeals.map(meal => (
              <button
                key={meal}
                onClick={() => onFilterMeal(filterMeal === meal ? null : meal)}
                title={t(`ideas.meal.${meal}`)}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${filterMeal === meal
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50'
                  }`}
              >
                {MEAL_EMOJIS[meal]}
              </button>
            ))}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-gray-400 hover:text-red-500 ml-1"
                title={t('ideas.clearFilters')}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Lista de Ideas */}
        <div className="max-h-[55vh] overflow-y-auto space-y-2">
          {filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-300 dark:hover:border-amber-600 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <span className="text-base flex-shrink-0" title={t(`ideas.protein.${idea.proteinType}`)}>
                  {PROTEIN_EMOJIS[idea.proteinType]}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs text-gray-900 dark:text-white leading-tight">
                    {idea.title}
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                    {idea.description}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <span
                      className="inline-flex items-center px-1 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 text-[9px] rounded"
                      title={t(`ideas.meal.${idea.mealType}`)}
                    >
                      {MEAL_EMOJIS[idea.mealType]} {t(`ideas.meal.${idea.mealType}`)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredIdeas.length === 0 && hasFilters && (
            <div className="text-center py-4 text-gray-500 text-xs">
              {t('ideas.noResults')}
              <button onClick={clearFilters} className="block mx-auto mt-1 text-amber-500 hover:underline">
                {t('ideas.clearFilters')}
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

