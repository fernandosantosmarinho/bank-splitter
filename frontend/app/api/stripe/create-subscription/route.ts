import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe, getPriceIdForTier, SubscriptionTier } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS for critical administrative updates
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || user.emailAddresses[0]?.emailAddress;

        const { tier } = await req.json() as { tier: SubscriptionTier };

        if (!tier || !['pro', 'enterprise'].includes(tier)) {
            return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
        }

        const priceId = getPriceIdForTier(tier);

        if (!priceId) {
            return NextResponse.json({ error: 'Price ID not configured for this tier' }, { status: 500 });
        }

        // Get or create customer
        // Use supabaseAdmin to ensure we can read/write regardless of RLS
        const { data: userData } = await supabaseAdmin
            .from('user_metrics')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single();

        let customerId = userData?.stripe_customer_id;

        if (!customerId) {
            console.log(`Creating new Stripe customer for user ${userId}...`);
            const customer = await stripe.customers.create({
                email: email,
                metadata: {
                    userId: userId,
                },
            });

            customerId = customer.id;
            console.log(`Created Stripe customer ${customerId}. Saving to database...`);

            // Save to Supabase IMMEDIATELY and wait
            const { error: updateError } = await supabaseAdmin
                .from('user_metrics')
                .update({
                    stripe_customer_id: customerId,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (updateError) {
                console.error("CRITICAL: Failed to save stripe_customer_id:", updateError);
                return NextResponse.json({ error: 'Database synchronization failed' }, { status: 500 });
            }
            console.log("Database updated with stripe_customer_id.");
        } else if (email) {
            // Ensure email is up to date for existing customers
            await stripe.customers.update(customerId, {
                email: email,
            }).catch(err => console.error("Error updating customer email:", err));
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{
                price: priceId,
            }],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription',
                payment_method_types: ['card', 'paypal']
            },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                userId: userId,
                tier: tier,
            },
        });

        // Extract client secret
        const invoice = subscription.latest_invoice as any;

        if (!invoice) {
            console.error('Subscription created but no invoice generated');
            return NextResponse.json({ error: 'No invoice generated' }, { status: 500 });
        }

        let clientSecret = invoice.payment_intent?.client_secret;

        // If payment_intent is not expanded or missing, try to retrieve the invoice properly expanded
        if (!clientSecret) {
            try {
                console.log('Retrieving invoice to expand payment_intent...');
                const retrievedInvoice = await stripe.invoices.retrieve(invoice.id, {
                    expand: ['payment_intent']
                });

                if ((retrievedInvoice as any).payment_intent) {
                    const pi = (retrievedInvoice as any).payment_intent;
                    clientSecret = pi.client_secret;
                }
            } catch (e) {
                console.error('Error retrieving invoice:', e);
            }
        }

        if (!clientSecret) {
            console.error('Could not find client_secret in subscription invoice', invoice);
            return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
        }

        // Proactive update to Supabase to handle potential webhook delays/missing local delivery
        const sub = subscription as any;

        // Get the end date from Stripe (Unix timestamp in seconds, convert to milliseconds)
        let finalEndDate: Date;

        if (sub.current_period_end) {
            finalEndDate = new Date(sub.current_period_end * 1000);
            console.log(`[Create Subscription] Using Stripe's period end: ${finalEndDate.toISOString()}`);
        } else {
            // Fallback only if Stripe didn't provide a date (very rare)
            console.warn("[Create Subscription] WARNING: No current_period_end from Stripe, using fallback +31 days");
            finalEndDate = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
        }

        console.log(`[Create Subscription] Saving to DB: subscription_id=${subscription.id}, user=${userId}, tier=${tier}, status=active, expires=${finalEndDate.toISOString()}`);

        const { error: finalUpdateError } = await supabaseAdmin
            .from('user_metrics')
            .update({
                stripe_subscription_id: subscription.id,
                subscription_tier: tier,
                subscription_status: 'active', // Immediate activation for better local/dev experience
                subscription_current_period_end: finalEndDate.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (finalUpdateError) {
            console.error("[Create Subscription] Error during proactive DB update:", finalUpdateError);
        }

        return NextResponse.json({
            subscriptionId: subscription.id,
            clientSecret: clientSecret
        });

    } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json(
            { error: 'Failed to create subscription' },
            { status: 500 }
        );
    }
}
