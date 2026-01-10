import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rotas públicas (que não exigem login)
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // 1. Ignora arquivos internos do Next.js (_next)
        // 2. Ignora todos os arquivos estáticos (fotos, ícones, favicon)
        // 3. Ignora arquivos de manifesto
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Sempre executa para rotas de API
        '/(api|trpc)(.*)',
    ],
};