"use client";

import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";

export default function Footer() {
    const t = useTranslations("Landing.Footer");
    return (
        <footer className="py-12 px-6 border-t border-white/10 bg-[#050505] text-sm text-gray-400">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-white font-bold">BankToBook</span>
                </div>
                <div className="flex items-center gap-8">
                    <a href="#" className="hover:text-white transition-colors">{t("privacy")}</a>
                    <a href="#" className="hover:text-white transition-colors">{t("terms")}</a>
                    <a href="#" className="hover:text-white transition-colors">{t("contact")}</a>
                </div>
                <div className="text-xs text-gray-600">
                    © 2026 BankToBook Inc.
                </div>
            </div>
        </footer>
    );
}
