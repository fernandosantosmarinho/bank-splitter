/**
 * Server-side Stripe Client
 * 
 * IMPORTANT: This file should ONLY be imported by server-side code
 * (API routes, server components, server actions)
 * 
 * Never import this in client components or it will expose your secret key!
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
        'STRIPE_SECRET_KEY is not set. Please add it to your .env.local file.\n' +
        'Get your secret key from: https://dashboard.stripe.com/apikeys'
    );
}

/**
 * Stripe client instance
 * Configured with the latest API version and TypeScript support
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
    appInfo: {
        name: 'BankToBook',
        version: '1.0.0',
    },
});

/**
 * Get or create a Stripe customer for a user
 * 
 * @param userId - The Clerk user ID
 * @param email - User's email address
 * @param existingCustomerId - Existing Stripe customer ID if any
 * @returns Stripe customer ID
 */
export async function getOrCreateStripeCustomer(
    userId: string,
    email: string,
    existingCustomerId?: string | null
): Promise<string> {
    // If we already have a customer ID, verify it exists
    if (existingCustomerId) {
        try {
            await stripe.customers.retrieve(existingCustomerId);
            return existingCustomerId;
        } catch (error) {
            console.warn(`Stripe customer ${existingCustomerId} not found, creating new one`);
        }
    }

    // Create new customer
    const customer = await stripe.customers.create({
        email,
        metadata: {
            userId,
        },
    });

    return customer.id;
}

/**
 * Create a Stripe Checkout Session for subscription
 * 
 * @param params - Checkout session parameters
 * @returns Stripe Checkout Session
 */
export async function createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    userId: string;
    plan: string;
    billingPeriod: string;
    offerApplied: boolean;
    successUrl: string;
    cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: params.customerId,
        line_items: [
            {
                price: params.priceId,
                quantity: 1,
            },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
        client_reference_id: params.userId,
        metadata: {
            userId: params.userId,
            plan: params.plan,
            billingPeriod: params.billingPeriod,
            offerApplied: params.offerApplied ? 'true' : 'false',
        },
        // IMPORTANT: Pass metadata to the subscription itself
        subscription_data: {
            metadata: {
                userId: params.userId,
                plan: params.plan,
                billingPeriod: params.billingPeriod,
            },
        },
        allow_promotion_codes: false, // We handle promos via price IDs
        billing_address_collection: 'required',
        customer_update: {
            address: 'auto',
        },
    });

    return session;
}
