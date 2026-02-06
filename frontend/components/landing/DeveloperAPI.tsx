"use client";

import { useTranslations } from "next-intl";
import { Terminal, Lock, Workflow, Shield } from "lucide-react";

type Translator = (key: string) => string;

export default function DeveloperAPI() {
    const t = useTranslations("Landing.DeveloperAPI");

    return (
        <section className="py-32 px-6 relative bg-[#050505] border-y border-white/5">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-400 text-xs font-semibold uppercase tracking-wider mb-6">
                            <Terminal className="h-3 w-3" /> {t("badge")}
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold tracking-normal text-white mb-6 leading-tight">
                            {t("title")}
                        </h2>

                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            {t("description")}
                        </p>

                        <div className="space-y-4">
                            {[
                                { icon: Lock, text: t("feature_1") },
                                { icon: Workflow, text: t("feature_2") },
                                { icon: Shield, text: t("feature_3") },
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                                        <feature.icon className="h-5 w-5 text-green-400" />
                                    </div>
                                    <span className="text-zinc-300 font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="relative bg-[#0A0A0A] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/5">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-3 w-3 rounded-full bg-red-500/50" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                                    <div className="h-3 w-3 rounded-full bg-green-500/50" />
                                </div>
                                <span className="text-xs text-gray-500 font-mono">api_demo.py</span>
                                <div className="w-12" />
                            </div>

                            <div className="p-6 font-mono text-sm overflow-x-auto">
                                <pre className="text-gray-300 leading-relaxed">
                                    <code>
                                        <span className="text-purple-400">import</span> <span className="text-blue-400">requests</span>
                                        {"\n\n"}
                                        <span className="text-gray-500">url</span> = <span className="text-green-400">"https://api.banktobook.com/v1/convert"</span>
                                        {"\n"}
                                        <span className="text-gray-500">headers</span> = {'{'}<span className="text-green-400">"x-api-key"</span>: <span className="text-green-400">"sk_live_..."</span>{'}'}
                                        {"\n"}
                                        <span className="text-gray-500">files</span> = {'{'}<span className="text-green-400">"file"</span>: <span className="text-blue-400">open</span>(<span className="text-green-400">"stmt.pdf"</span>, <span className="text-green-400">"rb"</span>){'}'}
                                        {"\n\n"}
                                        <span className="text-gray-500">res</span> = <span className="text-blue-400">requests</span>.<span className="text-indigo-400">post</span>(<span className="text-gray-500">url</span>, <span className="text-gray-500">headers</span>, <span className="text-gray-500">files</span>)
                                        {"\n"}
                                        <span className="text-purple-400">print</span>(<span className="text-gray-500">res</span>.<span className="text-indigo-400">json</span>())
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
