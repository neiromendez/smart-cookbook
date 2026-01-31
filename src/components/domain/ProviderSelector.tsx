'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Zap, ExternalLink, Key, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AI_PROVIDERS, getFreeProviders, getPaidProviders, getAdapter } from '@/lib/adapters';
import type { AIProviderConfig, AIProviderKey, ModelInfo } from '@/types';
import { cn } from '@/lib/utils/cn';

interface ProviderSelectorProps {
  selectedProvider: string;
  apiKeys: AIProviderKey[];
  onSelectProvider: (providerId: string) => void;
  onSaveApiKey: (provider: string, key: string, selectedModel?: string) => void;
  onValidateKey: (provider: string, key: string) => Promise<boolean>;
  onSelectModel?: (provider: string, model: string) => void;
}

/**
 * ProviderSelector - Selector de proveedor de IA
 *
 * Muestra:
 * - Lista de proveedores (gratuitos primero)
 * - Estado de API key (configurada/no configurada)
 * - Formulario para agregar API key
 * - Links a documentacion
 */
export function ProviderSelector({
  selectedProvider,
  apiKeys,
  onSelectProvider,
  onSaveApiKey,
  onValidateKey,
  onSelectModel,
}: ProviderSelectorProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dynamicModels, setDynamicModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Efecto para cargar modelos dinámicos (especialmente para OpenRouter)
  useEffect(() => {
    // Limpiar modelos del proveedor anterior inmediatamente
    setDynamicModels([]);

    const fetchModels = async () => {
      const adapter = getAdapter(selectedProvider);
      if (!adapter) return;

      const apiKey = apiKeys.find(k => k.provider === selectedProvider)?.key;

      // Si ya tenemos modelos estáticos y no hay key, quizás no sea necesario,
      // pero para OpenRouter queremos la lista actualizada si es posible.

      setLoadingModels(true);
      try {
        const models = await adapter.listModels(apiKey);
        if (models && models.length > 0) {
          setDynamicModels(models);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [selectedProvider, apiKeys]);

  const freeProviders = getFreeProviders();
  const paidProviders = getPaidProviders();

  const currentProvider = AI_PROVIDERS[selectedProvider];
  const currentApiKey = apiKeys.find(k => k.provider === selectedProvider);

  // Modelos disponibles para el proveedor actual
  const availableModels = useMemo(() => {
    // 1. Prioridad: Modelos dinámicos cargados
    if (dynamicModels.length > 0) {
      return dynamicModels.map(m => ({
        ...m,
        // Asegurar que tenemos vendor para el agrupamiento
        vendor: m.id.includes('/') ? m.id.split('/')[0] : (currentProvider?.name || 'General'),
      }));
    }

    // 2. Fallback: Modelos estáticos de la configuración
    if (!currentProvider?.freeModels) return [];

    return currentProvider.freeModels.map(id => ({
      id,
      // Formatear nombre legible: "google/gemini-2.0-flash-exp:free" -> "Gemini 2.0 Flash Exp"
      name: id
        .split('/').pop()
        ?.replace(':free', '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()) || id,
      vendor: id.split('/')[0],
      contextWindow: 0,
      isFree: true,
    }));
  }, [currentProvider, dynamicModels]);

  // Modelo actualmente seleccionado (validar que existe en la lista disponible)
  const savedModel = currentApiKey?.selectedModel;
  const modelExistsInList = savedModel && availableModels.some(m => m.id === savedModel);
  const selectedModel = modelExistsInList ? savedModel : availableModels[0]?.id;
  const selectedModelInfo = availableModels.find(m => m.id === selectedModel);

  // Agrupar modelos por vendor
  const modelsByVendor = useMemo(() => {
    const grouped: Record<string, typeof availableModels> = {};
    availableModels.forEach(model => {
      if (!grouped[model.vendor]) grouped[model.vendor] = [];
      grouped[model.vendor].push(model);
    });
    return grouped;
  }, [availableModels]);

  const handleSelectProvider = (provider: AIProviderConfig) => {
    onSelectProvider(provider.id);
    setIsOpen(false);
    setIsModelSelectorOpen(false); // Cerrar selector de modelos al cambiar proveedor

    // Si no tiene API key configurada, abrir el formulario
    const hasKey = apiKeys.some(k => k.provider === provider.id && k.validated);
    if (!hasKey) {
      setEditingProvider(provider.id);
      setApiKeyInput('');
      setValidationError(null);
    }
  };

  const handleSaveKey = async () => {
    if (!editingProvider || !apiKeyInput.trim()) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      const isValid = await onValidateKey(editingProvider, apiKeyInput.trim());

      if (isValid) {
        onSaveApiKey(editingProvider, apiKeyInput.trim());
        setEditingProvider(null);
        setApiKeyInput('');
      } else {
        setValidationError(t('provider.validationError.invalid'));
      }
    } catch {
      setValidationError(t('provider.validationError.error'));
    } finally {
      setIsValidating(false);
    }
  };

  const getProviderStatus = (provider: AIProviderConfig) => {
    const key = apiKeys.find(k => k.provider === provider.id);
    if (key?.validated) return 'configured';
    if (key) return 'invalid';
    return 'not_configured';
  };

  return (
    <div className="space-y-4">
      {/* Selector dropdown */}
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-2">
            {!currentApiKey?.validated ? (
              <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider rounded border border-orange-200 dark:border-orange-800">
                {t('provider.missingKey')}
              </span>
            ) : currentProvider?.isFree ? (
              <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider rounded border border-green-200 dark:border-green-800">
                {t('provider.free')}
              </span>
            ) : null}
            <span className="font-semibold text-gray-900 dark:text-white">
              {currentProvider?.name || t('provider.select')}
            </span>
            {currentApiKey?.validated && (
              <Check className="h-4 w-4 text-green-500" />
            )}
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform text-gray-400', isOpen && 'rotate-180')} />
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
            >
              {/* Proveedores gratuitos */}
              <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Zap className="h-3 w-3 text-orange-400" />
                  {t('provider.free')} (Sin tarjeta de crédito)
                </p>
                {freeProviders.map(provider => {
                  const status = getProviderStatus(provider);
                  return (
                    <button
                      key={provider.id}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md',
                        'hover:bg-gray-100 dark:hover:bg-gray-800',
                        selectedProvider === provider.id && 'bg-orange-50 dark:bg-orange-950'
                      )}
                      onClick={() => handleSelectProvider(provider)}
                    >
                      <span className="flex items-center gap-2">
                        {provider.name}
                      </span>
                      <span className="flex items-center gap-1">
                        {status === 'configured' && <Check className="h-4 w-4 text-green-500" />}
                        {status === 'invalid' && <span className="text-[10px] font-bold text-red-500 uppercase">{t('provider.invalid')}</span>}
                        {status === 'not_configured' && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase">
                            <Key className="h-3 w-3" />
                            {t('provider.notConfigured')}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Proveedores de pago */}
              <div className="p-2">
                <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {t('provider.paid')}
                </p>
                {paidProviders.map(provider => {
                  const status = getProviderStatus(provider);
                  return (
                    <button
                      key={provider.id}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md',
                        'hover:bg-gray-100 dark:hover:bg-gray-800',
                        selectedProvider === provider.id && 'bg-orange-50 dark:bg-orange-950'
                      )}
                      onClick={() => handleSelectProvider(provider)}
                    >
                      <span>{provider.name}</span>
                      <span className="flex items-center gap-1">
                        {status === 'configured' && <Check className="h-4 w-4 text-green-500" />}
                        {status === 'invalid' && <span className="text-[10px] font-bold text-red-500 uppercase">{t('provider.invalid')}</span>}
                        {status === 'not_configured' && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                            <Key className="h-3 w-3" />
                            {t('provider.notConfigured')}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Formulario de API Key */}
      <AnimatePresence>
        {editingProvider && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card variant="outlined">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4 text-orange-500" />
                  {t('provider.configureKey', { provider: AI_PROVIDERS[editingProvider]?.name })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="password"
                  placeholder={lang === 'es' ? "Pega tu API key aquí..." : "Paste your API key here..."}
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  error={validationError || undefined}
                />

                <div className="flex items-center justify-between">
                  <a
                    href={AI_PROVIDERS[editingProvider]?.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {t('provider.getKey')}
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingProvider(null);
                        setApiKeyInput('');
                        setValidationError(null);
                      }}
                    >
                      {t('provider.cancel')}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveKey}
                      loading={isValidating}
                      disabled={!apiKeyInput.trim()}
                    >
                      {t('provider.save')}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  🔒 {t('provider.keyStored')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selector de Modelo (solo para proveedores con múltiples modelos gratuitos) */}
      {currentApiKey?.validated && availableModels.length > 1 && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'es' ? 'Modelo:' : 'Model:'}
              </span>
              <span className="font-medium truncate max-w-[180px]">
                {selectedModelInfo?.name || 'Seleccionar...'}
              </span>
            </span>
            <ChevronDown className={cn('h-4 w-4 transition-transform text-gray-400', isModelSelectorOpen && 'rotate-180')} />
          </Button>

          <AnimatePresence>
            {isModelSelectorOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-[400px] overflow-y-auto"
              >
                {Object.entries(modelsByVendor).map(([vendor, models]) => (
                  <div key={vendor} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                    <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                      {vendor}
                    </p>
                    {models.map(model => (
                      <button
                        key={model.id}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 text-sm',
                          'hover:bg-gray-100 dark:hover:bg-gray-800',
                          selectedModel === model.id && 'bg-purple-50 dark:bg-purple-950'
                        )}
                        onClick={() => {
                          if (onSelectModel) {
                            onSelectModel(selectedProvider, model.id);
                          }
                          setIsModelSelectorOpen(false);
                        }}
                      >
                        <span className="truncate">{model.name}</span>
                        {selectedModel === model.id && (
                          <Check className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}

                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 {lang === 'es'
                      ? 'Todos estos modelos son 100% gratuitos en OpenRouter'
                      : 'All these models are 100% free on OpenRouter'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
