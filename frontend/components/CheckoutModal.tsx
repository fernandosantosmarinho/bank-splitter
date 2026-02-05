"use client";

import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, Lock, Sparkles, Shield, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionTier } from "@/lib/stripe";
import { useTheme } from "next-themes";
import { useTranslations, useLocale } from "next-intl";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
    tier: SubscriptionTier;
    billingPeriod: 'monthly' | 'yearly';
    isPromoActive: boolean;
    price: number;
    intentType: 'payment' | 'setup';
    onSuccess: () => void;
    onCancel: () => void;
    email?: string;
}

function CheckoutForm({
    tier,
    billingPeriod,
    isPromoActive,
    price,
    intentType,
    onSuccess,
    onCancel,
    email
}: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const t = useTranslations('Checkout');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const displayPrice = billingPeriod === 'yearly' ? (price / 12).toFixed(2) : price;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);
        setErrorMessage(null);

        const returnUrl = `${window.location.origin}/settings?tab=billing&success=true`;

        if (intentType === 'setup') {
            const { error } = await stripe.confirmSetup({
                elements,
                confirmParams: { return_url: returnUrl },
                redirect: "if_required",
            });

            if (error) {
                setErrorMessage(error.message || "An unexpected error occurred.");
                setIsLoading(false);
                return;
            }

            onSuccess();
            return;
        }

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: returnUrl },
            redirect: "if_required",
        });

        if (error) {
            setErrorMessage(error.message || "An unexpected error occurred.");
            setIsLoading(false);
            return;
        }

        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-0 md:h-[600px]">
            {/* LEFT COLUMN - Order Summary (The "Receipt") */}
            <div className="bg-gradient-to-br from-neutral-900 to-blue-900/20 p-8 flex flex-col justify-between border-r border-white/5 md:max-h-[600px]">
                <div>
                    {/* Plan Badge */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{t('plan_label_short')}</p>
                                <h3 className="text-2xl font-bold text-white capitalize">{tier}</h3>
                            </div>
                        </div>
                        {isPromoActive && (
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wide rounded-full border border-purple-500/30">
                                40% OFF
                            </span>
                        )}
                    </div>

                    {/* Price Display */}
                    <div className="mb-6">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-5xl font-bold text-white">€{displayPrice}</span>
                            <span className="text-xl text-gray-400">/mês</span>
                        </div>
                        <p className="text-sm text-gray-400">
                            {billingPeriod === 'yearly'
                                ? t('billed_yearly', { price: price.toFixed(2) })
                                : t('billed_monthly')}
                        </p>
                    </div>

                    {/* What's Included - Compact List */}
                    <div className="space-y-2 mb-6">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{t('included')}</p>
                        <ul className="space-y-1.5 text-sm text-gray-300">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span>{t('features.docs_per_month', { count: tier === 'starter' ? 50 : 500 })}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span>{t('features.advanced_extraction')}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span>{t('features.export_csv_excel')}</span>
                            </li>
                            {tier === 'pro' && (
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                    <span>{t('features.quickbooks')}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Trust Badges at Bottom of Left Column */}
                <div className="space-y-3 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">
                            {t('secure_billing')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Lock className="h-3 w-3" />
                        <span>{t('stripe_encrypted')}</span>
                    </div>
                    {/* Payment Provider Logos */}
                    <div className="flex items-center gap-3 opacity-40 grayscale">
                        <svg className="h-4" viewBox="0 0 38 24" fill="currentColor">
                            <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#fff" />
                            <path d="M15.5 16.5l1.9-11h3l-1.9 11h-3zm13.7-10.7c-.6-.2-1.5-.5-2.6-.5-2.9 0-4.9 1.5-4.9 3.6 0 1.6 1.4 2.4 2.5 2.9 1.1.5 1.5.9 1.5 1.3 0 .7-.8 1-1.6 1-1.1 0-1.6-.2-2.5-.5l-.3-.2-.4 2.3c.7.3 2 .6 3.3.6 3.1 0 5.1-1.5 5.1-3.8 0-1.2-.7-2.2-2.4-3-.9-.5-1.5-.8-1.5-1.3 0-.4.5-.9 1.5-.9.9 0 1.5.2 2 .4l.2.1.4-2.2zm5.8-1.3h-2.3c-.7 0-1.3.2-1.6.9l-4.6 10.6h3.1s.5-1.4.6-1.7h3.7c.1.4.3 1.7.3 1.7h2.7l-2.4-11h.5zm-3.5 7.1c.2-.6 1.2-3.2 1.2-3.2s.3-.7.4-1.1l.2 1s.6 2.7.7 3.3h-2.5zM13.6 5.5l-3 7.5-.3-1.6c-.5-1.8-2.2-3.7-4.1-4.7l2.7 10h3.1l4.6-11.2h-3z" fill="#1434CB" />
                        </svg>
                        <svg className="h-4" viewBox="0 0 38 24" fill="currentColor">
                            <circle cx="15" cy="12" r="7" fill="#EB001B" />
                            <circle cx="23" cy="12" r="7" fill="#F79E1B" />
                            <path d="M19 6.7c1.3 1.2 2 2.9 2 4.8s-.7 3.6-2 4.8c-1.3-1.2-2-2.9-2-4.8s.7-3.6 2-4.8z" fill="#FF5F00" />
                        </svg>
                        <span className="text-xs font-semibold">Stripe</span>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN - Payment Form (The "Action") - WITH INTERNAL SCROLL */}
            {/* RIGHT COLUMN - Payment Form (The "Action") - WITH INTERNAL SCROLL */}
            <div className="bg-neutral-950 flex flex-col justify-between md:max-h-[600px] md:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <div className="space-y-4 flex-1 p-8 pb-0">
                    {/* Payment Form Label */}
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <label className="text-sm text-gray-400 font-semibold uppercase tracking-wide">
                            {t('payment_info')}
                        </label>
                    </div>

                    {/* Stripe Payment Element */}
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                        <PaymentElement
                            options={{
                                layout: "accordion",
                                paymentMethodOrder: ["card"],
                            }}
                        />
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <p>{errorMessage}</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons at Bottom - STICKY */}
                <div className="space-y-3 p-8 pt-6 sticky bottom-0 bg-neutral-950 z-20 shadow-[0_-20px_40px_-10px_rgba(0,0,0,1)]">
                    <Button
                        type="submit"
                        disabled={!stripe || isLoading}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all duration-200"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {t('processing')}
                            </>
                        ) : (
                            <>
                                <Lock className="mr-2 h-4 w-4" />
                                {t('pay_button_secure', { price: displayPrice })}
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        className="w-full text-gray-400 hover:text-white hover:bg-white/5"
                        disabled={isLoading}
                    >
                        {t('cancel_button')}
                    </Button>
                    <p className="text-xs text-gray-500 text-center relative z-20 bg-neutral-950 pb-2">
                        {t('terms_notice')}
                    </p>
                </div>
            </div>
        </form>
    );
}


interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    tier: SubscriptionTier;
    billingPeriod: 'monthly' | 'yearly';
    isPromoActive: boolean;
    price: number;
    email?: string;
}

export default function CheckoutModal({
    isOpen,
    onClose,
    tier,
    billingPeriod,
    isPromoActive,
    price,
    email
}: CheckoutModalProps) {
    const { theme } = useTheme();
    const t = useTranslations('Checkout');
    const locale = useLocale();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoadingSecret, setIsLoadingSecret] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [intentType, setIntentType] = useState<'payment' | 'setup'>('payment');
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
    const startedRef = useRef(false);
    const currentCustomerRef = useRef<string | null>(null);

    // Generate a unique session token for this modal instance
    const sessionTokenRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isOpen || tier === "free") return;

        // Generate session token on first open
        if (!sessionTokenRef.current) {
            sessionTokenRef.current = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // CRITICAL: Single-flight guard that survives StrictMode
        if (startedRef.current) {
            console.log('[CheckoutModal] Already started, skipping duplicate call');
            return;
        }
        startedRef.current = true;

        const abortController = new AbortController();
        const signal = abortController.signal;

        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        async function pollLatestIntent(customerId: string) {
            console.log('[CheckoutModal] Starting polling for customerId:', customerId);
            const start = Date.now();
            const timeoutMs = 15000;
            let attempts = 0;

            while (!signal.aborted && Date.now() - start < timeoutMs) {
                attempts++;
                console.log(`[CheckoutModal] Poll attempt ${attempts}`);

                try {
                    const res = await fetch(
                        `${window.location.origin}/api/stripe/latest-intent?customerId=${encodeURIComponent(customerId)}`,
                        { signal }
                    );

                    if (!res.ok) {
                        const txt = await res.text();
                        throw new Error(`latest-intent failed: ${res.status} ${txt}`);
                    }

                    const data = await res.json();

                    if (data?.clientSecret) {
                        console.log('[CheckoutModal] Poll found clientSecret');
                        return data.clientSecret as string;
                    }

                    await sleep(800);
                } catch (err: any) {
                    if (err.name === 'AbortError') {
                        console.log('[CheckoutModal] Polling aborted');
                        return null;
                    }
                    throw err;
                }
            }

            console.log('[CheckoutModal] Poll timeout after', attempts, 'attempts');
            return null;
        }

        const run = async () => {
            console.log('[CheckoutModal] create-subscription START', {
                tier,
                billingPeriod,
                isPromoActive,
                sessionToken: sessionTokenRef.current
            });

            setIsLoadingSecret(true);

            try {
                const response = await fetch(`${window.location.origin}/api/stripe/create-subscription`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Idempotency-Key": sessionTokenRef.current!
                    },
                    body: JSON.stringify({
                        plan: tier,
                        billingPeriod,
                        isPromoActive,
                    }),
                    signal
                });

                if (signal.aborted) return;

                const data = await response.json();
                console.log('[CheckoutModal] create-subscription RESPONSE', {
                    subscriptionId: data?.subscriptionId,
                    hasClientSecret: Boolean(data?.clientSecret),
                    needsPolling: data?.needsPolling,
                    customerId: data?.customerId
                });

                if (data?.subscriptionId) {
                    setSubscriptionId(data.subscriptionId);
                }

                if (data?.error) {
                    console.error('[CheckoutModal] API error:', data.error);
                    toast.error(data.error);
                    onClose();
                    return;
                }

                // If Stripe returned clientSecret directly
                if (data?.clientSecret) {
                    console.log('[CheckoutModal] Got clientSecret directly');
                    setClientSecret(data.clientSecret);
                    setIntentType(data.intentType ?? "payment");
                    setIsLoadingSecret(false);
                    return;
                }

                // Polling path
                if (data?.needsPolling && data?.customerId) {
                    console.log('[CheckoutModal] Needs polling, starting...');
                    currentCustomerRef.current = data.customerId;

                    const cs = await pollLatestIntent(data.customerId);
                    if (signal.aborted) return;

                    if (cs) {
                        console.log('[CheckoutModal] Poll succeeded, setting clientSecret');
                        setClientSecret(cs);
                        setIntentType("payment");
                        setIsLoadingSecret(false);
                        return;
                    }

                    console.error('[CheckoutModal] Poll timeout');
                    toast.error(t('error_timeout'));
                    onClose();
                    return;
                }

                console.error('[CheckoutModal] Unexpected response format');
                toast.error(t('error_failed'));
                onClose();
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.log('[CheckoutModal] Request aborted');
                    return;
                }
                console.error('[CheckoutModal] Error:', err);
                toast.error("Failed to initialize payment");
                onClose();
            } finally {
                if (!signal.aborted) {
                    setIsLoadingSecret(false);
                }
            }
        };

        run();

        return () => {
            console.log('[CheckoutModal] Cleanup: aborting requests');
            abortController.abort();
            // DO NOT reset startedRef here - it causes StrictMode to re-run
        };
    }, [isOpen, tier, billingPeriod, isPromoActive]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            console.log('[CheckoutModal] Modal closed, resetting state');
            setClientSecret(null);
            setIsSuccess(false);
            setIsLoadingSecret(false);
            startedRef.current = false;
            currentCustomerRef.current = null;
            sessionTokenRef.current = null;
        }
    }, [isOpen]);

    const handleSuccess = async () => {
        setIsSuccess(true);

        // Attempt to sync subscription status immediately (fixes local webhook issues)
        if (subscriptionId) {
            console.log('[CheckoutModal] Syncing subscription status...', subscriptionId);
            try {
                await fetch('/api/stripe/sync-subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscriptionId })
                });
                console.log('[CheckoutModal] Sync request sent');
            } catch (err) {
                console.error('[CheckoutModal] Sync failed', err);
            }
        }

        toast.success("Subscription upgraded successfully!");

        setTimeout(() => {
            onClose();
            window.location.reload();
        }, 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-5xl bg-neutral-900/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl text-foreground p-0 flex flex-col max-h-[90vh]">
                {/* Header - Compact */}
                <DialogHeader className="px-8 pt-6 pb-4 shrink-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-white/5 rounded-t-2xl">
                    <DialogTitle className="text-2xl font-bold text-white">{t('title')}</DialogTitle>
                    <DialogDescription className="text-gray-400 text-sm">
                        {t('description', { tier })}
                    </DialogDescription>
                </DialogHeader>

                {/* Content - Scrollable wrapper for mobile, visible for desktop (handled internally) */}
                <div className="flex-1 min-h-0 overflow-y-auto md:overflow-y-visible">
                    {isSuccess ? (
                        <div className="py-12 px-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">{t('success.title')}</h3>
                                <p className="text-muted-foreground mt-2">{t('success.message')}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isLoadingSecret ? (
                                <div className="py-12 px-8 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                    <p>{t('initializing')}</p>
                                </div>
                            ) : (
                                clientSecret && (
                                    <Elements
                                        stripe={stripePromise}
                                        options={{
                                            clientSecret,
                                            locale: locale as any,
                                            appearance: {
                                                theme: 'night',
                                                variables: {
                                                    colorPrimary: '#3b82f6',
                                                    colorBackground: '#000000',
                                                    colorText: '#ffffff',
                                                    colorDanger: '#ef4444',
                                                    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                                                    borderRadius: '12px',
                                                },
                                                rules: {
                                                    '.Input': {
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        boxShadow: 'none',
                                                    },
                                                    '.Input:focus': {
                                                        border: '1px solid #3b82f6',
                                                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)',
                                                    },
                                                },
                                            },
                                            // @ts-ignore
                                            defaultValues: {
                                                billingDetails: {
                                                    email: email,
                                                }
                                            }
                                        }}
                                    >
                                        <CheckoutForm
                                            tier={tier}
                                            billingPeriod={billingPeriod}
                                            isPromoActive={isPromoActive}
                                            price={price}
                                            intentType={intentType}
                                            onSuccess={handleSuccess}
                                            onCancel={onClose}
                                            email={email}
                                        />
                                    </Elements>
                                )
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
