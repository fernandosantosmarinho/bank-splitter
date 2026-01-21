import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import {
    FileText,
    ScanLine,
    Database,
    ArrowRight,
    Play,
    CheckCircle2,
    TrendingUp,
    Globe,
    Zap
} from "lucide-react";

export default async function Home() {
    const { userId } = await auth();

    return (
        <div className="min-h-screen font-sans text-slate-200">

            {/* NAVBAR */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-600/20">
                            <Database className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">BankSplitter</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {!userId ? (
                            <>
                                <SignInButton mode="modal">
                                    <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <Button size="sm" className="shadow-none">Get Started</Button>
                                </SignUpButton>
                            </>
                        ) : (
                            <Link href="/dashboard">
                                <Button size="sm">Go to Dashboard</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Zap className="h-3 w-3" /> New Engine V2.0 Live
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
                        The Easiest Way to <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Extract & Analyze</span> <br />
                        Financial Data.
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                        Stop wasting hours on manual data entry. BankSplitter uses advanced AI to extract transactions from PDF statements and Check images with 99.9% accuracy.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <SignUpButton mode="modal">
                            <Button size="lg" className="h-14 px-8 text-lg shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                                Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </SignUpButton>
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-white/10 bg-white/5 hover:bg-white/10">
                            <Play className="mr-2 h-5 w-5 fill-current" /> Watch Demo
                        </Button>
                    </div>

                    <div className="mt-20 relative rounded-xl border border-white/10 bg-[#0f172a] shadow-2xl overflow-hidden aspect-video max-w-4xl mx-auto group">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10" />
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <div className="h-20 w-20 bg-blue-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-blue-500/30 group-hover:scale-110 transition-transform duration-500">
                                <Play className="h-8 w-8 text-white ml-1" />
                            </div>
                        </div>
                        {/* Abstract Dashboard Representation */}
                        <div className="p-8 grid grid-cols-3 gap-4 opacity-50 blur-[1px] group-hover:blur-0 transition-all duration-700">
                            <div className="col-span-1 bg-white/5 rounded-lg h-64 border border-white/5" />
                            <div className="col-span-2 flex flex-col gap-4">
                                <div className="h-16 bg-white/5 rounded-lg border border-white/5" />
                                <div className="flex-1 bg-white/5 rounded-lg border border-white/5" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section className="py-24 px-6 relative border-t border-white/5 bg-[#050b14]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">One Platform, Endless Possibilities</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to automate your financial workflow in one place.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={<FileText className="h-6 w-6 text-blue-400" />}
                            title="PDF Extraction"
                            description="Extract transactions from any bank statement PDF instantly."
                        />
                        <FeatureCard
                            icon={<ScanLine className="h-6 w-6 text-purple-400" />}
                            title="Check Scanning"
                            description="Turn check images into structured data with Vision AI."
                        />
                        <FeatureCard
                            icon={<Database className="h-6 w-6 text-emerald-400" />}
                            title="QBO Export"
                            description="Directly export data compatible with QuickBooks Online."
                        />
                        <FeatureCard
                            icon={<TrendingUp className="h-6 w-6 text-pink-400" />}
                            title="Analytics"
                            description="Visualize spending habits and cash flow trends."
                        />
                    </div>
                </div>
            </section>

            {/* TRUST SECTION */}
            <section className="py-24 px-6 border-t border-white/5 bg-[#020617]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">Trusted by accountants worldwide.</h2>
                        <div className="space-y-4">
                            <TrustItem text="Bank-grade encryption (AES-256)." />
                            <TrustItem text="Data never used for model training." />
                            <TrustItem text="99.9% Up-time SLA guarantee." />
                        </div>
                        <Button className="mt-4">See Security Report</Button>
                    </div>

                    <div className="flex-1 w-full relative">
                        <div className="absolute inset-0 bg-blue-600/10 blur-[80px] rounded-full" />
                        <div className="relative bg-[#0f172a] border border-white/5 rounded-2xl p-8 max-w-md mx-auto shadow-2xl">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                                <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                </div>
                                <div>
                                    <div className="text-white font-bold">System Secure</div>
                                    <div className="text-emerald-500 text-sm">Valid Certificate · 2026</div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[90%] bg-emerald-500" />
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Security Score</span>
                                    <span>98/100</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 border-t border-white/5 bg-[#010409]">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-slate-600" />
                        <span className="text-slate-500 font-semibold">BankSplitter © 2026</span>
                    </div>
                    <div className="flex items-center gap-8 text-sm text-slate-500">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: any) {
    return (
        <div className="group p-6 rounded-xl bg-[#0f172a] border border-white/5 hover:border-blue-500/30 transition-all hover:-translate-y-1 duration-300">
            <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center mb-4 group-hover:bg-blue-600/10 group-hover:scale-110 transition-all">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        </div>
    )
}

function TrustItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <span className="text-slate-300">{text}</span>
        </div>
    )
}
