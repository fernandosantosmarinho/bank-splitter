"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Zap, Globe, FileSpreadsheet, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Features() {
    const t = useTranslations("Landing.Features");

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
    );
}
