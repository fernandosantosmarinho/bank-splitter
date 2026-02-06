"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SocialProof() {
    const t = useTranslations("Landing.SocialProof");
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
