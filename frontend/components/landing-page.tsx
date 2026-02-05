"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { motion, useTransform, useMotionValue, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
    ArrowRight,
    Play,
    CheckCircle2,
    Zap,
    Globe,
    Shield,
    UploadCloud,
    FileSpreadsheet,
    Terminal,
    Lock,
    Workflow,
    Cpu,
    Check,
    X,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

// --- Types ---
interface LandingPageProps {
    userId: string | null;
}

type Translator = (key: string) => string;

// --- Main Component ---
export function LandingPage({ userId }: LandingPageProps) {
    const t = useTranslations("Landing");

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 overflow-x-hidden font-sans">
            <Navbar userId={userId} t={t} />
            <Hero sectionT={t} />
            <SocialProof sectionT={t} />
            <Features sectionT={t} />
            <DeveloperAPI sectionT={t} />
            <HowItWorks sectionT={t} />
            <Pricing sectionT={t} />
            <FAQ sectionT={t} />
            <CTA sectionT={t} />
            <Footer sectionT={t} />
        </div>
    );
}

// --- Sections ---

function Navbar({ userId, t }: { userId: string | null, t: Translator }) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                scrolled ? "bg-black/50 backdrop-blur-xl border-white/5" : "bg-transparent border-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="relative bg-gradient-to-tr from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all group-hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]">
                        <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Zap className="h-5 w-5 text-white fill-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-100 transition-colors">BankToBook</span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                    <Link href="#features" className="hover:text-white transition-colors">{t("Navbar.features")}</Link>
                    <Link href="#how-it-works" className="hover:text-white transition-colors">{t("Navbar.how_it_works")}</Link>
                    <Link href="#pricing" className="hover:text-white transition-colors">{t("Navbar.pricing")}</Link>
                </div>

                <div className="flex items-center gap-4">
                    {!userId ? (
                        <>
                            <SignInButton mode="modal">
                                <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-zinc-300 hover:text-white hover:bg-white/5">
                                    {t("Navbar.signin")}
                                </Button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <Button size="sm" className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] font-semibold transition-transform hover:scale-105">
                                    {t("Navbar.get_started")}
                                </Button>
                            </SignUpButton>
                        </>
                    ) : (
                        <Link href="/dashboard">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-transform hover:scale-105">
                                {t("Navbar.dashboard")}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}

function Hero({ sectionT }: { sectionT: Translator }) {
    const t = (key: string) => sectionT(`Hero.${key}`);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Typewriter State
    const words = [
        { text: ".CSV", color: "text-emerald-500" },
        { text: ".QBO", color: "text-blue-500" }
    ];
    const [textIndex, setTextIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);

    // Typewriter Logic
    useEffect(() => {
        if (subIndex === words[textIndex].text.length + 1 && !reverse) {
            // Finished typing word, wait 1.2s then reverse
            const timeout = setTimeout(() => setReverse(true), 2000);
            return () => clearTimeout(timeout);
        }

        if (subIndex === 0 && reverse) {
            // Finished deleting, move to next word
            setReverse(false);
            setTextIndex((prev) => (prev + 1) % words.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, reverse ? 50 : 200); // Typing speed: 100ms, Deleting: 50ms

        return () => clearTimeout(timeout);
    }, [subIndex, reverse, textIndex]); // Removed 'words' dependency

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const x = (clientX - left) / width - 0.5;
        const y = (clientY - top) / height - 0.5;
        mouseX.set(x);
        mouseY.set(y);
    }

    return (
        <section className="relative pt-32 pb-20 px-6 min-h-screen flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505]" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="max-w-5xl mx-auto text-center relative z-10 px-4">
                {/* Badge */}
                {t("new_engine_badge") && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md"
                    >
                        <Zap className="h-3 w-3 fill-current" /> {t("new_engine_badge")}
                    </motion.div>
                )}

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold tracking-normal text-white mb-8 leading-tight"
                >
                    <span className="[word-spacing:12px]">{t("headline_part1")}</span> <br className="hidden md:block" />
                    <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1 gap-y-1">
                        {/* Fixed Width Container for Typewriter */}
                        <span className="inline-flex items-baseline justify-start w-[100px] md:w-[180px] whitespace-nowrap">
                            <span className={cn("font-bold", words[textIndex].color)}>
                                {words[textIndex].text.substring(0, subIndex) || "\u00A0"}
                            </span>
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
                                className="w-1 h-10 md:h-14 bg-white ml-1 inline-block shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]"
                            />
                        </span>
                        <span>{t("headline_part2")}</span>
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    {t("subheadline")}
                </motion.p>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <SignUpButton mode="modal">
                        <Button size="lg" className="h-14 px-8 text-base bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-blue-400/20 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(37,99,235,0.6)]">
                            {t("cta_primary")} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </SignUpButton>
                    <Button variant="outline" size="lg" className="h-14 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white backdrop-blur-sm rounded-full transition-all hover:scale-105">
                        <Play className="mr-2 h-4 w-4 fill-current" /> {t("cta_secondary")}
                    </Button>
                </motion.div>

                {/* 3D Tilt Container */}
                <TiltContainer mouseX={mouseX} mouseY={mouseY} onMouseMove={handleMouseMove} sectionT={sectionT} />
            </div>
        </section>
    );
}

