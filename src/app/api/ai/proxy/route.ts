// Vercel Edge Function - Proxy CORS para APIs de IA
// Este proxy permite llamar a APIs que no soportan CORS desde el browser
// Solo reenvía las peticiones, NUNCA guarda las API keys

import { NextRequest, NextResponse } from 'next/server';

// Configurar como Edge Function para mejor performance y latencia
export const runtime = 'edge';

// Proveedores permitidos (whitelist)
const ALLOWED_PROVIDERS = [
  'groq',
  'google',
  'cerebras',
  'openai',
  'anthropic',
  'together',
  'fireworks',
  'mistral',
  'huggingface',
];

// URLs base permitidas (whitelist de seguridad)
const ALLOWED_BASE_URLS = [
  'api.groq.com',
  'generativelanguage.googleapis.com',
  'api.cerebras.ai',
  'api.openai.com',
  'api.anthropic.com',
  'api.together.xyz',
  'api.fireworks.ai',
  'api.mistral.ai',
  'api-inference.huggingface.co',
];

/**
 * POST /api/ai/proxy
 * Proxy para llamadas a APIs de IA
 *
 * Headers requeridos:
 * - X-Target-URL: URL completa del endpoint destino
 * - X-API-Key: API key del usuario (se pasa como Bearer token)
 * - X-Provider: ID del proveedor (para logging)
 *
 * El body se reenvía tal cual al proveedor
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener headers necesarios
    const targetUrl = request.headers.get('X-Target-URL');
    const apiKey = request.headers.get('X-API-Key');
    const provider = request.headers.get('X-Provider');

    // Validaciones
    if (!targetUrl) {
      return NextResponse.json(
        { error: { message: 'Missing X-Target-URL header' } },
        { status: 400 }
      );
    }

    if (!apiKey && !targetUrl.includes('key=')) {
      return NextResponse.json(
        { error: { message: 'Missing X-API-Key header' } },
        { status: 400 }
      );
    }

    if (provider && !ALLOWED_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: { message: `Provider ${provider} not allowed` } },
        { status: 403 }
      );
    }

    // Validar URL (seguridad)
    const url = new URL(targetUrl);
    const isAllowedUrl = ALLOWED_BASE_URLS.some(base => url.hostname.includes(base));

    if (!isAllowedUrl) {
      return NextResponse.json(
        { error: { message: 'Target URL not in whitelist' } },
        { status: 403 }
      );
    }

    // Construir headers para el proveedor
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Agregar autorizacion segun el proveedor
    if (apiKey) {
      if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        // Header especial para permitir browser requests (si aplica)
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    // Obtener el body
    const body = await request.text();

    // Hacer la peticion al proveedor
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body,
    });

    // Si es streaming, devolver el stream directamente
    if (response.headers.get('content-type')?.includes('text/event-stream') ||
      response.headers.get('content-type')?.includes('application/x-ndjson') ||
      response.headers.get('transfer-encoding') === 'chunked') {

      // Crear un TransformStream para pasar los datos
      const { readable, writable } = new TransformStream();

      // Pipe la respuesta del proveedor al cliente
      response.body?.pipeTo(writable);

      return new Response(readable, {
        headers: {
          'Content-Type': response.headers.get('content-type') || 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Si no es streaming, devolver JSON normalmente
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });

  } catch (error) {
    console.error('[CORS Proxy] Error:', error);

    // Detectar errores de red
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: { message: 'Network error - could not reach provider', code: 'NETWORK_ERROR' } },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: { message: 'Internal proxy error', code: 'PROXY_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/proxy
 * Para validar API keys (llama a /models del proveedor)
 */
export async function GET(request: NextRequest) {
  try {
    const targetUrl = request.headers.get('X-Target-URL');
    const apiKey = request.headers.get('X-API-Key');
    const provider = request.headers.get('X-Provider');

    if (!targetUrl) {
      return NextResponse.json(
        { error: { message: 'Missing X-Target-URL header' } },
        { status: 400 }
      );
    }

    // Validar URL
    const url = new URL(targetUrl);
    const isAllowedUrl = ALLOWED_BASE_URLS.some(base => url.hostname.includes(base));

    if (!isAllowedUrl) {
      return NextResponse.json(
        { error: { message: 'Target URL not in whitelist' } },
        { status: 403 }
      );
    }

    const headers: HeadersInit = {};

    if (apiKey) {
      if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });

  } catch (error) {
    console.error('[CORS Proxy] GET Error:', error);

    return NextResponse.json(
      { error: { message: 'Proxy error' } },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Target-URL, X-API-Key, X-Provider',
      'Access-Control-Max-Age': '86400',
    },
  });
}
