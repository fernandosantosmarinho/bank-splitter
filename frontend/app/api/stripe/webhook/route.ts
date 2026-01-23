import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, getCreditsForTier, SubscriptionTier } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Use service role key for webhook to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received webhook event:', event.type);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentSucceeded(invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentFailed(invoice);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    try {
        console.log(`[Checkout] Processing session ${session.id}`);
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier as SubscriptionTier;

        if (!userId || !tier) {
            console.error('[Checkout] Missing metadata in checkout session', { userId, tier });
            return;
        }

        const subscriptionId = session.subscription as string;
        if (!subscriptionId) {
            console.error('[Checkout] No subscription ID found in session');
            return;
        }

        const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
        const subscription = subscriptionResponse as any;
        const credits = getCreditsForTier(tier);

        const rawPeriodEnd = subscription.current_period_end;
        let calculatedEnd: Date;

        if (rawPeriodEnd && typeof rawPeriodEnd === 'number' && rawPeriodEnd > 0) {
            calculatedEnd = new Date(rawPeriodEnd * 1000);
            console.log(`[Checkout] Using Stripe's period end: ${calculatedEnd.toISOString()}`);

            // Sanity Check: Only override if date is in the past or less than 24h away
            const oneDayFromNow = Date.now() + (24 * 60 * 60 * 1000);
            if (calculatedEnd.getTime() < oneDayFromNow) {
                console.warn(`[Checkout] Stripe date ${calculatedEnd.toISOString()} is too early, forcing +31 days`);
                calculatedEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
            }
        } else {
            console.warn(`[Checkout] Missing or invalid current_period_end (${rawPeriodEnd}), forcing 31 days.`);
            calculatedEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
        }

        console.log(`[Checkout] Final Calculated End Date: ${calculatedEnd.toISOString()}`);

        const { error } = await supabaseAdmin
            .from('user_metrics')
            .update({
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                subscription_tier: tier,
                subscription_status: subscription.status,
                subscription_current_period_end: calculatedEnd.toISOString(),
                credits_total: credits === -1 ? 999999 : credits,
                credits_used: 0,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        if (error) {
            console.error('[Checkout] Failed to update user metrics:', error);
            throw error;
        }

        console.log(`[Checkout] Successfully initialized subscription for user ${userId}`);
    } catch (error) {
        console.error('[Checkout] Error handling checkout completion:', error);
        throw error;
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    try {
        console.log(`[Subscription Update] Processing subscription ${subscription.id}`);
        const customerId = subscription.customer as string;

        // Get userId from customer
        const { data: userData, error: fetchError } = await supabaseAdmin
            .from('user_metrics')
            .select('user_id, subscription_tier')
            .eq('stripe_customer_id', customerId)
            .single();

        if (fetchError || !userData) {
            console.error('[Subscription Update] User not found for customer:', customerId, fetchError);
            return;
        }

        // Check metadata for tier (priority), then plan nickname, then fallback to current DB tier
        // Note: We prioritize metadata because our checkout flow sets it there.
        let tier = subscription.metadata?.tier as SubscriptionTier;

        if (!tier) {
            console.log('[Subscription Update] No tier in metadata, checking previous user tier');
            tier = userData.subscription_tier as SubscriptionTier;
        }

        if (!tier) {
            // Last resort: try to infer from plan nickname or ID if possible, but for now log warning
            console.warn('[Subscription Update] Could not determine subscription tier, skipping credit update');
        }

        // If we have a new tier, calculate credits. 
        // Be careful not to reset credits if it's just a status update, unless it's a renewal (checked via current_period_end usually, but logic here is simplified)
        // For now, we update credits if we successfully identified the tier.
        let creditsUpdate = {};
        if (tier) {
            const credits = getCreditsForTier(tier);
            if (credits !== undefined) {
                creditsUpdate = { credits_total: credits === -1 ? 999999 : credits };
            }
        }

        const sub = subscription as any;
        let calculatedEnd: Date;

        if (sub.current_period_end) {
            calculatedEnd = new Date(sub.current_period_end * 1000);
            console.log(`[Subscription Update] Using Stripe's period end: ${calculatedEnd.toISOString()}`);

            // Sanity check: Only override if date is in the past or less than 24h away
            const oneDayFromNow = Date.now() + (24 * 60 * 60 * 1000);
            if (calculatedEnd.getTime() < oneDayFromNow) {
                console.warn(`[Subscription Update] Stripe date ${calculatedEnd.toISOString()} is too early, forcing +31 days`);
                calculatedEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
            }
        } else {
            console.warn('[Subscription Update] No current_period_end from Stripe, forcing 31 days');
            calculatedEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
        }

        console.log(`[Subscription Update] Final validDate: ${calculatedEnd.toISOString()}`);

        const { error: updateError } = await supabaseAdmin
            .from('user_metrics')
            .update({
                stripe_subscription_id: sub.id,
                subscription_tier: tier || userData.subscription_tier, // Keep existing if unknown
                subscription_status: sub.status,
                subscription_current_period_end: calculatedEnd.toISOString(),
                ...creditsUpdate,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userData.user_id);

        if (updateError) {
            console.error('[Subscription Update] Failed to update Supabase:', updateError);
            throw updateError;
        }

        console.log(`[Subscription Update] Successfully updated user ${userData.user_id}`);
    } catch (error) {
        console.error('[Subscription Update] Error processing update:', error);
        throw error;
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
        console.log(`[Subscription Deleted] Processing subscription ${subscription.id}`);
        const customerId = subscription.customer as string;

        const { data: userData } = await supabaseAdmin
            .from('user_metrics')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();

        if (!userData) {
            console.error('[Subscription Deleted] User not found for customer:', customerId);
            return;
        }

        // Downgrade to free tier
        const freeCredits = getCreditsForTier('free');

        const { error } = await supabaseAdmin
            .from('user_metrics')
            .update({
                subscription_tier: 'free',
                subscription_status: 'canceled',
                stripe_subscription_id: null,
                credits_total: freeCredits,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userData.user_id);

        if (error) {
            console.error('[Subscription Deleted] Failed to downgrade user:', error);
            throw error;
        }

        console.log(`[Subscription Deleted] Downgraded user ${userData.user_id} to free`);
    } catch (error) {
        console.error('[Subscription Deleted] Error handling deletion:', error);
        throw error;
    }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    try {
        console.log(`[Payment Succeeded] Processing invoice ${invoice.id}`);
        const customerId = invoice.customer as string;
        const inv = invoice as any;
        const subscriptionId = inv.subscription as string;

        if (!subscriptionId) {
            console.log('[Payment Succeeded] not a subscription invoice, skipping');
            return;
        }

        const { data: userData } = await supabaseAdmin
            .from('user_metrics')
            .select('user_id, subscription_tier')
            .eq('stripe_customer_id', customerId)
            .single();

        if (!userData) {
            console.error('[Payment Succeeded] User not found for customer:', customerId);
            return;
        }

        // Retrieve full subscription to get metadata
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

        // Get tier from metadata (source of truth), fallback to DB
        const metadataTier = (subscription.metadata?.tier as SubscriptionTier);
        const tier = metadataTier || (userData.subscription_tier as SubscriptionTier);

        if (!tier) {
            console.warn('[Payment Succeeded] No tier found, skipping credit reset');
            return;
        }

        const credits = getCreditsForTier(tier);
        let calculatedEnd: Date;

        if (subscription.current_period_end) {
            calculatedEnd = new Date(subscription.current_period_end * 1000);
            console.log(`[Payment Succeeded] Using Stripe's period end: ${calculatedEnd.toISOString()}`);

            // Sanity check: Only override if date is in the past or less than 24h away
            const oneDayFromNow = Date.now() + (24 * 60 * 60 * 1000);
            if (calculatedEnd.getTime() < oneDayFromNow) {
                console.warn(`[Payment Succeeded] Stripe date ${calculatedEnd.toISOString()} is too early, forcing +31 days`);
                calculatedEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
            }
        } else {
            console.warn('[Payment Succeeded] No current_period_end from Stripe, forcing 31 days');
            calculatedEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
        }

        console.log(`[Payment Succeeded] Raw Stripe current_period_end: ${subscription.current_period_end}`);
        console.log(`[Payment Succeeded] Calculated ISO Date: ${calculatedEnd.toISOString()}`);

        const { error } = await supabaseAdmin
            .from('user_metrics')
            .update({
                subscription_tier: tier,
                subscription_status: subscription.status,
                subscription_current_period_end: calculatedEnd.toISOString(),
                stripe_subscription_id: subscription.id,
                credits_total: credits === -1 ? 999999 : credits,
                credits_used: 0,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userData.user_id);

        if (error) {
            console.error('[Payment Succeeded] Failed to update Supabase:', error);
            throw error;
        }

        console.log(`[Payment Succeeded] Processed for user ${userData.user_id}. Tier: ${tier}`);
    } catch (error) {
        console.error('[Payment Succeeded] Error processing payment:', error);
        throw error;
    }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    try {
        const customerId = invoice.customer as string;

        const { data: userData } = await supabaseAdmin
            .from('user_metrics')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();

        if (!userData) {
            console.error('[Payment Failed] User not found for customer:', customerId);
            return;
        }

        await supabaseAdmin
            .from('user_metrics')
            .update({
                subscription_status: 'past_due',
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userData.user_id);

        console.log(`[Payment Failed] Marked subscription past_due for user ${userData.user_id}`);
    } catch (error) {
        console.error('[Payment Failed] Error processing failure:', error);
        throw error;
    }
}
