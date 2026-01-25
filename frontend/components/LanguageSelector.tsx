"use client";

import { useTransition, useState } from "react";
import { useLocale } from "next-intl";
import { Locale, locales } from "@/i18n/locales";
import { setUserLocale } from "@/app/actions/set-locale";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const languageNames: Record<Locale, string> = {
    en: "English",
    pt: "Português",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
};

const languageFlags: Record<Locale, string> = {
    en: "🇺🇸",
    pt: "🇧🇷",
    es: "🇪🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
};

export default function LanguageSelector() {
    const currentLocale = useLocale() as Locale;
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);

    const handleLocaleChange = (newLocale: string) => {
        if (!locales.includes(newLocale as Locale)) return;

        setIsLoading(true);
        startTransition(async () => {
            // Artificial delay to ensure loader is seen if needed, but not strictly necessary
            // await new Promise(r => setTimeout(r, 100)); // Optional
            try {
                await setUserLocale(newLocale as Locale);
                toast.success(`Language changed to ${languageNames[newLocale as Locale]}`);
                // Reload the page to apply the new locale
                window.location.reload();
            } catch (error) {
                console.error("Failed to change language:", error);
                toast.error("Failed to change language");
                setIsLoading(false);
            }
        });
    };

    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-muted-foreground animate-pulse">
                            Changing language...
                        </p>
                    </div>
                </div>
            )}
            <Select
                value={currentLocale}
                onValueChange={handleLocaleChange}
                disabled={isPending || isLoading}
            >
                <SelectTrigger className="w-[180px] bg-background border-border text-foreground">
                    <SelectValue>
                        <span className="flex items-center gap-2">
                            <span>{languageFlags[currentLocale]}</span>
                            <span>{languageNames[currentLocale]}</span>
                        </span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                    {locales.map((locale) => (
                        <SelectItem
                            key={locale}
                            value={locale}
                            className="cursor-pointer hover:bg-muted"
                        >
                            <div className="flex items-center gap-2">
                                <span>{languageFlags[locale]}</span>
                                <span>{languageNames[locale]}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </>
    );
}
