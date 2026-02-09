"use client";

import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function Footer() {
    const t = useTranslations("Landing.Footer");
    return (
        <footer className="py-12 px-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050505] text-sm text-slate-500 dark:text-gray-400 transition-colors duration-500">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                    <span className="text-slate-900 dark:text-white font-bold">BankToBook</span>
                </div>
                <div className="flex items-center gap-8">
                    <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t("privacy")}</a>
                    <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t("terms")}</Link>
                    <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t("contact")}</a>
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-600">
                    © 2026 BankToBook Inc.
                </div>
            </div>
        </footer>
    );
}
