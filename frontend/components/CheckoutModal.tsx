"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionTier } from "@/lib/stripe";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
    tier: SubscriptionTier;
    price: number;
    onSuccess: () => void;
    onCancel: () => void;
    email?: string;
}

function CheckoutForm({ tier, price, onSuccess, onCancel, email }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const t = useTranslations('Checkout');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/dashboard?tab=settings&payment_success=true`,
            },
            redirect: "if_required", // Important: Avoid redirect if possible
        });

        if (error) {
            setErrorMessage(error.message || "An unexpected error occurred.");
            setIsLoading(false);
        } else {
            // Payment successful
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg border border-border mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-foreground font-medium capitalize">{t('plan_label', { tier })}</span>
                    <span className="text-xl font-bold text-foreground">${price}/mo</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    {t('billed_monthly')}
                </p>
            </div>

            <PaymentElement
                options={{
                    layout: "tabs",
                    defaultValues: {
                        billingDetails: {
                            email: email
                        }
                    }
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
                    {t('cancel_button')}
                </Button>
                <Button
                    type="submit"
                    disabled={!stripe || isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                >
                    {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('processing')}</>
                    ) : (
                        <><Lock className="mr-2 h-3 w-3" /> {t('pay_button', { price })}</>
                    )}
                </Button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" /> {t('secured_by')}
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

export default function CheckoutModal({ isOpen, onClose, tier, billingPeriod, isPromoActive, price, email }: CheckoutModalProps) {
    const { theme } = useTheme();
    const t = useTranslations('Checkout');
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoadingSecret, setIsLoadingSecret] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && tier !== 'free') {
            const fetchClientSecret = async () => {
                setIsLoadingSecret(true);
                try {
                    const response = await fetch("/api/stripe/create-subscription", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            tier,
                            billingPeriod,
                            isPromoActive
                        }),
                    });

                    const data = await response.json();

                    if (data.error) {
                        toast.error(data.error);
                        onClose();
                    } else {
                        setClientSecret(data.clientSecret);
                    }
                } catch (error) {
                    console.error("Error creating subscription:", error);
                    toast.error("Failed to initialize payment");
                    onClose();
                } finally {
                    setIsLoadingSecret(false);
                }
            };

            fetchClientSecret();
        }
    }, [isOpen, tier, billingPeriod, isPromoActive, onClose]);

    const handleSuccess = () => {
        setIsSuccess(true);
        toast.success("Subscription upgraded successfully!");
        // Optional: refresh page/data after a delay
        setTimeout(() => {
            onClose();
            window.location.reload(); // Refresh to update UI with new subscription status
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
                                            price={price} // Use prop price
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
