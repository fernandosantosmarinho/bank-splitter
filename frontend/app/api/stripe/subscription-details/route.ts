import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

function toIsoFromUnixSeconds(value: unknown): string | null {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    return new Date(n * 1000).toISOString();
}

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
        if (!subscription.items?.data?.[0]) {
            console.error('[Subscription Details] Subscription has no items');
            return NextResponse.json({ error: 'Subscription has no items' }, { status: 500 });
        }

        const price = subscription.items.data[0].price;

        if (!price?.product) {
            console.error('[Subscription Details] Price has no product');
            return NextResponse.json({ error: 'Price missing product' }, { status: 500 });
        }

        const productId = typeof price.product === 'string' ? price.product : price.product.id;
        const product = await stripe.products.retrieve(productId);

        // Cast to any to access properties not in strict type definition
        const sub = subscription as any;

        // Extract current_period_end from root OR first item (fallback logic)
        // Some subscription configurations put the period on the item level
        let currentPeriodEndRaw = sub.current_period_end;

        if (!currentPeriodEndRaw && sub.items?.data?.[0]?.current_period_end) {
            console.log('[Subscription Details] Found current_period_end in items.data[0]');
            currentPeriodEndRaw = sub.items.data[0].current_period_end;
        }

        let currentPeriodEnd = toIsoFromUnixSeconds(currentPeriodEndRaw);

        if (!currentPeriodEnd) {
            console.warn('[Subscription Details] Missing current_period_end even in items, using fallback');
            // Fallback to now + 30 days if absolutely missing
            const fallbackDate = new Date();
            fallbackDate.setDate(fallbackDate.getDate() + 30);
            currentPeriodEnd = fallbackDate.toISOString();
        }

        return NextResponse.json({
            planName: product.name,
            amount: price.unit_amount ? price.unit_amount / 100 : 0,
            currency: price.currency,
            interval: price.recurring?.interval,
            status: sub.status,
            currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            paymentMethod: paymentMethodDetails
        });

    } catch (error: any) {
        console.error('Error fetching subscription details:', error);
        return NextResponse.json(
            { error: `Failed to fetch subscription details: ${error?.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
