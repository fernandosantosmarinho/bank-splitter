import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use service role key to bypass RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: userData } = await supabase
            .from('user_metrics')
            .select('stripe_subscription_id')
            .eq('user_id', userId)
            .single();

        if (!userData?.stripe_subscription_id) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
        }

        // Cancel at period end (don't delete immediately)
        const subscription = await stripe.subscriptions.update(
            userData.stripe_subscription_id,
            { cancel_at_period_end: true }
        ) as any;

        // Update Supabase immediately to reflect pending cancellation
        await supabase
            .from('user_metrics')
            .update({
                subscription_status: subscription.status,
                subscription_cancel_at_period_end: true,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        return NextResponse.json({
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end
        });

    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
        );
    }
}
