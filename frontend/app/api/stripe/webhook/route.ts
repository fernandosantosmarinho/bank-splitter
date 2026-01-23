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
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier as SubscriptionTier;

    if (!userId || !tier) {
        console.error('Missing metadata in checkout session');
        return;
    }

    const subscriptionResponse = await stripe.subscriptions.retrieve(
        session.subscription as string
    );
    const subscription = subscriptionResponse as any;

    const credits = getCreditsForTier(tier);

    await supabaseAdmin
        .from('user_metrics')
        .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_tier: tier,
            subscription_status: subscription.status,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            credits_total: credits === -1 ? 999999 : credits, // Unlimited = very large number
            credits_used: 0, // Reset credits on new subscription
        })
        .eq('user_id', userId);

    console.log(`Subscription created for user ${userId}: ${tier}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Get userId from customer
    const { data: userData } = await supabaseAdmin
        .from('user_metrics')
        .select('user_id, subscription_tier')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!userData) {
        console.error('User not found for customer:', customerId);
        return;
    }

    // Check metadata for tier (priority), otherwise fallback to current DB tier
    const metadataTier = (subscription.metadata?.tier as SubscriptionTier);
    const tier = metadataTier || (userData.subscription_tier as SubscriptionTier);

    // If we have a new tier in metadata, use it. If not, we might be just renewing the current tier.
    const credits = getCreditsForTier(tier);
    const sub = subscription as any;

    await supabaseAdmin
        .from('user_metrics')
        .update({
            stripe_subscription_id: sub.id,
            subscription_tier: tier, // Update the tier!
            subscription_status: sub.status,
            subscription_current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            credits_total: credits === -1 ? 999999 : credits,
        })
        .eq('user_id', userData.user_id);

    console.log(`Subscription updated for user ${userData.user_id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const { data: userData } = await supabaseAdmin
        .from('user_metrics')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!userData) {
        console.error('User not found for customer:', customerId);
        return;
    }

    // Downgrade to free tier
    const freeCredits = getCreditsForTier('free');

    await supabaseAdmin
        .from('user_metrics')
        .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            credits_total: freeCredits,
        })
        .eq('user_id', userData.user_id);

    console.log(`Subscription canceled for user ${userData.user_id}, downgraded to free`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    const inv = invoice as any;
    const subscriptionId = inv.subscription as string;

    if (!subscriptionId) return; // Not a subscription invoice

    const { data: userData } = await supabaseAdmin
        .from('user_metrics')
        .select('user_id, subscription_tier')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!userData) {
        console.error('User not found for customer:', customerId);
        return;
    }

    // Retrieve full subscription to get metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

    // Get tier from metadata (source of truth), fallback to DB
    const metadataTier = (subscription.metadata?.tier as SubscriptionTier);
    const tier = metadataTier || (userData.subscription_tier as SubscriptionTier);
    const credits = getCreditsForTier(tier);

    await supabaseAdmin
        .from('user_metrics')
        .update({
            subscription_tier: tier, // FORCE update tier on payment success
            subscription_status: subscription.status,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            stripe_subscription_id: subscription.id,
            credits_total: credits === -1 ? 999999 : credits,
            credits_used: 0,
        })
        .eq('user_id', userData.user_id);

    console.log(`Payment succeeded for user ${userData.user_id}. Tier set to: ${tier}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const { data: userData } = await supabaseAdmin
        .from('user_metrics')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!userData) {
        console.error('User not found for customer:', customerId);
        return;
    }

    // Update subscription status
    await supabaseAdmin
        .from('user_metrics')
        .update({
            subscription_status: 'past_due',
        })
        .eq('user_id', userData.user_id);

    console.log(`Payment failed for user ${userData.user_id}`);
}
