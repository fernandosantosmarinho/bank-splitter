import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserMetrics } from "@/lib/supabase";

import { useTranslations } from "next-intl";
import { useWelcomeOffer } from "@/hooks/useWelcomeOffer";

interface PricingCardProps {
    plan: 'free' | 'starter' | 'pro';
    billingPeriod: 'monthly' | 'yearly';
    userMetrics: UserMetrics;
    currentPlan: string;
    isLoading: boolean;
    onUpgrade: (plan: string) => void;
}

export default function PricingCard({
    plan,
    billingPeriod,
    userMetrics,
    currentPlan,
    isLoading,
    onUpgrade
}: PricingCardProps) {
    const t = useTranslations('BillingNew.cards');
    const tCommon = useTranslations('Common');

    // Use centralized hook for offer state
    const offer = useWelcomeOffer(
        userMetrics?.account_created_at,
        userMetrics?.welcome_offer_used
    );

    // Feature Lists Mapping
    const features = {
        free: [
            { text: t('feature_5_docs'), included: true },
            { text: t('feature_basic_extraction'), included: true },
            { text: t('feature_csv_export'), included: true },
            { text: t('feature_priority_supp'), included: false }
        ],
        starter: [
            { text: t('feature_50_docs'), included: true },
            { text: t('feature_advanced_extraction'), included: true },
            { text: t('feature_csv_excel_export'), included: true },
            { text: t('feature_quickbooks'), included: false }
        ],
        pro: [
            { text: t('feature_500_docs'), included: true },
            { text: t('feature_advanced_extraction'), included: true },
            { text: t('feature_priority_proc'), included: true },
            { text: t('feature_quickbooks'), included: true },
            { text: t('feature_priority_supp'), included: true }
        ]
    };

    // @ts-ignore
    const currentFeatures = features[plan] || [];

    const details = {
        name: tCommon(`plan_${plan}`),
        description: t(`plan_${plan}_desc`),
        features: currentFeatures
    };
    const isCurrent = currentPlan === plan || (plan === 'free' && (!currentPlan || currentPlan === 'free'));

    // Dynamic Price Calculation
    const getPrice = (): { display: number | string; original: number | string; yearlyTotal: number | string } => {
        if (plan === 'free') return { display: 0, original: 0, yearlyTotal: 0 };

        const basePrices = {
            starter: { monthly: 15, yearly: 144 },
            pro: { monthly: 49, yearly: 468 }
        };

        const promoPrices = {
            starter: { monthly: 9, yearly: 86.40 },
            pro: { monthly: 29.40, yearly: 280.80 }
        };

        const prices = offer.isActive ? promoPrices : basePrices;
        // @ts-ignore
        const price = prices[plan][billingPeriod];

        // Ensure standard display
        // Ensure standard display

        let displayPrice: number | string = price;
        let originalPrice: number | string = 0;
        let yearlyTotal: number | string = 0;

        if (billingPeriod === 'yearly') {
            displayPrice = (price / 12).toFixed(2);
            // @ts-ignore
            originalPrice = (basePrices[plan][billingPeriod] / 12).toFixed(2);
            yearlyTotal = price.toFixed(2);
        } else {
            displayPrice = price;
            // @ts-ignore
            originalPrice = basePrices[plan].monthly;
            yearlyTotal = 0; // Explicitly set to 0 for monthly
        }

        return {
            display: displayPrice,
            original: originalPrice,
            yearlyTotal: yearlyTotal
        };
    };

    const priceData = getPrice();
    const showPromo = offer.isActive && plan !== 'free';

    return (
        <Card
            id={plan === 'starter' ? 'starter-plan-card' : undefined}
            className={`relative flex flex-col h-full bg-card transition-all duration-200 hover:shadow-xl ${isCurrent ? 'border-primary shadow-md' : 'border-border'} ${showPromo ? 'border-indigo-500/50' : ''}`}
        >
            {plan === 'starter' && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-4 py-1">{t('popular')}</Badge>
                </div>
            )}
            {showPromo && (
                <div className="absolute top-4 right-4 z-20">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 text-xs border border-purple-200 shadow-sm flex items-center gap-1">
                        🎁 {t('welcome_offer_badge')}
                    </Badge>
                </div>
            )}

            <CardHeader>
                <CardTitle className="text-xl font-bold">{details.name}</CardTitle>
                <CardDescription>{details.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col space-y-6">
                <div className="flex items-baseline gap-2">
                    {plan === 'free' ? (
                        <span className="text-3xl font-bold">{tCommon('plan_free')}</span>
                    ) : (
                        <>
                            <div className="flex flex-col items-start">
                                {Number(priceData.display) < Number(priceData.original) && (
                                    <span className="text-gray-400 line-through text-lg font-medium">
                                        €{priceData.original}
                                    </span>
                                )}
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-emerald-500">
                                        €{priceData.display}
                                    </span>
                                    <span className="text-muted-foreground text-sm">{t('per_month')}</span>
                                </div>
                                {billingPeriod === 'yearly' && Number(priceData.yearlyTotal) > 0 && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        {t('billed_yearly_val', { amount: priceData.yearlyTotal })}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <ul className="space-y-3 flex-1">
                    {details.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            {feature.included ? (
                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                                <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                            )}
                            <span className={feature.included ? 'text-foreground' : ''}>{feature.text}</span>
                        </li>
                    ))}
                </ul>

                <Button
                    onClick={() => onUpgrade(plan)}
                    disabled={isCurrent || isLoading}
                    variant={isCurrent ? 'outline' : showPromo ? 'default' : 'secondary'}
                    className={`w-full font-bold ${showPromo && !isCurrent ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : ''}`}
                >
                    {isCurrent ? t('current_plan') : isLoading ? t('processing') : t('subscribe', { plan: details.name })}
                </Button>
            </CardContent>
        </Card>
    );
}
