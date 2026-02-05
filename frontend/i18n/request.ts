import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './locales';

export default getRequestConfig(async ({ requestLocale }) => {
    const requestedLocale = await requestLocale;
    const locale = requestedLocale && locales.includes(requestedLocale as any)
        ? requestedLocale
        : defaultLocale;

    const userMessages = (await import(`../messages/${locale}.json`)).default;
    const defaultMessages = (await import(`../messages/en.json`)).default;

    // Simple shallow merge is sufficient here because our structure is flat at the top level (Dashboard, Common)
    // If 'Dashboard' is missing in userMessages, we take it from defaultMessages.
    // Note: If 'Dashboard' exists but is partial in userMessages, this shallow merge won't merge deeply.
    // For a production app, use 'lodash.merge' or 'deepmerge'.
    // For now, to prevent the specific crash of "Could not resolve Dashboard", this works if the file is incomplete.
    // However, since we just fixed es.json to be complete, this is a safety net for fr/de.

    // Custom deep-ish merge for our specific structure (optional but safer)
    const messages = {
        ...defaultMessages,
        ...userMessages,
        Dashboard: { ...defaultMessages.Dashboard, ...(userMessages.Dashboard || {}) },
        Common: { ...defaultMessages.Common, ...(userMessages.Common || {}) },
        Landing: { ...defaultMessages.Landing, ...(userMessages.Landing || {}) },
    };

    return {
        locale,
        messages
    };
});
