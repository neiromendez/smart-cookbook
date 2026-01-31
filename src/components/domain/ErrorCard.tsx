'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, RefreshCw, ArrowRight, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { APIError, FreeAlternative } from '@/types';

interface ErrorCardProps {
  error: APIError;
  onRetry?: () => void;
  onSwitchProvider?: (providerId: string) => void;
  onNavigate?: (path: string) => void;
  provider?: string;
}

/**
 * ErrorCard - Tarjeta de error amigable con soluciones
 *
 * Muestra:
 * - Icono + Titulo del error
 * - Explicacion en lenguaje simple
 * - Lista de soluciones
 * - Alternativas gratuitas (si aplica)
 * - Botones de accion
 * - Auto-retry con countdown (si aplica)
 */
export function ErrorCard({
  error,
  onRetry,
  onSwitchProvider,
  onNavigate,
  provider,
}: ErrorCardProps) {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Auto-retry countdown
  useEffect(() => {
    if (error.autoRetry && error.retryDelay && onRetry) {
      const seconds = Math.ceil(error.retryDelay / 1000);
      setCountdown(seconds);

      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return 0; // Marcar como listo para retry
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [error.autoRetry, error.retryDelay]);

  // Efecto separado para ejecutar retry cuando countdown llega a 0
  useEffect(() => {
    if (countdown === 0 && onRetry && !isRetrying) {
      setIsRetrying(true);
      setCountdown(null);
      onRetry();
    }
  }, [countdown, onRetry, isRetrying]);

  const handleAction = (action: string) => {
    if (action.startsWith('switch-provider:')) {
      const providerId = action.split(':')[1]; // Changed to split for parsing
      if (onSwitchProvider) onSwitchProvider(providerId);
    } else if (action.startsWith('navigate:')) {
      const path = action.replace('navigate:', '');
      onNavigate?.(path);
    } else if (action === 'show-free-providers') {
      // Scroll a la seccion de alternativas
    } else if (action === 'auto-switch-provider') {
      // Cambiar automaticamente al primer proveedor gratuito
      if (error.freeAlternatives?.[0]) {
        const action = error.freeAlternatives[0].action;
        const providerId = action.replace('switch-provider:', '');
        onSwitchProvider?.(providerId);
      }
    }
  };

  const cancelAutoRetry = () => {
    setCountdown(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="outlined" className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30">
        <CardContent>
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <span className="text-3xl" role="img" aria-label="error icon">
              {error.icon}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t(error.title)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t(error.message)}
              </p>
            </div>
          </div>

          {/* Soluciones */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              💡 {t('errors.solutions')}
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {error.solutions.map((solution, index) => (
                <li key={index}>{t(solution)}</li>
              ))}
            </ol>
          </div>

          {/* Alternativas gratuitas */}
          <AnimatePresence>
            {error.freeAlternatives && error.freeAlternatives.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800"
              >
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  {t('errors.freeAlternatives')}
                </p>
                <div className="space-y-2">
                  {error.freeAlternatives.map((alt: FreeAlternative, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {alt.provider}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          - {t(alt.reason)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAction(alt.action)}
                        className="text-green-600 hover:text-green-700"
                      >
                        {t('errors.use')} <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Link al dashboard del proveedor */}
          {error.providerLinks && provider && error.providerLinks[provider] && (
            <a
              href={error.providerLinks[provider]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
            >
              Ir al dashboard de {provider}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Botones de accion */}
          <div className="flex flex-wrap gap-2">
            {error.actionButton && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAction(error.actionButton!.action)}
              >
                {t(error.actionButton.label)}
              </Button>
            )}

            {onRetry && countdown !== null ? (
              // Auto-retry con countdown - usar dos botones separados
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={true}
                  icon={<RefreshCw className="h-4 w-4 animate-spin" />}
                >
                  Reintentando en {countdown}s...
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelAutoRetry}
                  className="text-xs underline"
                >
                  Cancelar
                </Button>
              </div>
            ) : onRetry ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled={isRetrying}
                icon={<RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />}
              >
                {isRetrying ? 'Reintentando...' : 'Intentar de nuevo'}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
