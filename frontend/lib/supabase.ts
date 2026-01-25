import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Check .env.local');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

// Type definition for User Metrics
export interface UserMetrics {
    user_id: string;
    documents_processed: number;
    time_saved_hours: number;
    success_rate: number;
    credits_total: number;
    credits_used: number;
    csv_exports: number;
    qbo_exports: number;
    subscription_tier?: 'free' | 'pro' | 'enterprise';
    subscription_status?: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_current_period_end?: string;
    subscription_cancel_at_period_end?: boolean;
    locale?: string;
}

// incrementMetric moved to app/actions/metrics.ts to run on server-side
// and bypass RLS if Service Key is provided.

async function getCurrentMetric(userId: string, column: string): Promise<number> {
    const { data } = await supabase.from('user_metrics').select(column).eq('user_id', userId).single();
    return data ? (data as any)[column] || 0 : 0;
}
