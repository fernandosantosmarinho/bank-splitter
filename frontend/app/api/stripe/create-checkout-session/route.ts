import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
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

        // Parse request body
        const { plan, billingPeriod, isPromoActive } = await req.json() as {
            plan: 'starter' | 'pro';
            billingPeriod: 'monthly' | 'yearly';
            isPromoActive: boolean;
        };

        // Validate input
        if (!plan || !['starter', 'pro'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan. Must be "starter" or "pro"' }, { status: 400 });
        }

        if (!billingPeriod || !['monthly', 'yearly'].includes(billingPeriod)) {
            return NextResponse.json({ error: 'Invalid billingPeriod. Must be "monthly" or "yearly"' }, { status: 400 });
        }

        // Fetch user metrics to verify promo eligibility SERVER-SIDE
        const { data: userMetrics } = await supabaseAdmin
            .from('user_metrics')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!userMetrics) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Determine promo eligibility SERVER-SIDE (never trust client)
        const isOfferActive = (() => {
            if (userMetrics.welcome_offer_used) return false;
            if (!userMetrics.account_created_at) return false;

            const createdAt = new Date(userMetrics.account_created_at).getTime();
            const now = Date.now();
            const fortyEightHours = 48 * 60 * 60 * 1000;

            return (now - createdAt) < fortyEightHours;
        })();

        console.log('[Checkout Session] User:', userId, 'Plan:', plan, 'Period:', billingPeriod, 'Client claims promo:', isPromoActive, 'Server determined promo:', isOfferActive);

        // Use server-determined promo status
        const { getStripePriceId } = await import('@/lib/stripe-prices');
        const priceId = getStripePriceId(plan, billingPeriod, isOfferActive);

        console.log('[Checkout Session] Using Price ID:', priceId);

        // Get or create customer
        let customerId = userMetrics.stripe_customer_id;

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
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin')}/dashboard?tab=settings&view=billing&success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin')}/dashboard?tab=settings&view=billing`,
            metadata: {
                userId: userId,
                plan: plan,
                billingPeriod: billingPeriod,
                offerApplied: isOfferActive ? 'true' : 'false',
            },
            subscription_data: {
                metadata: {
                    userId: userId,
                    plan: plan,
                    billingPeriod: billingPeriod,
                    offerApplied: isOfferActive ? 'true' : 'false',
                },
            },
            // Mark offer as used immediately if applicable
            ...(isOfferActive && {
                client_reference_id: `welcome_offer_${userId}`,
            }),
        });

        // ⚠️ DO NOT mark welcome_offer_used here!
        // It will be marked by the webhook AFTER successful payment
        // Setting it here would prevent users from seeing the discount

        console.log('[Checkout Session] Created session:', session.id);

        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
        });

    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
