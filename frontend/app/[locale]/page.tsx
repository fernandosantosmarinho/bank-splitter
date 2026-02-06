import { auth } from "@clerk/nextjs/server";
import { setRequestLocale } from 'next-intl/server';
import dynamic from 'next/dynamic';

// Static Imports (Critical for LCP and initial view)
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";

// Dynamic Imports (Below the fold)
const SocialProof = dynamic(() => import('@/components/landing/SocialProof'), { ssr: true });
const Features = dynamic(() => import('@/components/landing/Features'), { ssr: true });
const DeveloperAPI = dynamic(() => import('@/components/landing/DeveloperAPI'), { ssr: true });
const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks'), { ssr: true });
const Pricing = dynamic(() => import('@/components/landing/Pricing'), { ssr: true });
const FAQ = dynamic(() => import('@/components/landing/FAQ'), { ssr: true });
const CTA = dynamic(() => import('@/components/landing/CTA'), { ssr: true });
const Footer = dynamic(() => import('@/components/landing/Footer'), { ssr: true });

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    // Determine the user ID to adjust value prop or CTAs
    const { userId } = await auth();

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 overflow-x-hidden font-sans">
            <Navbar userId={userId} />
            <Hero />
            <SocialProof />
            <Features />
            <DeveloperAPI />
            <HowItWorks />
            <Pricing />
            <FAQ />
            <CTA />
            <Footer />
        </div>
    );
}
