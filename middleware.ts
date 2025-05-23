import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Générer un ID unique pour cette requête
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Ajouter l'ID de requête aux headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  
  // Logger le début de la requête
  const startTime = Date.now();
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  
  console.log(`[${new Date().toISOString()}] ${method} ${pathname}${search} - Request ID: ${requestId}`);
  
  // Créer la réponse avec les headers modifiés
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Ajouter des headers de sécurité et de tracking
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-response-time', `${Date.now() - startTime}ms`);
  
  // Headers de sécurité
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Logger la fin de la requête
  const duration = Date.now() - startTime;
  console.log(`[${new Date().toISOString()}] ${method} ${pathname}${search} - ${duration}ms - Request ID: ${requestId}`);
  
  return response;
}

// Configuration du middleware
export const config = {
  matcher: [
    // Appliquer à toutes les routes API
    '/api/:path*',
    // Et aux pages (sauf assets statiques)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};