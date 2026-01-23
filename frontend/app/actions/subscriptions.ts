'use server';

import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function getSubscriptionData(userId: string) {
    try {
        const { data, error } = await supabase
            .from('user_metrics')
            .select('subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_current_period_end')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error fetching subscription data:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getSubscriptionData:', error);
        return null;
    }
}

export async function createCheckoutSession(tier: 'pro' | 'enterprise') {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('Unauthorized');
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stripe/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tier }),
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

export async function createPortalSession() {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('Unauthorized');
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stripe/portal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to create portal session');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating portal session:', error);
        throw error;
    }
}
