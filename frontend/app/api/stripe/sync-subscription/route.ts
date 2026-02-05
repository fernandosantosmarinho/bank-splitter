import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { performSubscriptionUpdate } from '@/lib/stripe-sync';
import { getPlanFromPriceId } from '@/lib/stripe-prices';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subscriptionId } = await req.json();

        if (!subscriptionId) {
            return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
        }

        console.log(`[Sync] Syncing subscription ${subscriptionId} for user ${userId}`);

        // 1. Retrieve subscription with latest invoice
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['latest_invoice', 'items.data.price']
        });

        if (subscription.status === 'active') {
            // Already active? Ensure DB matches
            console.log('[Sync] Subscription is active, ensuring DB is updated');
        }

        // 2. If incomplete and invoice is open, try to pay it
        if (subscription.status === 'incomplete' || subscription.status === 'past_due') {
            const invoice = subscription.latest_invoice as any;
            if (invoice && invoice.status === 'open') {
                console.log(`[Sync] Invoice ${invoice.id} is open. Attempting to pay...`);
                try {
                    // 2a. Check if we need to manually attach a payment method
                    let paymentMethodId = typeof invoice.payment_method === 'string' ? invoice.payment_method : invoice.payment_method?.id;

                    if (!paymentMethodId) {
                        console.log('[Sync] No payment method on invoice. Fetching customer cards...');
                        // Fetch latest card attached to customer
                        const paymentMethods = await stripe.paymentMethods.list({
                            customer: subscription.customer as string,
                            type: 'card',
                            limit: 1,
                        });

                        if (paymentMethods.data.length > 0) {
                            paymentMethodId = paymentMethods.data[0].id;
                            console.log(`[Sync] Found payment method ${paymentMethodId}. Attaching to invoice...`);
                        } else {
                            console.error('[Sync] No payment methods found for customer!');
                        }
                    }

                    // 2b. Pay the invoice
                    if (paymentMethodId) {
                        await stripe.invoices.pay(invoice.id, {
                            payment_method: paymentMethodId
                        });
                        console.log('[Sync] Invoice paid successfully');
                    } else {
                        console.error('[Sync] Cannot pay invoice: No payment method available.');
                    }

                    // Re-fetch subscription to get new status
                    const updatedSub = await stripe.subscriptions.retrieve(subscriptionId, {
                        expand: ['items.data.price']
                    });

                    if (updatedSub.status === 'active') {
                        console.log('[Sync] Subscription is now active!');
                        // Update local variable to proceed with DB update logic
                        Object.assign(subscription, updatedSub);
                    }
                } catch (err: any) {
                    console.error(`[Sync] Failed to pay invoice: ${err.message}`);
                }
            }
        }

        // 3. If active (or trialing), update DB
        if (subscription.status === 'active' || subscription.status === 'trialing') {
            const priceId = subscription.items.data[0]?.price?.id;
            if (!priceId) throw new Error('No price ID found');

            const planConfig = getPlanFromPriceId(priceId);
            if (!planConfig) {
                console.error('[Sync] Unknown price ID', priceId);
                // Don't fail the request, but log error
            } else {
                await performSubscriptionUpdate({
                    userId,
                    subscription,
                    plan: planConfig.plan,
                    billingPeriod: planConfig.billingPeriod,
                    isPromo: planConfig.isPromo
                });
            }

            return NextResponse.json({ success: true, status: subscription.status });
        }

        return NextResponse.json({ success: false, status: subscription.status, message: 'Subscription not active yet' });

    } catch (error: any) {
        console.error('[Sync] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
