import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define rotas que exigem autenticação
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/api(.*)',
]);

// Define rotas públicas dentro da API (exceções)
const isWebhookRoute = createRouteMatcher([
    '/api/stripe/webhook',
]);

import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    // Se o usuário estiver logado e tentar acessar a home ('/'), redireciona para o dashboard
    // NOTE: This might conflict with next-intl if not careful, but let's keep it.
    // If next-intl redirects / -> /en, this check for '/' might miss /en.

    // Protege rotas APENAS se não for o webhook
    if (isProtectedRoute(req) && !isWebhookRoute(req)) {
        await auth.protect();
    }

    // Skip internationalization for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    return intlMiddleware(req);
});

export const config = {
    matcher: [
        // Pula arquivos estáticos e internos do Next.js
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4)).*)',
        // Sempre roda nas rotas de API
        '/(api|trpc)(.*)',
    ],
};