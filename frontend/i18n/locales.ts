export const locales = ['en', 'pt', 'es', 'fr', 'de'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
    return locales.includes(value as Locale);
}
