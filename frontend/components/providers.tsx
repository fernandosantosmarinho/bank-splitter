"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { esES, frFR, deDE, enUS, ptBR } from "@clerk/localizations";

const LINGUAS: Record<string, any> = {
    es: esES,
    fr: frFR,
    de: deDE,
    en: enUS,
    pt: ptBR
};

function ClerkWithTheme({ children, locale }: { children: React.ReactNode, locale: string }) {
    const { theme } = useTheme();

    return (
        <ClerkProvider
            localization={LINGUAS[locale] || enUS}
            appearance={{
                baseTheme: theme === 'dark' ? dark : undefined,
                variables: {
                    colorPrimary: "#2563eb",
                    borderRadius: "0.75rem",
                    fontFamily: "var(--font-dm-sans)",
                    colorBackground: theme === 'dark' ? '#09090b' : '#ffffff',
                    colorInputBackground: theme === 'dark' ? '#27272a' : '#f4f4f5',
                    colorText: theme === 'dark' ? '#fafafa' : '#09090b',
                    colorTextSecondary: theme === 'dark' ? '#a1a1aa' : '#71717a',
                },
                elements: {
                    // Modal Wrapper
                    modalBackdrop: "bg-black/50 backdrop-blur-sm",
                    modalContent: "bg-card border border-border shadow-2xl rounded-2xl overflow-hidden",

                    // Main Card Layout
                    card: "bg-card shadow-none rounded-none border-0",
                    rootBox: "bg-card",

                    // Navbar (Sidebar)
                    navbar: "bg-muted/10 border-r border-border hidden md:flex",
                    navbarButton: "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg my-0.5 font-medium",
                    activeNavbarButton: "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground text-primary font-semibold",

                    // Headers
                    headerTitle: "text-foreground font-bold tracking-tight",
                    headerSubtitle: "text-muted-foreground",

                    // Sections
                    profileSectionTitleText: "text-foreground font-semibold border-b border-border pb-2 mb-4",
                    profileSectionPrimaryButton: "text-primary hover:bg-primary/10 hover:text-primary transition-colors",

                    // Form Elements
                    formFieldLabel: "text-foreground font-medium",
                    formFieldInput: "bg-background border-border text-foreground focus:border-primary focus:ring-primary/20 transition-all rounded-md",
                    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm",
                    formButtonReset: "text-muted-foreground hover:text-foreground hover:bg-muted",

                    // Misc
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground bg-card px-2",
                    avatarImageActionsUpload: "text-primary hover:text-primary/90",
                    userPreviewMainIdentifier: "text-foreground font-semibold",
                    userPreviewSecondaryIdentifier: "text-muted-foreground",

                    // Badge & Alerts
                    badge: "bg-primary/10 text-primary border border-primary/20",
                    alert: "bg-destructive/10 text-destructive border border-destructive/20",

                    // Footer
                    footer: "bg-muted/30 border-t border-border",
                    footerActionLink: "text-primary hover:text-primary/90 font-medium"
                }
            }}
        >
            {children}
        </ClerkProvider>
    );
}

export function Providers({ children, locale }: { children: React.ReactNode, locale?: string }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
        >
            <ClerkWithTheme locale={locale || 'en'}>
                {children}
                <Toaster />
            </ClerkWithTheme>
        </ThemeProvider>
    );
}
