'use client';

import { ThemeProvider } from 'next-themes';
import '@/lib/i18n';
import { useIsClient } from '@/lib/hooks/useIsClient';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Providers - Wrapper para todos los providers de la app
 *
 * Incluye:
 * - ThemeProvider (next-themes) para dark/light mode
 * - i18n se inicializa via import
 */
export function Providers({ children }: ProvidersProps) {
  const isClient = useIsClient();

  // Mostrar nada hasta que el cliente este montado
  // Esto evita el flash de tema incorrecto
  if (!isClient) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        {children}
      </div>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
