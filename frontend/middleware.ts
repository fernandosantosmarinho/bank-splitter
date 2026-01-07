import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define quais rotas são protegidas
const isProtectedRoute = createRouteMatcher([
    '/' // Protege a Home
]);

// MUDANÇA AQUI: Adicionamos 'async' e mudamos a forma de chamar o 'auth'
export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};