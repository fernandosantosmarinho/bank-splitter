import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth, req) => {
    // Protege toda a aplicação. 
    // O Clerk automaticamente redireciona para a página de login deles (accounts.dev)
    // se o usuário não estiver logado.
    await auth.protect();
});

export const config = {
    // Esse matcher é o padrão oficial do Clerk para evitar loops em arquivos internos
    matcher: [
        // Pula arquivos internos do Next.js e arquivos estáticos (imagens, css, etc)
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Sempre roda nas rotas de API
        '/(api|trpc)(.*)',
    ],
};