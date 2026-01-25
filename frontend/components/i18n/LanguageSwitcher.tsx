'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setUserLocale } from '@/app/actions/set-locale';
import { Locale, locales } from '@/i18n/locales';
import { Globe, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { cn } from "@/lib/utils";

export function LanguageSwitcher({ currentLocale, className }: { currentLocale: Locale, className?: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSelect = (value: string) => {
        const locale = value as Locale;
        startTransition(async () => {
            await setUserLocale(locale);
            router.refresh(); // Refresh to apply translations on server components
        });
    };

    const localeLabels: Record<Locale, string> = {
        en: 'English',
        pt: 'Português',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch'
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={cn("h-8 gap-2 text-muted-foreground", className)}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    <span className="uppercase text-xs font-bold">{currentLocale}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale}
                        onClick={() => handleSelect(locale)}
                        className="text-xs font-medium cursor-pointer"
                    >
                        <span className={locale === currentLocale ? "font-bold text-primary" : ""}>
                            {localeLabels[locale]}
                        </span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
