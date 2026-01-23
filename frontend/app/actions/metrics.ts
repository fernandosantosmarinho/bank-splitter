'use server';

import { createClient } from '@supabase/supabase-js';
import { UserMetrics } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use Service Key if available (Bypasses RLS), otherwise Fallback to Anon Key (Subject to RLS)
const supabase = createClient(
    supabaseUrl || '',
    supabaseServiceKey || supabaseAnonKey || ''
);

console.log("[Metrics] Initialized Supabase Client. Using Service Key?", !!supabaseServiceKey);

export async function incrementMetric(userId: string | undefined | null, column: keyof UserMetrics, amount: number = 1) {
    if (!userId) return;
    if (!supabaseUrl) {
        console.warn("Supabase URL not provided.");
        return;
    }

    try {
        console.log(`[Metrics] Incrementing ${column} for ${userId}`);

        // 1. Fetch current row (or at least try to)
        const { data, error } = await supabase
            .from('user_metrics')
            .select('*')
            .eq('user_id', userId)
            .single();

        // If error is not 'PGRST116' (No rows), we log it.
        if (error && error.code !== 'PGRST116') {
            console.error("[Metrics] Error fetching metric:", error);
        }

        // 2. Prepare Data
        let row: Partial<UserMetrics>;

        if (data) {
            row = data as UserMetrics;
        } else {
            // Default Row for New Users
            row = {
                user_id: userId,
                documents_processed: 0,
                time_saved_hours: 0,
                success_rate: 99.9,
                credits_total: 5000,
                credits_used: 0,
                csv_exports: 0,
                qbo_exports: 0
            };
        }

        // 3. Increment Value
        (row as any)[column] = ((row as any)[column] || 0) + amount;

        // Side Effects
        if (column === 'documents_processed') {
            row.credits_used = (row.credits_used || 0) + 10;
            row.time_saved_hours = (row.time_saved_hours || 0) + 0.5;
        }

        // 4. Sanitize Payload
        const payload = {
            user_id: row.user_id,
            documents_processed: row.documents_processed,
            time_saved_hours: row.time_saved_hours,
            success_rate: row.success_rate,
            credits_total: row.credits_total,
            credits_used: row.credits_used,
            csv_exports: row.csv_exports,
            qbo_exports: row.qbo_exports
        };

        // 5. Upsert
        const { error: upsertError } = await supabase
            .from('user_metrics')
            .upsert(payload);

        if (upsertError) {
            console.error("[Metrics] Failed to upsert:", upsertError.message);
            throw new Error(upsertError.message);
        } else {
            console.log("[Metrics] Updated successfully.");
        }

    } catch (err: any) {
        console.error("[Metrics] Exception:", err.message);
        // We re-throw so the UI knows something went wrong, or swallow if we want it to be potential non-blocking
        // For debugging, re-throwing is better
        throw err;
    }
}


export async function getMetrics(userId: string | undefined | null): Promise<UserMetrics | null> {
    if (!userId) return null;
    if (!supabaseUrl) return null;

    try {
        console.log(`[Metrics] Fetching for ${userId} (Service Key)`);

        const { data, error } = await supabase
            .from('user_metrics')
            .select('user_id, documents_processed, time_saved_hours, success_rate, credits_total, credits_used, csv_exports, qbo_exports, subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_current_period_end')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error("[Metrics] Error fetching:", error.message);
            return null;
        }

        console.log("[Metrics] Data returned:", JSON.stringify(data));
        return data as UserMetrics;
    } catch (e) {
        console.error("[Metrics] Fetch Exception:", e);
        return null;
    }
}
