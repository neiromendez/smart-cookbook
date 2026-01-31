// Servicio de manejo de errores
// Mapea errores de cada proveedor a errores amigables

import type { APIError, ErrorCode, FreeAlternative } from '@/types';

// Alternativas gratuitas para errores de pago
const FREE_ALTERNATIVES: FreeAlternative[] = [
  {
    provider: 'Cerebras',
    reason: 'errors.freeReasons.cerebras',
    url: 'https://cloud.cerebras.ai/',
    action: 'switch-provider:cerebras',
  },
  {
    provider: 'Google AI Studio',
    reason: 'errors.freeReasons.google',
    url: 'https://aistudio.google.com/',
    action: 'switch-provider:google',
  },
  {
    provider: 'Groq',
    reason: 'errors.freeReasons.groq',
    url: 'https://console.groq.com/',
    action: 'switch-provider:groq',
  },
  {
    provider: 'Hugging Face',
    reason: 'errors.freeReasons.huggingface',
    url: 'https://huggingface.co/',
    action: 'switch-provider:huggingface',
  },

  {
    provider: 'OpenRouter',
    reason: 'errors.freeReasons.openrouter',
    url: 'https://openrouter.ai/',
    action: 'switch-provider:openrouter',
  },
];

// Catalogo de errores con soluciones
const ERROR_SOLUTIONS: Record<ErrorCode, APIError> = {
  INVALID_API_KEY: {
    code: 'INVALID_API_KEY',
    icon: '🔑',
    title: 'errors.invalidApiKey.title',
    message: 'errors.invalidApiKey.message',
    solutions: [
      'Verifica que copiaste la key completa',
      'Genera una nueva API key en el dashboard del proveedor',
      'Asegurate de que la key no haya expirado',
    ],
    actionButton: {
      label: 'Ir a configuracion',
      action: 'navigate:/settings',
    },
    providerLinks: {
      openai: 'https://platform.openai.com/api-keys',
      groq: 'https://console.groq.com/keys',
      google: 'https://aistudio.google.com/apikey',
      openrouter: 'https://openrouter.ai/settings/keys',
      cerebras: 'https://cloud.cerebras.ai/',
      huggingface: 'https://huggingface.co/settings/tokens',
    },
  },

  INSUFFICIENT_QUOTA: {
    code: 'INSUFFICIENT_QUOTA',
    icon: '💳',
    title: 'errors.insufficientQuota.title',
    message: 'errors.insufficientQuota.message',
    solutions: [
      'Anade creditos a tu cuenta del proveedor de IA',
      'O usa un proveedor 100% GRATUITO (sin tarjeta):',
    ],
    freeAlternatives: FREE_ALTERNATIVES,
    actionButton: {
      label: 'Ver proveedores gratuitos',
      action: 'show-free-providers',
    },
  },

  BILLING_HARD_LIMIT: {
    code: 'BILLING_HARD_LIMIT',
    icon: '🚫',
    title: 'errors.insufficientQuota.title', // Reusing similar error title
    message: 'Has alcanzado el limite de gasto mensual configurado.',
    solutions: [
      'Aumenta tu limite de gasto en el dashboard del proveedor',
      'Espera al proximo ciclo de facturacion',
      'Usa un proveedor gratuito mientras tanto',
    ],
    freeAlternatives: FREE_ALTERNATIVES.slice(0, 3),
  },

  PAYMENT_REQUIRED: {
    code: 'PAYMENT_REQUIRED',
    icon: '💰',
    title: 'errors.paymentRequired.title',
    message: 'errors.paymentRequired.message',
    solutions: [
      'Estos proveedores NO requieren tarjeta de credito:',
    ],
    freeAlternatives: FREE_ALTERNATIVES,
    actionButton: {
      label: 'Usar Google AI (Recomendado)',
      action: 'switch-provider:google',
    },
  },

  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    icon: '⏱️',
    title: 'errors.rateLimitExceeded.title',
    message: 'errors.rateLimitExceeded.message',
    solutions: [
      'Espera unos segundos antes de intentar de nuevo',
      'Reduce la frecuencia de tus solicitudes',
      'O cambia a otro proveedor gratuito',
    ],
    autoRetry: true,
    retryDelay: 5000,
    freeAlternatives: FREE_ALTERNATIVES.slice(0, 3),
  },

  DAILY_LIMIT_REACHED: {
    code: 'DAILY_LIMIT_REACHED',
    icon: '📅',
    title: 'errors.rateLimitExceeded.title', // Similar concept
    message: 'Has alcanzado el limite de solicitudes diarias.',
    solutions: [
      'Tu limite se reinicia a las 00:00 UTC',
      'Mientras tanto, rota a otro proveedor gratuito:',
    ],
    freeAlternatives: FREE_ALTERNATIVES,
    actionButton: {
      label: 'Rotar proveedor automaticamente',
      action: 'auto-switch-provider',
    },
  },

  MODEL_NOT_FOUND: {
    code: 'MODEL_NOT_FOUND',
    icon: '🤖',
    title: 'Modelo No Disponible',
    message: 'El modelo de IA seleccionado no esta disponible.',
    solutions: [
      'El modelo puede haber sido descontinuado',
      'Prueba con otro modelo del mismo proveedor',
      'Verifica que tu API key tenga acceso a este modelo',
    ],
    actionButton: {
      label: 'Seleccionar otro modelo',
      action: 'navigate:/settings',
    },
  },

  CONTEXT_LENGTH_EXCEEDED: {
    code: 'CONTEXT_LENGTH_EXCEEDED',
    icon: '📏',
    title: 'Mensaje Muy Largo',
    message: 'Tu solicitud excede el limite del modelo.',
    solutions: [
      'Reduce la cantidad de ingredientes',
      'Simplifica tu peticion',
      'Intenta con un modelo de mayor contexto',
    ],
  },

  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    icon: '📡',
    title: 'Error de Conexion',
    message: 'No se pudo conectar con el proveedor de IA.',
    solutions: [
      'Verifica tu conexion a internet',
      'El servicio puede estar temporalmente caido',
      'Intenta de nuevo en unos segundos',
    ],
    autoRetry: true,
    retryDelay: 3000,
  },

  TIMEOUT: {
    code: 'TIMEOUT',
    icon: '⏰',
    title: 'Tiempo Agotado',
    message: 'La solicitud tardo demasiado en responder.',
    solutions: [
      'El proveedor puede estar sobrecargado',
      'Usa un proveedor con inferencia ultra-rapida:',
    ],
    freeAlternatives: [
      {
        provider: 'Cerebras',
        reason: '2600 tokens/seg - EL MAS RAPIDO',
        url: 'https://cloud.cerebras.ai/',
        action: 'switch-provider:cerebras',
      },
      {
        provider: 'Groq',
        reason: '300 tokens/seg - Muy rapido',
        url: 'https://console.groq.com/',
        action: 'switch-provider:groq',
      },
    ],
    autoRetry: true,
    retryDelay: 5000,
  },

  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    icon: '🔧',
    title: 'Servicio No Disponible',
    message: 'El proveedor de IA esta en mantenimiento.',
    solutions: [
      'Revisa el status del proveedor',
      'Intenta con otro proveedor mientras tanto',
    ],
    providerLinks: {
      openai: 'https://status.openai.com',
      groq: 'https://status.groq.com',
      google: 'https://status.cloud.google.com',
    },
    freeAlternatives: FREE_ALTERNATIVES.slice(0, 3),
  },

  CONTENT_POLICY_VIOLATION: {
    code: 'CONTENT_POLICY_VIOLATION',
    icon: '⚠️',
    title: 'Contenido No Permitido',
    message: 'Tu solicitud fue rechazada por politicas de contenido.',
    solutions: [
      'Reformula tu peticion sin terminos problematicos',
      'Asegurate de pedir solo recetas de cocina',
      'Evita mencionar temas no relacionados con comida',
    ],
  },

  PROMPT_INJECTION_DETECTED: {
    code: 'PROMPT_INJECTION_DETECTED',
    icon: '🛡️',
    title: 'Solicitud Invalida',
    message: 'Tu mensaje contiene patrones no permitidos.',
    solutions: [
      'Solo puedo ayudarte con recetas de cocina',
      'Reformula tu peticion enfocandote en ingredientes',
      'Ejemplo: "Tengo pollo y verduras, ¿que puedo cocinar?"',
    ],
  },

  CORS_ERROR: {
    code: 'CORS_ERROR',
    icon: '🌐',
    title: 'Error de CORS',
    message: 'El proveedor no permite llamadas desde el navegador.',
    solutions: [
      'Usa OpenRouter que soporta CORS nativo',
      'O espera mientras reintentamos via proxy',
    ],
    freeAlternatives: [
      {
        provider: 'OpenRouter',
        reason: 'Soporta CORS, 500+ modelos',
        url: 'https://openrouter.ai/',
        action: 'switch-provider:openrouter',
      },
    ],
    autoRetry: true,
    retryDelay: 2000,
  },

  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    icon: '❓',
    title: 'Error Inesperado',
    message: 'Ocurrio un error que no pudimos identificar.',
    solutions: [
      'Intenta de nuevo',
      'Si persiste, cambia de proveedor',
      'Reporta el error si continua',
    ],
    autoRetry: true,
    retryDelay: 3000,
  },
};

