"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "./PlanBadge";
import { TopUpButton } from "./TopUpButton";
import { type UserMetrics } from "@/lib/supabase";
import { useTranslations, useLocale } from "next-intl";
import { setUserLocale } from '@/app/actions/set-locale';
import { Locale, locales } from '@/i18n/locales';
import {
    Settings,
    Globe,
    LogOut,
    UserCircle,
    Check,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderActionsProps {
    userMetrics: UserMetrics;
    className?: string;
}

export function HeaderActions({ userMetrics, className }: HeaderActionsProps) {
    const { user } = useUser();
    const router = useRouter();
    const t = useTranslations('Dashboard.header');

    // Determine Top Up Prominence
    // If inactive OR free tier -> Prominent
    const isFreeOrInactive = userMetrics.subscription_tier === 'free' || userMetrics.subscription_status !== 'active';

    if (!user) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

    return (
        <div className={cn("flex items-center gap-4", className)}>

            {/* 1. Plan & Usage Group (Hidden on mobile) */}
            <div className="hidden md:flex items-center gap-3">
                <PlanBadge tier={userMetrics.subscription_tier} />
                <UsageIndicator metrics={userMetrics} />
            </div>

            {/* 2. Top Up Button */}
            <div className={cn("hidden xs:block transition-all", isFreeOrInactive ? "ml-1" : "ml-0")}>
                <TopUpButton isProminent={isFreeOrInactive} />
            </div>

            {/* 3. Avatar & Menu */}
            <HeaderUserMenu user={user} />
        </div>
    );
}

function UsageIndicator({ metrics }: { metrics: UserMetrics }) {
    const percent = metrics.credits_total === 999999 ? 0 : Math.min((metrics.credits_used / metrics.credits_total) * 100, 100);
    const usageLabel = `${metrics.credits_used.toLocaleString()} / ${metrics.credits_total === 999999 ? '∞' : metrics.credits_total.toLocaleString()}`;

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-muted/50 transition-colors cursor-help"
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Credit usage: ${usageLabel}`}
                    >
                        <div className="flex flex-col gap-0.5 min-w-[60px]">
                            <div className="h-1.5 w-16 bg-muted/80 rounded-full overflow-hidden border border-border/20">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", percent > 90 ? "bg-red-500" : "bg-emerald-500")}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-[10px] font-mono font-medium text-muted-foreground">
                            {metrics.credits_used}
                            <span className="text-muted-foreground/40 mx-0.5">/</span>
                            {metrics.credits_total === 999999 ? '∞' : (metrics.credits_total / 1000).toFixed(0) + 'k'}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                    Credits used / Credits available
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function HeaderUserMenu({ user }: { user: any }) {
    const { signOut, openUserProfile } = useClerk();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const currentLocale = useLocale() as Locale;

    const localeLabels: Record<Locale, string> = {
        en: 'English',
        pt: 'Português',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch'
    };

    const handleLocaleChange = (newLocale: Locale) => {
        startTransition(async () => {
            await setUserLocale(newLocale);
            router.refresh();
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-9 w-9 ring-1 ring-border/50 bg-muted/20 hover:ring-primary/40 hover:bg-muted/40 transition-all overflow-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ml-1"
                    aria-label="User menu"
                >
                    {user.imageUrl ? (
                        <img src={user.imageUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <UserCircle className="h-6 w-6 text-muted-foreground" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuLabel className="font-normal p-2">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">{user.fullName}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">{user.primaryEmailAddress?.emailAddress}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />

                {/* Language Submenu */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="p-2 cursor-pointer">
                        <Globe className="mr-2 h-4 w-4" />
                        <span>Language</span>
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-muted-foreground uppercase">{currentLocale}</span>
                        </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {locales.map((loc) => (
                            <DropdownMenuItem key={loc} onClick={() => handleLocaleChange(loc)} className="cursor-pointer">
                                <span className={cn("mr-2 flex h-3.5 w-3.5 items-center justify-center opacity-0", loc === currentLocale && "opacity-100")}>
                                    <Check className="h-3 w-3 text-primary" />
                                </span>
                                {localeLabels[loc]}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem onClick={() => openUserProfile()} className="p-2 cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Manage Account</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem onClick={() => signOut(() => router.push('/'))} className="p-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
