"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
    const t = useTranslations("Landing.FAQ");
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
