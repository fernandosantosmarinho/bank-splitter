"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { motion, useTransform, useMotionValue } from "framer-motion";
import { useTranslations } from "next-intl";
import {
    ArrowRight,
    Play,
    CheckCircle2,
    Zap,
    FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SignUpButton } from "@clerk/nextjs";

type Translator = (key: string) => string;

export default function Hero() {
    const t = useTranslations("Landing.Hero");
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
            const timeout = setTimeout(() => setReverse(true), 2000);
            return () => clearTimeout(timeout);
        }

        if (subIndex === 0 && reverse) {
            setReverse(false);
            setTextIndex((prev) => (prev + 1) % words.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, reverse ? 50 : 200);

        return () => clearTimeout(timeout);
    }, [subIndex, reverse, textIndex]);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const x = (clientX - left) / width - 0.5;
        const y = (clientY - top) / height - 0.5;
        mouseX.set(x);
        mouseY.set(y);
    }

    // Simplified animation variants for mobile
    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    };

    return (
        <section className="relative pt-32 pb-20 px-6 min-h-screen flex flex-col items-center justify-center overflow-hidden">
            {/* Background elements - static to avoid layout shift */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505]" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="max-w-5xl mx-auto text-center relative z-10 px-4">
                {/* Badge */}
                {/* @ts-ignore */}
                {t.has("new_engine_badge") && (
                    <motion.div
                        {...fadeInUp}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md"
                    >
                        <Zap className="h-3 w-3 fill-current" /> {t("new_engine_badge")}
                    </motion.div>
                )}

                {/* Headline - LCP Element */}
                <h1 className="text-5xl md:text-7xl font-bold tracking-normal text-white mb-8 leading-tight">
                    <span className="[word-spacing:12px]">{t("headline_part1")}</span> <br className="hidden md:block" />
                    <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1 gap-y-1">
                        <span className="inline-flex items-baseline justify-start w-[100px] md:w-[180px] whitespace-nowrap">
                            <span className={cn("font-bold", words[textIndex].color)}>
                                {words[textIndex].text.substring(0, subIndex) || "\u00A0"}
                            </span>
                            <span className="w-1 h-10 md:h-14 bg-white ml-1 inline-block shadow-[0_0_10px_2px_rgba(255,255,255,0.8)] animate-pulse" />
                        </span>
                        <span>{t("headline_part2")}</span>
                    </span>
                </h1>

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

                {/* 3D Tilt Container - Dashboard Mockup */}
                <TiltContainer mouseX={mouseX} mouseY={mouseY} onMouseMove={handleMouseMove} t={t} />
            </div>
        </section>
    );
}

function TiltContainer({ mouseX, mouseY, onMouseMove, t }: { mouseX: any, mouseY: any, onMouseMove: any, t: any }) {
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
                            <div className="flex items-center gap-2 text-xs text-gray-400">
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
                                {t("mockup_accuracy")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
