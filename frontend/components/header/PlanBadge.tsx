import { cn } from "@/lib/utils";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { useTranslations } from "next-intl";

interface PlanBadgeProps {
    tier: 'free' | 'pro' | 'enterprise';
    className?: string;
}

export function PlanBadge({ tier, className }: PlanBadgeProps) {
    const t = useTranslations('Dashboard.header');

    return (
        <div className={cn("flex items-center gap-2 px-2 py-1 rounded-full bg-secondary/50 border border-border/50", className)}>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('plan')}</span>
            <SubscriptionBadge
                tier={tier}
                className="h-4 px-1 text-[10px] border-none bg-transparent p-0"
            />
        </div>
    );
}
