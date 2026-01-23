import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia' as any,
    typescript: true,
});

// Subscription tier configurations
export const SUBSCRIPTION_TIERS = {
    free: {
        name: 'Free',
        credits: 500,
        price: 0,
        priceId: null, // No Stripe price for free tier
        features: [
            '500 credits per month',
            'Basic extraction features',
            'CSV & QBO exports',
            'Email support'
        ]
    },
    pro: {
        name: 'Pro',
        credits: 5000,
        price: 29,
        priceId: process.env.STRIPE_PRO_PRICE_ID, // Set in Stripe dashboard
        features: [
            '5,000 credits per month',
            'Advanced extraction features',
            'Priority processing',
            'CSV & QBO exports',
            'Priority email support',
            'API access'
        ]
    },
    enterprise: {
        name: 'Enterprise',
        credits: -1, // -1 means unlimited
        price: 99,
        priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID, // Set in Stripe dashboard
        features: [
            'Unlimited credits',
            'All Pro features',
            'Dedicated account manager',
            'Custom integrations',
            '24/7 phone support',
            'SLA guarantee'
        ]
    }
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export function getCreditsForTier(tier: SubscriptionTier): number {
    return SUBSCRIPTION_TIERS[tier].credits;
}

export function getPriceIdForTier(tier: SubscriptionTier): string | null {
    return SUBSCRIPTION_TIERS[tier].priceId || null;
}
