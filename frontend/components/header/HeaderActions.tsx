"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "./PlanBadge";
import { TopUpButton } from "./TopUpButton";
import { type UserMetrics } from "@/lib/supabase";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { setUserLocale } from '@/app/actions/set-locale';
import { Locale, locales } from '@/i18n/locales';
import {
    Settings,
    Globe,
    LogOut,
    UserCircle,
    Check,
    Loader2,
    Sun,
    Moon
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
    const isFree = !metrics.subscription_tier || metrics.subscription_tier === 'free';

    // Define usage and total based on plan
    const used = metrics.credits_used || 0;
    const total = metrics.credits_total || (isFree ? 5 : 0);

    const percent = total === 999999 ? 0 : Math.min((used / total) * 100, 100);

    const usageLabel = isFree
        ? `${used} / ${total} docs`
        : `${used.toLocaleString()} / ${total === 999999 ? '∞' : total.toLocaleString()}`;

    // Dynamic Color Logic
    let colorClass = "bg-emerald-500";

    if (percent < 60) colorClass = "bg-emerald-500";
    else if (percent < 90) colorClass = "bg-amber-500"; // Orange
    else colorClass = "bg-red-500"; // Red

    // Display string
    const displayString = isFree
        ? `${used} / ${total} docs`
        : `${used} / ${total === 999999 ? '∞' : total}`;

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
                        aria-label={`Usage: ${usageLabel}`}
                    >
                        <div className="flex flex-col gap-0.5 min-w-[60px]">
                            <div className="h-1.5 w-16 bg-muted/80 rounded-full overflow-hidden border border-border/20">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", colorClass)}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-[10px] font-mono font-medium text-muted-foreground whitespace-nowrap">
                            {displayString}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                    {isFree ? "Free documents processed" : "Credits used / Credits available"}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function HeaderUserMenu({ user }: { user: any }) {
    const { signOut, openUserProfile } = useClerk();
    const router = useRouter();
    const t = useTranslations('Dashboard.header.menu');
    const { theme, setTheme } = useTheme();
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const currentLocale = useLocale() as Locale;

    const localeLabels: Record<Locale, string> = {
        en: 'English',
        pt: 'Português',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch'
    };

    const languageFlags: Record<Locale, string> = {
        en: "🇺🇸",
        pt: "🇧🇷",
        es: "🇪🇸",
        fr: "🇫🇷",
        de: "🇩🇪",
    };

    const handleLocaleChange = (newLocale: Locale) => {
        setIsLoading(true);
        startTransition(async () => {
            await setUserLocale(newLocale);
            window.location.reload();
        });
    };

    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-muted-foreground animate-pulse">
                            {t('language')}...
                        </p>
                    </div>
                </div>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full overflow-hidden p-0 ring-2 ring-transparent hover:ring-primary/20 transition-all ml-1">
                        {user.imageUrl ? (
                            <img src={user.imageUrl} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <UserCircle className="h-8 w-8 text-muted-foreground" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-3 rounded-2xl bg-card border-border shadow-2xl" sideOffset={8}>

                    {/* Header Section */}
                    <div className="flex items-center gap-3 p-2 mb-2 relative">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border">
                            {user.imageUrl ? (
                                <img src={user.imageUrl} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <UserCircle className="h-full w-full text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex flex-col overflow-hidden mr-20">
                            <p className="text-sm font-semibold truncate text-foreground">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.primaryEmailAddress?.emailAddress}</p>
                        </div>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={(e) => { e.preventDefault(); setTheme(theme === 'dark' ? 'light' : 'dark'); }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 bg-secondary rounded-full p-1 flex items-center border border-border cursor-pointer hover:bg-secondary/80 transition-colors"
                            aria-label="Toggle theme"
                        >
                            <div className={cn("p-1.5 rounded-full transition-all duration-300", theme === 'light' ? "bg-background shadow-sm text-yellow-500" : "text-muted-foreground")}>
                                <Sun className="h-3.5 w-3.5" />
                            </div>
                            <div className={cn("p-1.5 rounded-full transition-all duration-300", theme === 'dark' ? "bg-slate-700 shadow-sm text-purple-400" : "text-muted-foreground")}>
                                <Moon className="h-3.5 w-3.5" />
                            </div>
                        </button>
                    </div>

                    <div className="h-[1px] bg-border/50 my-1 mx-2" />

                    {/* Menu Items Group */}
                    <div className="space-y-1 mt-2">

                        <DropdownMenuItem onClick={() => openUserProfile()} className="p-3 cursor-pointer rounded-xl hover:bg-muted/50 focus:bg-muted/50 focus:text-foreground group text-muted-foreground hover:text-foreground transition-colors">
                            <Settings className="mr-3 h-5 w-5 text-blue-500 group-hover:scale-105 transition-transform" />
                            <span className="font-medium">{t('manage_account')}</span>
                        </DropdownMenuItem>

                        {/* Language Dropdown */}
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="p-3 cursor-pointer rounded-xl hover:bg-muted/50 focus:bg-muted/50 focus:text-foreground group text-muted-foreground hover:text-foreground transition-colors">
                                <Globe className="mr-3 h-5 w-5 text-blue-500 group-hover:scale-105 transition-transform" />
                                <span className="font-medium">{t('language')}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-card border-border p-2 rounded-xl shadow-xl min-w-[180px]">
                                {locales.map((loc) => (
                                    <DropdownMenuItem key={loc} onClick={() => handleLocaleChange(loc)} className="cursor-pointer rounded-lg p-2.5 hover:bg-muted">
                                        <span className={cn("mr-2 flex h-3.5 w-3.5 items-center justify-center transition-opacity", loc === currentLocale ? "opacity-100" : "opacity-0")}>
                                            <Check className="h-3 w-3 text-primary" />
                                        </span>
                                        <span className="mr-2 text-base leading-none">{languageFlags[loc]}</span>
                                        <span className="font-medium">{localeLabels[loc]}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                    </div>

                    <div className="h-[1px] bg-border/50 my-2 mx-2" />

                    <DropdownMenuItem onClick={() => signOut({ redirectUrl: process.env.NEXT_PUBLIC_APP_URL || '/' })} className="p-3 cursor-pointer rounded-xl hover:bg-red-500/10 focus:bg-red-500/10 text-red-500 focus:text-red-500 group mt-1">
                        <LogOut className="mr-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        <span className="font-medium">{t('sign_out')}</span>
                    </DropdownMenuItem>

                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
