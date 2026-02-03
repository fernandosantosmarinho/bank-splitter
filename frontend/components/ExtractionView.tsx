"use client";

import { useUser } from "@clerk/nextjs";
import { sendGAEvent } from "@next/third-parties/google";
import { incrementMetric } from "@/app/actions/metrics";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload, X, Download, FileSpreadsheet, Loader2,
    FileText, Zap, ShieldCheck, Activity, CheckCircle2,
    TrendingUp, TrendingDown, Building, RefreshCcw,
    Lock, FileX, Trash2, Server, Wallet, ScanLine, History,
    Files, ArrowRight, FileCheck, BrainCircuit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Locale } from "@/i18n/locales";
import { UserMetrics } from "@/lib/supabase";
import DocumentLimitModal from "@/components/billing/DocumentLimitModal";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TaskHeader } from "@/components/TaskHeader";
import { FileSummaryCard } from "@/components/FileSummaryCard";
import { TransactionsToolbar } from "@/components/TransactionsToolbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- INTERFACES ---
interface Transaction {
    amount: number;
}

interface AccountData {
    account_name: string;
    account_number_partial: string;
    currency: string;
    transactions: Transaction[];
    preview_headers: string[];
    preview_rows: any[];
    csv_content?: string;
    qbo_content?: string;
}

interface ExtractionViewProps {
    title?: string;
    description?: string;
    mode?: "pdf" | "image" | "mixed";
    onSuccess?: (file: File, transactionCount: number) => void;
    onDownload?: (type: "CSV" | "QBO", fileName: string) => void;
    userMetrics?: UserMetrics;
}

const normalizeCurrencyCode = (raw: string): string => {
    if (!raw) return 'BRL';
    const clean = raw.trim().toUpperCase();

    // Mapeamento de nomes comuns para códigos ISO
    const map: Record<string, string> = {
        'EURO': 'EUR',
        'EUROS': 'EUR',
        '€': 'EUR',
        'R$': 'BRL',
        'REAL': 'BRL',
        'REAIS': 'BRL',
        'US$': 'USD',
        'DOLLAR': 'USD',
        'U$': 'USD'
    };

    const code = map[clean] || clean;
    return code.length === 3 ? code : 'USD';
};

const formatCurrency = (value: number, currency: string) => {
    try {
        const isoCode = normalizeCurrencyCode(currency);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: isoCode,
        }).format(value);
    } catch (e) {
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value);
    }
};

