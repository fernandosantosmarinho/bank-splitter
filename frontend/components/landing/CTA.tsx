"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SignUpButton } from "@clerk/nextjs";

export default function CTA() {
    const t = useTranslations("Landing.CTA");
    return (
        <section className="py-24 px-6 relative overflow-hidden bg-slate-900 border-t border-white/10">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-normal">{t("title")}</h2>
                <SignUpButton mode="modal">
                    <Button size="lg" className="h-14 px-10 bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold shadow-[0_0_30px_rgba(37,99,235,0.2)] dark:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-transform hover:scale-105">
                        {t("button")}
                    </Button>
                </SignUpButton>
            </div>
        </section>
    )
}
