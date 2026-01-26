import { useTranslations } from "next-intl";

interface PricingToggleProps {
    billingPeriod: 'monthly' | 'yearly';
    onToggle: (period: 'monthly' | 'yearly') => void;
}

export default function PricingToggle({ billingPeriod, onToggle }: PricingToggleProps) {
    const t = useTranslations('BillingNew.toggle');

    return (
        <div className="flex items-center justify-center mb-8">
            <div className="bg-muted p-1 rounded-xl flex items-center relative">
                <button
                    onClick={() => onToggle('monthly')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${billingPeriod === 'monthly'
                        ? 'bg-background text-foreground shadow-sm scale-105'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    {t('monthly')}
                </button>
                <button
                    onClick={() => onToggle('yearly')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative flex items-center gap-2 ${billingPeriod === 'yearly'
                        ? 'bg-background text-foreground shadow-sm scale-105'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    {t('yearly')}
                    <span className="absolute -top-3 -right-3 md:-right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm z-10">
                        {t('save_40')}
                    </span>
                </button>
            </div>
        </div>
    );
}
