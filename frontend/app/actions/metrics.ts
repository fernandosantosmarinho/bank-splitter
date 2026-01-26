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

            // Increment Free Tier Counter automatically
            if (!row.subscription_tier || row.subscription_tier === 'free') {
                row.free_documents_processed = (row.free_documents_processed || 0) + amount;
            }
        }

        // 4. Sanitize Payload
        // 4. Sanitize Payload (Include new fields)
        const payload = {
            user_id: row.user_id,
            documents_processed: row.documents_processed,
            time_saved_hours: row.time_saved_hours,
            success_rate: row.success_rate,
            credits_total: row.credits_total,
            credits_used: row.credits_used,
            csv_exports: row.csv_exports,
            qbo_exports: row.qbo_exports,
            subscription_tier: (row as any).subscription_tier,
            subscription_status: (row as any).subscription_status,
            stripe_customer_id: (row as any).stripe_customer_id,
            stripe_subscription_id: (row as any).stripe_subscription_id,
            subscription_current_period_end: (row as any).subscription_current_period_end,
            subscription_cancel_at_period_end: (row as any).subscription_cancel_at_period_end,

            // New Fields
            free_documents_processed: (row as any).free_documents_processed,
            welcome_offer_used: (row as any).welcome_offer_used,
            welcome_offer_expires_at: (row as any).welcome_offer_expires_at,
            account_created_at: (row as any).account_created_at
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
            .select('*') // Select all columns to include new fields automatically
            .eq('user_id', userId)
            .single();

        if (error) {
            // Auto-create metrics if not found (First login)
            if (error.code === 'PGRST116') {
                console.log("[Metrics] User not found, creating default.");
                const now = new Date();
                const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48h

                const defaultMetrics: UserMetrics = {
                    user_id: userId,
                    documents_processed: 0,
                    time_saved_hours: 0,
                    success_rate: 99.9,
                    credits_total: 5000, // Or 5 for free tier? Adjust as needed
                    credits_used: 0,
                    csv_exports: 0,
                    qbo_exports: 0,
                    subscription_tier: 'free',
                    free_documents_processed: 0,
                    welcome_offer_used: false,
                    welcome_offer_expires_at: expires.toISOString(),
                    account_created_at: now.toISOString()
                };

                await supabase.from('user_metrics').insert(defaultMetrics);
                return defaultMetrics;
            }
            console.error("[Metrics] Error fetching:", error.message);
            return null;
        }

        return data as UserMetrics;
    } catch (e) {
        console.error("[Metrics] Fetch Exception:", e);
        return null;
    }
}
