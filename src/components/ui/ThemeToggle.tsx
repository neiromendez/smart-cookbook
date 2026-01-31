'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils/cn';

interface ThemeToggleProps {
  className?: string;
}

/**
 * ThemeToggle - Botones para cambiar el tema
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', icon: Sun, label: 'Claro' },
    { id: 'dark', icon: Moon, label: 'Oscuro' },
    { id: 'system', icon: Monitor, label: 'Sistema' },
  ];

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
