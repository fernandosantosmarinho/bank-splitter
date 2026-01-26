/**
 * Stripe Checkout Session Creation API
 * 
 * POST /api/stripe/create-checkout
 * 
 * Creates a Stripe Checkout Session for subscription purchase
 * Validates promo eligibility server-side for security
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getStripePriceId, type Plan, type BillingPeriod } from '@/lib/stripe-prices';
import { createCheckoutSession, getOrCreateStripeCustomer } from '@/lib/stripe-server';
import { getUserMetrics, updateUserSubscription } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate user
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Parse request body
        const body = await req.json();
        const { plan, billingPeriod } = body as {
            plan: Plan;
            billingPeriod: BillingPeriod;
        };

        // 3. Validate input
        if (!plan || !billingPeriod) {
            return NextResponse.json(
                { error: 'Missing required fields: plan, billingPeriod' },
                { status: 400 }
            );
        }

        if (!['starter', 'pro'].includes(plan)) {
            return NextResponse.json(
                { error: 'Invalid plan. Must be "starter" or "pro"' },
                { status: 400 }
            );
        }

        if (!['monthly', 'yearly'].includes(billingPeriod)) {
            return NextResponse.json(
                { error: 'Invalid billingPeriod. Must be "monthly" or "yearly"' },
                { status: 400 }
            );
        }

        // 4. Fetch user metrics from Supabase
        const userMetrics = await getUserMetrics(userId);

        if (!userMetrics) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // 5. Determine promo eligibility SERVER-SIDE (never trust client)
        const isOfferActive = (() => {
            if (userMetrics.welcome_offer_used) return false;
            if (!userMetrics.account_created_at) return false;

            const createdAt = new Date(userMetrics.account_created_at).getTime();
            const now = Date.now();
            const fortyEightHours = 48 * 60 * 60 * 1000;

            return (now - createdAt) < fortyEightHours;
        })();

        console.log('[Checkout] User:', userId, 'Plan:', plan, 'Period:', billingPeriod, 'Offer Active:', isOfferActive);

        // 6. Get the correct Stripe Price ID
        const priceId = getStripePriceId(plan, billingPeriod, isOfferActive);

        // 7. Get or create Stripe customer
        const userEmail = userMetrics.email || `${userId}@clerk.user`;
        const customerId = await getOrCreateStripeCustomer(
            userId,
            userEmail,
            userMetrics.stripe_customer_id
        );

        // 8. Save customer ID if it's new
        if (customerId !== userMetrics.stripe_customer_id) {
            await updateUserSubscription(userId, {
                stripe_customer_id: customerId,
            });
        }

        // 9. Build success/cancel URLs
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const successUrl = `${appUrl}/dashboard?tab=settings&view=billing&success=true`;
        const cancelUrl = `${appUrl}/dashboard?tab=settings&view=billing&canceled=true`;

        // 10. Create Stripe Checkout Session
        const session = await createCheckoutSession({
            customerId,
            priceId,
            userId,
            plan,
            billingPeriod,
            offerApplied: isOfferActive,
            successUrl,
            cancelUrl,
        });

        console.log('[Checkout] Session created:', session.id);

        // 11. Return session ID to client
        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
        });

    } catch (error: any) {
        console.error('[Checkout] Error:', error);

        return NextResponse.json(
            {
                error: 'Failed to create checkout session',
                message: error.message,
            },
            { status: 500 }
        );
    }
}
