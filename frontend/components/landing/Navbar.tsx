"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export default function Navbar({ userId }: { userId: string | null }) {
    const t = useTranslations("Landing.Navbar");
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                scrolled ? "bg-black/50 backdrop-blur-xl border-white/5" : "bg-transparent border-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="relative bg-gradient-to-tr from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all group-hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]">
                        <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Zap className="h-5 w-5 text-white fill-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-100 transition-colors">BankToBook</span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                    <Link href="#features" className="hover:text-white transition-colors">{t("features")}</Link>
                    <Link href="#how-it-works" className="hover:text-white transition-colors">{t("how_it_works")}</Link>
                    <Link href="#pricing" className="hover:text-white transition-colors">{t("pricing")}</Link>
                </div>

                <div className="flex items-center gap-4">
                    {!userId ? (
                        <>
                            <SignInButton mode="modal">
                                <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-zinc-300 hover:text-white hover:bg-white/5">
                                    {t("signin")}
                                </Button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <Button size="sm" className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] font-semibold transition-transform hover:scale-105">
                                    {t("get_started")}
                                </Button>
                            </SignUpButton>
                        </>
                    ) : (
                        <Link href="/dashboard">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-transform hover:scale-105">
                                {t("dashboard")}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}
