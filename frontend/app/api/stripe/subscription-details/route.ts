import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use service role key to bypass RLS and get secure customer data
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: userData } = await supabase
            .from('user_metrics')
            .select('stripe_customer_id, stripe_subscription_id')
            .eq('user_id', userId)
            .single();

        if (!userData?.stripe_subscription_id) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
        }

        // Fetch Subscription
        const subscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id);

        // Fetch Payment Method
        let paymentMethodDetails = null;
        const defaultPaymentMethodId = subscription.default_payment_method as string;

        if (defaultPaymentMethodId) {
            const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);
            if (paymentMethod.card) {
                paymentMethodDetails = {
                    brand: paymentMethod.card.brand,
                    last4: paymentMethod.card.last4,
                    exp_month: paymentMethod.card.exp_month,
                    exp_year: paymentMethod.card.exp_year
                };
            }
        }

        // Fetch Product/Price details for display name
        const price = subscription.items.data[0].price;
        const product = await stripe.products.retrieve(price.product as string);

        return NextResponse.json({
            planName: product.name,
            amount: price.unit_amount ? price.unit_amount / 100 : 0,
            currency: price.currency,
            interval: price.recurring?.interval,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            paymentMethod: paymentMethodDetails
        });

    } catch (error) {
        console.error('Error fetching subscription details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subscription details' },
            { status: 500 }
        );
    }
}