function TiltContainer({ mouseX, mouseY, onMouseMove, sectionT }: { mouseX: any, mouseY: any, onMouseMove: any, sectionT: Translator }) {
    const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

    return (
        <motion.div
            style={{ rotateX, rotateY, perspective: 1200 }}
            className="mt-20 relative perspective-1200 group w-full"
            onMouseMove={onMouseMove}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
        >
            <div className="relative rounded-2xl bg-[#0A0A0A] border border-white/10 shadow-2xl overflow-hidden max-w-5xl mx-auto aspect-[16/9] md:aspect-[2/1] transition-transform duration-200 ease-out">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10 opacity-40 text-left group-hover:opacity-70 transition-opacity duration-700" />

                {/* UI: Browser Header */}
                <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                </div>

                {/* UI: Content */}
                <div className="p-6 grid grid-cols-2 gap-6 h-full relative z-10">
                    {/* Source PDF */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group/scan">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <FileSpreadsheet className="w-4 h-4" /> STATEMENT_2024.pdf
                            </div>
                        </div>
                        <div className="space-y-3 opacity-50">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-2 w-full bg-zinc-800 rounded-sm" />
                            ))}
                        </div>
                        {/* Scanning Beam */}
                        <motion.div
                            className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-blue-500/20 to-transparent z-10 border-t border-blue-500/50"
                            animate={{ top: ['-10%', '110%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                    </div>

                    {/* Extracted Data */}
                    <div className="bg-blue-900/[0.05] border border-blue-500/20 rounded-xl p-4 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[10px]">
                                QUICKBOOKS READY
                            </Badge>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-3 text-xs font-mono">
                                    <div className="w-16 h-4 bg-blue-500/20 rounded-sm" />
                                    <div className="flex-1 h-4 bg-blue-500/10 rounded-sm" />
                                    <div className="w-12 h-4 bg-emerald-500/20 rounded-sm" />
                                </div>
                            ))}
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-center">
                            <p className="text-emerald-400 text-xs font-mono font-bold tracking-wide">
                                {sectionT("Hero.mockup_accuracy")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function SocialProof({ sectionT }: { sectionT: Translator }) {
    const t = (key: string) => sectionT(`SocialProof.${key}`);
    const brands = ["Vertex", "Orbit", "Catalog", "Layer", "Sisyphus", "Circool", "Quotient", "Hourglass"];

    return (
        <section className="py-12 border-y border-white/5 bg-black/40 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 text-center mb-8">
                <p className="text-xs text-gray-500 font-medium tracking-widest uppercase">{t("trusted_by")}</p>
            </div>

            <div className="relative flex overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />

                <motion.div
                    className="flex gap-24 min-w-full shrink-0 items-center justify-around px-12 text-zinc-600 fill-zinc-600"
                    animate={{ x: ["0%", "-100%"] }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                >
                    {[...brands, ...brands].map((brand, i) => (
                        <span key={i} className="text-xl font-bold font-sans opacity-50 hover:opacity-100 hover:text-white transition-all duration-300 cursor-default">
                            {brand}
                        </span>
                    ))}
                </motion.div>
            </div>

            <div className="text-center mt-10">
                <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400/90 text-[10px] tracking-wide px-3 py-1">
                    <CheckCircle2 className="w-3 h-3 mr-1.5" /> {t("stat_transactions")}
                </Badge>
            </div>
        </section>
    );
}

function Features({ sectionT }: { sectionT: Translator }) {
    const t = (key: string) => sectionT(`Features.${key}`);

    const cardClass = "group relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-white/[0.05] to-transparent p-8 hover:border-white/30 transition-all duration-500";

    return (
        <section id="features" className="py-32 px-6 relative bg-[#050505]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold text-white mb-6"
                    >
                        {t("title")}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-300 text-lg max-w-2xl mx-auto"
                    >
                        {t("subtitle")}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
                    {/* Card 1: Speed */}
                    <div className={cn(cardClass, "md:col-span-2 md:row-span-2")}>
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                            <Zap className="w-32 h-32 text-blue-500" />
                        </div>
                        <div className="h-full flex flex-col relative z-10">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400 border border-blue-500/20">
                                <Zap className="h-6 w-6" />
                            </div>
                            <h3 className="text-3xl font-bold tracking-normal text-white mb-4">{t("card_speed_title")}</h3>
                            <p className="text-gray-300 text-lg max-w-md">{t("card_speed_desc")}</p>

                            <div className="mt-auto">
                                <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
                                    <span>PROCESSING TIME</span>
                                    <span className="text-blue-400">0.15s</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
                                        initial={{ width: "0%" }}
                                        whileInView={{ width: "92%" }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Global */}
                    <div className={cardClass}>
                        <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400 border border-purple-500/20">
                            <Globe className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold tracking-normal text-white mb-3">{t("card_global_title")}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{t("card_global_desc")}</p>
                    </div>

                    {/* Card 3: Formats */}
                    <div className={cardClass}>
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 border border-emerald-500/20">
                            <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold tracking-normal text-white mb-3">{t("card_format_title")}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed mb-6">{t("card_format_desc")}</p>
                        <div className="flex flex-wrap gap-2">
                            {['CSV', 'QBO', 'OFX', 'XLSX'].map(f => (
                                <Badge key={f} variant="outline" className="border-white/10 text-gray-400 text-[10px]">
                                    {f}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Card 4: AI */}
                    <div className={cn(cardClass, "md:col-span-3 flex flex-col md:flex-row items-center gap-8")}>
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold mb-6 border border-indigo-500/20">
                                <Shield className="h-3 w-3" /> {t("card_ai_security")}
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">{t("card_ai_title")}</h3>
                            <p className="text-gray-300 text-lg max-w-xl">{t("card_ai_desc")}</p>
                        </div>
                        <div className="flex-1 w-full relative h-48 md:h-full bg-black/50 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,transparent,black)]" />
                            <Shield className="w-24 h-24 text-white/5" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function HowItWorks({ sectionT }: { sectionT: Translator }) {
    const t = (key: string) => sectionT(`HowItWorks.${key}`);
    const steps = [
        { title: t("step1_title"), desc: t("step1_desc"), icon: UploadCloud, id: 1 },
        { title: t("step2_title"), desc: t("step2_desc"), icon: Cpu, id: 2 },
        { title: t("step3_title"), desc: t("step3_desc"), icon: FileSpreadsheet, id: 3 },
    ];

    return (
        <section id="how-it-works" className="py-24 px-6 relative border-t border-white/5 bg-[#050505]">
            <div className="max-w-7xl mx-auto">
                <div className="mb-24 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{t("title")}</h2>
                </div>

                <div className="relative">
                    {/* Central Vertical Dashed Line */}
                    <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px border-l-2 border-dashed border-white/20" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 max-w-5xl mx-auto">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: false, margin: "-100px" }}
                                transition={{ duration: 0.8, delay: i * 0.4, ease: "easeOut" }}
                                className="flex flex-col items-center text-center relative z-10"
                            >
                                <div className="relative mb-8 group">
                                    <div className="w-28 h-28 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-lg group-hover:border-blue-500/30 group-hover:bg-blue-500/5 transition-all duration-500">
                                        <step.icon className="h-10 w-10 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#050505] border border-white/10 rounded-full px-3 py-1 text-xs font-mono text-gray-500">
                                        STEP 0{step.id}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-gray-300 text-sm leading-relaxed max-w-[250px]">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

function Pricing({ sectionT }: { sectionT: Translator }) {
    const t = (key: string) => sectionT(`Pricing.${key}`);
    const [isYearly, setIsYearly] = useState(false);

    return (
        <section id="pricing" className="py-32 px-6 relative bg-[#050505] overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-blue-900/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8"
                    >
                        {t("welcome_offer")}
                    </motion.div>

                    <h2 className="text-3xl md:text-5xl font-bold tracking-normal text-white mb-6">{t("title")}</h2>
                    <p className="text-gray-300 text-lg">{t("subtitle")}</p>

                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={cn("text-sm transition-colors", !isYearly ? "text-white font-medium" : "text-gray-400")}>{t("monthly")}</span>
                        <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-blue-600" />
                        <span className={cn("text-sm flex items-center gap-2 transition-colors", isYearly ? "text-white font-medium" : "text-gray-400")}>
                            {t("yearly")}
                            <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] px-1.5 py-0.5 h-5">-40%</Badge>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
                    {/* Free Plan */}
                    <PricingCard
                        title={t("cards.free_title")}
                        price={t("cards.free_price")}
                        description={t("cards.free_desc")}
                        features={[t("cards.free_feat_1"), t("cards.free_feat_2"), t("cards.free_feat_3")]}
                        buttonText={t("cards.free_cta")} // "Sign Up Free"
                        buttonVariant="outline"
                        t={t}
                    />

                    {/* Starter Plan */}
                    <PricingCard
                        title={t("cards.starter_title")}
                        price={isYearly ? t("cards.starter_price_yearly") : t("cards.starter_price_discount")}
                        originalPrice={!isYearly ? t("cards.starter_price_original") : undefined}
                        description={t("cards.starter_desc")}
                        features={[t("cards.starter_feat_1"), t("cards.starter_feat_2"), t("cards.starter_feat_3")]}
                        buttonText={isYearly ? t("cards.cta_starter_yearly") : t("cards.paid_cta")}
                        buttonVariant="glow"
                        isPopular
                        mostPopularText={t("most_popular")}
                        highlightedPrice
                        t={t}
                        billingCycle={isYearly ? "yearly" : "monthly"}
                        yearlySubtext={t("cards.billed_starter_yearly")}
                    />

                    {/* Pro Plan (Highlighted) */}
                    <PricingCard
                        title={t("cards.pro_title")}
                        price={isYearly ? t("cards.pro_price_yearly") : t("cards.pro_price_discount")}
                        originalPrice={!isYearly ? t("cards.pro_price_original") : undefined}
                        description={t("cards.pro_desc")}
                        features={[t("cards.pro_feat_1"), t("cards.pro_feat_2"), t("cards.pro_feat_3"), t("cards.pro_feat_4")]}
                        buttonText={isYearly ? t("cards.cta_pro_yearly") : t("cards.paid_cta")}
                        buttonVariant="primary"
                        highlightedPrice
                        t={t}
                        billingCycle={isYearly ? "yearly" : "monthly"}
                        yearlySubtext={t("cards.billed_pro_yearly")}
                    />
                </div>
            </div>
        </section>
    )
}

function PricingCard({
    title, price, originalPrice, description, features, buttonText, buttonVariant, isPopular, mostPopularText, highlightedPrice, t, billingCycle = "monthly", yearlySubtext
}: {
    title: string, price: string, originalPrice?: string, description: string, features: string[], buttonText: string, buttonVariant: "outline" | "primary" | "glow", isPopular?: boolean, mostPopularText?: string, highlightedPrice?: boolean, t: Translator, billingCycle?: "monthly" | "yearly", yearlySubtext?: string
}) {
    const isPro = buttonVariant === "glow";

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "relative p-8 rounded-3xl border flex flex-col h-full transition-all duration-300",
                isPro
                    ? "bg-black border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.15)] ring-1 ring-blue-500/50"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
            )}
        >
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-xl border border-blue-400">
                    {mostPopularText}
                </div>
            )}

            <div className="mb-8">
                <h3 className={cn("text-lg font-medium mb-2", isPro ? "text-blue-400" : "text-white")}>{title}</h3>
                <div className="flex items-baseline gap-2 mb-2">
                    {originalPrice && (
                        <span className="text-lg text-gray-500 line-through">{originalPrice}</span>
                    )}
                    <span className={cn("text-4xl font-bold tracking-tight text-white")}>{price}</span>
                    {billingCycle === "yearly" && yearlySubtext ? (
                        <span className="text-gray-400 text-xs block mt-1">{yearlySubtext}</span>
                    ) : (
                        <span className="text-gray-400 text-sm">/{t("per_month")}</span>
                    )}
                </div>
                <p className="text-gray-300 text-sm">{description}</p>
            </div>

            <div className="space-y-4 mb-8 flex-1">
                {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0", isPro ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-gray-400")}>
                            <Check className="h-3 w-3" />
                        </div>
                        <span className="text-gray-200 text-sm">{feature}</span>
                    </div>
                ))}
            </div>

            {buttonVariant === "glow" ? (
                <SignUpButton mode="modal">
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-xl shadow-lg shadow-blue-900/40 border border-blue-500/50 font-semibold text-base transition-all hover:scale-[1.02]">
                        {buttonText}
                    </Button>
                </SignUpButton>
            ) : buttonVariant === "primary" ? (
                <SignUpButton mode="modal">
                    <Button className="w-full bg-transparent border border-white/20 hover:bg-white/10 text-white h-12 rounded-xl font-semibold text-base transition-all hover:scale-[1.02]">
                        {buttonText}
                    </Button>
                </SignUpButton>
            ) : (
                <SignUpButton mode="modal">
                    <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 h-12 rounded-xl font-medium text-base transition-all hover:scale-[1.02]">
                        {buttonText}
                    </Button>
                </SignUpButton>
            )}
        </motion.div>
    );
}