export default function ExtractionView({
    title,
    description,
    mode = "mixed",
    onSuccess,
    onDownload,
    userMetrics
}: ExtractionViewProps) {
    const { user } = useUser();
    const router = useRouter();
    const t = useTranslations('Extraction');
    const locale = useLocale() as Locale;

    // Limit Modal State
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

    // Default fallback if props are missing (should generally be passed from parent though)
    const viewTitle = title || t('titles.extract_statement');
    const viewDesc = description || t('titles.desc_statement');

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [accounts, setAccounts] = useState<AccountData[]>([]);
    const [status, setStatus] = useState("");
    const [progress, setProgress] = useState(0);

    // --- FILTERING STATE ---
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');

    // --- FINANCIAL MATH ---
    const summary = useMemo(() => {
        if (accounts.length === 0) return { totalCredit: 0, totalDebit: 0, net: 0, count: 0 };

        let totalCredit = 0;
        let totalDebit = 0;
        let count = 0;

        accounts.forEach(acc => {
            // Use total extracted rows for the count to match the table display
            count += acc.preview_rows.length;

            acc.transactions.forEach(tx => {
                // Keep financial totals based on actual parsed transactions
                if (tx.amount > 0) totalCredit += tx.amount;
                else totalDebit += tx.amount;
            });
        });

        return { totalCredit, totalDebit, net: totalCredit + totalDebit, count };
    }, [accounts]);

    useEffect(() => {
        let messageInterval: NodeJS.Timeout;
        if (isLoading && progress > 5) {
            const LOADING_MESSAGES = [
                t('processing.steps.secure_enclave'),
                t('processing.steps.layout'),
                t('processing.steps.columns'),
                t('processing.steps.financial'),
                t('processing.steps.integrity'),
                t('processing.steps.export'),
                t('processing.steps.finalizing')
            ];
            let msgIndex = 0;
            messageInterval = setInterval(() => {
                setStatus(LOADING_MESSAGES[msgIndex % LOADING_MESSAGES.length]);
                msgIndex++;
            }, 2000);
        }
        return () => clearInterval(messageInterval);
    }, [isLoading, progress]);

    useEffect(() => {
        return () => { if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    const generatePDFPreview = async (file: File) => {
        try {
            const pdfjs = await import("pdfjs-dist");
            pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
            const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
            const page = await pdf.getPage(1);
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            const viewport = page.getViewport({ scale: 1.0 });
            if (context) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport: viewport } as any).promise;
                setPreviewUrl(canvas.toDataURL());
            }
        } catch (e) { console.error("Preview failed", e); }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.length > 0) {
            const f = acceptedFiles[0];
            setFile(f);
            setAccounts([]);
            if (f.type.startsWith("image/")) setPreviewUrl(URL.createObjectURL(f));
            else generatePDFPreview(f);

            // ANALYTICS: Track file upload
            sendGAEvent('event', 'file_upload', {
                file_type: mode === 'pdf' ? 'pdf' : 'image',
                file_extension: f.name.split('.').pop(),
                file_size: f.size
            });

            toast.info(t('dropzone.document_loaded'));
        }
    }, [mode]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: mode === 'pdf'
            ? { 'application/pdf': ['.pdf'] }
            : { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
        maxFiles: 1,
        multiple: false,
        disabled: isLoading
    });

    const resetForm = () => {
        setFile(null);
        setPreviewUrl(null);
        setAccounts([]);
        setProgress(0);
        setStatus("");
    };

    const handleExtract = async () => {
        if (!file) return;

        // Check for Free Tier Limits
        const isFree = !userMetrics || !userMetrics.subscription_tier || userMetrics.subscription_tier === 'free';

        // Check Limits (Universal)
        const creditsUsed = userMetrics?.credits_used || 0;
        const creditsTotal = userMetrics?.credits_total || 5; // Default to 5 if undefined

        // If limited (not -1) and exhausted
        if (creditsTotal !== -1 && creditsUsed >= creditsTotal) {
            setIsLimitModalOpen(true);
            return;
        }

        setIsLoading(true);
        setStatus(t('processing.init'));
        setAccounts([]);
        setProgress(0);

        // ANALYTICS: Track extraction start
        sendGAEvent('event', 'extraction_started', {
            mode: mode,
            file_type: file.type
        });

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                return prev + (prev < 30 ? 5 : prev < 70 ? 2 : 0.5);
            });
        }, 800);

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Use local proxy to avoid CORS and handle Auth automatically
            const response = await fetch(`/api/extract`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`Engine Error: ${response.statusText}`);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            if (reader) {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split("\n\n");
                    buffer = parts.pop() || "";

                    for (const line of parts) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine.startsWith("data: ")) continue;

                        try {
                            const jsonStr = trimmedLine.replace("data: ", "");
                            const payload = JSON.parse(jsonStr);

                            if (payload.type === "init") setProgress(20);
                            else if (payload.type === "status") {
                                setStatus(payload.text);
                                setProgress(prev => Math.min(prev + 10, 85));
                            }
                            else if (payload.type === "chunk") {
                                console.log("[ExtractionView] Chunk received. Accounts:", payload.accounts.length);
                                setProgress(100);
                                setAccounts(payload.accounts);
                                console.log("[ExtractionView] Incrementing metrics for user:", user?.id);
                                try {
                                    await incrementMetric(user?.id, 'documents_processed', 1);
                                    console.log("[ExtractionView] Metric incremented.");
                                } catch (err) {
                                    console.error("[ExtractionView] Failed to increment metric:", err);
                                }

                                if (onSuccess && file) {
                                    const transactionCount = payload.accounts.reduce((sum: number, acc: AccountData) => sum + acc.preview_rows.length, 0);

                                    // ANALYTICS: Track success
                                    sendGAEvent('event', 'extraction_success', {
                                        mode: mode,
                                        transaction_count: transactionCount
                                    });

                                    onSuccess(file, transactionCount);
                                }
                            }
                            else if (payload.type === "error") {
                                throw new Error(payload.message);
                            }
                        } catch (e) {
                            console.warn("JSON Parse warning:", e);
                        }
                    }
                }
            }

            clearInterval(interval);
            setStatus("Securely discarding original file...");
            // Allow time for the destruction animation
            setTimeout(() => setIsLoading(false), 2500);

        } catch (error: any) {
            clearInterval(interval);
            setStatus(t('processing.error'));
            toast.error(error.message || t('processing.error'));
            setIsLoading(false);
        }
    };

    const downloadFile = (content: string, fileName: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success(t('processing.downloaded', { file: fileName }));
    };

    const downloadCSV = async (acc: AccountData) => {
        if (acc.csv_content) {
            // ANALYTICS: Track download
            sendGAEvent('event', 'file_download', {
                type: 'CSV',
                account: acc.account_name
            });

            const fileName = `${acc.account_name}.csv`;
            downloadFile(acc.csv_content, fileName, "text/csv;charset=utf-8;");
            await incrementMetric(user?.id, 'csv_exports', 1);
            if (onDownload) onDownload("CSV", fileName);
        }
    }

    const downloadQBO = async (acc: AccountData) => {
        if (acc.qbo_content) {
            // ANALYTICS: Track download
            sendGAEvent('event', 'file_download', {
                type: 'QBO',
                account: acc.account_name
            });

            const fileName = `${acc.account_name}.qbo`;
            downloadFile(acc.qbo_content, fileName, "application/octet-stream");
            await incrementMetric(user?.id, 'qbo_exports', 1);
            if (onDownload) onDownload("QBO", fileName);
        }
    }

    // --- FILTER LOGIC ---
    const filteredAccounts = useMemo(() => {
        if (!search && typeFilter === 'all') return accounts;

        const parseAmount = (str: any): number => {
            if (!str || typeof str !== 'string') return 0;
            const clean = str.replace(/[^\d.,-]/g, '');
            if (!clean) return 0;

            const lastComma = clean.lastIndexOf(',');
            const lastDot = clean.lastIndexOf('.');

            let normalized = clean;
            if (lastComma > lastDot) {
                normalized = clean.replace(/\./g, '').replace(',', '.');
            } else {
                normalized = clean.replace(/,/g, '');
            }
            return parseFloat(normalized);
        };

        return accounts.map(acc => {
            const headers = acc.preview_headers.map(h => h.toLowerCase());

            const debitHeader = acc.preview_headers.find(h => /debit|débito|saída|outgoing/i.test(h));
            const creditHeader = acc.preview_headers.find(h => /credit|crédito|entrada|deposit/i.test(h));
            const amountHeader = acc.preview_headers.find(h => /valor|amount|price|value/i.test(h) && !/saldo|balance/i.test(h) && !/debit|débito|credit|crédito/i.test(h));

            const indicesToKeep = acc.preview_rows.reduce((indices: number[], row, idx) => {
                let netValue = 0;

                if (debitHeader || creditHeader) {
                    const debitVal = debitHeader ? Math.abs(parseAmount(row[debitHeader])) : 0;
                    const creditVal = creditHeader ? Math.abs(parseAmount(row[creditHeader])) : 0;
                    if (debitVal > 0) netValue -= debitVal;
                    if (creditVal > 0) netValue += creditVal;
                } else if (amountHeader) {
                    netValue = parseAmount(row[amountHeader]);
                }

                let typeMatch = true;
                if (typeFilter !== 'all') {
                    if (netValue === 0) typeMatch = false;
                    else if (typeFilter === 'debit') typeMatch = netValue < 0;
                    else if (typeFilter === 'credit') typeMatch = netValue > 0;
                }

                let searchMatch = true;
                if (search) {
                    const rowString = Object.values(row).join(" ").toLowerCase();
                    searchMatch = rowString.includes(search.toLowerCase());
                }

                if (typeMatch && searchMatch) {
                    indices.push(idx);
                }
                return indices;
            }, [] as number[]);

            return {
                ...acc,
                transactions: indicesToKeep.map(i => acc.transactions[i] || { amount: 0 }),
                preview_rows: indicesToKeep.map(i => acc.preview_rows[i])
            };
        });
    }, [accounts, search, typeFilter]);

    // --- CHIPS LOGIC ---
    const chips = useMemo(() => {
        const c = [];
        if (search) c.push({ key: 'search', label: `Search: "${search}"` });
        if (typeFilter !== 'all') c.push({ key: 'type', label: typeFilter === 'debit' ? t('toolbar.filter_debit') : t('toolbar.filter_credit') });
        return c;
    }, [search, typeFilter, t]);

    const handleRemoveChip = (key: string) => {
        if (key === 'search') setSearch("");
        if (key === 'type') setTypeFilter('all');
    };

    const handleClearAll = () => {
        setSearch("");
        setTypeFilter('all');
    };

    // --- KPI CLICK ---
    const handleTotalCreditClick = () => setTypeFilter(typeFilter === 'credit' ? 'all' : 'credit');
    const handleTotalDebitClick = () => setTypeFilter(typeFilter === 'debit' ? 'all' : 'debit');
    const handleNetClick = () => setTypeFilter('all');

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            {/* --- STATE 1: UPLOAD VIEW (Empty or File Review) --- */}
            {accounts.length === 0 && (
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 h-full flex flex-col pb-6">
                    {/* Header */}
                    <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0 mt-4 md:mt-0">


                        <h1 className="text-3xl font-bold text-foreground tracking-tight">{viewTitle}</h1>

                    </div>


                    {/* Main Content Grid */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                        {/* LEFT COLUMN: UPLOAD AREA (8/12) */}
                        {/* LEFT COLUMN: UPLOAD AREA (8/12) */}
                        <div className="lg:col-span-8 flex flex-col h-full">
                            {!file ? (
                                // --- EMPTY STATE (Upload Dropzone) ---
                                <Card className="flex-1 border-dashed border-2 border-muted-foreground/20 bg-muted/5 relative overflow-hidden group transition-all duration-300 hover:border-primary/50 hover:bg-muted/10">
                                    <div {...getRootProps()} className="absolute inset-0 z-10 cursor-pointer outline-none">
                                        <input {...getInputProps()} />
                                    </div>

                                    <CardContent className="h-full flex flex-col items-center justify-center p-6 sm:p-12 relative z-0">
                                        <div className="text-center space-y-6 max-w-md mx-auto pointer-events-none select-none">
                                            <div className="relative mx-auto h-24 w-24 bg-card rounded-2xl border border-border flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                                                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-hover:bg-primary/10 transition-colors" />
                                                <Upload className="h-10 w-10 text-primary" />
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                                                    {t('dropzone.click_to_upload')}
                                                </h3>
                                                <p className="text-muted-foreground text-sm">{t('dropzone.subtitle')}</p>
                                            </div>

                                            <div className="flex items-center justify-center gap-4 text-xs font-medium text-muted-foreground opacity-70">
                                                {mode === 'pdf' ? (
                                                    <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> PDF</span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5"><Files className="h-3.5 w-3.5" /> JPEG / PNG</span>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>

                                    {/* Bottom Security Indicators */}
                                    <div className="absolute bottom-4 inset-x-0 flex justify-center gap-6 opacity-40 pointer-events-none select-none">
                                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                            <Server className="h-3 w-3" /> {t('dropzone.ram_only')}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                            <Trash2 className="h-3 w-3" /> {t('dropzone.auto_wipe')}
                                        </div>
                                    </div>
                                </Card>
                            ) : !isLoading ? (
                                // --- FILE SELECTED STATE (Preview) ---
                                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Image Card */}
                                    <Card className="flex-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden relative flex flex-col max-h-[65vh]">
                                        {/* Header Bar */}
                                        <div className="shrink-0 h-14 bg-muted/30 border-b border-border flex items-center justify-between px-4">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <img
                                                    src={file.type === 'application/pdf' ? '/pdf_icon.png' : '/jpeg_icon.png'}
                                                    alt="File Type"
                                                    className="h-8 w-8 shrink-0 object-contain"
                                                />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium truncate max-w-[200px] md:max-w-[400px]">{file.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => { e.stopPropagation(); resetForm(); }}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Large Preview Area */}
                                        <div className="flex-1 bg-muted/10 relative p-4 overflow-hidden min-h-0">
                                            <div className="w-full h-full flex items-center justify-center">
                                                {previewUrl ? (
                                                    <img src={previewUrl} className="max-w-full max-h-full object-contain shadow-lg rounded-md ring-1 ring-border" alt="Preview" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                                                        <FileText className="h-16 w-16" />
                                                        <span className="text-sm font-medium">No Preview Available</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Separated Button Area */}
                                    <div className="mt-6 flex justify-center">
                                        <Button size="lg" className="w-full max-w-sm font-bold shadow-lg text-base h-12" onClick={handleExtract}>
                                            <Zap className="h-5 w-5 mr-2" /> {t('processing.start_extraction')}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // --- LOADING STATE ---
                                <div className="flex-1 flex flex-col items-center justify-center p-6">
                                    <AnimatePresence mode="wait">
                                        {progress < 100 ? (
                                            <motion.div
                                                key="processing"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="bg-card/90 backdrop-blur border border-border p-8 rounded-xl shadow-2xl text-center w-full max-w-md"
                                            >
                                                <div className="relative mx-auto w-16 h-16 mb-4">
                                                    <div className="absolute inset-0 rounded-full border-4 border-muted" />
                                                    <motion.div
                                                        className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <BrainCircuit className="h-6 w-6 text-primary" />
                                                    </div>
                                                </div>

                                                <h3 className="font-bold text-lg mb-1">{status || t('processing.title')}</h3>
                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-6">
                                                    {Math.round(progress)}% {t('processing.encryption_active')}
                                                </p>

                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-primary"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ type: "spring", stiffness: 50 }}
                                                    />
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="shredding"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="bg-card/90 backdrop-blur border border-border p-8 rounded-xl shadow-2xl text-center w-full max-w-md"
                                            >
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.1, 1],
                                                        opacity: [1, 0.8, 1]
                                                    }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-emerald-500/30"
                                                >
                                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                                </motion.div>
                                                <h3 className="text-xl font-bold mb-2">{t('processing.success')}</h3>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    {t('processing.discarding_desc')}
                                                </p>
                                                <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-500 bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/10">
                                                    <Trash2 className="h-3 w-3" /> {t('processing.zero_retention')}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: INFO PANEL (4/12) */}
                        <div className="lg:col-span-4 flex flex-col gap-6">

                            {/* Security Badge Card */}
                            <Card className="bg-gradient-to-br from-emerald-950/20 to-card border-emerald-500/20 overflow-hidden relative">
                                <div className="absolute -right-6 -top-6 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl" />
                                <CardHeader className="pb-3 relative z-10">
                                    <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-2 border border-emerald-500/20">
                                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <CardTitle className="text-base text-emerald-500">{t('features.security_title')}</CardTitle>
                                    <CardDescription className="text-xs">{t('features.compliance')}</CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10 pt-0">
                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {t('features.encryption')}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {t('features.no_storage')}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Steps / Process */}
                            <div className="space-y-4 px-2">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">
                                    {t('overview.processing_history')?.split(" ")[0] || "Process"} {/* Fallback */}
                                </h4>
                                <div className="space-y-6 relative ml-2">
                                    {/* Line */}
                                    <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border z-0" />

                                    {[
                                        { icon: Upload, label: t('features.step_1'), desc: t('features.formats') },
                                        { icon: BrainCircuit, label: t('features.step_2'), desc: "OCR + LLM Logic" },
                                        { icon: FileSpreadsheet, label: t('features.step_3'), desc: "CSV / QBO" }
                                    ].map((step, idx) => (
                                        <div key={idx} className="relative z-10 flex items-start gap-4 group">
                                            <div className="h-3 w-3 rounded-full bg-background border-2 border-primary mt-1 shadow-sm ring-2 ring-background group-hover:scale-110 transition-transform" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground leading-none">{step.label}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div >
            )
            }

            {/* --- STATE 2: RESULTS VIEW --- */}
            {
                accounts.length > 0 && (
                    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 space-y-6 flex-1 min-h-0 flex flex-col overflow-hidden pb-4">
                        {/* Header with Animation */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 shrink-0 mt-4 md:mt-0">
                            <TaskHeader
                                title={t('results.title')}
                                subtitle={t('results.subtitle')}
                                primaryCtaLabel={t('results.upload_another')}
                                onPrimaryCtaClick={resetForm}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                            {/* Summary & Download Card */}
                            <div className="md:col-span-3">
                                <FileSummaryCard
                                    fileName={file?.name || "Document"}
                                    status="success"
                                    transactionCount={summary.count}
                                    bankName={accounts[0]?.account_name}
                                    currency={accounts[0]?.currency}
                                    uploadedAt="Just now"
                                    onDownloadCsv={() => downloadCSV(accounts[0])}
                                    onDownloadQbo={() => downloadQBO(accounts[0])}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                            {/* Total Credit */}
                            <Card
                                className={cn(
                                    "bg-card border-border shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:shadow-md",
                                    typeFilter === 'credit' && "ring-2 ring-emerald-500/40 bg-muted/20"
                                )}
                                onClick={handleTotalCreditClick}
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <TrendingUp className="h-12 w-12 text-emerald-500" />
                                </div>
                                <CardContent className="p-5 relative z-10">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t('results.total_credit')}
                                    </p>
                                    <p className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.totalCredit, accounts[0].currency)}</p>
                                </CardContent>
                            </Card>

                            {/* Total Debit */}
                            <Card
                                className={cn(
                                    "bg-card border-border shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:shadow-md",
                                    typeFilter === 'debit' && "ring-2 ring-red-500/40 bg-muted/20"
                                )}
                                onClick={handleTotalDebitClick}
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <TrendingDown className="h-12 w-12 text-red-500" />
                                </div>
                                <CardContent className="p-5 relative z-10">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {t('results.total_debit')}
                                    </p>
                                    <p className="text-2xl font-mono font-bold text-red-600 dark:text-red-400">{formatCurrency(Math.abs(summary.totalDebit), accounts[0].currency)}</p>
                                </CardContent>
                            </Card>

                            {/* Net Balance */}
                            <Card
                                className="bg-card border-blue-500/20 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md"
                                onClick={handleNetClick}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Wallet className="h-12 w-12 text-blue-500" />
                                </div>
                                <CardContent className="p-5 relative z-10">
                                    <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-1 tracking-widest flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> {t('results.net_balance')}
                                    </p>
                                    <p className="text-2xl font-mono font-bold text-foreground">{formatCurrency(summary.net, accounts[0].currency)}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Transactions Toolbar & Table (Flex 1 to fill space) */}
                        <div className="flex-1 min-h-0 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                            <TransactionsToolbar
                                search={search}
                                onSearchChange={setSearch}
                                typeFilter={typeFilter}
                                onTypeFilterChange={setTypeFilter}
                                chips={chips}
                                onRemoveChip={handleRemoveChip}
                                onClearAll={handleClearAll}
                            />

                            {/* Filtered Tables */}
                            <div className="flex-1 overflow-hidden mt-2 space-y-4 overflow-y-auto pr-1">
                                {filteredAccounts.map((acc, idx) => (
                                    <Card key={idx} className="bg-card border-border overflow-hidden flex flex-col shadow-sm">
                                        <div className="bg-muted border-b border-border z-10 grid items-center"
                                            style={{ gridTemplateColumns: `repeat(${acc.preview_headers.length}, minmax(120px, 1fr))` }}>
                                            {acc.preview_headers.map((header, i) => (
                                                <div key={i} className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap truncate border-r border-border/50 last:border-0 hover:bg-muted/80 transition-colors" title={header}>
                                                    {header}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-background">
                                            {acc.preview_rows.length > 0 ? (
                                                acc.preview_rows.map((row, i) => (
                                                    <div key={i} className="group hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0 grid items-center text-sm"
                                                        style={{ gridTemplateColumns: `repeat(${acc.preview_headers.length}, minmax(120px, 1fr))` }}>
                                                        {acc.preview_headers.map((header, j) => (
                                                            <div key={j} className="px-4 py-2.5 font-mono text-muted-foreground group-hover:text-foreground truncate border-r border-border/50 last:border-0">
                                                                {row[header]}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                                    <FileX className="h-8 w-8 opacity-20" />
                                                    <span className="text-sm">{t('results.no_results')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            <DocumentLimitModal
                isOpen={isLimitModalOpen}
                onClose={() => setIsLimitModalOpen(false)}
                onSubscribe={() => {
                    setIsLimitModalOpen(false);
                    router.push("/dashboard?tab=settings&view=billing");
                    setTimeout(() => {
                        const starterCard = document.getElementById('starter-plan-card');
                        if (starterCard) {
                            starterCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            starterCard.classList.add('highlight-pulse');
                            setTimeout(() => starterCard.classList.remove('highlight-pulse'), 2000);
                        }
                    }, 500);
                }}
                onViewPlans={() => {
                    setIsLimitModalOpen(false);
                    router.push("/dashboard?tab=settings&view=billing");
                }}
                accountCreatedAt={userMetrics?.account_created_at}
                welcomeOfferUsed={userMetrics?.welcome_offer_used}
                welcomeOfferExpiresAt={userMetrics?.welcome_offer_expires_at}
                plan={(userMetrics?.subscription_tier as any) || 'free'}
                used={(userMetrics?.credits_used || 0)}
                limit={(userMetrics?.credits_total || 5)}
            />
        </div >
    );
}
