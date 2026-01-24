"use client";

import { useState } from "react";
import { UserResource } from "@clerk/types";
import { UserMetrics } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    Zap
} from "lucide-react";
import CheckoutModal from "./CheckoutModal";
import { SubscriptionTier } from "@/lib/stripe";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import SubscriptionManagerModal from "./SubscriptionManagerModal";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

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
        toast.success("API Key copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            toast.success("Settings saved successfully");
        }, 1000);
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
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account preferences and API access.</p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted border border-border h-10 mb-8">
                    <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground cursor-pointer">General</TabsTrigger>
                    <TabsTrigger value="billing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground cursor-pointer">Billing</TabsTrigger>
                    <TabsTrigger value="api" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground cursor-pointer">API</TabsTrigger>
                </TabsList>

                {/* --- GENERAL TAB --- */}
                <TabsContent value="general" className="space-y-6">
                    {/* Profile Card */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-card-foreground flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-500" /> Profile Information
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">Update your personal details.</CardDescription>
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
                                    <Label className="text-muted-foreground">Full Name</Label>
                                    <Input defaultValue={user.fullName || ""} className="bg-background border-border text-foreground" disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Email Address</Label>
                                    <Input defaultValue={user.primaryEmailAddress?.emailAddress || ""} className="bg-background border-border text-foreground" disabled />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preferences */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-card-foreground flex items-center gap-2">
                                <Laptop className="h-5 w-5 text-emerald-500" /> Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-foreground">Email Notifications</Label>
                                    <p className="text-xs text-muted-foreground">Receive summaries of your extractions.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="h-[1px] bg-border" />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        {theme === 'dark' ? <Moon className="h-4 w-4 text-foreground" /> : <Sun className="h-4 w-4 text-orange-500" />}
                                        <Label className="text-foreground">Appearance Mode</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Switch between dark workstation and light studio themes.</p>
                                </div>
                                <Switch
                                    checked={theme === 'dark'}
                                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]">
                            {isLoading ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                        </Button>
                    </div>
                </TabsContent>

                {/* --- BILLING TAB --- */}
                <TabsContent value="billing" className="space-y-6">
                    {/* Pricing Tiers */}
                    {(!stats.subscription_tier || stats.subscription_tier === 'free') && (
                        <>
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-foreground mb-2">Upgrade Your Plan</h3>
                                <p className="text-sm text-muted-foreground">Choose the plan that best fits your needs</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Free Tier */}
                                <Card className="bg-card border-border">
                                    <CardHeader>
                                        <CardTitle className="text-card-foreground">Free</CardTitle>
                                        <CardDescription className="text-muted-foreground">Perfect for trying out</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-3xl font-bold text-foreground">$0</p>
                                            <p className="text-xs text-muted-foreground">per month</p>
                                        </div>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                500 credits/month
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                Basic extraction
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                CSV & QBO exports
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                Email support
                                            </li>
                                        </ul>
                                        <Button
                                            variant="outline"
                                            className="w-full border-border text-muted-foreground"
                                            disabled
                                        >
                                            Current Plan
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Pro Tier */}
                                <Card className="bg-card border-blue-500/30 relative">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-blue-500 text-white">Popular</Badge>
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-card-foreground">Pro</CardTitle>
                                        <CardDescription className="text-muted-foreground">For professionals</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-3xl font-bold text-foreground">$29</p>
                                            <p className="text-xs text-muted-foreground">per month</p>
                                        </div>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                5,000 credits/month
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                Advanced extraction
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                Priority processing
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                API access
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                Priority support
                                            </li>
                                        </ul>
                                        <Button
                                            variant={currentTier === 'pro' ? 'outline' : 'default'}
                                            className={currentTier === 'pro' ? 'w-full border-border text-muted-foreground' : 'w-full bg-blue-600 hover:bg-blue-500 text-white'}
                                            onClick={() => handleUpgrade('pro')}
                                            disabled={isLoading || currentTier === 'pro'}
                                        >
                                            {currentTier === 'pro' ? 'Current Plan' : (isLoading ? 'Loading...' : 'Upgrade to Pro')}
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Enterprise Tier */}
                                <Card className="bg-card border-border">
                                    <CardHeader>
                                        <CardTitle className="text-card-foreground">Enterprise</CardTitle>
                                        <CardDescription className="text-muted-foreground">For large teams</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-3xl font-bold text-foreground">$99</p>
                                            <p className="text-xs text-muted-foreground">per month</p>
                                        </div>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                Unlimited credits
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                All Pro features
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                Dedicated manager
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                Custom integrations
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                24/7 phone support
                                            </li>
                                        </ul>
                                        <Button
                                            variant={currentTier === 'enterprise' ? 'outline' : 'default'}
                                            className={currentTier === 'enterprise' ? 'w-full border-border text-muted-foreground' : 'w-full bg-purple-600 hover:bg-purple-500 text-white'}
                                            onClick={() => handleUpgrade('enterprise')}
                                            disabled={isLoading || currentTier === 'enterprise'}
                                        >
                                            {currentTier === 'enterprise' ? 'Current Plan' : (isLoading ? 'Loading...' : 'Upgrade to Enterprise')}
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
                                <CreditCard className="h-5 w-5 text-purple-500" /> Current Subscription
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-muted-foreground font-bold uppercase">Current Plan</p>
                                        <h2 className="text-2xl font-bold text-foreground mt-1 capitalize">
                                            {stats.subscription_tier || 'Free'} Tier
                                        </h2>
                                        {stats.subscription_current_period_end && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {stats.subscription_cancel_at_period_end ? "Ends on " : "Renews on "}
                                                {new Date(stats.subscription_current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
                                            ? "Cancels Soon"
                                            : stats.subscription_status === 'active'
                                                ? 'Active'
                                                : stats.subscription_status || 'Inactive'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Usage Stats */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Credits Used</span>
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
                                <p className="text-xs text-muted-foreground">1 Document = 10 Credits</p>
                            </div>

                            {/* Manage Subscription Button */}
                            {stats.stripe_customer_id && (stats.subscription_status === 'active' || stats.subscription_status === 'past_due' || stats.subscription_cancel_at_period_end) && (
                                <Button
                                    variant="outline"
                                    className="w-full border-border text-foreground hover:bg-muted"
                                    onClick={handleManageSubscription}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Loading...' : 'Manage Subscription'}
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
                                <Key className="h-5 w-5 text-orange-500" /> API Access
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">Use this key to authenticate with the BankSplitter API.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Secret Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={apiKey}
                                        readOnly
                                        type="password"
                                        className="bg-muted border-border text-foreground font-mono"
                                    />
                                    <Button variant="outline" onClick={handleCopy} className="border-border hover:bg-muted text-muted-foreground min-w-[100px]">
                                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
                                    </Button>
                                </div>
                                <p className="text-xs text-red-500/80 flex items-center gap-1 mt-2">
                                    <Shield className="h-3 w-3" /> Do not share this key with anyone.
                                </p>
                            </div>

                            <Card className="bg-muted border-border shadow-none">
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                                        <FileJson className="h-4 w-4" /> Usage Example
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
