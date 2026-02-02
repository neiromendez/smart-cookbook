'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils/cn';

interface ThemeToggleProps {
  className?: string;
  variant?: 'buttons' | 'list';
}

/**
 * ThemeToggle - Botones o lista para cambiar el tema
 */
export function ThemeToggle({ className, variant = 'buttons' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', icon: Sun, label: 'Claro', labelEn: 'Light' },
    { id: 'dark', icon: Moon, label: 'Oscuro', labelEn: 'Dark' },
    { id: 'system', icon: Monitor, label: 'Sistema', labelEn: 'System' },
  ];

  if (variant === 'list') {
    return (
      <div className={cn('space-y-1', className)}>
        {themes.map(({ id, icon: Icon, label, labelEn }) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
              theme === id
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4" />
              <span>{label} / {labelEn}</span>
            </div>
            {theme === id && (
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg', className)}>
      {themes.map(({ id, icon: Icon, label }) => (
        <Button
          key={id}
          variant="ghost"
          size="sm"
          onClick={() => setTheme(id)}
          className={cn(
            'px-3 py-1.5',
            theme === id && 'bg-white dark:bg-gray-700 shadow-sm'
          )}
          title={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
