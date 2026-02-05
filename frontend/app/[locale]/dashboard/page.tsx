"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { useEffect, Suspense, useState, useCallback, useRef } from "react";
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
    Download,
    Terminal,
    Banknote
} from "lucide-react";
import { cn, getFileIcon } from "@/lib/utils";
import ExtractionView from "@/components/ExtractionView";
import SettingsView from "@/components/SettingsView";
import DeveloperSettingsView from "@/components/DeveloperSettingsView";
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
//... MOCK_HISTORY content...


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
    const [isNavigating, setIsNavigating] = useState(false);
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const key = `processing_history_${user.id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            setHistory(JSON.parse(stored));
        } else {
            setHistory([]);
        }
    }, [user]);

    useEffect(() => {
        if (!user || history.length === 0) return;
        const key = `processing_history_${user.id}`;
        localStorage.setItem(key, JSON.stringify(history));
    }, [history, user]);

    useEffect(() => {
        if (isUserLoaded && !user) {
            router.push("/");
        }
    }, [isUserLoaded, user, router]);

    const loginTracked = useRef(false);

    useEffect(() => {
        if (user) {
            getMetrics(user.id).then(data => data && setStats(data));

            // ANALYTICS: Track Login
            if (!loginTracked.current) {
                sendGAEvent('event', 'login', { method: 'clerk' });
                loginTracked.current = true;
            }
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

    const handleNavigation = useCallback((tab: string) => {
        setIsNavigating(true);
        setNavigatingTo(tab);
        router.push(`/dashboard?tab=${tab}`);
        setIsMobileMenuOpen(false);
    }, [router]);

    // Reset loading state when navigation completes
    useEffect(() => {
        setIsNavigating(false);
        setNavigatingTo(null);
    }, [searchParams]);

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
        credits_total: 5,
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
            {/* Top Progress Bar */}
            {isNavigating && <TopProgressBar />}

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
                            <span className="text-lg font-bold tracking-tight text-foreground hidden md:inline-block">BankToBook</span>
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

                <aside className={cn("absolute top-0 left-0 z-50 w-72 bg-card/50 backdrop-blur-xl border-r border-border flex flex-col transition-transform duration-300 md:static pt-4 md:pt-8 pb-4 md:pb-6 h-full", isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0")}>
                    <div className="p-6 h-16 border-b border-border flex items-center justify-between md:hidden bg-card">
                        <span className="text-lg font-bold tracking-tight">Menu</span>
                        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}><Menu className="h-5 w-5" /></Button>
                    </div>

                    <div className="flex-1 px-4 md:px-6 py-6 space-y-8 overflow-y-auto">
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest px-3">{t('nav.navigation_title')}</p>
                            <nav className="space-y-2">
                                <SidebarItem icon={<Activity className="h-5 w-5" />} label={t('nav.overview')} active={currentTab === "overview"} isLoading={navigatingTo === "overview"} onClick={() => handleNavigation("overview")} />
                                <SidebarItem icon={<FileSpreadsheet className="h-5 w-5" />} label={t('nav.extract_statement')} active={currentTab === "statements"} isLoading={navigatingTo === "statements"} onClick={() => handleNavigation("statements")} />
                                <SidebarItem icon={<Banknote className="h-5 w-5" />} label={t('nav.extract_check')} active={currentTab === "checks"} isLoading={navigatingTo === "checks"} onClick={() => handleNavigation("checks")} />
                            </nav>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest px-3">{t('nav.account_title')}</p>
                            <nav className="space-y-2">
                                <SidebarItem icon={<Terminal className="h-5 w-5" />} label="Developer API" active={currentTab === "developer"} isLoading={navigatingTo === "developer"} onClick={() => handleNavigation("developer")} />
                                <SidebarItem icon={<Settings className="h-5 w-5" />} label={t('nav.settings')} active={currentTab === "settings"} isLoading={navigatingTo === "settings"} onClick={() => handleNavigation("settings")} />
                            </nav>
                        </div>
                    </div>
                </aside>

                <main className={cn("flex-1 overflow-x-hidden relative bg-secondary/5 p-4 md:p-8", ["overview", "statements", "checks"].includes(currentTab) ? "overflow-y-hidden flex flex-col" : "overflow-y-auto")}>
                    {currentTab === "overview" && (
                        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full flex-1 flex flex-col min-h-0">
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

                            <div className="bg-card border border-border rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-border font-bold flex items-center gap-2"><Clock className="h-4 w-4" /> {t('overview.processing_history')}</div>
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 m-4 mb-0 flex gap-3 shrink-0">
                                    <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                    <div><h4 className="text-sm font-semibold text-foreground mb-1">{t('overview.privacy_title')}</h4><p className="text-xs text-muted-foreground">{t('overview.privacy_desc')}</p></div>
                                </div>

                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-4 shrink-0">
                                    <div className="col-span-4">{t('overview.history_cols.file_name')}</div>
                                    <div className="col-span-2 text-center">{t('overview.history_cols.rows_extracted')}</div>
                                    <div className="col-span-2 text-center">{t('overview.history_cols.downloads')}</div>
                                    <div className="col-span-2 text-center">{t('overview.history_cols.processed_at')}</div>
                                    <div className="col-span-2 text-right">{t('overview.history_cols.privacy')}</div>
                                </div>

                                <div className="flex-1 overflow-auto">
                                    {history.map((item, i) => (
                                        <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-muted/40 transition-colors items-center">
                                            {/* Col 1: File Info */}
                                            <div className="col-span-4 flex items-center gap-3 overflow-hidden">
                                                <img
                                                    src={getFileIcon(item.name)}
                                                    alt="File Icon"
                                                    className="h-8 w-8 object-contain shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate text-foreground">{item.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{item.size}</p>
                                                </div>
                                            </div>

                                            {/* Col 2: Rows */}
                                            <div className="col-span-2 text-center">
                                                <span className="text-xs font-medium bg-muted/50 px-2 py-1 rounded text-foreground">{item.rowsExtracted ? item.rowsExtracted.toLocaleString() : '-'}</span>
                                            </div>

                                            {/* Col 3: Downloads */}
                                            <div className="col-span-2 flex items-center justify-center gap-2">
                                                {item.downloads.length > 0 ? (
                                                    item.downloads.map((d) => (
                                                        <span key={d} className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", d === 'CSV' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20")}>
                                                            {d}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground">-</span>
                                                )}
                                            </div>

                                            {/* Col 4: Processed At */}
                                            <div className="col-span-2 text-xs text-muted-foreground font-medium text-center">
                                                {item.time}
                                            </div>

                                            {/* Col 5: Privacy */}
                                            <div className="col-span-2 flex justify-end">
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-full border border-border/50">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{t('overview.not_stored')}</span>
                                                </div>
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
                            userMetrics={currentStats}
                        />
                    )}

                    {currentTab === "settings" && <SettingsView user={user} stats={currentStats} />}
                    {currentTab === "developer" && <DeveloperSettingsView />}
                </main>
            </div>
        </div>
    );
}

function TopProgressBar() {
    return (
        <div className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-[100] overflow-hidden">
            <div className="h-full bg-primary animate-progress-bar" />
        </div>
    );
}

function SidebarItem({ icon, label, active, isLoading, onClick }: { icon: React.ReactNode, label: string, active: boolean, isLoading?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group relative overflow-hidden",
                active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                isLoading && "opacity-70 cursor-wait"
            )}
        >
            <div className={cn("transition-colors relative z-10", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
            </div>
            <span className="relative z-10">{label}</span>
            {active && <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90 opacity-100 z-0" />}
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