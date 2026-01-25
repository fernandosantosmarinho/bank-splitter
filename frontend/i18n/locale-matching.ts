import { locales, defaultLocale, type Locale } from "./locales";

export function matchLocale(acceptLanguage: string | null): Locale {
    if (!acceptLanguage) return defaultLocale;

    // Simple parser for Accept-Language header
    // e.g. "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7"
    const preferences = acceptLanguage
        .split(',')
        .map(part => {
            const [lang, priority] = part.split(';');
            return {
                lang: lang.trim(),
                q: priority ? parseFloat(priority.split('=')[1]) : 1.0
            };
        })
        .sort((a, b) => b.q - a.q);

    for (const pref of preferences) {
        // Check exact match (e.g. "pt")
        const baseLang = pref.lang.split('-')[0].toLowerCase() as Locale;
        if (locales.includes(baseLang)) {
            return baseLang;
        }
    }

    return defaultLocale;
}
