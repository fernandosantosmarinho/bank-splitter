import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserMetrics } from "@/lib/supabase";
import { useTranslations, useLocale } from "next-intl";

interface CurrentSubscriptionCardProps {
    userMetrics: UserMetrics;
    onManage: () => void;
    isLoading: boolean;
}

export default function CurrentSubscriptionCard({ userMetrics, onManage, isLoading }: CurrentSubscriptionCardProps) {
    const t = useTranslations('BillingNew.current_sub');
    const tCommon = useTranslations('Common');
    const locale = useLocale();

    const isFree = !userMetrics.subscription_tier || userMetrics.subscription_tier === 'free';

    // Usage Logic
    const usage = userMetrics.credits_used || 0;
    const limit = userMetrics.credits_total || (isFree ? 5 : 0);
    const percentage = Math.min((usage / limit) * 100, 100);

    const getProgressColorByUsage = (u: number, l: number) => {
        const p = (u / l) * 100;
        if (p === 0) return 'bg-slate-200 dark:bg-slate-800'; // Gray for 0%
        if (p <= 50) return 'bg-emerald-500'; // Green
        if (p <= 80) return 'bg-amber-500'; // Orange/Yellow
        return 'bg-red-500'; // Red
    };

    const progressColor = getProgressColorByUsage(usage, limit);

    const getStatusColor = (status: string | undefined) => {
        if (!status || status === 'active') return 'bg-emerald-500';
        if (status === 'past_due') return 'bg-red-500';
        return 'bg-slate-500';
    };

    const getStatusLabel = (status: string | undefined) => {
        if (!status || status === 'active') return t('active');
        if (status === 'past_due') return t('past_due');
        return status;
    };

    return (
        <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-1/3">
                    <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="h-4 w-4 text-purple-500" />
                        <h2 className="text-lg font-bold text-foreground">
                            {isFree ? t('free_tier_label') : tCommon(`plan_${userMetrics.subscription_tier}`)}
                        </h2>

                    </div>
                </div>

                <div className="w-full sm:w-1/3 flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs text-muted-foreground">
                            {isFree ? t('free_docs_label') : t('usage_credits_label')}
                        </span>
                        <span className="text-xs font-mono font-bold">
                            {usage} / {limit}
                        </span>
                    </div>
                    {/* Manual Progress Bar to match HeaderActions style */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/20">
                        <div
                            className={cn("h-full rounded-full transition-all duration-500", progressColor)}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                        {isFree ? t('free_tier_desc') : t('paid_tier_desc')}
                    </p>
                </div>

                <div className="w-full sm:w-auto">
                    {!isFree && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto border-border hover:bg-muted text-xs h-8"
                            onClick={onManage}
                            disabled={isLoading}
                        >
                            {isLoading ? tCommon('loading') : t('manage_stripe')}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
