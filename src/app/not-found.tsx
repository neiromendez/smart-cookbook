'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            <div className="relative mb-8">
                <div className="absolute inset-0 blur-2xl bg-orange-500/20 rounded-full scale-150" />
                <div className="relative bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl">
                    <UtensilsCrossed className="h-16 w-16 text-orange-500" />
                </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('notFound.title')}
            </h1>

            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
                {t('notFound.message')}
            </p>

            <Button
                size="lg"
                className="rounded-full px-8 gap-2"
                onClick={() => router.push('/')}
            >
                <Home className="h-4 w-4" />
                {t('notFound.backHome')}
            </Button>

            <div className="mt-12 opacity-50 grayscale select-none pointer-events-none">
                <div className="flex gap-4 text-4xl">
                    🍳 🍅 🥦 🥘
                </div>
            </div>
        </div>
    );
}
