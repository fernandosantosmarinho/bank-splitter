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
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import ExtractionView from "@/components/ExtractionView";
import SettingsView from "@/components/SettingsView";

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
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get("tab") || "overview";

    const [stats, setStats] = useState<UserMetrics | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);

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
        if (isLoaded && !user) {
            router.push("/");
        }
    }, [isLoaded, user, router]);

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

    if (!isLoaded) return <div className="h-screen w-full bg-[#020617] flex items-center justify-center"><Loader2 className="h-8 w-8 text-blue-500 animate-spin" /></div>;

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
        <div className="flex h-screen bg-[#020617] font-sans text-slate-200 overflow-hidden">

            {/* SIDEBAR */}
            <aside className="w-64 bg-[#050b14] border-r border-white/5 flex flex-col z-20">
                <div className="p-6 h-16 border-b border-white/5 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-sm">
                        <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white">BankSplitter</span>
                </div>

                <div className="px-6 py-4">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Navigation</p>
                    <nav className="space-y-1">
                        <Button variant={currentTab === "overview" ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3", currentTab === "overview" ? "bg-[#1e293b] text-white" : "text-slate-400 hover:text-white hover:bg-white/5")} onClick={() => router.push("/dashboard?tab=overview")}>
                            <Activity className="h-4 w-4" /> Overview
                        </Button>
                        <Button variant={currentTab === "statements" ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3", currentTab === "statements" ? "bg-[#1e293b] text-white" : "text-slate-400 hover:text-white hover:bg-white/5")} onClick={() => router.push("/dashboard?tab=statements")}>
                            <FileSpreadsheet className="h-4 w-4" /> Extract Statement
                        </Button>
                        <Button variant={currentTab === "checks" ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3", currentTab === "checks" ? "bg-[#1e293b] text-white" : "text-slate-400 hover:text-white hover:bg-white/5")} onClick={() => router.push("/dashboard?tab=checks")}>
                            <ShieldCheck className="h-4 w-4" /> Extract Check
                        </Button>
                    </nav>
                </div>

                <div className="px-6 py-2">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Account</p>
                    <nav className="space-y-1">
                        <Button variant={currentTab === "settings" ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3", currentTab === "settings" ? "bg-[#1e293b] text-white" : "text-slate-400 hover:text-white hover:bg-white/5")} onClick={() => router.push("/dashboard?tab=settings")}>
                            <Settings className="h-4 w-4" /> Settings
                        </Button>
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-white/5">
                    {/* Compact User Profile */}
                    <div
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
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
                            <span className="text-sm font-medium text-white truncate">{user.fullName || user.firstName}</span>
                            <span className="text-xs text-slate-500 truncate">Pro Plan</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden bg-[#020617]">

                {/* NEW WORKSTATION HEADER */}
                <header className="h-16 border-b border-white/5 bg-[#020617] flex items-center justify-between px-8">
                    {/* Left: Greeting & Date */}
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-tight">
                            {getGreeting()}, {user.firstName}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {todayDate}
                        </p>
                    </div>

                    {/* Right: Credits, Help, Notifs */}
                    <div className="flex items-center gap-6">
                        {/* Credits Badge */}
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-[#0f172a] border border-white/5 rounded-full">
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full animate-pulse", currentStats.credits_used > currentStats.credits_total * 0.9 ? "bg-red-500" : "bg-emerald-500")} />
                                <span className="text-xs font-bold text-slate-300">{currentStats.credits_used.toLocaleString()} <span className="text-slate-600">/</span> {currentStats.credits_total.toLocaleString()} Credits</span>
                            </div>
                            <div className="h-3 w-[1px] bg-white/10" />
                            <span className="text-[10px] font-bold text-blue-500 cursor-pointer hover:underline">TOP UP</span>
                        </div>

                        <div className="h-5 w-[1px] bg-white/5" />

                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5 h-8 w-8">
                            <HelpCircle className="h-4 w-4" />
                        </Button>

                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5 h-8 w-8 relative">
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-red-500 rounded-full border border-[#020617]" />
                        </Button>
                    </div>
                </header>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-hidden p-6 relative">
                    {currentTab === "overview" && (
                        <div className="h-full flex flex-col gap-6 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* OVERVIEW HEADER CARD */}
                            <div className="bg-[#0b1221] border border-white/5 rounded-xl p-6 shrink-0">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
                                            <Wallet className="h-6 w-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <h1 className="text-xl font-bold text-white">Workspace Overview</h1>
                                            <p className="text-xs text-slate-500">Financial Data Extraction</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-2">
                                            <Zap className="h-3 w-3" /> V2 Engine Active
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2"><MoreVertical className="h-4 w-4 text-slate-400" /></Button>
                                    </div>
                                </div>

                                {/* STATS ROW */}
                                <div className="grid grid-cols-3 gap-8 mb-8 border-b border-white/5 pb-8">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1"><FileText className="h-3 w-3" /> DOCUMENTS PROCESSED</p>
                                        <p className="text-2xl font-bold text-white tracking-tight">{currentStats.documents_processed.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> TIME SAVED (HOURS)</p>
                                        <p className="text-2xl font-bold text-white tracking-tight">~{currentStats.time_saved_hours}h</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> SUCCESS RATE</p>
                                        <p className="text-2xl font-bold text-white tracking-tight">{currentStats.success_rate}%</p>
                                    </div>
                                </div>

                                {/* SUB STATS GRID */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#0f172a] rounded-lg p-4 border border-white/5">
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">TOTAL CREDITS</p>
                                        <p className="text-white font-semibold">{currentStats.credits_total.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-[#0f172a] rounded-lg p-4 border border-white/5">
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">CREDITS USED</p>
                                        <p className="text-white font-semibold">{currentStats.credits_used.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col md:flex-row gap-6 justify-between items-center border-t border-white/5 pt-6">
                                    <div className="flex gap-8 w-full md:w-auto">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-400">CSV Exports:</span>
                                            <span className="text-sm font-bold text-emerald-400">{currentStats.csv_exports}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-400">QBO Exports:</span>
                                            <span className="text-sm font-bold text-blue-400">{currentStats.qbo_exports}</span>
                                        </div>
                                    </div>
                                    <Button size="sm" className="w-full md:w-auto bg-[#0f172a] border border-white/10 hover:bg-white/5 text-blue-400 h-9" onClick={() => router.push("/dashboard?tab=statements")}>New Extraction</Button>
                                </div>
                            </div>

                            {/* PROCESSING HISTORY (PRIVACY LOG) */}
                            <div className="flex-1 min-h-0 flex flex-col">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 shrink-0">
                                    <div className="h-5 w-5 rounded-full bg-slate-700 flex items-center justify-center"><Clock className="h-3 w-3" /></div>
                                    Processing History
                                </h3>
                                <div className="bg-[#0b1221] border border-white/5 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
                                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-white/5 bg-[#0f172a] text-[10px] uppercase font-bold text-slate-500 tracking-wider shrink-0">
                                        <span>File Name</span>
                                        <span className="w-24">Downloads</span>
                                        <span className="w-32">Processed At</span>
                                        <span className="text-right w-20">Status</span>
                                    </div>
                                    {/* SCROLLABLE LIST CONTAINER */}
                                    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                                        {history.map((item, i) => (
                                            <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-[#0f172a] transition-colors items-center group">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-[#020617] rounded-lg border border-white/5 text-slate-400 group-hover:text-blue-500 transition-colors">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{item.name}</p>
                                                        <p className="text-[10px] text-slate-500">{item.size}</p>
                                                    </div>
                                                </div>

                                                {/* DOWNLOADS COLUMN */}
                                                <div className="w-24 flex items-center gap-1">
                                                    {item.downloads.length > 0 ? (
                                                        item.downloads.map((type) => (
                                                            <span
                                                                key={type}
                                                                className={cn(
                                                                    "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                                                                    type === "CSV"
                                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                                        : "bg-blue-600/10 text-blue-400 border-blue-600/20"
                                                                )}
                                                            >
                                                                {type}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-slate-600">-</span>
                                                    )}
                                                </div>

                                                <div className="text-xs text-slate-400 font-mono w-32">
                                                    {item.time}
                                                </div>
                                                <div className="flex justify-end w-20">
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded text-[10px] font-bold text-slate-400 border border-transparent group-hover:border-slate-700">
                                                        <Trash2 className="h-3 w-3" /> DELETED
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-6 py-3 bg-[#0f172a]/50 text-center text-[10px] text-slate-500 border-t border-white/5 shrink-0">
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
        <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-500 font-mono text-sm">Loading Workspace...</div>}>
            <DashboardContent />
        </Suspense>
    );
}