import { Gift } from "lucide-react";
import { UserMetrics } from "@/lib/supabase";
import { useTranslations } from "next-intl";
import { useWelcomeOffer } from "@/hooks/useWelcomeOffer";

interface BillingHeaderProps {
    userMetrics: UserMetrics;
}

export default function BillingHeader({ userMetrics }: BillingHeaderProps) {
    const t = useTranslations('BillingNew.header');

    // Use centralized hook - single source of truth
    const offer = useWelcomeOffer(
        userMetrics?.account_created_at,
        userMetrics?.welcome_offer_used
    );

    // Don't render if offer is not active
    if (!offer.isActive) {
        return null;
    }

    return (
        <div className="w-full mb-6 bg-gradient-to-r from-indigo-600 to-purple-500 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-4 w-full justify-center sm:justify-start">
                <div className="p-2 bg-white/10 rounded-full animate-pulse hidden sm:block">
                    <Gift className="h-6 w-6 text-yellow-300" />
                </div>
                <div className="text-center sm:text-left">
                    <h3 className="font-bold text-white text-lg tracking-tight">
                        🎁 {t('welcome_offer_title')}
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                        {t('welcome_offer_desc_prefix')}
                        <span className="inline-flex items-center justify-center bg-black/20 text-yellow-300 font-mono font-bold px-2 py-0.5 rounded mx-1.5 border border-white/10">
                            {offer.remainingLabel}
                        </span>
                        {t('welcome_offer_desc_suffix')}
                    </p>
                </div>
            </div>
        </div>
    );
}
