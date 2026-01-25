import { Locale } from '@/i18n/locales';

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions) {
    return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrency(locale: Locale, value: number, currency: string = 'USD') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(value);
}

export function formatDate(locale: Locale, date: Date | number, options?: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat(locale, options).format(date);
}
