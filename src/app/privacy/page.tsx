'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ChefHat, ArrowLeft, Shield, Database, Key, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function PrivacyPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  const content = {
    es: {
      title: 'Política de Privacidad',
      lastUpdated: 'Última actualización: Enero 2026',
      intro: 'En Smart Cookbook, tu privacidad es nuestra prioridad número uno. Esta política explica cómo manejamos (o mejor dicho, cómo NO manejamos) tus datos.',
      highlights: [
        {
          icon: Shield,
          title: 'Sin servidores propios',
          description: 'No tenemos bases de datos ni servidores que almacenen tu información.',
        },
        {
          icon: Database,
          title: '100% Local',
          description: 'Todos tus datos se guardan únicamente en tu navegador (localStorage).',
        },
        {
          icon: Key,
          title: 'API Keys seguras',
          description: 'Tus API keys nunca salen de tu dispositivo excepto para llamar a los proveedores de IA.',
        },
        {
          icon: Trash2,
          title: 'Control total',
          description: 'Puedes borrar todos tus datos en cualquier momento desde la configuración.',
        },
      ],
      sections: [
        {
          title: '1. Datos que almacenamos',
          content: 'Todos los datos se almacenan LOCALMENTE en tu navegador usando localStorage:',
          list: [
            'Perfil de chef (nombre, preferencias, alergias)',
            'API keys de proveedores de IA',
            'Historial de recetas generadas',
            'Lista de compras',
            'Despensa (ingredientes disponibles)',
            'Preferencias de idioma y tema',
          ],
        },
        {
          title: '2. Datos que NO recopilamos',
          content: 'Nosotros no tenemos acceso a:',
          list: [
            'Tu nombre real o información personal',
            'Tus API keys',
            'Las recetas que generas',
            'Tu ubicación',
            'Tu historial de navegación',
            'Ningún dato analítico o de seguimiento',
          ],
        },
        {
          title: '3. Comunicación con terceros',
          content: 'Cuando generas una receta, tu navegador se comunica directamente con el proveedor de IA que seleccionaste (OpenRouter, Groq, etc.). Esta comunicación incluye:',
          list: [
            'Tu API key (para autenticación)',
            'El prompt con los ingredientes y preferencias',
            'Información de tu perfil relevante para la receta',
          ],
          note: 'Revisa la política de privacidad de cada proveedor de IA para entender cómo manejan esta información.',
        },
        {
          title: '4. Cookies',
          content: 'No usamos cookies de seguimiento ni de publicidad. Solo utilizamos localStorage para persistir tus preferencias.',
        },
        {
          title: '5. Cómo borrar tus datos',
          content: 'Tienes control total sobre tus datos:',
          list: [
            'Ve a Configuración → "Borrar Todo" para eliminar todos los datos de la aplicación',
            'Alternativamente, limpia el localStorage de tu navegador',
            'Una vez borrados, los datos no se pueden recuperar',
          ],
        },
        {
          title: '6. Seguridad',
          content: 'Recomendaciones de seguridad:',
          list: [
            'Usa API keys con permisos limitados cuando sea posible',
            'No compartas tu navegador con personas en las que no confíes',
            'Borra tus datos antes de vender o regalar tu dispositivo',
          ],
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: January 2026',
      intro: "At Smart Cookbook, your privacy is our number one priority. This policy explains how we handle (or rather, how we DON'T handle) your data.",
      highlights: [
        {
          icon: Shield,
          title: 'No own servers',
          description: 'We have no databases or servers that store your information.',
        },
        {
          icon: Database,
          title: '100% Local',
          description: 'All your data is stored only in your browser (localStorage).',
        },
        {
          icon: Key,
          title: 'Secure API Keys',
          description: 'Your API keys never leave your device except to call AI providers.',
        },
        {
          icon: Trash2,
          title: 'Full control',
          description: 'You can delete all your data at any time from settings.',
        },
      ],
      sections: [
        {
          title: '1. Data we store',
          content: 'All data is stored LOCALLY in your browser using localStorage:',
          list: [
            'Chef profile (name, preferences, allergies)',
            'AI provider API keys',
            'Generated recipe history',
            'Shopping list',
            'Pantry (available ingredients)',
            'Language and theme preferences',
          ],
        },
        {
          title: '2. Data we DO NOT collect',
          content: 'We have no access to:',
          list: [
            'Your real name or personal information',
            'Your API keys',
            'The recipes you generate',
            'Your location',
            'Your browsing history',
            'Any analytics or tracking data',
          ],
        },
        {
          title: '3. Third-party communication',
          content: 'When you generate a recipe, your browser communicates directly with the AI provider you selected (OpenRouter, Groq, etc.). This communication includes:',
          list: [
            'Your API key (for authentication)',
            'The prompt with ingredients and preferences',
            'Your profile information relevant to the recipe',
          ],
          note: "Review each AI provider's privacy policy to understand how they handle this information.",
        },
        {
          title: '4. Cookies',
          content: 'We do not use tracking or advertising cookies. We only use localStorage to persist your preferences.',
        },
        {
          title: '5. How to delete your data',
          content: 'You have full control over your data:',
          list: [
            'Go to Settings → "Delete All" to remove all application data',
            'Alternatively, clear your browser\'s localStorage',
            'Once deleted, data cannot be recovered',
          ],
        },
        {
          title: '6. Security',
          content: 'Security recommendations:',
          list: [
            'Use API keys with limited permissions when possible',
            "Don't share your browser with people you don't trust",
            'Delete your data before selling or giving away your device',
          ],
        },
      ],
    },
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              {lang === 'es' ? 'Volver' : 'Back'}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="font-bold text-gray-900 dark:text-white">Smart Cookbook</span>
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🔒 {t.title}
            </h1>
            <p className="text-sm text-gray-500 mb-4">{t.lastUpdated}</p>
            <p className="text-gray-600 dark:text-gray-300 mb-8">{t.intro}</p>

            {/* Highlights */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {t.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <highlight.icon className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    {highlight.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {t.sections.map((section, index) => (
                <div key={index}>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {section.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {section.content}
                  </p>
                  {section.list && (
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 ml-2">
                      {section.list.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.note && (
                    <p className="mt-2 text-sm text-orange-600 dark:text-orange-400 italic">
                      ⚠️ {section.note}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer links */}
            <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 flex gap-4 text-sm">
              <Link href="/terms" className="text-orange-600 hover:underline">
                {lang === 'es' ? 'Términos' : 'Terms'}
              </Link>
              <Link href="/disclaimer" className="text-orange-600 hover:underline">
                Disclaimer
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
