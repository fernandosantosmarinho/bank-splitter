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
import { AlertCircle, CheckCircle2, Loader2, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionTier } from "@/lib/stripe";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg border border-border mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-foreground font-medium capitalize flex items-center gap-2">
                        {tier} Plan
                        {isPromoActive && (
                            <span className="inline-flex items-center gap-1 text-xs bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full border border-purple-500/20">
                                <Sparkles className="h-3 w-3" />
                                40% OFF
                            </span>
                        )}
                    </span>
                    <span className="text-xl font-bold text-foreground">
                        €{displayPrice}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </span>
                </div>
                <p className="text-xs text-muted-foreground">
                    {billingPeriod === 'yearly'
                        ? `Billed annually at €${price.toFixed(2)}`
                        : 'Billed monthly'}
                </p>
            </div>

            <PaymentElement
                options={{
                    layout: "accordion",
                    paymentMethodOrder: ["card"],
                }}
            />

            {errorMessage && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{errorMessage}</p>
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 border-border text-foreground hover:bg-muted"
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={!stripe || isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                >
                    {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing</>
                    ) : (
                        <><Lock className="mr-2 h-3 w-3" /> Pay €{displayPrice}</>
                    )}
                </Button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" /> Secured by Stripe
            </p>
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
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoadingSecret, setIsLoadingSecret] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [intentType, setIntentType] = useState<'payment' | 'setup'>('payment');
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
                        `/api/stripe/latest-intent?customerId=${encodeURIComponent(customerId)}`,
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
                const response = await fetch("/api/stripe/create-subscription", {
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
                    hasClientSecret: Boolean(data?.clientSecret),
                    needsPolling: data?.needsPolling,
                    customerId: data?.customerId
                });

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
                    toast.error("Timeout ao iniciar o pagamento. Tente novamente.");
                    onClose();
                    return;
                }

                console.error('[CheckoutModal] Unexpected response format');
                toast.error("Falha ao iniciar pagamento. Tente novamente.");
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

    const handleSuccess = () => {
        setIsSuccess(true);
        toast.success("Subscription upgraded successfully!");

        setTimeout(() => {
            onClose();
            window.location.reload();
        }, 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border border-border text-foreground p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {t('description', { tier })}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-6">
                    {isSuccess ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
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
                                <div className="py-12 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                    <p>{t('initializing')}</p>
                                </div>
                            ) : (
                                clientSecret && (
                                    <Elements
                                        stripe={stripePromise}
                                        options={{
                                            clientSecret,
                                            appearance: {
                                                theme: theme === 'dark' ? 'night' : 'stripe',
                                                variables: {
                                                    colorPrimary: '#2563eb',
                                                    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                                                },
                                            },
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
