'use server';

import { cookies, headers } from 'next/headers';
import { defaultLocale, isLocale, Locale } from './locales';
import { matchLocale } from './locale-matching';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase client similar to actions/metrics.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
    supabaseUrl || '',
    supabaseServiceKey || supabaseAnonKey || ''
);

const COOKIE_NAME = 'bs_locale';

export async function getLocale(): Promise<Locale> {
    // 1. Check Authenticated User Preference
    try {
        const { userId } = await auth();
        if (userId && supabaseUrl) {
            const { data } = await supabase
                .from('user_metrics')
                .select('locale')
                .eq('user_id', userId)
                .single();

            if (data?.locale && isLocale(data.locale)) {
                return data.locale;
            }
        }
    } catch (e) {
        // Ignore auth/db errors for locale resolution -> proceed to fallback
        // console.warn("Failed to fetch user locale preference", e);
    }

    // 2. Check Cookie
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(COOKIE_NAME)?.value;
    if (cookieLocale && isLocale(cookieLocale)) {
        return cookieLocale;
    }

    // 3. Check Accept-Language Header
    try {
        const headerDetails = await headers();
        const acceptLanguage = headerDetails.get('accept-language');
        const matched = matchLocale(acceptLanguage);
        return matched;
    } catch (e) {
        return defaultLocale;
    }
}
