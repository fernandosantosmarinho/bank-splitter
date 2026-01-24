import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface TaskHeaderProps {
    title: string;
    subtitle?: string;
    primaryCtaLabel?: string;
    primaryCtaHref?: string;
    onPrimaryCtaClick?: () => void;
    className?: string;
}

export function TaskHeader({
    title,
    subtitle,
    primaryCtaLabel,
    primaryCtaHref,
    onPrimaryCtaClick,
    className,
}: TaskHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
            <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>

            {primaryCtaLabel && (
                primaryCtaHref ? (
                    <Link href={primaryCtaHref}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {primaryCtaLabel}
                        </Button>
                    </Link>
                ) : (
                    <Button onClick={onPrimaryCtaClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {primaryCtaLabel}
                    </Button>
                )
            )}
        </div>
    );
}
