import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getCreditsForTier, SubscriptionTier } from '@/lib/stripe';
import { BillingPeriod } from '@/lib/stripe-prices';

// 🛡️ Webhook/Sync MUST use service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function toIsoFromUnixSeconds(value: unknown): string | null {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    return new Date(n * 1000).toISOString();
}

/**
 * Common Logic to activate a plan in Supabase
 */
export async function performSubscriptionUpdate({
    userId,
    subscription,
    plan,
    billingPeriod,
    isPromo
}: {
    userId: string;
    subscription: Stripe.Subscription;
    plan: SubscriptionTier;
    billingPeriod?: BillingPeriod;
    isPromo?: boolean;
}) {
    const credits = getCreditsForTier(plan);
    const customerId = subscription.customer as string;

    console.log(`[Sync] Updating DB for user ${userId} -> ${plan}`);

    const { error } = await supabaseAdmin
        .from('user_metrics')
        .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            subscription_tier: plan,
            subscription_status: subscription.status,
            subscription_current_period_end: toIsoFromUnixSeconds((subscription as any).current_period_end),
            subscription_cancel_at_period_end: subscription.cancel_at_period_end,
            credits_total: credits === -1 ? 999999 : credits,
            credits_used: 0,
            updated_at: new Date().toISOString(),
            ...(isPromo && { welcome_offer_used: true })
        })
        .eq('user_id', userId);

    if (error) throw error;
    console.log(`[Sync] SUCCESS: User ${userId} promoted to ${plan}`);
}
