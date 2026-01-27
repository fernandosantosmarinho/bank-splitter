import { Sparkles, Check, Gift, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslations, useLocale } from "next-intl";
import { useWelcomeOffer } from "@/hooks/useWelcomeOffer";
import { Progress } from "@/components/ui/progress";

interface DocumentLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubscribe: () => void;
    onViewPlans: () => void;
    accountCreatedAt?: string;
    welcomeOfferUsed?: boolean;
    plan?: 'free' | 'starter' | 'pro' | 'business' | 'enterprise'; // Expanded plan types
    used?: number;
    limit?: number;
    resetsAt?: string;
}

export default function DocumentLimitModal({
    isOpen,
    onClose,
    onSubscribe,
    onViewPlans,
    accountCreatedAt,
    welcomeOfferUsed,
    plan = 'free',
    used = 0,
    limit = 5,
    resetsAt
}: DocumentLimitModalProps) {
    const t = useTranslations('BillingNew.limit_modal');
    const locale = useLocale();

    // Use centralized hook - single source of truth (Only relevant for Free plan)
    const offer = useWelcomeOffer(accountCreatedAt, welcomeOfferUsed);

    // Animation classes for smooth entry
    const animationClasses = "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300";

    // Format date helper
    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    };

    const isFree = plan === 'free';
    const isStarter = plan === 'starter';
    const isPro = plan === 'pro';

    // Content decision logic
    let title = t('title'); // Default: Free tier limit
    let description = t('desc');
    let showOffer = isFree; // Only show offer block for Free users
    let showUpgrade = isStarter; // Starter sees Upgrade to Pro
    let showStatus = isPro; // Pro sees status only
    let primaryCtaLabel = isFree && offer.isActive ? t('cta_claim_offer') : t('cta_subscribe');
    let primaryCtaAction = onSubscribe;

    if (isStarter) {
        title = t('title_limit_reached');
        description = t('desc_starter');
        primaryCtaLabel = t('cta_view_plans');
        primaryCtaAction = onViewPlans;
    } else if (isPro) {
        title = t('title_limit_reached');
        description = t('desc_pro', { date: formatDate(resetsAt) });
        primaryCtaLabel = t('cta_view_plans');
        primaryCtaAction = onViewPlans;
    }

    const usagePercent = Math.min(100, (used / limit) * 100);

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
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold leading-tight tracking-tight">
                                {title}
                            </DialogTitle>
                            <p className="text-indigo-100 text-sm mt-1 leading-snug opacity-90">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* B. & C. BODY CONTENT */}
                <div className="p-5 flex flex-col gap-5">

                    {/* USAGE PROGRESS (Visible for all, but emphasized for paid plans) */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                            <span>{t('documents_used')}</span>
                            <span className={used >= limit ? "text-red-500 font-bold" : ""}>{used} / {limit}</span>
                        </div>
                        <Progress value={usagePercent} className="h-2" />
                        {resetsAt && (
                            <p className="text-[10px] text-muted-foreground text-right">{t('renews', { date: formatDate(resetsAt) })}</p>
                        )}
                        {/* Current Plan Label - Discrete */}
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                            {t('current_plan_label', { plan: plan.toUpperCase() })}
                        </p>
                    </div>

                    {/* B. OFFER / UPGRADE / STATUS BLOCK */}
                    <div className={`rounded-xl border p-6 relative overflow-hidden transition-all ${(showOffer && offer.isActive) || showUpgrade ? 'bg-indigo-50/50 dark:bg-white/5 border-indigo-100 dark:border-white/10' : 'bg-muted/30 border-border'
                        }`}>

                        {showOffer ? (
                            offer.isActive ? (
                                // ACTIVE OFFER STATE
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                        <Gift className="h-4 w-4" />
                                        <span className="text-sm font-bold uppercase tracking-wide">
                                            {t('offer_active_label')}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-muted-foreground line-through text-lg">€15</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-foreground">€9</span>
                                            <span className="text-sm text-muted-foreground font-medium">/mês</span>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 border border-yellow-300/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-lg flex items-center gap-2">
                                        <span className="text-yellow-300/80">{t('offer_expires_label')}</span>
                                        <span className="text-yellow-300">{offer.remainingLabel}</span>
                                    </div>
                                </div>
                            ) : (
                                // EXPIRED OFFER STATE
                                <div className="text-center py-1">
                                    <p className="text-sm font-bold text-muted-foreground mb-1 uppercase tracking-wide">
                                        {t('offer_expired_label')}
                                    </p>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-xl font-bold text-foreground">{t('price_normal')}</span>
                                    </div>
                                </div>
                            )
                        ) : showUpgrade ? (
                            // STARTER -> UPGRADE TO PRO BLOCK
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-sm font-bold uppercase tracking-wide">
                                        {t('upgrade_to_pro_title')}
                                    </span>
                                </div>
                                {/* Simple benefits list for upgrade */}
                                <ul className="text-left space-y-1.5 mt-1">
                                    {[t('upgrade_feature_1'), t('upgrade_feature_2'), t('upgrade_feature_3')].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Check className="h-3 w-3 text-emerald-500" />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            // PRO -> STATUS BLOCK (No Upsell)
                            <div className="text-center">
                                <p className="text-sm font-bold text-foreground mb-1">
                                    {t('pro_status_title')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t('pro_status_msg', { used, limit, date: formatDate(resetsAt) })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* C. FEATURES BULLETS (Only for Free to reinforce value, skip for others to reduce noise) */}
                    {isFree && (
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
                    )}

                    {/* D. CTAs */}
                    <div className="flex flex-col gap-3 mt-1">
                        <Button
                            onClick={primaryCtaAction}
                            className={`w-full h-12 text-base font-bold shadow-md hover:scale-[1.01] transition-all
                                ${showOffer && offer.isActive
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    : 'bg-primary hover:bg-primary/90'
                                }`}
                        >
                            {primaryCtaLabel}
                            {(showOffer && offer.isActive) && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Secondary Left */}
                            {!isStarter && !isPro && (
                                <Button
                                    variant="outline"
                                    onClick={onViewPlans}
                                    className="w-full text-xs h-9 border-border bg-transparent hover:bg-muted"
                                >
                                    {t('cta_view_plans')}
                                </Button>
                            )}
                            {/* If Starter/Pro, use full width close or alternative layout if desired. 
                                For now keeping grid structure but maybe spanning full width if only 1 secondary button?
                                Let's keep 2 cols for consistency or fill empty slot.
                            */}
                            {(isStarter || isPro) && (
                                <div /> // Spacer
                            )}

                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className={`w-full text-xs h-9 text-muted-foreground hover:text-foreground ${(isStarter || isPro) ? "col-span-2" : ""}`}
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
