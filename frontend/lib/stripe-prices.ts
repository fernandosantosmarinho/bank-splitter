/**
 * Stripe Price ID Helper
 * 
 * Centralized logic for selecting the correct Stripe Price ID based on:
 * - Plan (starter/pro)
 * - Billing period (monthly/yearly)
 * - Promo eligibility (welcome offer)
 * 
 * All price IDs are loaded from environment variables.
 */

export type Plan = 'starter' | 'pro';
export type BillingPeriod = 'monthly' | 'yearly';

interface PriceConfig {
    priceId: string;
    displayPrice: number;
    originalPrice?: number;
}

/**
 * Get the Stripe Price ID for a given plan configuration
 * 
 * @param plan - The subscription plan (starter or pro)
 * @param billingPeriod - The billing period (monthly or yearly)
 * @param isPromoActive - Whether the welcome offer promo is active
 * @returns The Stripe Price ID from environment variables
 * @throws Error if the required environment variable is not set
 */
export function getStripePriceId(
    plan: Plan,
    billingPeriod: BillingPeriod,
    isPromoActive: boolean
): string {
    // Build the environment variable name
    const planUpper = plan.toUpperCase();
    const periodUpper = billingPeriod.toUpperCase();
    const promoSuffix = isPromoActive ? '_PROMO' : '';

    const envVarName = `NEXT_PUBLIC_STRIPE_PRICE_${planUpper}_${periodUpper}${promoSuffix}`;

    // Get the price ID from environment
    const priceId = process.env[envVarName];

    if (!priceId) {
        throw new Error(
            `Missing Stripe Price ID: ${envVarName} is not set in environment variables. ` +
            `Please add it to your .env.local file.`
        );
    }

    return priceId;
}

/**
 * Get price configuration including display price and original price
 * 
 * @param plan - The subscription plan
 * @param billingPeriod - The billing period
 * @param isPromoActive - Whether promo pricing applies
 * @returns Price configuration object
 */
export function getPriceConfig(
    plan: Plan,
    billingPeriod: BillingPeriod,
    isPromoActive: boolean
): PriceConfig {
    const priceId = getStripePriceId(plan, billingPeriod, isPromoActive);

    // Base prices (in euros)
    const basePrices = {
        starter: { monthly: 15, yearly: 144 },
        pro: { monthly: 49, yearly: 468 }
    };

    // Promo prices (40% off)
    const promoPrices = {
        starter: { monthly: 9, yearly: 86.40 },
        pro: { monthly: 29.40, yearly: 280.80 }
    };

    const prices = isPromoActive ? promoPrices : basePrices;
    const price = prices[plan][billingPeriod];
    const originalPrice = isPromoActive ? basePrices[plan][billingPeriod] : undefined;

    // For yearly billing, return monthly equivalent
    const displayPrice = billingPeriod === 'yearly' ? price / 12 : price;

    return {
        priceId,
        displayPrice,
        originalPrice: originalPrice ? (billingPeriod === 'yearly' ? originalPrice / 12 : originalPrice) : undefined
    };
}

/**
 * Identify plan configuration from a Stripe Price ID
 * Used in webhooks to determine what the user purchased
 */
export function getPlanFromPriceId(priceId: string): {
    plan: Plan;
    billingPeriod: BillingPeriod;
    isPromo: boolean;
} | null {
    const plans: Plan[] = ['starter', 'pro'];
    const periods: BillingPeriod[] = ['monthly', 'yearly'];
    const promos = [true, false];

    for (const plan of plans) {
        for (const period of periods) {
            for (const isPromo of promos) {
                try {
                    if (getStripePriceId(plan, period, isPromo) === priceId) {
                        return { plan, billingPeriod: period, isPromo };
                    }
                } catch {
                    // Skip if price ID not set for this combo
                }
            }
        }
    }

    return null;
}

/**
 * Validate that all required Stripe environment variables are set
 * Call this on app startup to fail fast if configuration is incomplete
 */
export function validateStripeConfig(): void {
    const required = [
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        'NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY',
        'NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY_PROMO',
        'NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY',
        'NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY_PROMO',
        'NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY',
        'NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_PROMO',
        'NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY',
        'NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY_PROMO',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required Stripe environment variables:\n${missing.join('\n')}\n\n` +
            `Please add these to your .env.local file.`
        );
    }
}

/**
 * Get the Stripe publishable key
 * Safe to use on client-side
 */
export function getStripePublishableKey(): string {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!key) {
        throw new Error(
            'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. ' +
            'Please add it to your .env.local file.'
        );
    }

    return key;
}
