// frontend/app/api/stripe/create-subscription/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe'; // TODO: prefer '@/lib/stripe-server'
import { createClient } from '@supabase/supabase-js';
import { getStripePriceId } from '@/lib/stripe-prices';
import Stripe from 'stripe';

// 🛡️ Use service role key to check user metrics safely
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safeEmail(user: any) {
    return (
        user.emailAddresses.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress ||
        user.emailAddresses[0]?.emailAddress
    );
}

export async function POST(req: NextRequest) {
    try {
        // 1) Auth
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = safeEmail(user);

        // 2) Idempotency key
        const idempotencyKey = req.headers.get('X-Idempotency-Key');
        console.log('[Create Sub] Idempotency Key:', idempotencyKey);

        // 3) Body
        const { plan, billingPeriod } = (await req.json()) as {
            plan: 'starter' | 'pro';
            billingPeriod: 'monthly' | 'yearly';
        };

        // 4) Load metrics
        const { data: userMetrics } = await supabaseAdmin
            .from('user_metrics')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!userMetrics) {
            return NextResponse.json({ error: 'User metrics not found' }, { status: 404 });
        }

        // 5) Promo eligibility
        const isOfferActive = (() => {
            if (userMetrics.welcome_offer_used) return false;
            if (!userMetrics.account_created_at) return false;

            const createdAt = new Date(userMetrics.account_created_at).getTime();
            const now = Date.now();
            const fortyEightHours = 48 * 60 * 60 * 1000;

            return now - createdAt < fortyEightHours;
        })();

        console.log(
            `[Create Sub] User: ${userId}, Plan: ${plan}, Period: ${billingPeriod}, Promo: ${isOfferActive}`
        );

        // 6) Price
        const priceId = getStripePriceId(plan, billingPeriod, isOfferActive);

        // 7) Customer
        let customerId = (userMetrics.stripe_customer_id as string | null) ?? null;

        if (!customerId) {
            console.log(`[Create Sub] Creating new customer for ${userId}`);
            const customer = await stripe.customers.create({
                email,
                metadata: { userId },
            });
            customerId = customer.id;

            await supabaseAdmin
                .from('user_metrics')
                .update({
                    stripe_customer_id: customerId,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);
        }

        // 8) Check for existing incomplete subscription (idempotency)
        if (idempotencyKey) {
            const existingSubscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'incomplete',
                limit: 5,
            });

            const matchingSub = existingSubscriptions.data.find(
                (sub) => sub.metadata?.idempotencyKey === idempotencyKey
            );

            if (matchingSub) {
                console.log('[Create Sub] Found existing subscription with same idempotency key:', matchingSub.id);

                // Re-fetch with expansions
                const sub2 = (await stripe.subscriptions.retrieve(matchingSub.id, {
                    expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
                })) as any;

                const latestInvoice = sub2.latest_invoice as Stripe.Invoice | string | null;
                const invoicePI = typeof latestInvoice === 'string' ? null : (latestInvoice as any)?.payment_intent ?? null;
                const invoicePIClientSecret: string | null = invoicePI?.client_secret ?? null;
                const setupClientSecret: string | null = sub2?.pending_setup_intent?.client_secret ?? null;

                const clientSecret: string | null = invoicePIClientSecret || setupClientSecret;
                const intentType: 'payment' | 'setup' = invoicePIClientSecret ? 'payment' : 'setup';

                if (clientSecret) {
                    return NextResponse.json({
                        subscriptionId: matchingSub.id,
                        clientSecret,
                        customerId,
                        intentType,
                    });
                }

                // Still no secret, return polling response
                return NextResponse.json({
                    subscriptionId: matchingSub.id,
                    clientSecret: null,
                    intentType: null,
                    customerId,
                    needsPolling: true,
                });
            }
        }

        // 9) Create subscription
        console.log('[Create Sub] Creating new subscription');
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            collection_method: 'charge_automatically',
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice'],
            metadata: {
                userId,
                plan,
                billingPeriod,
                offerApplied: isOfferActive ? 'true' : 'false',
                ...(idempotencyKey && { idempotencyKey }),
            },
        });

        // Re-fetch subscription with the expansions we actually need (more reliable than create response)
        const sub2 = (await stripe.subscriptions.retrieve(subscription.id, {
            expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
        })) as any;

        const latestInvoice = sub2.latest_invoice as Stripe.Invoice | string | null;
        const invoiceId =
            typeof latestInvoice === 'string' ? latestInvoice : latestInvoice?.id ?? null;

        const invoicePI = typeof latestInvoice === 'string' ? null : (latestInvoice as any)?.payment_intent ?? null;
        const invoicePIClientSecret: string | null = invoicePI?.client_secret ?? null;

        const setupClientSecret: string | null = sub2?.pending_setup_intent?.client_secret ?? null;

        let clientSecret: string | null = invoicePIClientSecret || setupClientSecret;
        let intentType: 'payment' | 'setup' = invoicePIClientSecret ? 'payment' : 'setup';

        // If still missing, do ONE deterministic invoice fetch (no finalize/pay)
        if (!clientSecret && invoiceId) {
            console.log(`[Create Sub] client_secret missing; retrieving invoice ${invoiceId} w/ expand...`);
            const fullInvoice = (await stripe.invoices.retrieve(invoiceId, {
                expand: ['payment_intent'],
            })) as any;

            console.log('[Create Sub] Invoice debug', {
                invoiceId: fullInvoice.id,
                status: fullInvoice.status,
                amount_due: fullInvoice.amount_due,
                amount_paid: fullInvoice.amount_paid,
                collection_method: fullInvoice.collection_method,
                payment_intent_id: fullInvoice.payment_intent?.id ?? null,
                payment_intent_type: typeof fullInvoice.payment_intent,
            });

            const cs = fullInvoice?.payment_intent?.client_secret ?? null;
            if (cs) {
                clientSecret = cs;
                intentType = 'payment';
            }
        }

        console.log('[Create Sub] Final response', {
            subscriptionId: subscription.id,
            status: sub2.status,
            invoiceId,
            hasClientSecret: Boolean(clientSecret),
            intentType,
            needsPolling: !clientSecret,
        });

        // CRITICAL: Always return 200 with proper structure
        if (!clientSecret) {
            return NextResponse.json({
                subscriptionId: subscription.id,
                clientSecret: null,
                intentType: null,
                customerId,
                needsPolling: true,
            });
        }

        return NextResponse.json({
            subscriptionId: subscription.id,
            clientSecret,
            customerId,
            intentType,
        });
    } catch (error: any) {
        console.error('[Create Sub] Error:', error?.message, error?.stack);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }
}