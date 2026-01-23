import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server"; // <--- Importação Essencial

// Define rotas que exigem autenticação
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/api(.*)',
]);

// Define rotas públicas dentro da API (exceções)
const isWebhookRoute = createRouteMatcher([
    '/api/stripe/webhook',
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    // Se o usuário estiver logado e tentar acessar a home ('/'), redireciona para o dashboard
    if (userId && req.nextUrl.pathname === '/') {
        // CORREÇÃO: Usar NextResponse.redirect ao invés de Response.redirect
        const dashboardUrl = new URL('/dashboard', req.url);
        return NextResponse.redirect(dashboardUrl);
    }

    // Protege rotas APENAS se não for o webhook
    if (isProtectedRoute(req) && !isWebhookRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Pula arquivos estáticos e internos do Next.js
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Sempre roda nas rotas de API
        '/(api|trpc)(.*)',
    ],
};