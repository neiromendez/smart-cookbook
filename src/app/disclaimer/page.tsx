'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ChefHat, ArrowLeft, AlertTriangle, Bot, Heart, Scale } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function DisclaimerPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'es' | 'en';

  const content = {
    es: {
      title: 'Disclaimer',
      subtitle: 'Descargo de Responsabilidad',
      intro: 'Smart Cookbook utiliza inteligencia artificial para generar recetas. Por favor, lee atentamente este disclaimer antes de usar la aplicación.',
      warnings: [
        {
          icon: Bot,
          title: 'Contenido Generado por IA',
          description: 'Las recetas son creadas por modelos de inteligencia artificial. Aunque hacemos nuestro mejor esfuerzo por proporcionar información precisa, la IA puede cometer errores en ingredientes, cantidades, tiempos de cocción o instrucciones.',
          color: 'orange',
        },
        {
          icon: AlertTriangle,
          title: 'Alergias e Intolerancias',
          description: 'SIEMPRE verifica los ingredientes antes de cocinar. La IA puede no identificar correctamente todos los alérgenos. Si tienes alergias severas, consulta con un profesional médico antes de probar nuevas recetas.',
          color: 'red',
        },
        {
          icon: Heart,
          title: 'Condiciones de Salud',
          description: 'Las sugerencias nutricionales son aproximadas y generadas por IA. No sustituyen el consejo médico profesional. Si tienes diabetes, hipertensión u otras condiciones, consulta a tu médico o nutricionista.',
          color: 'pink',
        },
        {
          icon: Scale,
          title: 'Precisión Nutricional',
          description: 'Los valores nutricionales mostrados son estimaciones y pueden variar significativamente según los ingredientes exactos, marcas y métodos de preparación utilizados.',
          color: 'blue',
        },
      ],
      sections: [
        {
          title: 'Uso Bajo Tu Responsabilidad',
          content: 'Al usar Smart Cookbook, aceptas que:',
          list: [
            'Eres responsable de verificar la seguridad de cada receta',
            'Debes adaptar las recetas según tus necesidades dietéticas',
            'No nos hacemos responsables de reacciones adversas',
            'Cocinar implica riesgos inherentes que debes gestionar',
          ],
        },
        {
          title: 'Qué Hacer Siempre',
          content: 'Recomendaciones de seguridad:',
          list: [
            '✅ Lee toda la receta antes de empezar',
            '✅ Verifica que no contenga ingredientes a los que seas alérgico',
            '✅ Usa tu criterio en cantidades y tiempos',
            '✅ Asegura la correcta cocción de carnes y mariscos',
            '✅ Guarda los alimentos de forma segura',
            '✅ Consulta fuentes adicionales si tienes dudas',
          ],
        },
        {
          title: 'Limitación de Responsabilidad',
          content: 'Smart Cookbook, sus creadores y colaboradores no se hacen responsables de:',
          list: [
            'Daños a la salud derivados del uso de recetas generadas',
            'Reacciones alérgicas o intolerancias',
            'Errores en información nutricional',
            'Resultados culinarios insatisfactorios',
            'Costos derivados del uso de APIs de terceros',
          ],
        },
      ],
      callToAction: 'Si experimentas cualquier reacción adversa después de consumir una receta, busca atención médica inmediatamente.',
    },
    en: {
      title: 'Disclaimer',
      subtitle: 'Legal Disclaimer',
      intro: 'Smart Cookbook uses artificial intelligence to generate recipes. Please read this disclaimer carefully before using the application.',
      warnings: [
        {
          icon: Bot,
          title: 'AI-Generated Content',
          description: 'Recipes are created by artificial intelligence models. Although we do our best to provide accurate information, AI can make mistakes in ingredients, quantities, cooking times, or instructions.',
          color: 'orange',
        },
        {
          icon: AlertTriangle,
          title: 'Allergies & Intolerances',
          description: 'ALWAYS verify ingredients before cooking. AI may not correctly identify all allergens. If you have severe allergies, consult a medical professional before trying new recipes.',
          color: 'red',
        },
        {
          icon: Heart,
          title: 'Health Conditions',
          description: 'Nutritional suggestions are approximate and AI-generated. They do not substitute professional medical advice. If you have diabetes, hypertension, or other conditions, consult your doctor or nutritionist.',
          color: 'pink',
        },
        {
          icon: Scale,
          title: 'Nutritional Accuracy',
          description: 'Displayed nutritional values are estimates and may vary significantly based on exact ingredients, brands, and preparation methods used.',
          color: 'blue',
        },
      ],
      sections: [
        {
          title: 'Use at Your Own Risk',
          content: 'By using Smart Cookbook, you accept that:',
          list: [
            'You are responsible for verifying the safety of each recipe',
            'You must adapt recipes according to your dietary needs',
            'We are not responsible for adverse reactions',
            'Cooking involves inherent risks that you must manage',
          ],
        },
        {
          title: 'What to Always Do',
          content: 'Safety recommendations:',
          list: [
            '✅ Read the entire recipe before starting',
            "✅ Verify it doesn't contain ingredients you're allergic to",
            '✅ Use your judgment on quantities and times',
            '✅ Ensure proper cooking of meats and seafood',
            '✅ Store food safely',
            '✅ Consult additional sources if in doubt',
          ],
        },
        {
          title: 'Limitation of Liability',
          content: 'Smart Cookbook, its creators, and contributors are not responsible for:',
          list: [
            'Health damage resulting from use of generated recipes',
            'Allergic reactions or intolerances',
            'Errors in nutritional information',
            'Unsatisfactory culinary results',
            'Costs arising from use of third-party APIs',
          ],
        },
      ],
      callToAction: 'If you experience any adverse reaction after consuming a recipe, seek medical attention immediately.',
    },
  };

  const t = content[lang];

  const colorClasses = {
    orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    red: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    pink: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800',
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  };

  const iconColorClasses = {
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
    pink: 'text-pink-600 dark:text-pink-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              ⚠️ {t.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{t.subtitle}</p>
            <p className="text-gray-600 dark:text-gray-300 mb-8">{t.intro}</p>

            {/* Warning Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {t.warnings.map((warning, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${colorClasses[warning.color as keyof typeof colorClasses]}`}
                >
                  <warning.icon className={`h-6 w-6 mb-2 ${iconColorClasses[warning.color as keyof typeof iconColorClasses]}`} />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                    {warning.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {warning.description}
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
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 ml-2">
                    {section.list.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="mt-8 p-4 bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 font-medium text-center">
                🚨 {t.callToAction}
              </p>
            </div>

            {/* Footer links */}
            <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 flex gap-4 text-sm">
              <Link href="/terms" className="text-orange-600 hover:underline">
                {lang === 'es' ? 'Términos' : 'Terms'}
              </Link>
              <Link href="/privacy" className="text-orange-600 hover:underline">
                {lang === 'es' ? 'Privacidad' : 'Privacy'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
