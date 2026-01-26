import { Sparkles, Check, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useWelcomeOffer } from "@/hooks/useWelcomeOffer";

interface DocumentLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubscribe: () => void;
    onViewPlans: () => void;
    accountCreatedAt?: string;
    welcomeOfferUsed?: boolean;
}

export default function DocumentLimitModal({
    isOpen,
    onClose,
    onSubscribe,
    onViewPlans,
    accountCreatedAt,
    welcomeOfferUsed
}: DocumentLimitModalProps) {
    const t = useTranslations('BillingNew.limit_modal');

    // Use centralized hook - single source of truth
    const offer = useWelcomeOffer(accountCreatedAt, welcomeOfferUsed);

    // Animation classes for smooth entry
    const animationClasses = "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-0 rounded-xl border shadow-2xl sm:max-w-md bg-card border-border overflow-hidden p-0 outline-none ${animationClasses}`}
            // Override default close button behavior if needed, but we keep X for UX
            >
                {/* A. COMPACT HEADER (25-30% height) */}
                <div className="bg-gradient-to-br from-indigo-700 to-purple-600 p-6 text-center text-white relative">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />

                    <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-full shadow-lg border border-white/20">
                            <Sparkles className="h-6 w-6 text-yellow-300 fill-yellow-300/20" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold leading-tight tracking-tight">
                                {t('title')}
                            </DialogTitle>
                            <p className="text-indigo-100 text-sm mt-1 leading-snug opacity-90">
                                {t('desc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* B. & C. BODY CONTENT */}
                <div className="p-5 flex flex-col gap-5">

                    {/* B. OFFER BLOCK */}
                    <div className={`rounded-xl border p-8 relative overflow-hidden transition-all ${offer.isActive ? 'bg-indigo-50/50 dark:bg-white/5 border-indigo-100 dark:border-white/10' : 'bg-muted/30 border-border'}`}>

                        {offer.isActive ? (
                            // ACTIVE STATE - Vertical Centered Layout
                            <>
                                <div className="flex flex-col items-center text-center gap-4">

                                    {/* 1. TITLE */}
                                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                        <Gift className="h-4 w-4" />
                                        <span className="text-sm font-bold uppercase tracking-wide">
                                            {t('offer_active_label')}
                                        </span>
                                    </div>

                                    {/* 2. PRICE (The Hook) */}
                                    <div className="flex items-baseline gap-2 mt-4">
                                        <span className="text-muted-foreground line-through text-lg">€15</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-foreground">€9</span>
                                            <span className="text-sm text-muted-foreground font-medium">/mês</span>
                                        </div>
                                    </div>

                                    {/* 3. SAVINGS */}
                                    <p className="text-sm font-semibold text-green-400 mt-1">
                                        {t('savings')}
                                    </p>

                                    {/* 4. TIMER (The Urgency) */}
                                    <div className="mt-6 bg-black/40 border border-yellow-300/20 text-yellow-300 px-4 py-2 rounded-full text-xs font-mono font-bold shadow-lg flex items-center gap-2">
                                        <span className="text-yellow-300/80">{t('offer_expires_label')}</span>
                                        <span className="text-yellow-300">{offer.remainingLabel}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // EXPIRED STATE
                            <div className="text-center py-1">
                                <p className="text-sm font-bold text-muted-foreground mb-1 uppercase tracking-wide">
                                    {t('offer_expired_label')}
                                </p>
                                <p className="text-xs text-muted-foreground mb-3">
                                    {t('offer_expired_msg')}
                                </p>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-xl font-bold text-foreground">{t('price_normal')}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* C. BENEFITS BULLETS */}
                    <ul className="space-y-2 px-1">
                        {[t('feature_more_docs'), t('feature_export'), t('feature_priority')].map((feat, i) => (
                            <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="font-medium">{feat}</span>
                            </li>
                        ))}
                    </ul>

                    {/* D. CTAs */}
                    <div className="flex flex-col gap-3 mt-1">
                        <Button
                            onClick={onSubscribe}
                            className={`w-full h-12 text-base font-bold shadow-md hover:scale-[1.01] transition-all
                                ${offer.isActive
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    : 'bg-primary hover:bg-primary/90'
                                }`}
                        >
                            {offer.isActive ? t('cta_claim_offer') : t('cta_subscribe')}
                            {offer.isActive && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                onClick={onViewPlans}
                                className="w-full text-xs h-9 border-border bg-transparent hover:bg-muted"
                            >
                                {t('cta_view_plans')}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="w-full text-xs h-9 text-muted-foreground hover:text-foreground"
                            >
                                {t('close')}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
