import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define rotas que exigem autenticação (apenas o dashboard e a API)
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/api(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
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