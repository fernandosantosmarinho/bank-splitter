"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { type UserMetrics } from "@/lib/supabase";
import { getMetrics } from "@/app/actions/metrics";
import {
    FileText,
    Settings,
    Wallet,
    Activity,
    FileSpreadsheet,
    Clock,
    Loader2,
    ShieldCheck,
    Menu,
    Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import ExtractionView from "@/components/ExtractionView";
import SettingsView from "@/components/SettingsView";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { useTranslations } from "next-intl";
import { HeaderActions } from "@/components/header/HeaderActions";

// ... MOCK_HISTORY interface ...
interface HistoryItem {
    name: string;
    time: string;
    size: string;
    downloads: string[];
    rowsExtracted?: number;
    timestamp?: number;
}

const MOCK_HISTORY: HistoryItem[] = [
    { name: "Statement_Jan_2026.pdf", time: "Today, 10:42 AM", size: "1.2 MB", downloads: ["CSV", "QBO"], rowsExtracted: 237, timestamp: Date.now() - 2 * 60 * 60 * 1000 },
    { name: "Amex_Dec_2025_Final.pdf", time: "Yesterday, 4:15 PM", size: "2.4 MB", downloads: ["CSV"], rowsExtracted: 189, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 },
    { name: "Chase_Check_#1024.jpg", time: "Jan 19, 2:30 PM", size: "0.8 MB", downloads: [], rowsExtracted: 1, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 },
    { name: "Invoice_Q4_Consulting.pdf", time: "Jan 18, 9:00 AM", size: "0.5 MB", downloads: ["QBO"], rowsExtracted: 42, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 },
    { name: "Boa_Statement_Nov25.pdf", time: "Jan 15, 11:20 AM", size: "1.8 MB", downloads: ["CSV"], rowsExtracted: 312, timestamp: Date.now() - 9 * 24 * 60 * 60 * 1000 },
    { name: "Receipt_Uber_Trip.png", time: "Jan 12, 8:45 PM", size: "0.4 MB", downloads: [], rowsExtracted: 1, timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000 },
    { name: "WellsFargo_Check_99.jpg", time: "Jan 10, 1:15 PM", size: "0.9 MB", downloads: ["CSV"], rowsExtracted: 1, timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000 },
    { name: "Payroll_Summary_2025.pdf", time: "Jan 05, 10:00 AM", size: "3.1 MB", downloads: ["CSV", "QBO"], rowsExtracted: 156, timestamp: Date.now() - 19 * 24 * 60 * 60 * 1000 }
];

function DashboardContent() {
    const { user, isLoaded: isUserLoaded } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get("tab") || "overview";
    const t = useTranslations('Dashboard');
    const tCommon = useTranslations('Common');
    const tExtraction = useTranslations('Extraction');

    const [stats, setStats] = useState<UserMetrics | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [period, setPeriod] = useState<'7D' | '30D' | '90D' | 'All'>('30D');

    useEffect(() => {
        const stored = localStorage.getItem("processing_history");
        if (stored) {
            setHistory(JSON.parse(stored));
        } else {
            setHistory(MOCK_HISTORY);
            localStorage.setItem("processing_history", JSON.stringify(MOCK_HISTORY));
        }
    }, []);

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
            getMetrics(user.id).then(data => data && setStats(data));
        }
    }, [user]);

    const handleExtractionSuccess = useCallback((file: File, transactionCount: number) => {
        if (user) getMetrics(user.id).then(data => data && setStats(prev => ({ ...prev, ...data })));
        const newItem: HistoryItem = {
            name: file.name,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            size: (file.size / 1024 / 1024).toFixed(1) + " MB",
            downloads: [],
            rowsExtracted: transactionCount,
            timestamp: Date.now()
        };
        setHistory(prev => [newItem, ...prev].slice(0, 50));
    }, [user]);

    const handleDownload = useCallback((type: "CSV" | "QBO", fileName: string) => {
        if (user) getMetrics(user.id).then(data => data && setStats(prev => ({ ...prev, ...data })));
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const latest = { ...updated[0] };
            if (!latest.downloads.includes(type)) {
                latest.downloads = [...latest.downloads, type];
                updated[0] = latest;
            }
            return updated;
        });
    }, [user]);

    const getPeriodMs = (periodKey: '7D' | '30D' | '90D' | 'All') => {
        const day = 24 * 60 * 60 * 1000;
        switch (periodKey) {
            case '7D': return 7 * day;
            case '30D': return 30 * day;
            case '90D': return 90 * day;
            case 'All': return Infinity;
        }
    };

    const filteredHistory = history.filter(item => {
        if (period === 'All' || !item.timestamp) return true;
        return item.timestamp >= Date.now() - getPeriodMs(period);
    });

    const periodStats = {
        documents: filteredHistory.length,
        timeSaved: filteredHistory.length * 0.25,
        csvExports: filteredHistory.reduce((sum, item) => sum + (item.downloads.includes('CSV') ? 1 : 0), 0),
        qboExports: filteredHistory.reduce((sum, item) => sum + (item.downloads.includes('QBO') ? 1 : 0), 0),
    };

    const currentStats: UserMetrics = stats || {
        user_id: user?.id || "",
        documents_processed: 0,
        time_saved_hours: 0,
        success_rate: 99.9,
        credits_total: 5000,
        credits_used: 0,
        csv_exports: 0,
        qbo_exports: 0,
        subscription_tier: 'free',
        subscription_status: 'inactive'
    };

    if (!isUserLoaded || !stats) return <div className="h-screen w-full bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /><span className="ml-2 text-sm text-muted-foreground">{tCommon('loading')}</span></div>;
    if (!user) return null;

    return (
        <div className="flex flex-col h-screen bg-background font-sans text-foreground overflow-hidden">

            {/* --- GLOBAL HEADER (Single Row) --- */}
            <header className="flex flex-col bg-background z-50 shrink-0 border-b border-border/40 relative">

                {/* ROW 1: Logo & Actions */}
                <div className="h-16 flex items-center justify-between px-4 md:px-6">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-3">
                        <div className="md:hidden">
                            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                                <Menu className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => router.push('/dashboard')}>
                            <div className="bg-primary/10 p-1.5 rounded-lg shadow-sm border border-primary/10">
                                <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-foreground hidden md:inline-block">BankSplitter</span>
                        </div>
                    </div>

                    {/* Right: Consolidated Actions */}
                    <HeaderActions userMetrics={currentStats} />
                </div>
            </header>

            {/* --- BODY (Sidebar + Content) --- */}
            <div className="flex flex-1 overflow-hidden relative">

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200" onClick={() => setIsMobileMenuOpen(false)} />
                )}

                <aside className={cn("absolute inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 md:static", isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0")}>
                    <div className="p-6 h-16 border-b border-border flex items-center justify-between md:hidden">
                        <span className="text-lg font-bold tracking-tight">Menu</span>
                        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}><Menu className="h-5 w-5" /></Button>
                    </div>
                    <div className="px-4 py-6 space-y-6 flex-1 overflow-y-auto">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 px-2 tracking-wider">Navigation</p>
                            <nav className="space-y-1">
                                <SidebarItem icon={<Activity className="h-4 w-4" />} label={t('nav.overview')} active={currentTab === "overview"} onClick={() => { router.push("/dashboard?tab=overview"); setIsMobileMenuOpen(false); }} />
                                <SidebarItem icon={<FileSpreadsheet className="h-4 w-4" />} label={t('nav.extract_statement')} active={currentTab === "statements"} onClick={() => { router.push("/dashboard?tab=statements"); setIsMobileMenuOpen(false); }} />
                                <SidebarItem icon={<ShieldCheck className="h-4 w-4" />} label={t('nav.extract_check')} active={currentTab === "checks"} onClick={() => { router.push("/dashboard?tab=checks"); setIsMobileMenuOpen(false); }} />
                            </nav>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 px-2 tracking-wider">Account</p>
                            <nav className="space-y-1">
                                <SidebarItem icon={<Settings className="h-4 w-4" />} label={t('nav.settings')} active={currentTab === "settings"} onClick={() => { router.push("/dashboard?tab=settings"); setIsMobileMenuOpen(false); }} />
                            </nav>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative bg-secondary/5">
                    {currentTab === "overview" && (
                        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-card border border-border rounded-xl p-6 shrink-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                                            <Wallet className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h1 className="text-xl font-bold text-card-foreground">{t('overview.title')}</h1>
                                                <SubscriptionBadge tier={currentStats.subscription_tier} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">{t('overview.subtitle')}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200" onClick={() => router.push("/dashboard?tab=statements")}>
                                        <FileText className="h-4 w-4 mr-2" /> {t('overview.new_extraction')}
                                    </Button>
                                </div>
                                <div className="flex items-center justify-end mb-4">
                                    <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg border border-border">
                                        {(['7D', '30D', '90D', 'All'] as const).map((p) => (
                                            <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1.5 text-xs font-bold rounded transition-all", period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{p}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-muted/50 rounded-lg p-5 border border-border">
                                        <div className="flex items-center justify-between mb-3"><p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" /> {t('overview.documents')}</p><div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center"><FileText className="h-4 w-4 text-blue-500" /></div></div>
                                        <p className="text-3xl font-bold text-foreground tracking-tight mb-1">{periodStats.documents.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">{period === 'All' ? t('overview.period.all_time') : t('overview.period.last_days', { days: period.replace('D', '') })}</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-5 border border-border">
                                        <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-1.5"><p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {t('overview.time_saved')}</p></div><div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center"><Clock className="h-4 w-4 text-emerald-500" /></div></div>
                                        <p className="text-3xl font-bold text-foreground tracking-tight mb-1">{Math.floor(periodStats.timeSaved)}h {Math.round((periodStats.timeSaved % 1) * 60)}m</p>
                                        <p className="text-xs text-muted-foreground">{period === 'All' ? t('overview.period.all_time') : t('overview.period.last_days', { days: period.replace('D', '') })}</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-5 border border-border">
                                        <div className="flex items-center justify-between mb-3"><p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Download className="h-3 w-3" /> {t('overview.exports')}</p><div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center"><Download className="h-4 w-4 text-purple-500" /></div></div>
                                        <p className="text-3xl font-bold text-foreground tracking-tight mb-1">{(periodStats.csvExports + periodStats.qboExports).toLocaleString()}</p>
                                        <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">{period === 'All' ? t('overview.period.all_time') : t('overview.period.last_days', { days: period.replace('D', '') })}</span><span className="text-muted-foreground">·</span><span className="text-emerald-500 font-semibold">CSV {periodStats.csvExports}</span><span className="text-muted-foreground">·</span><span className="text-blue-500 font-semibold">QBO {periodStats.qboExports}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl flex flex-col min-h-[400px]">
                                <div className="p-4 border-b border-border font-bold flex items-center gap-2"><Clock className="h-4 w-4" /> {t('overview.processing_history')}</div>
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 m-4 mb-0 flex gap-3">
                                    <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                    <div><h4 className="text-sm font-semibold text-foreground mb-1">{t('overview.privacy_title')}</h4><p className="text-xs text-muted-foreground">{t('overview.privacy_desc')}</p></div>
                                </div>
                                <div className="flex-1 overflow-auto p-4">
                                    {history.map((item, i) => (
                                        <div key={i} className="p-4 border-b border-border last:border-0 flex justify-between items-center hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-background rounded border border-border"><FileText className="h-4 w-4 text-muted-foreground" /></div>
                                                <div><p className="text-sm font-medium">{item.name}</p><p className="text-[10px] text-muted-foreground">{item.size} • {item.time}</p></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.downloads.map(d => <span key={d} className="text-[10px] px-1.5 py-0.5 bg-secondary rounded border border-border">{d}</span>)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {(currentTab === "statements" || currentTab === "checks") && (
                        <ExtractionView
                            key={currentTab}
                            title={currentTab === "statements" ? tExtraction('titles.extract_statement') : tExtraction('titles.extract_check')}
                            description={currentTab === "statements" ? tExtraction('titles.desc_statement') : tExtraction('titles.desc_check')}
                            mode={currentTab === "statements" ? "pdf" : "image"}
                            onSuccess={handleExtractionSuccess}
                            onDownload={handleDownload}
                        />
                    )}

                    {currentTab === "settings" && <SettingsView user={user} stats={currentStats} />}
                </main>
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group mb-1", active ? "bg-accent text-accent-foreground border border-border shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
            <div className={cn("transition-colors", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>{icon}</div>
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