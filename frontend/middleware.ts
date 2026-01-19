import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server"; // <--- Importação Essencial

// Define rotas que exigem autenticação
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/api(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    // Se o usuário estiver logado e tentar acessar a home ('/'), redireciona para o dashboard
    if (userId && req.nextUrl.pathname === '/') {
        // CORREÇÃO: Usar NextResponse.redirect ao invés de Response.redirect
        const dashboardUrl = new URL('/dashboard', req.url);
        return NextResponse.redirect(dashboardUrl);
    }

    if (isProtectedRoute(req)) {
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