import { FileText, MoreVertical, Download, Eye, RefreshCcw, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface FileSummaryCardProps {
    fileName: string;
    status: 'success' | 'processing' | 'failed' | 'partial';
    transactionCount?: number;
    bankName?: string;
    periodStart?: string;
    periodEnd?: string;
    currency?: string;
    uploadedAt?: string;
    onDownloadCsv: () => void;
    onDownloadQbo: () => void;
}

export function FileSummaryCard({
    fileName,
    status,
    transactionCount = 0,
    bankName,
    periodStart,
    periodEnd,
    currency,
    uploadedAt,
    onDownloadCsv,
    onDownloadQbo
}: FileSummaryCardProps) {
    const t = useTranslations('Extraction.file_summary');

    return (
        <Card>
            <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-4">
                    {/* Top Row: File Info & Actions */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Left: Icon + Name + Badge */}
                        <div className="flex items-start gap-4 min-w-0">
                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                            <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3
                                        className="font-semibold tracking-tight truncate max-w-[200px] sm:max-w-[300px]"
                                        title={`${fileName}${bankName ? ` • ${bankName}` : ''}${currency ? ` • ${currency}` : ''}${uploadedAt ? ` • ${uploadedAt}` : ''}`}
                                    >
                                        {fileName}
                                    </h3>
                                    <Badge variant={status === 'success' ? 'default' : 'secondary'} className={cn(
                                        "shrink-0 capitalize",
                                        status === 'success' && "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20 dark:text-emerald-400"
                                    )}>
                                        {status === 'success' ? t('status_success') : status}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    {t('complete')} — <span className="font-medium text-foreground">{t('transactions_found', { count: transactionCount })}</span>
                                </p>
                            </div>
                        </div>

                        {/* Right: File Actions Only */}
                        <div className="flex items-center gap-2 shrink-0 mt-2 md:mt-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onDownloadCsv}
                                className="font-bold text-foreground group hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 transition-colors"
                                title={t('download_csv')}
                            >
                                <Download className="mr-2 h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 sidebar-accent-icon" />
                                CSV
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onDownloadQbo}
                                className="font-bold text-foreground group hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 transition-colors"
                                title={t('download_qbo')}
                            >
                                <Download className="mr-2 h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 sidebar-accent-icon" />
                                QBO
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">{t('more_actions')}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem disabled>
                                        <Eye className="mr-2 h-4 w-4" /> {t('view_pdf')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled>
                                        <RefreshCcw className="mr-2 h-4 w-4" /> {t('reprocess')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" disabled>
                                        <Trash2 className="mr-2 h-4 w-4" /> {t('delete')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
