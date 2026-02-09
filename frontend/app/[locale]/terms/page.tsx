"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-100 font-sans">
            <div className="max-w-3xl mx-auto px-6 py-20">
                <div className="mb-10">
                    <Link href="/">
                        <Button variant="ghost" className="pl-0 hover:pl-2 transition-all gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>

                <h1 className="text-4xl font-bold mb-4 tracking-tight">Terms of Service</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-12">Last updated: February 08, 2026</p>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">1. Introduction</h2>
                        <p className="mb-4">
                            Welcome to BankToBook. By accessing or using our website and services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">2. Description of Service</h2>
                        <p className="mb-4">
                            BankToBook provides automated extraction services for bank statements and checks, converting PDF and image documents into structured data formats like CSV and QuickBooks. We do not provide financial, accounting, or legal advice.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">3. User Responsibilities</h2>
                        <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-600 dark:text-slate-300">
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You agree not to upload any illegal or malicious content.</li>
                            <li>You represent that you have the right to process the financial documents you upload.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">4. Privacy & Data Security</h2>
                        <p className="mb-4">
                            We take your privacy seriously. We employ industry-standard encryption (AES-256) to protect your data. We operate on a zero-retention policy for input documents, meaning your uploaded files are deleted immediately after processing. Please review our full Privacy Policy for details.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">5. Subscriptions & Billing</h2>
                        <p className="mb-4">
                            Paid subscriptions are billed in advance on a monthly or annual basis. You may cancel your subscription at any time; however, cancellations will be effective at the end of the current billing cycle. No refunds are provided for partial usage.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">6. Limitation of Liability</h2>
                        <p className="mb-4">
                            To the maximum extent permitted by law, BankToBook shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">7. Changes to Terms</h2>
                        <p className="mb-4">
                            We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the service. Continued use of the service after such changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section className="mb-20">
                        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at support@banktobook.com.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
