"use client";

import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface TopUpButtonProps {
    isProminent: boolean;
    showAttention?: boolean;
    className?: string;
}

export function TopUpButton({ isProminent, showAttention = true, className }: TopUpButtonProps) {
    const t = useTranslations('Dashboard.header');
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);

    // Track impression for prominent button
    useEffect(() => {
        if (isProminent) {
            trackEvent('header_topup_impression', { variant: 'prominent' });
        }
    }, [isProminent]);

    const handleClick = () => {
        if (isNavigating) return;

        setIsNavigating(true);
        trackEvent('header_topup_click', {
            is_prominent: isProminent,
            timestamp: new Date().toISOString()
        });

        router.push("/dashboard?tab=settings&view=billing");

        // Reset after navigation attempt
        setTimeout(() => setIsNavigating(false), 1000);
    };

    if (isProminent) {
        return (
            <Button
                size="sm"
                onClick={handleClick}
                disabled={isNavigating}
                className={cn(
                    "h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold tracking-wide px-5 shadow-sm hover:shadow-md transition-all rounded-md flex items-center gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                    showAttention && "animate-pulse",
                    className
                )}
                aria-label="Top up credits"
            >
                <Zap className="h-4 w-4 fill-current" />
                <span className="relative">{t('top_up')}</span>
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={isNavigating}
            className={cn(
                "h-9 rounded-md px-4 text-muted-foreground hover:text-foreground border-border/60 hover:border-border transition-all gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50",
                className
            )}
            aria-label="Top up credits"
        >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('top_up')}</span>
        </Button>
    );
}