// ... (I will use multi_replace for this as edits are scattered) existing code for other sections like DeveloperAPI and Footer if not modified ... 
// Since I was asked to output the full file, I will include the DeveloperAPI and Footer as they were, but styled.

function DeveloperAPI({ sectionT }: { sectionT: Translator }) {
    const t = (key: string) => sectionT(`DeveloperAPI.${key}`);

    return (
        <section className="py-32 px-6 relative bg-[#050505] border-y border-white/5">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-400 text-xs font-semibold uppercase tracking-wider mb-6">
                            <Terminal className="h-3 w-3" /> {t("badge")}
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold tracking-normal text-white mb-6 leading-tight">
                            {t("title")}
                        </h2>

                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            {t("description")}
                        </p>

                        <div className="space-y-4">
                            {[
                                { icon: Lock, text: t("feature_1") },
                                { icon: Workflow, text: t("feature_2") },
                                { icon: Shield, text: t("feature_3") },
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                                        <feature.icon className="h-5 w-5 text-green-400" />
                                    </div>
                                    <span className="text-zinc-300 font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="relative bg-[#0A0A0A] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/5">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-3 w-3 rounded-full bg-red-500/50" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                                    <div className="h-3 w-3 rounded-full bg-green-500/50" />
                                </div>
                                <span className="text-xs text-gray-500 font-mono">api_demo.py</span>
                                <div className="w-12" />
                            </div>

                            <div className="p-6 font-mono text-sm overflow-x-auto">
                                <pre className="text-gray-300 leading-relaxed">
                                    <code>
                                        <span className="text-purple-400">import</span> <span className="text-blue-400">requests</span>
                                        {"\n\n"}
                                        <span className="text-gray-500">url</span> = <span className="text-green-400">"https://api.banktobook.com/v1/convert"</span>
                                        {"\n"}
                                        <span className="text-gray-500">headers</span> = {'{'}<span className="text-green-400">"x-api-key"</span>: <span className="text-green-400">"sk_live_..."</span>{'}'}
                                        {"\n"}
                                        <span className="text-gray-500">files</span> = {'{'}<span className="text-green-400">"file"</span>: <span className="text-blue-400">open</span>(<span className="text-green-400">"stmt.pdf"</span>, <span className="text-green-400">"rb"</span>){'}'}
                                        {"\n\n"}
                                        <span className="text-gray-500">res</span> = <span className="text-blue-400">requests</span>.<span className="text-indigo-400">post</span>(<span className="text-gray-500">url</span>, <span className="text-gray-500">headers</span>, <span className="text-gray-500">files</span>)
                                        {"\n"}
                                        <span className="text-purple-400">print</span>(<span className="text-gray-500">res</span>.<span className="text-indigo-400">json</span>())
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FAQ({ sectionT }: { sectionT: Translator }) {
    const t = (key: string) => sectionT(`FAQ.${key}`);

    // We can use a map if keys are predictable, or manual.
    // Given the translation file has q1..q4
    const faqs = [1, 2, 3, 4];

    return (
        <section className="py-24 px-6 relative bg-[#050505]">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <Badge variant="secondary" className="mb-4 bg-white/10 text-white hover:bg-white/20">{t("badge")}</Badge>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("title")}</h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((i) => (
                        <div key={i} className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
                            <details className="group">
                                <summary className="flex cursor-pointer items-center justify-between p-6 list-none">
                                    <span className="text-lg font-medium text-white group-open:text-blue-400 transition-colors">
                                        {t(`q${i}`)}
                                    </span>
                                    <span className="transition group-open:rotate-180">
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                    </span>
                                </summary>
                                <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/5 opacity-0 group-open:animate-in group-open:fade-in-50 group-open:slide-in-from-top-1">
                                    {t(`a${i}`)}
                                </div>
                            </details>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function CTA({ sectionT }: { sectionT: Translator }) {
    const t = (key: string) => sectionT(`CTA.${key}`);
    return (
        <section className="py-24 px-6 relative overflow-hidden bg-[#050505] border-t border-white/10">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-normal">{t("title")}</h2>
                <SignUpButton mode="modal">
                    <Button size="lg" className="h-14 px-10 bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-transform hover:scale-105">
                        {t("button")}
                    </Button>
                </SignUpButton>
            </div>
        </section>
    )
}

function Footer({ sectionT }: { sectionT: Translator }) {
    const section = (key: string) => sectionT(`Footer.${key}`);
    return (
        <footer className="py-12 px-6 border-t border-white/10 bg-[#050505] text-sm text-gray-500">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-white font-bold">BankToBook</span>
                </div>

                <div className="flex gap-8">
                    <Link href="#" className="hover:text-white transition-colors">{section("privacy")}</Link>
                    <Link href="#" className="hover:text-white transition-colors">{section("terms")}</Link>
                </div>

                <div>
                    © 2024 BankToBook AI.
                </div>
            </div>
        </footer>
    );
}

// Chevron component helper
function ChevronDown(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}
