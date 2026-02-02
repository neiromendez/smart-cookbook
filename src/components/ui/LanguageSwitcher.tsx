'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check } from 'lucide-react';
import { StorageService } from '@/lib/services/storage.service';
import { cn } from '@/lib/utils/cn';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'list';
}

const LANGUAGES = [
  { code: 'es', label: 'ES', name: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'EN', name: 'English', flag: '🇺🇸' },
];

/**
 * LanguageSwitcher - Selector de idioma con dropdown o lista
 * Muestra bandera + codigo del idioma actual
 */
export function LanguageSwitcher({ className, variant = 'dropdown' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (variant !== 'dropdown') return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variant]);

  const handleSelect = (langCode: string) => {
    i18n.changeLanguage(langCode);
    StorageService.setPreferences({ locale: langCode as 'en' | 'es' });
    setIsOpen(false);
  };

  if (variant === 'list') {
    return (
      <div className={cn('space-y-1', className)}>
        {LANGUAGES.map(lang => {
          const isSelected = lang.code === currentLang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                isSelected
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
              {isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Boton principal - muestra idioma actual */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg',
          'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
          'text-sm font-medium text-gray-700 dark:text-gray-300',
          'transition-colors duration-200',
          'border border-transparent',
          isOpen && 'ring-2 ring-orange-500/50'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span>{currentLang.label}</span>
        <ChevronDown className={cn(
          'h-4 w-4 text-gray-500 transition-transform duration-200',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-44 py-1',
            'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
            'border border-gray-200 dark:border-gray-700',
            'z-50 animate-in fade-in-0 zoom-in-95 duration-150'
          )}
          role="listbox"
        >
          {LANGUAGES.map(lang => {
            const isSelected = lang.code === currentLang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2',
                  'text-sm text-left',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors duration-150',
                  isSelected && 'bg-orange-50 dark:bg-orange-900/20'
                )}
                role="option"
                aria-selected={isSelected}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex-1">
                  <div className={cn(
                    'font-medium',
                    isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'
                  )}>
                    {lang.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {lang.label}
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-orange-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
