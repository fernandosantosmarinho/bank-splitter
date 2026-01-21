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
import {
    User,
    Mail,
    Shield,
    CreditCard,
    Bell,
    Moon,
    Laptop,
    Key,
    Copy,
    Check,
    FileJson,
    Save,
    Zap
} from "lucide-react";

interface SettingsViewProps {
    user: UserResource;
    stats: UserMetrics;
}

export default function SettingsView({ user, stats }: SettingsViewProps) {
    const [apiKey, setApiKey] = useState("sk_live_51M..." + Math.random().toString(36).substring(7));
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
                <p className="text-slate-400 mt-1">Manage your account preferences and API access.</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 bg-[#0f172a] border border-white/5 h-10 mb-8">
                    <TabsTrigger value="general" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white text-slate-400">General</TabsTrigger>
                    <TabsTrigger value="billing" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white text-slate-400">Billing</TabsTrigger>
                    <TabsTrigger value="api" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white text-slate-400">API</TabsTrigger>
                </TabsList>

                {/* --- GENERAL TAB --- */}
                <TabsContent value="general" className="space-y-6">
                    {/* Profile Card */}
                    <Card className="bg-[#0b1221] border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-500" /> Profile Information
                            </CardTitle>
                            <CardDescription className="text-slate-400">Update your personal details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-[#0f172a] rounded-lg border border-white/5">
                                <img src={user.imageUrl} alt="Avatar" className="h-16 w-16 rounded-full border-2 border-slate-700" />
                                <div>
                                    <h3 className="font-bold text-white text-lg">{user.fullName}</h3>
                                    <p className="text-sm text-slate-400">{user.primaryEmailAddress?.emailAddress}</p>
                                    <Badge variant="outline" className="mt-2 border-blue-500/30 text-blue-400 bg-blue-500/10">PRO PLAN</Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Full Name</Label>
                                    <Input defaultValue={user.fullName || ""} className="bg-[#020617] border-white/10 text-white" disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Email Address</Label>
                                    <Input defaultValue={user.primaryEmailAddress?.emailAddress || ""} className="bg-[#020617] border-white/10 text-white" disabled />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preferences */}
                    <Card className="bg-[#0b1221] border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Laptop className="h-5 w-5 text-emerald-500" /> Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-white">Email Notifications</Label>
                                    <p className="text-xs text-slate-500">Receive summaries of your extractions.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="h-[1px] bg-white/5" />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-white">Dark Mode</Label>
                                    <p className="text-xs text-slate-500">Always on for Pro users.</p>
                                </div>
                                <Switch defaultChecked disabled />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-[#0b1221] border-white/5">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-purple-500" /> Subscription
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-slate-400 font-bold uppercase">Current Plan</p>
                                            <h2 className="text-2xl font-bold text-white mt-1">Pro Tier</h2>
                                            <p className="text-xs text-slate-500 mt-2">Renews on Feb 21, 2026</p>
                                        </div>
                                        <Badge className="bg-purple-500 text-white hover:bg-purple-600">Active</Badge>
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:bg-white/5">Manage Subscription</Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#0b1221] border-white/5">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-yellow-500" /> Usage Limits
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Credits Used</span>
                                        <span className="text-white font-mono">{stats.credits_used} / {stats.credits_total}</span>
                                    </div>
                                    <div className="h-2 w-full bg-[#0f172a] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-500"
                                            style={{ width: `${Math.min((stats.credits_used / stats.credits_total) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">1 Document = 10 Credits</p>
                                </div>
                                <Button className="w-full bg-[#0f172a] text-blue-400 hover:text-blue-300 hover:bg-[#1e293b] border border-blue-500/20">
                                    Purchase More Credits
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- API TAB --- */}
                <TabsContent value="api" className="space-y-6">
                    <Card className="bg-[#0b1221] border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Key className="h-5 w-5 text-orange-500" /> API Access
                            </CardTitle>
                            <CardDescription className="text-slate-400">Use this key to authenticate with the BankSplitter API.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Secret Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={apiKey}
                                        readOnly
                                        type="password"
                                        className="bg-[#020617] border-white/10 text-slate-400 font-mono"
                                    />
                                    <Button variant="outline" onClick={handleCopy} className="border-white/10 hover:bg-white/5 text-slate-300 min-w-[100px]">
                                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
                                    </Button>
                                </div>
                                <p className="text-xs text-red-400/80 flex items-center gap-1 mt-2">
                                    <Shield className="h-3 w-3" /> Do not share this key with anyone.
                                </p>
                            </div>

                            <Card className="bg-[#0f172a] border-white/5">
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                                        <FileJson className="h-4 w-4" /> Usage Example
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 font-mono text-xs text-slate-400">
                                    <p>curl -X POST https://api.banksplitter.com/v1/extract \</p>
                                    <p className="pl-4">-H "Authorization: Bearer <span className="text-orange-400">{apiKey.substring(0, 10)}...</span>" \</p>
                                    <p className="pl-4">-F "file=@statement.pdf"</p>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
