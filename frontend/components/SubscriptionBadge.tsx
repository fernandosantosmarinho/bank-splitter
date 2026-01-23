import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SubscriptionBadgeProps {
    tier: 'free' | 'pro' | 'enterprise' | null | undefined;
    className?: string;
}

export default function SubscriptionBadge({ tier, className }: SubscriptionBadgeProps) {
    const normalizedTier = (tier || 'free').toLowerCase();

    const badgeStyles = {
        free: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        pro: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        enterprise: "bg-purple-500/10 text-purple-400 border-purple-500/20"
    };

    const style = badgeStyles[normalizedTier as keyof typeof badgeStyles] || badgeStyles.free;

    return (
        <Badge
            variant="outline"
            className={cn(style, "text-[10px] font-bold uppercase tracking-wider", className)}
        >
            {normalizedTier}
        </Badge>
    );
}
