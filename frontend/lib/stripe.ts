import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
});

// Subscription tier configurations
export const SUBSCRIPTION_TIERS = {
    free: {
        name: 'Free Tier',
        credits: 5, // Documents
        price: 0,
        priceId: null,
        features: [
            '5 documents per month',
            'Basic extraction',
            'CSV exports'
        ]
    },
    starter: {
        name: 'Starter',
        credits: 50,
        price: 15, // Base price
        priceId: 'price_starter_monthly',
        features: [
            '50 documents per month',
            'Advanced extraction',
            'CSV & Excel exports'
        ]
    },
    pro: {
        name: 'Pro',
        credits: 500,
        price: 49,
        priceId: 'price_pro_monthly',
        features: [
            '500 documents per month',
            'Priority processing',
            'QuickBooks integration'
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
