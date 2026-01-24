"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase, type UserMetrics } from "@/lib/supabase";
import { getMetrics } from "@/app/actions/metrics";
import {
    FileText,
    ScanLine,
    Settings,
    Zap,
    CheckCircle2,
    Wallet,
    LayoutGrid,
    MoreVertical,
    Activity,
    FileSpreadsheet,
    Clock,
    HelpCircle,
    Bell,
    Trash2,
    Loader2,
    ShieldCheck,
    Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import ExtractionView from "@/components/ExtractionView";
import SettingsView from "@/components/SettingsView";
import SubscriptionBadge from "@/components/SubscriptionBadge";

const MOCK_HISTORY = [
    { name: "Statement_Jan_2026.pdf", time: "Today, 10:42 AM", size: "1.2 MB", downloads: ["CSV", "QBO"] },
    { name: "Amex_Dec_2025_Final.pdf", time: "Yesterday, 4:15 PM", size: "2.4 MB", downloads: ["CSV"] },
    { name: "Chase_Check_#1024.jpg", time: "Jan 19, 2:30 PM", size: "0.8 MB", downloads: [] },
    { name: "Invoice_Q4_Consulting.pdf", time: "Jan 18, 9:00 AM", size: "0.5 MB", downloads: ["QBO"] },
    { name: "Boa_Statement_Nov25.pdf", time: "Jan 15, 11:20 AM", size: "1.8 MB", downloads: ["CSV"] },
    { name: "Receipt_Uber_Trip.png", time: "Jan 12, 8:45 PM", size: "0.4 MB", downloads: [] },
    { name: "WellsFargo_Check_99.jpg", time: "Jan 10, 1:15 PM", size: "0.9 MB", downloads: ["CSV"] },
    { name: "Payroll_Summary_2025.pdf", time: "Jan 05, 10:00 AM", size: "3.1 MB", downloads: ["CSV", "QBO"] }
];

interface HistoryItem {
    name: string;
    time: string;
    size: string;
    downloads: string[];
}

function DashboardContent() {
    const { user, isLoaded: isUserLoaded } = useUser(); // Renamed isLoaded to isUserLoaded to avoid conflict
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get("tab") || "overview";

    const [stats, setStats] = useState<UserMetrics | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state
    const [isDashboardDataLoaded, setIsDashboardDataLoaded] = useState(false); // New state for dashboard data loading

    // Load history from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("processing_history");
        if (stored) {
            setHistory(JSON.parse(stored));
        } else {
            // Seed with mock data if empty
            setHistory(MOCK_HISTORY);
            localStorage.setItem("processing_history", JSON.stringify(MOCK_HISTORY));
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        if (history.length > 0) {
            localStorage.setItem("processing_history", JSON.stringify(history));
        }
    }, [history]);

    useEffect(() => {
        if (isUserLoaded && !user) {
            router.push("/");
        }
    }, [isUserLoaded, user, router]);

    useEffect(() => {
        if (user) {
            async function fetchMetrics() {
                console.log("[Dashboard] Fetching metrics via Server Action...");
                try {
                    const data = await getMetrics(user!.id);
                    if (data) {
                        console.log("[Dashboard] Metrics fetched:", data);
                        setStats(data);
                    } else {
                        console.warn("[Dashboard] No metrics returned.");
                    }
                } catch (err) {
                    console.error("[Dashboard] Server Action Error:", err);
                }
            }
            fetchMetrics();
        }
    }, [user]);

    const handleExtractionSuccess = useCallback((file: File) => {
        // Refresh metrics
        if (user) {
            getMetrics(user.id).then(data => {
                if (data) setStats(prev => ({ ...prev, ...data }));
            });
        }

        // Add to history
        const newItem: HistoryItem = {
            name: file.name,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            size: (file.size / 1024 / 1024).toFixed(1) + " MB",
            downloads: []
        };

        setHistory(prev => {
            const updated = [newItem, ...prev].slice(0, 50); // Limit to 50 items
            return updated;
        });
    }, [user]);

    const handleDownload = useCallback((type: "CSV" | "QBO", fileName: string) => {
        // Refresh metrics
        if (user) {
            getMetrics(user.id).then(data => {
                if (data) setStats(prev => ({ ...prev, ...data }));
            });
        }

        // Mark download in history
        setHistory(prev => {
            // Find most recent item matching filename (or just the first one if we assume it's the active one)
            // Ideally we match by name.
            // Since filename in history might be original name, and downloaded filename might differ slightly,
            // we should be careful. `fileName` from ExtractionView is `account_name.csv`.
            // While `file.name` is original pdf.
            // Simplified approach: Update the FIRST item in history (the one just processed).
            // This assumes the user downloads immediately after processing.
            if (prev.length === 0) return prev;

            const updated = [...prev];
            const latest = { ...updated[0] }; // Copy top item
            if (!latest.downloads.includes(type)) {
                latest.downloads = [...latest.downloads, type];
                updated[0] = latest;
            }
            return updated;
        });
    }, [user]);

    // Default Fallback
    const currentStats: UserMetrics = stats || {
        user_id: user?.id || "",
        documents_processed: 0,
        time_saved_hours: 0,
        success_rate: 99.9,
        credits_total: 5000,
        credits_used: 0,
        csv_exports: 0,
        qbo_exports: 0
    };

    // Keep the loading screen if User is loading OR initial stats are fetching
    if (!isUserLoaded || !stats) return <div className="h-screen w-full bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

    if (!user) {
        // middleware protects this, but safe fallback
        return null;
    }

    // Helpers for Header
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">

            {/* MOBILE OVERLAY */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 md:translate-x-0 md:static md:flex",
                isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
                <div className="p-6 h-16 border-b border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-1.5 rounded-lg shadow-sm">
                            <Wallet className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-foreground">BankSplitter</span>
                    </div>
                </div>

                <div className="px-6 py-4">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-wider">Navigation</p>
                    <nav className="space-y-1">
                        <Button variant={currentTab === "overview" ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3", currentTab === "overview" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")} onClick={() => { router.push("/dashboard?tab=overview"); setIsMobileMenuOpen(false); }}>
                            <Activity className="h-4 w-4" /> Overview
                        </Button>
                        <Button variant={currentTab === "statements" ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3", currentTab === "statements" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")} onClick={() => { router.push("/dashboard?tab=statements"); setIsMobileMenuOpen(false); }}>
                            <FileSpreadsheet className="h-4 w-4" /> Extract Statement
                        </Button>
                        <Button variant={currentTab === "checks" ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3", currentTab === "checks" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")} onClick={() => { router.push("/dashboard?tab=checks"); setIsMobileMenuOpen(false); }}>
                            <ShieldCheck className="h-4 w-4" /> Extract Check
                        </Button>
                    </nav>
                </div>

                <div className="px-6 py-2">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-wider">Account</p>
                    <nav className="space-y-1">
                        <Button variant={currentTab === "settings" ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3", currentTab === "settings" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")} onClick={() => { router.push("/dashboard?tab=settings"); setIsMobileMenuOpen(false); }}>
                            <Settings className="h-4 w-4" /> Settings
                        </Button>
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-border">
                    {/* Compact User Profile */}
                    <div
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={(e) => {
                            const btn = e.currentTarget.querySelector('button');
                            if (btn && e.target !== btn && !btn.contains(e.target as Node)) {
                                btn.click();
                            }
                        }}
                    >
                        <UserButton afterSignOutUrl="/" appearance={{
                            elements: {
                                avatarBox: "h-8 w-8"
                            }
                        }} />
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-foreground truncate">{user.fullName || user.firstName}</span>
                            <span className="text-xs text-muted-foreground truncate capitalize">{currentStats.subscription_tier || 'Free'} Plan</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden bg-background">

                {/* NEW WORKSTATION HEADER */}
                <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-8">
                    {/* Left: Hamburger & Greeting */}
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                        <div>
                            <h2 className="text-sm font-bold text-foreground tracking-tight">
                                {getGreeting()}, {user.firstName}
                            </h2>
                            <p className="text-xs text-muted-foreground font-medium">
                                {todayDate}
                            </p>
                        </div>
                    </div>

                    {/* Right: Credits, Plan & Top Up */}
                    <div className="flex items-center gap-4">
                        {/* Plan & Credits Container */}
                        <div className="hidden md:flex items-center gap-3 bg-card/50 backdrop-blur-xl border border-border rounded-full px-4 py-1.5 shadow-sm">
                            {/* Plan Pill */}
                            <div className="flex items-center gap-2 pr-3 border-r border-border">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Plan</span>
                                <SubscriptionBadge
                                    tier={currentStats.subscription_tier}
                                    className={cn(
                                        "h-5 px-2 border-0 shadow-sm",
                                        currentStats.subscription_tier === 'pro' ? "bg-blue-500/10 text-blue-500" :
                                            currentStats.subscription_tier === 'enterprise' ? "bg-purple-500/10 text-purple-500" :
                                                "bg-slate-500/10 text-muted-foreground"
                                    )}
                                />
                            </div>

                            {/* Credits Widget */}
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Usage</span>
                                    <span className="text-[11px] font-bold text-foreground font-mono leading-none">
                                        {currentStats.credits_used.toLocaleString()}
                                        <span className="text-muted-foreground mx-1">/</span>
                                        {currentStats.credits_total === 999999 ? '∞' : currentStats.credits_total.toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden border border-border">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-700 ease-out",
                                            currentStats.credits_used > currentStats.credits_total * 0.9
                                                ? "bg-gradient-to-r from-red-600 to-orange-500"
                                                : "bg-gradient-to-r from-blue-600 to-indigo-400"
                                        )}
                                        style={{ width: `${currentStats.credits_total === 999999 ? 0 : Math.min((currentStats.credits_used / currentStats.credits_total) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Top Up Button */}
                        <Button
                            size="sm"
                            onClick={() => router.push("/dashboard?tab=settings&view=billing")}
                            className="h-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-black tracking-widest px-5 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center gap-2 group border border-border"
                        >
                            <Zap className="h-3.5 w-3.5 fill-current group-hover:scale-110 transition-transform" />
                            TOP UP
                        </Button>
                    </div>
                </header>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 relative">
                    {currentTab === "overview" && (
                        <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* OVERVIEW HEADER CARD */}
                            <div className="bg-card border border-border rounded-xl p-6 shrink-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                                            <Wallet className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h1 className="text-xl font-bold text-card-foreground">Workspace Overview</h1>
                                                <SubscriptionBadge tier={currentStats.subscription_tier} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Your extraction analytics at a glance</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200"
                                        onClick={() => router.push("/dashboard?tab=statements")}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        New Extraction
                                    </Button>
                                </div>

                                {/* STATS GRID - 3 Columns */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Documents Processed */}
                                    <div className="bg-muted/50 rounded-lg p-5 border border-border">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                                <FileText className="h-3 w-3" /> Documents
                                            </p>
                                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-bold text-foreground tracking-tight mb-1">{currentStats.documents_processed.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">Total processed</p>
                                    </div>

                                    {/* Time Saved */}
                                    <div className="bg-muted/50 rounded-lg p-5 border border-border">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> Time Saved
                                            </p>
                                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <Clock className="h-4 w-4 text-emerald-500" />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-bold text-foreground tracking-tight mb-1">~{currentStats.time_saved_hours}h</p>
                                        <p className="text-xs text-muted-foreground">Through automation</p>
                                    </div>

                                    {/* Success Rate */}
                                    <div className="bg-muted/50 rounded-lg p-5 border border-border">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Success Rate
                                            </p>
                                            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                                                <CheckCircle2 className="h-4 w-4 text-purple-500" />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-bold text-foreground tracking-tight mb-1">{currentStats.success_rate}%</p>
                                        <p className="text-xs text-muted-foreground">Extraction accuracy</p>
                                    </div>
                                </div>

                                {/* Export Stats - Compact Footer */}
                                <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                                    <div className="flex gap-8">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                            <span className="text-xs text-muted-foreground">CSV:</span>
                                            <span className="text-sm font-bold text-emerald-500">{currentStats.csv_exports}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                            <span className="text-xs text-muted-foreground">QBO:</span>
                                            <span className="text-sm font-bold text-blue-500">{currentStats.qbo_exports}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-slate-500"></div>
                                            <span className="text-xs text-muted-foreground">Total Exports:</span>
                                            <span className="text-sm font-bold text-foreground">{currentStats.csv_exports + currentStats.qbo_exports}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PROCESSING HISTORY (PRIVACY LOG) */}
                            <div className="flex flex-col min-h-[400px] flex-1">
                                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2 shrink-0">
                                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center"><Clock className="h-3 w-3 text-muted-foreground" /></div>
                                    Processing History
                                </h3>
                                <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col flex-1 min-h-0 relative">
                                    <div className="overflow-x-auto">
                                        <div className="grid grid-cols-[minmax(200px,2fr)_minmax(150px,1.5fr)_minmax(140px,1fr)_100px] min-w-[800px] gap-4 px-6 py-3 border-b border-border bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground tracking-wider shrink-0">
                                            <span>File Name</span>
                                            <span>Downloads</span>
                                            <span>Processed At</span>
                                            <span className="text-right">Status</span>
                                        </div>
                                        {/* SCROLLABLE LIST CONTAINER */}
                                        <div className="min-w-[800px]">
                                            {history.map((item, i) => (
                                                <div key={i} className="grid grid-cols-[minmax(200px,2fr)_minmax(150px,1.5fr)_minmax(140px,1fr)_100px] gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors items-center group">
                                                    <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                                                        <div className="p-2 bg-background rounded-lg border border-border text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{item.name}</p>
                                                            <p className="text-[10px] text-muted-foreground">{item.size}</p>
                                                        </div>
                                                    </div>

                                                    {/* DOWNLOADS COLUMN */}
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        {item.downloads.length > 0 ? (
                                                            item.downloads.map((type) => (
                                                                <span
                                                                    key={type}
                                                                    className={cn(
                                                                        "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                                                                        type === "CSV"
                                                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                                            : "bg-blue-600/10 text-blue-500 border-blue-600/20"
                                                                    )}
                                                                >
                                                                    {type}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[10px] text-muted-foreground">-</span>
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-muted-foreground font-mono truncate">
                                                        {item.time}
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded text-[10px] font-bold text-muted-foreground border border-transparent group-hover:border-border whitespace-nowrap">
                                                            <Trash2 className="h-3 w-3" /> DELETED
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="px-6 py-3 bg-muted/30 text-center text-[10px] text-muted-foreground border-t border-border shrink-0">
                                        System automatically wipes all files from memory after extraction.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {(currentTab === "statements" || currentTab === "checks") && (
                        <ExtractionView
                            key={currentTab}
                            title={currentTab === "statements" ? "Bank Statement Extraction" : "Check Scanning"}
                            description={currentTab === "statements" ? "Upload PDF statements to extract transaction data." : "Upload check images for handwriting recognition."}
                            mode={currentTab === "statements" ? "pdf" : "image"}
                            onSuccess={handleExtractionSuccess}
                            onDownload={handleDownload}
                        />
                    )}

                    {currentTab === "settings" && <SettingsView user={user} stats={currentStats} />}
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group mb-1",
                active
                    ? "bg-[#0f172a] text-white border border-white/5 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
        >
            <div className={cn("transition-colors", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")}>
                {icon}
            </div>
            <span>{label}</span>
        </button>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono text-sm">Loading Workspace...</div>}>
            <DashboardContent />
        </Suspense>
    );
}