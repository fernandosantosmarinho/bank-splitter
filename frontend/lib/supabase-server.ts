/**
 * Server-side Supabase Client
 * 
 * For use in API routes and server components
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

/**
 * Supabase client with service role key
 * Has elevated permissions - use carefully!
 */
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

/**
 * Get user metrics including welcome offer eligibility
 */
export async function getUserMetrics(userId: string) {
    const { data, error } = await supabaseAdmin
        .from('user_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching user metrics:', error);
        return null;
    }

    return data;
}

/**
 * Update user's Stripe subscription information
 */
export async function updateUserSubscription(
    userId: string,
    data: {
        stripe_customer_id?: string;
        stripe_subscription_id?: string;
        stripe_price_id?: string;
        subscription_tier?: string;
        subscription_status?: string;
        welcome_offer_used?: boolean;
    }
) {
    const { error } = await supabaseAdmin
        .from('user_metrics')
        .update(data)
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating user subscription:', error);
        throw error;
    }
}
