"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "@/components/ui/sonner";

function ClerkWithTheme({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();

    return (
        <ClerkProvider
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

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
        >
            <ClerkWithTheme>
                {children}
                <Toaster />
            </ClerkWithTheme>
        </ThemeProvider>
    );
}
