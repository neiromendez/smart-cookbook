# 🍳 Smart Cookbook

**Tu asistente de cocina con IA - 100% gratis, 100% privado**

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md)

Genera recetas personalizadas basadas en los ingredientes que tengas disponibles. Sin servidores, sin bases de datos, todo funciona directamente en tu navegador.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)

## ✨ Características

- 🤖 **Múltiples proveedores de IA**: OpenRouter, Groq, Google AI, Cerebras (¡todos gratuitos!)
- 🔒 **100% Privado**: Tus datos nunca salen de tu navegador
- 🌐 **Sin backend**: Todo funciona client-side
- 🛡️ **Anti-Prompt Injection**: Protección contra manipulación de IA
- 🌙 **Tema oscuro/claro**: Modo sistema, oscuro o claro
- 🌍 **Multiidioma**: Español e Inglés
- 📱 **Mobile First**: Diseñado para móvil primero
- ⚡ **Ultra-rápido**: Generación de recetas en segundos

## 🚀 Inicio Rápido

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/smart-cookbook.git
cd smart-cookbook

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Abrir http://localhost:3000
```

## 🤖 Proveedores de IA Soportados

### 🆓 Gratuitos (Sin tarjeta de crédito)

| Proveedor | Velocidad | Free Tier | CORS |
|-----------|-----------|-----------|------|
| **OpenRouter** | Variable | $5 créditos + modelos :free | ✅ Nativo |
| **Groq** | 🚀 300 tok/s | 30 RPM, 6000 TPM | ✅ Soportado |
| **Google AI** | Media | Ilimitado (rate limits) | ✅ Soportado |
| **Cerebras** | 🚀🚀 2600 tok/s | 1M tokens/día | ✅ Soportado |

### 💳 De Pago

- OpenAI (GPT-4o)
- Anthropic (Claude)
- Together AI ($25 créditos)
- Fireworks AI ($1 créditos)
- Mistral

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/ai/proxy/     # API Endpoints (IA Gateway)
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Página principal
├── components/
│   ├── ui/               # Componentes base (Button, Card, Input)
│   ├── domain/           # Componentes de dominio (RecipeGenerator, ErrorCard)
│   └── providers/        # Context providers (Theme, i18n)
├── lib/
│   ├── adapters/         # Adaptadores de IA (OpenRouter, Groq, Google, etc.)
│   ├── services/         # Servicios (Storage, Guardrails, Error)
│   ├── hooks/            # Custom hooks (useRecipeGeneration)
│   └── utils/            # Utilidades
├── types/                # TypeScript types
└── locales/              # Traducciones (es, en)
```

## 🛡️ Seguridad

### Protección Anti-Prompt Injection

El sistema incluye múltiples capas de defensa:

1. **Validación de entrada**: Bloquea patrones como "ignore previous", "you are now", etc.
2. **System prompt blindado**: Instrucciones inmutables que la IA no puede ignorar
3. **Validación de salida**: Verifica que la respuesta sea contenido culinario

### Privacidad

- ✅ **Sin backend propio**: Todo es client-side
- ✅ **Sin analytics/tracking**: No recopilamos datos
- ✅ **Sin cookies de terceros**: Solo localStorage
- ✅ **API keys seguras**: Solo se envían al proveedor que elijas
- ✅ **Botón "Borrar Mis Datos"**: Elimina todo al instante

## 🔧 Configuración

### Variables de entorno

No se requieren variables de entorno. Todo funciona con las API keys del usuario.

### Performance
El sistema utiliza Vercel Edge Runtime para:
- 🚀 Latencia mínima (edge servers globales)
- 🔒 Whitelist de proveedores permitidos

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'feat: nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - Puedes usar este proyecto para lo que quieras.

## ⚠️ Disclaimer

Las recetas son generadas por IA solo para inspiración culinaria. No es consejo médico o nutricional profesional. Verifica siempre los ingredientes para tus necesidades de salud específicas, especialmente si tienes alergias o condiciones médicas.

---

Hecho con 🧡 y mucha IA
