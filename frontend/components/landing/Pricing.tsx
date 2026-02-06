"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignUpButton } from "@clerk/nextjs";
import { Check } from "lucide-react";

type Translator = (key: string) => string;

export default function Pricing() {
    const t = useTranslations("Landing.Pricing");
    const [isYearly, setIsYearly] = useState(false);

    // Wrapper to match signature expected by PricingCard
    const tWrapper = (key: string) => t(key);

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
                        buttonText={t("cards.free_cta")}
                        buttonVariant="outline"
                        t={tWrapper}
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
                        t={tWrapper}
                        billingCycle={isYearly ? "yearly" : "monthly"}
                        yearlySubtext={t("cards.billed_starter_yearly")}
                    />

                    {/* Pro Plan */}
                    <PricingCard
                        title={t("cards.pro_title")}
                        price={isYearly ? t("cards.pro_price_yearly") : t("cards.pro_price_discount")}
                        originalPrice={!isYearly ? t("cards.pro_price_original") : undefined}
                        description={t("cards.pro_desc")}
                        features={[t("cards.pro_feat_1"), t("cards.pro_feat_2"), t("cards.pro_feat_3"), t("cards.pro_feat_4")]}
                        buttonText={isYearly ? t("cards.cta_pro_yearly") : t("cards.paid_cta")}
                        buttonVariant="primary"
                        highlightedPrice
                        t={tWrapper}
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
                        <span className="text-lg text-gray-400 line-through">{originalPrice}</span>
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
