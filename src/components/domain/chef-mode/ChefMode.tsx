'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    X,
    Timer,
    CheckCircle2,
    Zap,
    ZapOff,
    ChefHat,
    List
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Recipe } from '@/types';
import { cn } from '@/lib/utils/cn';

interface ChefModeProps {
    recipe: Recipe;
    onClose: () => void;
}

export function ChefMode({ recipe, onClose }: ChefModeProps) {
    const { t, i18n } = useTranslation();
    const lang = i18n.language as 'es' | 'en';

    const [currentStep, setCurrentStep] = useState(0);
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
    const [wakeLockError, setWakeLockError] = useState(false);
    const [activeTimers, setActiveTimers] = useState<Record<number, { seconds: number; total: number }>>({});

    const stepCount = recipe.instructions.length;

    // ============================================
    // WAKE LOCK LOGIC
    // ============================================
    const requestWakeLock = useCallback(async () => {
        if ('wakeLock' in navigator) {
            try {
                const sentinel = await navigator.wakeLock.request('screen');
                setWakeLock(sentinel);
                console.info('[ChefMode] Wake Lock is active');

                sentinel.addEventListener('release', () => {
                    console.info('[ChefMode] Wake Lock was released');
                    setWakeLock(null);
                });
            } catch (err) {
                console.error('[ChefMode] Wake Lock error:', err);
                setWakeLockError(true);
            }
        }
    }, []);

    useEffect(() => {
        requestWakeLock();
        return () => {
            wakeLock?.release();
        };
    }, [requestWakeLock]);

    // Re-solicitar si la página vuelve a estar visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [requestWakeLock, wakeLock]);

    // ============================================
    // NAVIGATION LOGIC
    // ============================================
    const nextStep = () => {
        if (currentStep < stepCount - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // ============================================
    // TIMER LOGIC
    // ============================================
    const instruction = recipe.instructions[currentStep] || '';
    const timeMatch = instruction.match(/(\d+)\s*(?:min|minutos?|minutes?)/i);
    const timeMinutes = timeMatch ? parseInt(timeMatch[1], 10) : null;

    const startTimer = (minutes: number) => {
        const seconds = minutes * 60;
        setActiveTimers(prev => ({
            ...prev,
            [currentStep]: { seconds, total: seconds }
        }));
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTimers(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(key => {
                    const k = parseInt(key);
                    if (next[k].seconds > 0) {
                        next[k] = { ...next[k], seconds: next[k].seconds - 1 };
                        changed = true;

                        if (next[k].seconds === 0) {
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                            audio.play().catch(() => { });
                        }
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const currentTimer = activeTimers[currentStep];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gray-950 text-white flex flex-col font-sans"
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500 rounded-lg">
                        <ChefHat className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold truncate max-w-[200px] sm:max-w-md">
                            {recipe.title}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">
                                {t('chefMode.step', { current: currentStep + 1, total: stepCount })}
                            </span>
                            {wakeLock ? (
                                <span className="flex items-center gap-1 text-[10px] text-green-400">
                                    <Zap className="h-3 w-3" /> {t('chefMode.wakeLock.active')}
                                </span>
                            ) : wakeLockError ? (
                                <span className="flex items-center gap-1 text-[10px] text-red-400">
                                    <ZapOff className="h-3 w-3" /> {t('chefMode.wakeLock.error')}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="h-8 w-8 text-gray-400" />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-12 flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-full space-y-8"
                    >
                        {/* El Paso actual */}
                        <div className="space-y-6">
                            <p className="text-2xl sm:text-4xl font-medium leading-tight text-white">
                                {instruction}
                            </p>
                        </div>

                        {/* Timers y Acciones del Paso */}
                        <div className="flex flex-col items-center gap-6">
                            {timeMinutes && !currentTimer && (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => startTimer(timeMinutes)}
                                    className="rounded-full py-6 px-8 text-xl border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
                                    icon={<Timer className="h-6 w-6" />}
                                >
                                    {lang === 'es' ? `Iniciar Timer (${timeMinutes}m)` : `Start Timer (${timeMinutes}m)`}
                                </Button>
                            )}

                            {currentTimer && (
                                <div className="bg-orange-950/30 border-2 border-orange-500 rounded-3xl p-8 min-w-[280px] text-center shadow-2xl shadow-orange-500/10">
                                    <div className="text-5xl sm:text-7xl font-black tabular-nums text-white mb-2">
                                        {Math.floor(currentTimer.seconds / 60)}:{(currentTimer.seconds % 60).toString().padStart(2, '0')}
                                    </div>
                                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-orange-500"
                                            initial={false}
                                            animate={{ width: `${(currentTimer.seconds / currentTimer.total) * 100}%` }}
                                        />
                                    </div>
                                    {currentTimer.seconds === 0 && (
                                        <p className="mt-4 text-orange-400 font-bold text-xl animate-bounce">
                                            🔔 {lang === 'es' ? '¡LISTO!' : 'DONE!'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Hint de Ingredientes (Opcional, para el paso actual) */}
                        <div className="pt-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-full text-gray-400 text-sm">
                                <List className="h-4 w-4" />
                                {t('chefMode.ingredients')}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 sm:p-12 grid grid-cols-2 gap-6 max-w-6xl mx-auto w-full">
                <Button
                    size="lg"
                    variant="secondary"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="h-28 rounded-3xl text-2xl sm:text-3xl font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30"
                    icon={<ChevronLeft className="h-8 w-8 sm:h-12 sm:w-12" />}
                >
                    {t('chefMode.prev')}
                </Button>
                <Button
                    size="lg"
                    onClick={nextStep}
                    className={cn(
                        "h-28 rounded-3xl text-2xl sm:text-3xl font-bold transition-all",
                        currentStep === stepCount - 1
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-orange-500 hover:bg-orange-600 text-white"
                    )}
                >
                    {currentStep === stepCount - 1 ? (
                        <span className="flex items-center gap-3">
                            <CheckCircle2 className="h-8 w-8 sm:h-12 sm:w-12" />
                            {t('chefMode.finish')}
                        </span>
                    ) : (
                        <span className="flex items-center gap-3">
                            {t('chefMode.next')}
                            <ChevronRight className="h-8 w-8 sm:h-12 sm:w-12" />
                        </span>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
