import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, getCreditsForTier, SubscriptionTier } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { getPlanFromPriceId, BillingPeriod } from '@/lib/stripe-prices';

import { performSubscriptionUpdate, toIsoFromUnixSeconds } from '@/lib/stripe-sync';

// 🛡️ Webhook MUST use service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Gatilho para o nosso Fallback Manual (PaymentIntent avulso)
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const userId = paymentIntent.metadata?.userId;
    const subscriptionId = paymentIntent.metadata?.subscriptionId;
    const plan = paymentIntent.metadata?.plan as SubscriptionTier;

    if (!userId || !subscriptionId) {
        console.log('[Webhook] PI Succeeded without metadata markers - likely a standard invoice PI, skipping');
        return;
    }

    console.log(`[Webhook] Activation via PI Fallback for user ${userId}`);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await performSubscriptionUpdate({
        userId,
        subscription,
        plan: plan || 'starter'
    });
}

/**
 * Gatilho padrão do Stripe para faturas de subscrição
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    // Extract subscription ID - handle both string and expanded object
    const subscriptionRaw = (invoice as any).subscription;
    const subscriptionId = typeof subscriptionRaw === 'string'
        ? subscriptionRaw
        : subscriptionRaw?.id ?? null;

    console.log('[Webhook] Processing invoice.payment_succeeded', {
        invoiceId: invoice.id,
        subscriptionId,
        subscriptionRawType: typeof subscriptionRaw,
        customerId: invoice.customer,
        amount: invoice.amount_paid,
    });

    if (!subscriptionId) {
        console.error('[Webhook] ❌ No subscription ID in invoice', {
            invoiceId: invoice.id,
            subscriptionRaw,
        });
        return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price']
    });

    console.log('[Webhook] Retrieved subscription', {
        id: subscription.id,
        status: subscription.status,
        metadata: subscription.metadata,
        priceId: subscription.items.data[0]?.price?.id,
    });

    const userId = subscription.metadata?.userId || invoice.metadata?.userId;
    const priceId = subscription.items.data[0]?.price?.id;

    if (!userId) {
        console.error('[Webhook] ❌ CRITICAL: No userId found in subscription or invoice metadata', {
            subscriptionId,
            subscriptionMetadata: subscription.metadata,
            invoiceMetadata: invoice.metadata,
        });
        throw new Error(`No userId in metadata for subscription ${subscriptionId}`);
    }

    if (!priceId) {
        console.error('[Webhook] ❌ CRITICAL: No price ID found in subscription');
        throw new Error(`No price ID for subscription ${subscriptionId}`);
    }

    const planConfig = getPlanFromPriceId(priceId);

    if (!planConfig) {
        console.error('[Webhook] ❌ CRITICAL: Unknown price ID', {
            priceId,
            availablePrices: {
                starter_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY,
                starter_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY,
                pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
                pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
            }
        });
        throw new Error(`Unknown price ID: ${priceId}`);
    }

    console.log('[Webhook] ✅ Plan identified', {
        plan: planConfig.plan,
        billingPeriod: planConfig.billingPeriod,
        isPromo: planConfig.isPromo,
    });

    await performSubscriptionUpdate({
        userId,
        subscription,
        plan: planConfig.plan,
        billingPeriod: planConfig.billingPeriod,
        isPromo: planConfig.isPromo
    });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) {
        console.log('[Webhook] customer.subscription.updated: No userId in metadata, skipping');
        return;
    }

    console.log('[Webhook] customer.subscription.updated received', {
        subscriptionId: subscription.id,
        userId,
        status: subscription.status,
        current_period_end: (subscription as any).current_period_end,
    });

    // If subscription becomes active, we need to activate the full plan
    if (subscription.status === 'active') {
        console.log('[Webhook] Subscription is now active, activating full plan...');

        // Fetch subscription with price details
        const fullSubscription = await stripe.subscriptions.retrieve(subscription.id, {
            expand: ['items.data.price']
        });

        const priceId = fullSubscription.items.data[0]?.price?.id;

        if (!priceId) {
            console.error('[Webhook] ❌ No price ID found in active subscription');
            return;
        }

        const planConfig = getPlanFromPriceId(priceId);

        if (!planConfig) {
            console.error('[Webhook] ❌ Unknown price ID in subscription.updated', { priceId });
            return;
        }

        console.log('[Webhook] ✅ Activating plan from subscription.updated', {
            plan: planConfig.plan,
            billingPeriod: planConfig.billingPeriod,
            isPromo: planConfig.isPromo,
        });

        // Use the same activation logic as invoice.payment_succeeded
        await performSubscriptionUpdate({
            userId,
            subscription: fullSubscription,
            plan: planConfig.plan,
            billingPeriod: planConfig.billingPeriod,
            isPromo: planConfig.isPromo
        });

        return;
    }

    // For other status updates (incomplete, past_due, etc), just update the status
    console.log('[Webhook] Updating subscription status only (not active)');

    const { error } = await supabaseAdmin
        .from('user_metrics')
        .update({
            subscription_status: subscription.status,
            subscription_current_period_end: toIsoFromUnixSeconds((subscription as any).current_period_end),
            subscription_cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

    if (error) {
        console.error('[Webhook] Failed to update subscription status:', error);
    } else {
        console.log('[Webhook] Successfully updated subscription status');
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    await supabaseAdmin
        .from('user_metrics')
        .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            credits_total: getCreditsForTier('free'),
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
}
