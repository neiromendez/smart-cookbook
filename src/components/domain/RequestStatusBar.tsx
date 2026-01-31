'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, ChefHat, Wifi, Sparkles, AlertCircle } from 'lucide-react';
import type { RequestStatus } from '@/types';
import { cn } from '@/lib/utils/cn';

interface RequestStatusBarProps {
  status: RequestStatus;
  className?: string;
}

/**
 * RequestStatusBar - Barra de estado de peticion
 *
 * Estados visuales:
 * - IDLE: "🍳 Listo para cocinar"
 * - VALIDATING: "🔍 Validando tu petición..."
 * - CONNECTING: "🔌 Conectando con {provider}..."
 * - STREAMING: "✨ Generando receta... {tokens} tokens"
 * - COMPLETED: "✅ ¡Receta lista! (3.2s)"
 * - ERROR: (Manejado por ErrorCard)
 */
export function RequestStatusBar({ status, className }: RequestStatusBarProps) {
  const getStatusContent = () => {
    switch (status.state) {
      case 'idle':
        return {
          icon: <ChefHat className="h-5 w-5 text-orange-500" />,
          text: 'Listo para cocinar',
          subtext: 'Escribe los ingredientes que tienes',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-800/50',
        };

      case 'validating':
        return {
          icon: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
          text: status.message || 'Validando tu petición...',
          subtext: 'Verificando que todo esté en orden',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950/50',
        };

      case 'connecting':
        return {
          icon: <Wifi className="h-5 w-5 text-purple-500 animate-pulse" />,
          text: `Conectando con ${status.provider}...`,
          subtext: 'Estableciendo conexión segura',
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-950/50',
        };

      case 'streaming':
        return {
          icon: <Sparkles className="h-5 w-5 text-orange-500 animate-pulse" />,
          text: 'Generando receta...',
          subtext: `${status.tokens} tokens generados`,
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-950/50',
        };

      case 'completed':
        return {
          icon: <Check className="h-5 w-5 text-green-500" />,
          text: '¡Receta lista!',
          subtext: `Generada en ${(status.duration / 1000).toFixed(1)} segundos`,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950/50',
        };

      case 'error':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          text: 'Error al generar',
          subtext: 'Ver detalles abajo',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950/50',
        };

      default:
        return null;
    }
  };

  const content = getStatusContent();

  if (!content) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status.state}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'rounded-lg px-4 py-3 flex items-center gap-3',
          content.bgColor,
          className
        )}
      >
        <div className="flex-shrink-0">{content.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium text-sm', content.color)}>
            {content.text}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {content.subtext}
          </p>
        </div>

        {/* Progress bar para streaming */}
        {status.state === 'streaming' && (
          <div className="w-24 h-1.5 bg-orange-200 dark:bg-orange-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-orange-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 30,
                ease: 'linear',
                repeat: Infinity,
              }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
