"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { UploadCloud, Banknote, FileSpreadsheet, Minus, Maximize2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export default function InteractiveDemo() {
    const t = useTranslations("Landing.InteractiveDemo");
    const { resolvedTheme } = useTheme();
    const [activeStep, setActiveStep] = useState(1);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [mounted, setMounted] = useState(false);

    // prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setActiveStep((prev) => (prev === 3 ? 1 : prev + 1));
        }, 8000);

        return () => clearInterval(interval);
    }, [isAutoPlaying]);

    const handleStepInteraction = (step: number) => {
        setActiveStep(step);
        setIsAutoPlaying(false); // Pause auto-play on user interaction

        // Resume auto-play after 12 seconds of inactivity
        setTimeout(() => setIsAutoPlaying(true), 12000);
    };

    const steps = [
        {
            id: 1,
            title: t("step1_title"),
            desc: t("step1_desc"),
            icon: UploadCloud,
            video: mounted && resolvedTheme === "light" ? "/white_extract_state.mp4" : "/ExtractStatement.mp4",
        },
        {
            id: 2,
            title: t("step2_title"),
            desc: t("step2_desc"),
            icon: Banknote,
            video: mounted && resolvedTheme === "light" ? "/whiteExtractCheck.mp4" : "/ExtractCheck.mp4",
        },
        {
            id: 3,
            title: t("step3_title"),
            desc: t("step3_desc"),
            icon: FileSpreadsheet,
            video: mounted && resolvedTheme === "light" ? "/extract_white.mp4" : "/DOWNLOAD_CSVQBO.mp4",
        },
    ];

    return (
        <section id="features" className="py-32 px-6 relative bg-white dark:bg-black overflow-hidden transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
                    >
                        {t("title")}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto"
                    >
                        {t("subtitle")}
                    </motion.p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
                    {/* LEFT: Simulated App Window (3 columns on desktop) */}
                    <div className="lg:col-span-3 order-2 lg:order-1">
                        <div className="relative rounded-3xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl transition-colors duration-300">
                            {/* Window Title Bar */}
                            <div className="h-12 bg-gray-100 dark:bg-white/[0.03] border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-4 relative">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 absolute left-1/2 -translate-x-1/2">
                                    {steps.find((s) => s.id === activeStep)?.title}
                                </span>
                            </div>

                            {/* Window Content */}
                            <div className="min-h-[400px] bg-gray-900 flex items-center justify-center overflow-hidden aspect-video relative">
                                {steps.map((step) => (
                                    <VideoLayer
                                        key={step.id}
                                        src={step.video}
                                        isActive={activeStep === step.id}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Step Controls (2 columns on desktop) */}
                    <div className="lg:col-span-2 order-1 lg:order-2 space-y-4">
                        {steps.map((step) => (
                            <motion.button
                                key={step.id}
                                onClick={() => handleStepInteraction(step.id)}
                                onMouseEnter={() => handleStepInteraction(step.id)}
                                className={cn(
                                    "w-full text-left p-6 rounded-2xl border transition-all duration-300",
                                    activeStep === step.id
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                                        : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                                )}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                            activeStep === step.id
                                                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                                : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                                        )}
                                    >
                                        <step.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span
                                                className={cn(
                                                    "text-xs font-mono px-2 py-1 rounded-full",
                                                    activeStep === step.id
                                                        ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                                        : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-500"
                                                )}
                                            >
                                                STEP {step.id}
                                            </span>
                                        </div>
                                        <h3
                                            className={cn(
                                                "text-lg font-bold mb-2 transition-colors",
                                                activeStep === step.id
                                                    ? "text-gray-900 dark:text-white"
                                                    : "text-gray-600 dark:text-gray-300"
                                            )}
                                        >
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// Reusable Video Layer Component - Keeps all videos mounted for instant switching
function VideoLayer({ src, isActive }: { src: string; isActive: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
        }
    }, [isActive]);

    return (
        <div
            className={cn(
                "absolute inset-0 w-full h-full transition-opacity duration-300",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            )}
        >
            <video
                ref={videoRef}
                key={src} // Force remount when src changes (e.g. theme toggle)
                src={src} // Use src attribute directly for dynamic updates
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
}