/**
 * ErrorService - Parsea y mapea errores de diferentes proveedores
 */
class ErrorServiceClass {
  /**
   * Obtiene la informacion de error completa
   */
  getError(code: ErrorCode): APIError {
    return ERROR_SOLUTIONS[code] || ERROR_SOLUTIONS.UNKNOWN_ERROR;
  }

  /**
   * Parsea un error de API y devuelve un APIError estructurado
   */
  parseAPIError(status: number, body: unknown, provider?: string): APIError {
    // Intentar parsear formato especifico del proveedor
    if (typeof body === 'object' && body !== null) {
      const errorBody = body as Record<string, unknown>;

      // OpenAI / Groq / OpenRouter (formato similar)
      if (errorBody.error && typeof errorBody.error === 'object') {
        const error = errorBody.error as Record<string, string>;
        const code = error.code || error.type;

        if (code) {
          const mappedCode = this.mapProviderErrorCode(code, provider);
          return this.getError(mappedCode);
        }
      }

      // Google Gemini
      if (errorBody.error && typeof errorBody.error === 'object') {
        const error = errorBody.error as Record<string, string>;
        if (error.status === 'RESOURCE_EXHAUSTED') {
          return this.getError('RATE_LIMIT_EXCEEDED');
        }
        if (error.status === 'INVALID_ARGUMENT') {
          return this.getError('INVALID_API_KEY');
        }
      }
    }

    // Fallback: mapear por HTTP status
    return this.mapHttpStatus(status);
  }

