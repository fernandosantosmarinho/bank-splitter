"use client";

import { useState, useEffect } from "react";
import { UserResource } from "@clerk/types";
import { UserMetrics } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
    User,
    Shield,
    Key,
    Copy,
    Check,
    FileJson,
    Laptop,
    Globe,
    Moon,
    Sun
} from "lucide-react";
import CheckoutModal from "./CheckoutModal";
import { SubscriptionTier } from "@/lib/stripe";
import SubscriptionManagerModal from "./SubscriptionManagerModal";
import LanguageSelector from "./LanguageSelector";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Locale } from "@/i18n/locales";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { useWelcomeOffer } from "@/hooks/useWelcomeOffer";

// New Billing Components
import BillingHeader from "./billing/BillingHeader";
import PricingToggle from "./billing/PricingToggle";
import PricingCard from "./billing/PricingCard";
import CurrentSubscriptionCard from "./billing/CurrentSubscriptionCard";


interface SettingsViewProps {
    user: UserResource;
    stats: UserMetrics;
}

export default function SettingsView({ user, stats }: SettingsViewProps) {
    const { theme, setTheme } = useTheme();
    const [apiKey, setApiKey] = useState("sk_live_51M..." + Math.random().toString(36).substring(7));
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Checkout & Modals
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isSubscriptionManagerOpen, setIsSubscriptionManagerOpen] = useState(false);
    const [checkoutTier, setCheckoutTier] = useState<SubscriptionTier>('pro');

    // Billing State
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    const searchParams = useSearchParams();
    const router = useRouter();
    const initialTab = searchParams.get('view') || 'general';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Translation Hooks
    const t = useTranslations('Settings');
    const tCommon = useTranslations('Common');
    const tBilling = useTranslations('BillingNew');
    const locale = useLocale() as Locale;

    // Use centralized hook for offer state
    const offer = useWelcomeOffer(
        stats?.account_created_at,
        stats?.welcome_offer_used
    );

    // Sync state with URL param
    useEffect(() => {
        const view = searchParams.get('view');
        if (view) {
            setActiveTab(view);
        }
    }, [searchParams]);

    // Handle Stripe Checkout success/cancel callbacks
    useEffect(() => {
        const success = searchParams.get('success');
        const canceled = searchParams.get('canceled');

        if (success === 'true') {
            toast.success('Subscription upgrade successful! Your new plan is now active.');
            // Reload metrics to reflect new subscription
            if (user?.id) {
                window.location.href = '/dashboard?tab=settings&view=billing'; // Clean URL
            }
        } else if (canceled === 'true') {
            toast.info('Checkout canceled. You can upgrade anytime from the Billing tab.');
            // Clean URL
            window.history.replaceState({}, '', '/dashboard?tab=settings&view=billing');
        }
    }, [searchParams, user]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('view', val);
        window.history.pushState({}, '', newUrl.toString());
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        toast.success(t('toasts.copied'));
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUpgrade = (tier: string) => {
        if (tier === 'free') return; // Can't "upgrade" to free

        // Open the embedded checkout modal
        setCheckoutTier(tier as SubscriptionTier);
        setIsCheckoutOpen(true);
    };

    const handleManageSubscription = () => {
        setIsSubscriptionManagerOpen(true);
    };

    // Helper to get current tier
    const currentTier = (stats.subscription_tier || 'free') as string;

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('title')}</h1>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="border-b border-border w-full mb-4">
                    <TabsList className="flex w-full max-w-none bg-transparent h-12 p-0 justify-between items-center">
                        <TabsTrigger
                            value="general"
                            className="flex-1 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 text-muted-foreground data-[state=active]:text-foreground font-medium transition-all"
                        >
                            {t('tabs.general')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="billing"
                            className="flex-1 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 text-muted-foreground data-[state=active]:text-foreground font-medium transition-all"
                        >
                            {t('tabs.billing')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="api"
                            className="flex-1 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 text-muted-foreground data-[state=active]:text-foreground font-medium transition-all"
                        >
                            {t('tabs.api')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* --- GENERAL TAB --- */}
                <TabsContent value="general" className="space-y-6 w-full">
                    {/* Profile Card */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-card-foreground flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-500" /> {t('general.profile.title')}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">{t('general.profile.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border">
                                <img src={user.imageUrl} alt="Avatar" className="h-16 w-16 rounded-full border-2 border-slate-700" />
                                <div>
                                    <h3 className="font-bold text-foreground text-lg">{user.fullName}</h3>
                                    <p className="text-sm text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
                                    <div className="mt-2">
                                        <SubscriptionBadge tier={stats.subscription_tier} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">{t('general.profile.label_name')}</Label>
                                    <Input defaultValue={user.fullName || ""} className="bg-background border-border text-foreground" disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">{t('general.profile.label_email')}</Label>
                                    <Input defaultValue={user.primaryEmailAddress?.emailAddress || ""} className="bg-background border-border text-foreground" disabled />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preferences */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-card-foreground flex items-center gap-2">
                                <Laptop className="h-5 w-5 text-emerald-500" /> {t('general.preferences.title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        <Label className="text-foreground">{t('general.preferences.language')}</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{t('general.preferences.language_desc')}</p>
                                </div>
                                <LanguageSelector />
                            </div>
                            <div className="h-[1px] bg-border" />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        {theme === 'dark' ? <Moon className="h-4 w-4 text-foreground" /> : <Sun className="h-4 w-4 text-orange-500" />}
                                        <Label className="text-foreground">{t('general.preferences.appearance')}</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{t('general.preferences.appearance_desc')}</p>
                                </div>
                                <Switch
                                    checked={theme === 'dark'}
                                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- BILLING TAB (REFECTORED) --- */}
                {/* --- BILLING TAB (REFECTORED) --- */}
                <TabsContent value="billing" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

                    {/* Welcome Offer Banner - Slim & Integrated */}
                    <BillingHeader userMetrics={stats} />

                    {/* Pricing Section */}
                    <div id="pricing-section" className="space-y-2">

                        {(!stats.subscription_tier || stats.subscription_tier === 'free') && (
                            <div className="mb-4 mt-6">
                                <PricingToggle
                                    billingPeriod={billingPeriod}
                                    onToggle={setBillingPeriod}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 scroll-mt-20">
                            <PricingCard
                                plan="free"
                                billingPeriod={billingPeriod}
                                userMetrics={stats}
                                currentPlan={currentTier}
                                isLoading={isLoading}
                                onUpgrade={handleUpgrade}
                            />
                            <PricingCard
                                plan="starter"
                                billingPeriod={billingPeriod}
                                userMetrics={stats}
                                currentPlan={currentTier}
                                isLoading={isLoading}
                                onUpgrade={handleUpgrade}
                            />
                            <PricingCard
                                plan="pro"
                                billingPeriod={billingPeriod}
                                userMetrics={stats}
                                currentPlan={currentTier}
                                isLoading={isLoading}
                                onUpgrade={handleUpgrade}
                            />
                        </div>
                    </div>

                    {/* Current Subscription Status & Usage */}
                    <CurrentSubscriptionCard
                        userMetrics={stats}
                        onManage={handleManageSubscription}
                        isLoading={isLoading}
                    />
                </TabsContent>

                {/* --- API TAB --- */}
                <TabsContent value="api" className="space-y-6 w-full">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-card-foreground flex items-center gap-2">
                                <Key className="h-5 w-5 text-orange-500" /> {t('api.title')}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">{t('api.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">{t('api.secret_key')}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={apiKey}
                                        readOnly
                                        type="password"
                                        className="bg-muted border-border text-foreground font-mono"
                                    />
                                    <Button variant="outline" onClick={handleCopy} className="border-border hover:bg-muted text-muted-foreground min-w-[100px]">
                                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <><Copy className="h-4 w-4 mr-2" /> {t('api.copy')}</>}
                                    </Button>
                                </div>
                                <p className="text-xs text-red-500/80 flex items-center gap-1 mt-2">
                                    <Shield className="h-3 w-3" /> {t('api.warning')}
                                </p>
                            </div>

                            <Card className="bg-muted border-border shadow-none">
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                                        <FileJson className="h-4 w-4" /> {t('api.usage_example')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 font-mono text-xs text-muted-foreground">
                                    <p>curl -X POST https://api.banktobook.com/v1/extract \</p>
                                    <p className="pl-4">-H "Authorization: Bearer <span className="text-orange-500">{apiKey.substring(0, 10)}...</span>" \</p>
                                    <p className="pl-4">-F "file=@statement.pdf"</p>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                tier={checkoutTier}
                billingPeriod={billingPeriod}
                isPromoActive={offer.isActive}
                price={(function () {
                    if (checkoutTier === 'free') return 0;
                    const basePrices = {
                        starter: { monthly: 15, yearly: 144 },
                        pro: { monthly: 49, yearly: 468 },
                        business: { monthly: 149, yearly: 1428 }
                    };
                    const promoPrices = {
                        starter: { monthly: 9, yearly: 86.40 },
                        pro: { monthly: 29, yearly: 276 },
                        business: { monthly: 79, yearly: 756 }
                    };
                    const usePromo = offer.isActive;
                    const prices = usePromo ? promoPrices : basePrices;
                    // @ts-ignore
                    const p = prices[checkoutTier];
                    return p ? p[billingPeriod] : 0;
                })()}
                email={user.primaryEmailAddress?.emailAddress}
            />

            <SubscriptionManagerModal
                isOpen={isSubscriptionManagerOpen}
                onClose={() => setIsSubscriptionManagerOpen(false)}
            />
        </div >
    );
}
