"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    FileText,
    Image as ImageIcon,
    Wallet,
    FileSpreadsheet,
    ScanLine,
    ArrowUpRight,
    ShieldCheck,
    Trash2,
    Activity,
    Zap,
    LayoutDashboard,
    Settings
} from "lucide-react";
import { Card } from "@/components/ui/card";
import ExtractionView from "@/components/ExtractionView";

import { UserButton } from "@clerk/nextjs";

import { useRouter, useSearchParams } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get("tab") || "overview";

    const handleTabChange = (tab: string) => {
        // Optional: Use router.push to create history entry so back button works
        // If tab is overview, maybe verify if we want to remove the query param or keep it explicitly
        // router.push(tab === "overview" ? "/dashboard" : `/dashboard?tab=${tab}`);
        // However, since we are on app/page.tsx which is '/' route but inside the dashboard logic:
        // Actually, middleware redirects '/' -> '/dashboard', but we disabled that?.
        // Let's assume the user is at the current path.
        // Using '?' works relative to current path.

        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FC] flex font-sans text-slate-900">

            {/* --- SIDEBAR (Menu Simplificado) --- */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-900 p-1.5 rounded-lg">
                            <Wallet className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900">BankSplitter</span>
                    </div>
                </div>

                {/* Navigation - Apenas Overview e Settings */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    <SidebarItem
                        icon={<LayoutDashboard size={18} />}
                        label="Overview"
                        active={currentTab === "overview"}
                        onClick={() => handleTabChange("overview")}
                    />
                    <SidebarItem
                        icon={<FileText size={18} />}
                        label="Extract"
                        active={currentTab === "extract"}
                        onClick={() => handleTabChange("extract")}
                    />
                    <SidebarItem
                        icon={<ScanLine size={18} />}
                        label="Extract Check"
                        active={currentTab === "extract-check"}
                        onClick={() => handleTabChange("extract-check")}
                    />
                    <SidebarItem
                        icon={<Settings size={18} />}
                        label="Settings"
                        active={currentTab === "settings"}
                        onClick={() => handleTabChange("settings")}
                    />
                </nav>

                {/* Usage Card (Footer da Sidebar) */}
                <div className="p-4 border-t border-slate-100">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-800 uppercase mb-1">Pro Plan</h4>
                        <div className="flex justify-between items-end mb-2">
                            <p className="text-xs text-blue-600">Credits used</p>
                            <p className="text-xs font-bold text-blue-700">450/500</p>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-1.5 mb-3">
                            <div className="bg-blue-600 h-1.5 rounded-full w-[90%]" />
                        </div>
                        <button className="text-[10px] font-bold text-blue-700 hover:text-blue-900 hover:underline transition-colors cursor-pointer">
                            Upgrade Plan
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-64 flex flex-col min-h-screen">

                {/* TOP BAR */}
                <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
                    <h2 className="text-sm font-medium text-slate-500">
                        Dashboard / <span className="text-slate-900 font-semibold capitalize">{currentTab.replace("-", " ")}</span>
                    </h2>
                    {/* User Button (Clerk) */}
                    <div className="flex items-center">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </header>

                {/* CONTENT AREA */}
                <div className="p-8 max-w-6xl mx-auto w-full space-y-10">

                    {/* Renderização Condicional das Abas */}
                    {currentTab === "overview" && (
                        <>
                            {/* WELCOME SECTION */}
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold text-slate-900">Secure Processing Engine</h1>
                                <p className="text-slate-500">Select an input method. Data is permanently deleted after processing.</p>
                            </div>

                            {/* ACTION CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ActionCard
                                    title="Bank Statements"
                                    description="Process multi-page PDF statements into clean CSV/Excel files."
                                    icon={<FileText className="h-6 w-6 text-blue-600" />}
                                    subIcon={<FileSpreadsheet className="h-12 w-12 text-slate-200 group-hover:text-blue-100 transition-colors" />}
                                    color="blue"
                                    onClick={() => handleTabChange("extract")}
                                />
                                <ActionCard
                                    title="Check Images"
                                    description="Extract payee, date, and amount from photos or scans of checks."
                                    icon={<ScanLine className="h-6 w-6 text-emerald-600" />}
                                    subIcon={<ImageIcon className="h-12 w-12 text-slate-200 group-hover:text-emerald-100 transition-colors" />}
                                    color="emerald"
                                    onClick={() => handleTabChange("extract-check")}
                                />
                            </div>

                            {/* PRIVACY & METRICS SECTION */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* 1. Privacy Guarantee Card */}
                                <Card className="bg-slate-900 text-white p-6 rounded-xl flex flex-col justify-between border-slate-800 shadow-xl lg:col-span-1 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />

                                    <div>
                                        <div className="bg-white/10 w-fit p-2 rounded-lg mb-4">
                                            <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-2">Zero-Retention Policy</h3>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            We do not store your documents. All files are automatically shredded immediately upon download or session timeout.
                                        </p>
                                    </div>

                                    <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                        <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                                        System Secure
                                    </div>
                                </Card>

                                {/* 2. Value Metrics */}
                                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <Card className="p-6 border-slate-200 flex flex-col justify-center bg-white shadow-sm">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-amber-50 rounded-lg">
                                                <Zap className="h-4 w-4 text-amber-500" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Time Saved</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-900">
                                            ~12<span className="text-lg text-slate-400 font-medium ml-1">hours</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Estimated manual data entry time saved this month based on your usage.
                                        </p>
                                    </Card>

                                    <Card className="p-6 border-slate-200 flex flex-col justify-center bg-white shadow-sm">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-indigo-50 rounded-lg">
                                                <Activity className="h-4 w-4 text-indigo-500" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Usage</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-900">
                                            90<span className="text-lg text-slate-400 font-medium ml-1">%</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Of your monthly credits used. Resets in 14 days.
                                        </p>
                                    </Card>
                                </div>
                            </div>

                            {/* Disclaimer Footer */}
                            <div className="flex justify-center pt-8 opacity-40 hover:opacity-100 transition-opacity cursor-help">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <Trash2 className="h-3 w-3" />
                                    <span>Files are processed in memory and never written to disk storage.</span>
                                </div>
                            </div>
                        </>
                    )}

                    {currentTab === "extract" && (
                        <ExtractionView
                            title="Bank Statements"
                            description="Process multi-page PDF statements into clean CSV/Excel files."
                            mode="pdf"
                        />
                    )}

                    {currentTab === "extract-check" && (
                        <ExtractionView
                            title="Check Extraction"
                            description="Extract payee, date, and amount from photos or scans of checks."
                            mode="image"
                        />
                    )}

                    {currentTab === "settings" && (
                        /* --- SETTINGS PLACEHOLDER --- */
                        <div className="max-w-2xl">
                            <h1 className="text-2xl font-bold text-slate-900 mb-6">Account Settings</h1>
                            <Card className="p-8 text-center border-dashed border-2 border-slate-200 bg-slate-50">
                                <p className="text-slate-500">Settings panel content goes here.</p>
                                <p className="text-xs text-slate-400 mt-2">API Keys, Billing, and Export Preferences.</p>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// --- SUBCOMPONENTS ---

function SidebarItem({ icon, label, active = false, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 cursor-pointer ${active
                ? "bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
        >
            <div className={`${active ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"}`}>
                {icon}
            </div>
            {label}
        </button>
    );
}

function ActionCard({ title, description, icon, subIcon, color, onClick }: any) {
    const isBlue = color === "blue";
    return (
        <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <button
                onClick={onClick}
                className={`group relative w-full text-left h-full bg-white border rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer ${isBlue ? "border-slate-200 hover:border-blue-300" : "border-slate-200 hover:border-emerald-300"
                    }`}
            >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${isBlue ? "from-blue-50/50 via-transparent to-transparent" : "from-emerald-50/50 via-transparent to-transparent"
                    }`} />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 rounded-xl border bg-white shadow-sm">
                            {icon}
                        </div>
                        <div className="opacity-10 transform rotate-12 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
                            {subIcon}
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8">{description}</p>
                    <div className={`mt-auto flex items-center gap-1 text-sm font-bold ${isBlue ? "text-blue-600" : "text-emerald-600"}`}>
                        Start Extraction <ArrowUpRight className="h-4 w-4" />
                    </div>
                </div>
            </button>
        </motion.div>
    );
}