  /**
   * Mapea codigos de error especificos de cada proveedor
   */
  private mapProviderErrorCode(code: string, provider?: string): ErrorCode {
    const codeMap: Record<string, ErrorCode> = {
      // OpenAI
      'invalid_api_key': 'INVALID_API_KEY',
      'insufficient_quota': 'INSUFFICIENT_QUOTA',
      'rate_limit_exceeded': 'RATE_LIMIT_EXCEEDED',
      'billing_hard_limit_reached': 'BILLING_HARD_LIMIT',
      'model_not_found': 'MODEL_NOT_FOUND',
      'context_length_exceeded': 'CONTEXT_LENGTH_EXCEEDED',
      'content_policy_violation': 'CONTENT_POLICY_VIOLATION',

      // Groq
      'invalid_api_key_error': 'INVALID_API_KEY',
      'rate_limit': 'RATE_LIMIT_EXCEEDED',
      'tokens_exceeded': 'CONTEXT_LENGTH_EXCEEDED',

      // Google
      'API_KEY_INVALID': 'INVALID_API_KEY',
      'RESOURCE_EXHAUSTED': 'RATE_LIMIT_EXCEEDED',
      'PERMISSION_DENIED': 'INVALID_API_KEY',

      // OpenRouter
      'invalid_credentials': 'INVALID_API_KEY',
      'insufficient_credits': 'INSUFFICIENT_QUOTA',
      'moderation_blocked': 'CONTENT_POLICY_VIOLATION',
    };

    return codeMap[code] || 'UNKNOWN_ERROR';
  }

  /**
   * Mapea HTTP status codes a errores
   */
  private mapHttpStatus(status: number): APIError {
    const statusMap: Record<number, ErrorCode> = {
      400: 'CONTEXT_LENGTH_EXCEEDED',
      401: 'INVALID_API_KEY',
      402: 'PAYMENT_REQUIRED',
      403: 'INVALID_API_KEY',
      404: 'MODEL_NOT_FOUND',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'SERVICE_UNAVAILABLE',
      502: 'SERVICE_UNAVAILABLE',
      503: 'SERVICE_UNAVAILABLE',
      504: 'TIMEOUT',
    };

    const code = statusMap[status] || 'UNKNOWN_ERROR';
    return this.getError(code);
  }

  /**
   * Crea un error de red
   */
  createNetworkError(): APIError {
    return this.getError('NETWORK_ERROR');
  }

  /**
   * Crea un error de timeout
   */
  createTimeoutError(): APIError {
    return this.getError('TIMEOUT');
  }

  /**
   * Crea un error de prompt injection
   */
  createPromptInjectionError(): APIError {
    return this.getError('PROMPT_INJECTION_DETECTED');
  }

  /**
   * Crea un error de CORS
   */
  createCorsError(): APIError {
    return this.getError('CORS_ERROR');
  }

  /**
   * Obtiene las alternativas gratuitas
   */
  getFreeAlternatives(): FreeAlternative[] {
    return FREE_ALTERNATIVES;
  }
}

// Exportar instancia singleton
export const ErrorService = new ErrorServiceClass();
