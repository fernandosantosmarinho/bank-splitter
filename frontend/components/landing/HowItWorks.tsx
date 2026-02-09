"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { UploadCloud, Cpu, FileSpreadsheet } from "lucide-react";

export default function HowItWorks() {
    const t = useTranslations("Landing.HowItWorks");
    const steps = [
        { title: t("step1_title"), desc: t("step1_desc"), icon: UploadCloud, id: 1 },
        { title: t("step2_title"), desc: t("step2_desc"), icon: Cpu, id: 2 },
        { title: t("step3_title"), desc: t("step3_desc"), icon: FileSpreadsheet, id: 3 },
    ];

    return (
        <section id="how-it-works" className="py-24 px-6 relative border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#050505] transition-colors duration-500">
            <div className="max-w-7xl mx-auto">
                <div className="mb-24 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">{t("title")}</h2>
                </div>

                <div className="relative">
                    {/* Central Vertical Dashed Line */}
                    <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px border-l-2 border-dashed border-slate-400 dark:border-white/10" />

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
                                    <div className="w-28 h-28 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-300 dark:border-white/20 flex items-center justify-center shadow-lg dark:shadow-none group-hover:border-blue-500/30 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/5 transition-all duration-500">
                                        <step.icon className="h-10 w-10 text-slate-400 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-[#050505] border border-slate-800 dark:border-white/10 rounded-full px-3 py-1 text-xs font-mono text-white dark:text-gray-400">
                                        STEP 0{step.id}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-[250px]">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
