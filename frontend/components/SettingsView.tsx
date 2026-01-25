"use client";

import { useState, useTransition } from "react";
import { UserResource } from "@clerk/types";
import { UserMetrics } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
    User,
    Mail,
    Shield,
    CreditCard,
    Bell,
    Moon,
    Sun,
    Laptop,
    Key,
    Copy,
    Check,
    FileJson,
    Save,
    Zap,
    Globe
} from "lucide-react";
import CheckoutModal from "./CheckoutModal";
import { SubscriptionTier } from "@/lib/stripe";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import SubscriptionManagerModal from "./SubscriptionManagerModal";
import LanguageSelector from "./LanguageSelector";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Locale, locales } from "@/i18n/locales";
import { setUserLocale } from '@/app/actions/set-locale';

interface SettingsViewProps {
    user: UserResource;
    stats: UserMetrics;
}

export default function SettingsView({ user, stats }: SettingsViewProps) {
    const { theme, setTheme } = useTheme();
    const [apiKey, setApiKey] = useState("sk_live_51M..." + Math.random().toString(36).substring(7));
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isSubscriptionManagerOpen, setIsSubscriptionManagerOpen] = useState(false);
    const [checkoutTier, setCheckoutTier] = useState<SubscriptionTier>('pro');

    const searchParams = useSearchParams();
    const router = useRouter(); // Import useRouter
    const initialTab = searchParams.get('view') || 'general';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Translation Hooks
    const t = useTranslations('Settings');
    const tCommon = useTranslations('Common');
    const locale = useLocale() as Locale;

    // Sync state with URL param
    useEffect(() => {
        const view = searchParams.get('view');
        if (view) {
            setActiveTab(view);
        }
    }, [searchParams]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        // Update URL without full reload
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



    const handleUpgrade = (tier: 'pro' | 'enterprise') => {
        setCheckoutTier(tier);
        setIsCheckoutOpen(true);
    };

    const handleManageSubscription = () => {
        setIsSubscriptionManagerOpen(true);
    };

    // Helper to get current tier
    const currentTier = (stats.subscription_tier || 'free') as 'free' | 'pro' | 'enterprise';

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('title')}</h1>
                <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted border border-border h-10 mb-8">
                    <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground cursor-pointer">{t('tabs.general')}</TabsTrigger>
                    <TabsTrigger value="billing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground cursor-pointer">{t('tabs.billing')}</TabsTrigger>
                    <TabsTrigger value="api" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground cursor-pointer">{t('tabs.api')}</TabsTrigger>
                </TabsList>

                {/* --- GENERAL TAB --- */}
                <TabsContent value="general" className="space-y-6">
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

                {/* --- BILLING TAB --- */}
                <TabsContent value="billing" className="space-y-6">
                    {/* Pricing Tiers */}
                    {(!stats.subscription_tier || stats.subscription_tier === 'free') && (
                        <>
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-foreground mb-2">{t('billing.upgrade_title')}</h3>
                                <p className="text-sm text-muted-foreground">{t('billing.upgrade_subtitle')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Free Tier */}
                                <Card className="bg-card border-border">
                                    <CardHeader>
                                        <CardTitle className="text-card-foreground">{tCommon('plan_free')}</CardTitle>
                                        <CardDescription className="text-muted-foreground">{t('billing.perfect_for_trying')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-3xl font-bold text-foreground">$0</p>
                                            <p className="text-xs text-muted-foreground">{t('billing.per_month')}</p>
                                        </div>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.credits_500')}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.basic_extraction')}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.csv_qbo')}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.email_support')}
                                            </li>
                                        </ul>
                                        <Button
                                            variant="outline"
                                            className="w-full border-border text-muted-foreground"
                                            disabled
                                        >
                                            {t('billing.current_plan')}
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Pro Tier */}
                                <Card className="bg-card border-blue-500/30 relative">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-blue-500 text-white">{t('billing.popular')}</Badge>
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-card-foreground">{tCommon('plan_pro')}</CardTitle>
                                        <CardDescription className="text-muted-foreground">{t('billing.for_professionals')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-3xl font-bold text-foreground">$29</p>
                                            <p className="text-xs text-muted-foreground">{t('billing.per_month')}</p>
                                        </div>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.credits_5000')}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.advanced_extraction')}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.priority_processing')}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.api_access')}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.priority_support')}
                                            </li>
                                        </ul>
                                        <Button
                                            variant={currentTier === 'pro' ? 'outline' : 'default'}
                                            className={currentTier === 'pro' ? 'w-full border-border text-muted-foreground' : 'w-full bg-blue-600 hover:bg-blue-500 text-white'}
                                            onClick={() => handleUpgrade('pro')}
                                            disabled={isLoading || currentTier === 'pro'}
                                        >
                                            {currentTier === 'pro' ? t('billing.current_plan') : (isLoading ? tCommon('loading') : t('billing.upgrade_to', { tier: 'Pro' }))}
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Enterprise Tier */}
                                <Card className="bg-card border-border">
                                    <CardHeader>
                                        <CardTitle className="text-card-foreground">{tCommon('plan_enterprise')}</CardTitle>
                                        <CardDescription className="text-muted-foreground">{t('billing.for_teams')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-3xl font-bold text-foreground">$99</p>
                                            <p className="text-xs text-muted-foreground">{t('billing.per_month')}</p>
                                        </div>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.credits_unlimited')}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.all_pro')}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.dedicated_manager')}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.custom_integrations')}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                {t('billing.features.phone_support')}
                                            </li>
                                        </ul>
                                        <Button
                                            variant={currentTier === 'enterprise' ? 'outline' : 'default'}
                                            className={currentTier === 'enterprise' ? 'w-full border-border text-muted-foreground' : 'w-full bg-purple-600 hover:bg-purple-500 text-white'}
                                            onClick={() => handleUpgrade('enterprise')}
                                            disabled={isLoading || currentTier === 'enterprise'}
                                        >
                                            {currentTier === 'enterprise' ? t('billing.current_plan') : (isLoading ? tCommon('loading') : t('billing.upgrade_to', { tier: 'Enterprise' }))}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}

                    {/* Current Subscription Status */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-card-foreground flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-purple-500" /> {t('billing.current_subscription')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-muted-foreground font-bold uppercase">{t('billing.current_plan')}</p>
                                        <h2 className="text-2xl font-bold text-foreground mt-1 capitalize">
                                            {t('billing.current_tier', { tier: stats.subscription_tier || 'Free' })}
                                        </h2>
                                        {stats.subscription_current_period_end && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {stats.subscription_cancel_at_period_end ? t('billing.ends_on', { date: new Date(stats.subscription_current_period_end).toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' }) }) : t('billing.renews_on', { date: new Date(stats.subscription_current_period_end).toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' }) })}
                                            </p>
                                        )}
                                    </div>
                                    <Badge className={
                                        stats.subscription_status === 'active' && !stats.subscription_cancel_at_period_end
                                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                            : stats.subscription_status === 'active' && stats.subscription_cancel_at_period_end
                                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                                : stats.subscription_status === 'past_due'
                                                    ? "bg-red-500 text-white hover:bg-red-600"
                                                    : "bg-slate-500 text-white hover:bg-slate-600"
                                    }>
                                        {stats.subscription_status === 'active' && stats.subscription_cancel_at_period_end
                                            ? t('billing.cancels_soon')
                                            : stats.subscription_status === 'active'
                                                ? t('billing.active')
                                                : stats.subscription_status || 'Inactive'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Usage Stats */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('billing.credits_used')}</span>
                                    <span className="text-foreground font-mono">
                                        {stats.credits_used} / {stats.credits_total === 999999 ? '∞' : stats.credits_total}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-500"
                                        style={{ width: `${stats.credits_total === 999999 ? 0 : Math.min((stats.credits_used / stats.credits_total) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">{t('billing.credits_info')}</p>
                            </div>

                            {/* Manage Subscription Button */}
                            {stats.stripe_customer_id && stats.subscription_tier !== 'free' && (
                                <Button
                                    variant="outline"
                                    className="w-full border-border text-foreground hover:bg-muted"
                                    onClick={handleManageSubscription}
                                    disabled={isLoading}
                                >
                                    {isLoading ? tCommon('loading') : t('billing.manage_subscription')}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- API TAB --- */}
                <TabsContent value="api" className="space-y-6">
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
                                    <p>curl -X POST https://api.banksplitter.com/v1/extract \</p>
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
                email={user.primaryEmailAddress?.emailAddress}
            />

            <SubscriptionManagerModal
                isOpen={isSubscriptionManagerOpen}
                onClose={() => setIsSubscriptionManagerOpen(false)}
            />
        </div >
    );
}
