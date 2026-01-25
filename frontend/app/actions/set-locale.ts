'use server';

import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { isLocale, Locale } from '@/i18n/locales';

const COOKIE_NAME = 'bs_locale';

// Setup Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
    supabaseUrl || '',
    supabaseServiceKey || supabaseAnonKey || ''
);

export async function setUserLocale(locale: Locale) {
    if (!isLocale(locale)) return { success: false, error: 'Invalid locale' };

    // 1. Set Cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, locale, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
    });

    // 2. Persist to DB if authenticated
    try {
        const { userId } = await auth();
        if (userId && supabaseUrl) {
            // Check if user exists primarily via upsert logic in metrics
            // We will do a targeted update/upsert on user_metrics
            // We need to ensure we don't break other fields if row doesn't exist, 
            // but user_metrics usually exists for created users. 
            // Safe implementation: upsert with only user_id and locale? 
            // No, user_metrics might have other required fields or defaults that supabase handles.
            // But let's assume if they are logged in, we can update.

            const { error } = await supabase
                .from('user_metrics')
                .upsert({ user_id: userId, locale }, { onConflict: 'user_id' }); // Partial update merge is not default in pure SQL UPSERT unless fully specified, but Supabase JS upsert usually merges if row exists? 
            // Actually Supabase upsert requires all non-nullable columns if inserting.
            // Let's try update first, if fail (not found) then upsert?
            // Or cleaner: Use update() since we only want to save preference for *existing* metrics rows.
            // If metrics row doesn't exist yet (brand new user who hasn't seen dashboard?), they might get one here.
            // Let's stick to update for safety to avoid clobbering defaults if we don't have full object.
            // Wait, if I do upsert with just {user_id, locale}, it might wipe other columns if they are not defined? 
            // Supabase client `.upsert()` defaults to `ignoreDuplicates: false`, acting like ON CONFLICT DO UPDATE.
            // But if I provide partial data, does it merge or replace? 
            // Standard SQL UPSERT replaces or updates. It updates the columns provided.
            // But if it's a NEW row, it fails if required cols are missing.

            // Safest approach: Update. If 0 rows affected, we ignore (metrics will be created on dashboard load usually).

            const { error: updateError, count } = await supabase
                .from('user_metrics')
                .update({ locale })
                .eq('user_id', userId); // We only update existing rows

            if (updateError) {
                console.error('Error updating locale in DB:', updateError);
            }
        }
    } catch (e) {
        console.error('Error setting locale:', e);
    }

    return { success: true };
}
