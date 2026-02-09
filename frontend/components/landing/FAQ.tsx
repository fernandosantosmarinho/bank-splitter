"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
    const t = useTranslations("Landing.FAQ");
    const faqs = [1, 2, 3, 4];

    return (
        <section className="py-24 px-6 relative bg-slate-50 dark:bg-[#050505] transition-colors duration-500">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <Badge variant="secondary" className="mb-4 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20">{t("badge")}</Badge>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">{t("title")}</h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((i) => (
                        <div key={i} className="border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-white/[0.02] overflow-hidden shadow-sm dark:shadow-none">
                            <details className="group">
                                <summary className="flex cursor-pointer items-center justify-between p-6 list-none">
                                    <span className="text-lg font-medium text-slate-900 dark:text-white group-open:text-blue-600 dark:group-open:text-blue-400 transition-colors">
                                        {t(`q${i}`)}
                                    </span>
                                    <span className="transition group-open:rotate-180">
                                        <ChevronDown className="h-5 w-5 text-slate-400 dark:text-gray-400" />
                                    </span>
                                </summary>
                                <div className="p-6 pt-0 text-slate-600 dark:text-gray-400 leading-relaxed border-t border-slate-100 dark:border-white/5 group-open:animate-in group-open:fade-in group-open:slide-in-from-top-1 group-open:duration-200">
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
