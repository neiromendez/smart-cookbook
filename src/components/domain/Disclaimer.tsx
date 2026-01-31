'use client';

import { Info } from 'lucide-react';

interface DisclaimerProps {
  className?: string;
}

/**
 * Disclaimer - Aviso legal persistente
 *
 * Muestra advertencia sobre:
 * - Contenido generado por IA
 * - No es consejo medico
 * - Verificar ingredientes
 */
export function Disclaimer({ className }: DisclaimerProps) {
  return (
    <div
      className={`flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs text-yellow-800 dark:text-yellow-200 ${className}`}
    >
      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <p>
        <strong>Disclaimer:</strong> Esta receta es generada por IA solo para inspiración culinaria.
        No es consejo médico o nutricional profesional.
        Verifica siempre los ingredientes para tus necesidades de salud específicas,
        especialmente si tienes alergias o condiciones médicas.
      </p>
    </div>
  );
}
