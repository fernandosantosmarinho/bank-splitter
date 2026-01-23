"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Calendar, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { SubscriptionTier } from "@/lib/stripe";
import { useRouter } from "next/navigation";

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
            const res = await fetch('/api/stripe/subscription-details');
            if (!res.ok) throw new Error('Failed to fetch subscription');
            const data = await res.json();
            setDetails(data);
        } catch (error) {
            console.error(error);
            toast.error("Could not load subscription details");
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
            if (!res.ok) throw new Error('Failed to cancel');

            toast.success("Subscription canceled. Access remains until the billing period ends.");
            onClose();
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Failed to cancel subscription");
        } finally {
            setIsCancelling(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-[#0b1221] border border-white/10 text-white p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle>Manage Subscription</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        View and manage your active plan details.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-6">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4 text-slate-400">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p>Loading subscription details...</p>
                        </div>
                    ) : details ? (
                        <div className="space-y-6 mt-4">
                            {/* Plan Info Card */}
                            <div className="bg-[#0f172a] rounded-lg p-4 border border-white/5 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Current Plan</p>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-white">{details.planName}</h3>
                                            <SubscriptionBadge tier={details.planName.toLowerCase().includes('pro') ? 'pro' : 'enterprise'} />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-white">
                                            ${details.amount}/{details.interval}
                                        </p>
                                        <p className={details.cancelAtPeriodEnd ? "text-amber-500 text-xs" : "text-emerald-500 text-xs"}>
                                            {details.cancelAtPeriodEnd ? "Cancels soon" : "Active"}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-white/5 w-full" />

                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                    <span>
                                        {details.cancelAtPeriodEnd ? "Access ends on" : "Renews on"} <span className="text-white font-medium">{formatDate(details.currentPeriodEnd)}</span>
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
                                            Expires {details.paymentMethod.exp_month}/{details.paymentMethod.exp_year}
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
                                        {details.cancelAtPeriodEnd ? "Cancellation Scheduled" : "Cancel Subscription"}
                                    </Button>
                                    {details.cancelAtPeriodEnd && (
                                        <p className="text-center text-[10px] text-slate-500 mt-2">
                                            Your plan will remain active until the end of the billing period.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-3 animate-in fade-in zoom-in duration-200">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-red-500">Cancel Subscription?</h4>
                                            <p className="text-xs text-red-200/70 mt-1">
                                                You will match remaining credits and access at the end of your billing cycle ({formatDate(details.currentPeriodEnd)}). This action cannot be undone.
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
                                            Keep Plan
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                                            onClick={handleCancelSubscription}
                                            disabled={isCancelling}
                                        >
                                            {isCancelling ? (
                                                <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Cancelling...</>
                                            ) : (
                                                "Confirm Cancel"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-500">
                            <p>No active subscription details found.</p>
                            <Button variant="link" onClick={onClose} className="mt-2 text-blue-400">Close</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
