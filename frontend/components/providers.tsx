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
