import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe, getPriceIdForTier, SubscriptionTier } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tier } = await req.json() as { tier: SubscriptionTier };

        if (!tier || !['pro', 'enterprise'].includes(tier)) {
            return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
        }

        const priceId = getPriceIdForTier(tier);

        if (!priceId) {
            return NextResponse.json({ error: 'Price ID not configured for this tier' }, { status: 500 });
        }

        // Check if user already has a Stripe customer ID
        const { data: userData } = await supabase
            .from('user_metrics')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single();

        let customerId = userData?.stripe_customer_id;

        // Create a new customer if one doesn't exist
        if (!customerId) {
            const customer = await stripe.customers.create({
                metadata: {
                    userId: userId,
                },
            });
            customerId = customer.id;

            // Save customer ID to database
            await supabase
                .from('user_metrics')
                .update({ stripe_customer_id: customerId })
                .eq('user_id', userId);
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?tab=settings&success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?tab=settings&canceled=true`,
            metadata: {
                userId: userId,
                tier: tier,
            },
            subscription_data: {
                metadata: {
                    userId: userId,
                    tier: tier,
                },
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
