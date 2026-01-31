import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Smart Cookbook - Tu asistente de cocina con IA',
  description: 'Genera recetas personalizadas con IA basadas en los ingredientes que tengas. 100% gratis, 100% privado.',
  keywords: ['recetas', 'IA', 'cocina', 'ingredientes', 'inteligencia artificial', 'chef'],
  authors: [{ name: 'Smart Cookbook' }],
  openGraph: {
    title: 'Smart Cookbook - Tu asistente de cocina con IA',
    description: 'Genera recetas personalizadas con IA basadas en los ingredientes que tengas.',
    type: 'website',
    locale: 'es_ES',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-gray-50 dark:bg-gray-950`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
