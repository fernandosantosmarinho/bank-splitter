"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Zap, Globe, FileSpreadsheet, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Features() {
    const t = useTranslations("Landing.Features");

    const cardClass = "group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 hover:border-white/20 transition-all duration-500 shadow-2xl";

    return (
        <section id="capabilities" className="py-32 px-6 relative bg-black">
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
                        className="text-gray-400 text-lg max-w-2xl mx-auto"
                    >
                        {t("subtitle")}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]">
                    {/* Card 1: Speed (Video Bento) */}
                    <div className={cn(cardClass, "md:col-span-2 md:row-span-2 p-0 relative group")}>
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-105 transition-transform duration-700 brightness-125"
                        >
                            <source src="/ExtractStatement.mp4" type="video/mp4" />
                        </video>


                    </div>

                    {/* Card 2: Global */}
                    <div className={cardClass}>
                        <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400 border border-purple-500/20">
                            <Globe className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold tracking-normal text-white mb-3">{t("card_global_title")}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{t("card_global_desc")}</p>
                    </div>

                    {/* Card 3: Formats */}
                    <div className={cardClass}>
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 border border-emerald-500/20">
                            <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold tracking-normal text-white mb-3">{t("card_format_title")}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">{t("card_format_desc")}</p>
                        <div className="flex flex-wrap gap-2">
                            {['CSV', 'XLSX'].map(f => (
                                <Badge key={f} variant="outline" className="border-white/10 text-gray-400 text-[10px] bg-white/5">
                                    {f}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Card 4: AI (Wide) */}
                    <div className={cn(cardClass, "md:col-span-3 flex flex-col md:flex-row items-center gap-12 overflow-visible")}>
                        <div className="flex-1 z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold mb-6 border border-indigo-500/20">
                                <Shield className="h-3 w-3" /> {t("card_ai_security")}
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">{t("card_ai_title")}</h3>
                            <p className="text-gray-400 text-lg max-w-xl">{t("card_ai_desc")}</p>
                        </div>
                        <div className="flex-1 w-full relative h-48 md:h-64 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden group/sc">
                            <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,transparent,black)]" />
                            <Shield className="w-32 h-32 text-indigo-500/10 group-hover/sc:text-indigo-500/20 transition-colors duration-500" />

                            {/* Scanning Effect */}
                            <motion.div
                                className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"
                                animate={{ top: ["0%", "100%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
