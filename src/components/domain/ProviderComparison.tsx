'use client';

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  ExternalLink,
  Zap,
  DollarSign,
  Globe,
  Clock,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getAllProviders, getAdapter } from '@/lib/adapters';
import type { AIProviderConfig } from '@/types';
import { cn } from '@/lib/utils/cn';

interface ProviderComparisonProps {
  onSelectProvider?: (providerId: string) => void;
  onClose?: () => void;
}

/**
 * ProviderComparison - Tabla comparativa de proveedores de IA
 *
 * Muestra:
 * - Lista de todos los proveedores disponibles
 * - Caracteristicas: gratuito, CORS, velocidad
 * - Links a documentacion y dashboard
 */
export function ProviderComparison({ onSelectProvider, onClose }: ProviderComparisonProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  const providers = getAllProviders();

  // Categorizar proveedores
  const freeProviders = providers.filter(p => p.isFree);
  const paidProviders = providers.filter(p => !p.isFree);

  const features = [
    {
      key: 'free',
      label: { es: 'Gratis', en: 'Free' },
      icon: DollarSign,
      getValue: (p: AIProviderConfig) => p.isFree,
    },
    {
      key: 'cors',
      label: { es: 'Sin proxy', en: 'No proxy' },
      icon: Globe,
      getValue: (p: AIProviderConfig) => !p.requiresCors,
    },
    {
      key: 'speed',
      label: { es: 'Rápido', en: 'Fast' },
      icon: Zap,
      getValue: (p: AIProviderConfig) =>
        ['groq', 'cerebras', 'fireworks'].includes(p.id),
    },
  ];

  const getProviderRating = (provider: AIProviderConfig): number => {
    let score = 0;
    if (provider.isFree) score += 3;
    if (!provider.requiresCors) score += 2;
    if (['groq', 'cerebras', 'fireworks'].includes(provider.id)) score += 1;
    if (provider.freeModels && provider.freeModels.length > 3) score += 1;
    return Math.min(score, 5);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            ⚡ {lang === 'es' ? 'Comparación de Proveedores' : 'Provider Comparison'}
          </CardTitle>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Recomendación */}
        <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Star className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200 text-sm">
                {lang === 'es' ? 'Recomendado: OpenRouter' : 'Recommended: OpenRouter'}
              </p>
              <p className="text-green-700 dark:text-green-300 text-xs mt-1">
                {lang === 'es'
                  ? '✅ Gratis • ✅ Sin proxy (CORS nativo) • ✅ Múltiples modelos de IA'
                  : '✅ Free • ✅ No proxy (native CORS) • ✅ Multiple AI models'}
              </p>
            </div>
          </div>
        </div>

        {/* Proveedores Gratuitos */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-500" />
            {lang === 'es' ? 'Proveedores Gratuitos' : 'Free Providers'}
          </h3>
          <div className="space-y-2">
            {freeProviders.map((provider, index) => (
              <ProviderRow
                key={provider.id}
                provider={provider}
                features={features}
                rating={getProviderRating(provider)}
                lang={lang}
                index={index}
                onSelect={onSelectProvider}
              />
            ))}
          </div>
        </div>

        {/* Proveedores de Pago */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-orange-500" />
            {lang === 'es' ? 'Proveedores de Pago' : 'Paid Providers'}
          </h3>
          <div className="space-y-2">
            {paidProviders.map((provider, index) => (
              <ProviderRow
                key={provider.id}
                provider={provider}
                features={features}
                rating={getProviderRating(provider)}
                lang={lang}
                index={index + freeProviders.length}
                onSelect={onSelectProvider}
              />
            ))}
          </div>
        </div>

        {/* Leyenda */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 mb-2">
            {lang === 'es' ? 'Características:' : 'Features:'}
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            {features.map(feature => (
              <div key={feature.key} className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <feature.icon className="h-3 w-3" />
                <span>{feature.label[lang]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nota */}
        <p className="text-xs text-gray-500 text-center">
          💡 {lang === 'es'
            ? 'Todos los proveedores requieren una API key gratuita'
            : 'All providers require a free API key'}
        </p>
      </CardContent>
    </Card>
  );
}

// Componente para cada fila de proveedor
interface ProviderRowProps {
  provider: AIProviderConfig;
  features: {
    key: string;
    label: { es: string; en: string };
    icon: React.ElementType;
    getValue: (p: AIProviderConfig) => boolean;
  }[];
  rating: number;
  lang: 'es' | 'en';
  index: number;
  onSelect?: (providerId: string) => void;
}

function ProviderRow({ provider, features, rating, lang, index, onSelect }: ProviderRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
        'transition-colors'
      )}
    >
      {/* Nombre y rating */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white text-sm">
            {provider.name}
          </span>
          {provider.id === 'openrouter' && (
            <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-[10px] font-bold rounded">
              ⭐ {lang === 'es' ? 'RECOMENDADO' : 'RECOMMENDED'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-3 w-3',
                i < rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              )}
            />
          ))}
          {provider.freeModels && (
            <span className="ml-2 text-[10px] text-gray-500">
              {provider.freeModels.length} {lang === 'es' ? 'modelos' : 'models'}
            </span>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="flex items-center gap-2">
        {features.map(feature => {
          const hasFeature = feature.getValue(provider);
          return (
            <div
              key={feature.key}
              className={cn(
                'p-1.5 rounded',
                hasFeature
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              )}
              title={feature.label[lang]}
            >
              {hasFeature ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </div>
          );
        })}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1">
        <a
          href={provider.dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
          title={lang === 'es' ? 'Obtener API Key' : 'Get API Key'}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        {onSelect && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(provider.id)}
            className="text-xs"
          >
            {lang === 'es' ? 'Usar' : 'Use'}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
