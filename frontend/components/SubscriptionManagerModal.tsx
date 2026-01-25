"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Calendar, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { SubscriptionTier } from "@/lib/stripe";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Locale } from "@/i18n/locales";

interface SubscriptionDetails {
    planName: string;
    amount: number;
    currency: string;
    interval: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    paymentMethod: {
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
    } | null;
}

interface SubscriptionManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SubscriptionManagerModal({ isOpen, onClose }: SubscriptionManagerModalProps) {
    const t = useTranslations('SubscriptionManager');
    const locale = useLocale() as Locale;
    const [isLoading, setIsLoading] = useState(true);
    const [details, setDetails] = useState<SubscriptionDetails | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDetails();
        }
    }, [isOpen]);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/stripe/subscription-details', { cache: 'no-store' });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Failed to check subscription: ${res.status} ${err}`);
            }
            const data = await res.json();
            setDetails(data);
        } catch (error) {
            console.error(error);
            toast.error(t('error_load'));
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const router = useRouter();

    const handleCancelSubscription = async () => {
        setIsCancelling(true);
        try {
            const res = await fetch('/api/stripe/cancel-subscription', { method: 'POST' });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Cancel failed: ${res.status} ${err}`);
            }

            toast.success(t('success_cancel'));
            onClose();
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error(t('error_cancel'));
        } finally {
            setIsCancelling(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-card border border-border text-foreground p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {t('description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-6">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p>{t('loading')}</p>
                        </div>
                    ) : details ? (
                        <div className="space-y-6 mt-4">
                            {/* Plan Info Card */}
                            <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('current_plan')}</p>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-foreground">{details.planName}</h3>
                                            <SubscriptionBadge tier={details.planName.toLowerCase().includes('pro') ? 'pro' : 'enterprise'} />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-foreground">
                                            ${details.amount}{t('per_interval', { interval: details.interval })}
                                        </p>
                                        <p className={details.cancelAtPeriodEnd ? "text-amber-500 text-xs" : "text-emerald-500 text-xs"}>
                                            {details.cancelAtPeriodEnd ? t('status_cancels_soon') : t('status_active')}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-border w-full" />

                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {details.cancelAtPeriodEnd ? t('access_ends_on') : t('renews_on')} <span className="text-foreground font-medium">{formatDate(details.currentPeriodEnd)}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Payment Method */}
                            {details.paymentMethod && (
                                <div className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-[#0f172a]/50">
                                    <div className="h-10 w-14 bg-[#1e293b] rounded flex items-center justify-center border border-white/5">
                                        <CreditCard className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white capitalize">
                                            {details.paymentMethod.brand} •••• {details.paymentMethod.last4}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {t('expires', { date: `${details.paymentMethod.exp_month}/${details.paymentMethod.exp_year}` })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {!showCancelConfirm ? (
                                <div className="pt-2">
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                        onClick={() => setShowCancelConfirm(true)}
                                        disabled={details.cancelAtPeriodEnd}
                                    >
                                        {details.cancelAtPeriodEnd ? t('scheduled_button') : t('cancel_button')}
                                    </Button>
                                    {details.cancelAtPeriodEnd && (
                                        <p className="text-center text-[10px] text-slate-500 mt-2">
                                            {t('cancellation_scheduled_desc')}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-3 animate-in fade-in zoom-in duration-200">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-red-500">{t('confirm_title')}</h4>
                                            <p className="text-xs text-red-200/70 mt-1">
                                                {t('confirm_desc', { date: formatDate(details.currentPeriodEnd) })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="flex-1 hover:bg-red-500/5 hover:text-red-300 text-slate-400"
                                            onClick={() => setShowCancelConfirm(false)}
                                        >
                                            {t('keep_plan')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                                            onClick={handleCancelSubscription}
                                            disabled={isCancelling}
                                        >
                                            {isCancelling ? (
                                                <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> {t('cancelling')}</>
                                            ) : (
                                                t('confirm_cancel')
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-500">
                            <p>{t('no_active_sub')}</p>
                            <Button variant="link" onClick={onClose} className="mt-2 text-blue-400">{t('close')}</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
