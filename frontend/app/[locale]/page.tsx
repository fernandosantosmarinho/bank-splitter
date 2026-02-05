import { auth } from "@clerk/nextjs/server";
import { LandingPage } from "@/components/landing-page";
import { setRequestLocale } from 'next-intl/server';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    // Determine the user ID to adjust the CTA button state (Sign In vs Dashboard)
    const { userId } = await auth();

    return (
        <LandingPage userId={userId} />
    );
}
