"use client";

import { useUser } from "@clerk/nextjs";
import { incrementMetric } from "@/app/actions/metrics";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload, X, Download, FileSpreadsheet, Loader2,
    FileText, Zap, ShieldCheck, Activity, CheckCircle2,
    TrendingUp, TrendingDown, Building, RefreshCcw,
    Lock, FileX, Trash2, Server, Wallet
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    title = "Process Document",
    description = "Securely extract bank PDFs or check images.",
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
            toast.info(t('dropzone.document_loaded'));
        }
    }, [mode]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: mode === 'pdf'
            ? { 'application/pdf': ['.pdf'] }
            : mode === 'image'
                ? { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }
                : { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
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

        // Check for Free Tier Limits
        if (isFree) {
            if ((userMetrics?.free_documents_processed || 0) >= 5) {
                setIsLimitModalOpen(true);
                return;
            }
        } else {
            // Check Paid Tier Limit (Starter/Pro)
            const creditsUsed = userMetrics?.credits_used || 0;
            const creditsTotal = userMetrics?.credits_total || 0;

            // If limited (not -1) and exhausted
            if (creditsTotal !== -1 && creditsUsed >= creditsTotal) {
                // Show limit modal (reuse similar modal or custom)
                // For now reusing DocumentLimitModal which redirects to billing
                setIsLimitModalOpen(true);
                return;
            }
        }

        setIsLoading(true);
        setStatus(t('processing.init'));
        setAccounts([]);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                return prev + (prev < 30 ? 5 : prev < 70 ? 2 : 0.5);
            });
        }, 800);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`${apiUrl}/api/v1/extract`, {
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
                                    console.log("[ExtractionView] Calling onSuccess...");
                                    // Calculate total transaction count (using total rows to match UI display)
                                    const transactionCount = payload.accounts.reduce((sum: number, acc: AccountData) => sum + acc.preview_rows.length, 0);
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
            const fileName = `${acc.account_name}.csv`;
            downloadFile(acc.csv_content, fileName, "text/csv;charset=utf-8;");
            await incrementMetric(user?.id, 'csv_exports', 1);
            if (onDownload) onDownload("CSV", fileName);
        }
    }

    const downloadQBO = async (acc: AccountData) => {
        if (acc.qbo_content) {
            const fileName = `${acc.account_name}.qbo`;
            downloadFile(acc.qbo_content, fileName, "application/octet-stream");
            await incrementMetric(user?.id, 'qbo_exports', 1);
            if (onDownload) onDownload("QBO", fileName);
        }
    }

    // --- FILTER LOGIC ---
    const filteredAccounts = useMemo(() => {
        if (!search && typeFilter === 'all') return accounts;

        // Helper to parse currency strings (e.g. "R$ 1.200,50" -> 1200.50)
        const parseAmount = (str: any): number => {
            if (!str || typeof str !== 'string') return 0;
            const clean = str.replace(/[^\d.,-]/g, ''); // Keep only nums, separators, sign
            if (!clean) return 0;

            // Heuristic for locale:
            const lastComma = clean.lastIndexOf(',');
            const lastDot = clean.lastIndexOf('.');

            let normalized = clean;
            if (lastComma > lastDot) {
                // Comma is decimal (PT-BR: 1.000,00)
                normalized = clean.replace(/\./g, '').replace(',', '.');
            } else {
                // Dot is decimal (US: 1,000.00) or no separator
                normalized = clean.replace(/,/g, '');
            }
            return parseFloat(normalized);
        };

        return accounts.map(acc => {
            // Identify Columns (Normalize Schema)
            const headers = acc.preview_headers.map(h => h.toLowerCase());

            const debitHeader = acc.preview_headers.find(h => /debit|débito|saída|outgoing/i.test(h));
            const creditHeader = acc.preview_headers.find(h => /credit|crédito|entrada|deposit/i.test(h));
            const amountHeader = acc.preview_headers.find(h => /valor|amount|price|value/i.test(h) && !/saldo|balance/i.test(h) && !/debit|débito|credit|crédito/i.test(h));

            // Determine indices to keep based on ROW CONTENT
            const indicesToKeep = acc.preview_rows.reduce((indices: number[], row, idx) => {
                // Determine Net Value
                let netValue = 0;

                if (debitHeader || creditHeader) {
                    // Two-column layout strategy
                    const debitVal = debitHeader ? Math.abs(parseAmount(row[debitHeader])) : 0;
                    const creditVal = creditHeader ? Math.abs(parseAmount(row[creditHeader])) : 0;

                    // Logic: If we have a value in Debit col, it's an outflow (-). If Credit col, inflow (+).
                    if (debitVal > 0) netValue -= debitVal;
                    if (creditVal > 0) netValue += creditVal;

                    // Edge case: Note that some statements might have "Amount" + "Type(D/C)" column. 
                    // But usually regex catches explicit "Debit/Credit" headers.
                } else if (amountHeader) {
                    // Single-column layout strategy
                    netValue = parseAmount(row[amountHeader]);
                }

                // 1. Type Filter (Debit/Credit)
                let typeMatch = true;
                if (typeFilter !== 'all') {
                    if (netValue === 0) typeMatch = false; // Ignore zero/empty rows in strict mode
                    else if (typeFilter === 'debit') typeMatch = netValue < 0;
                    else if (typeFilter === 'credit') typeMatch = netValue > 0;
                }

                // 2. Search Filter
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
                transactions: indicesToKeep.map(i => acc.transactions[i] || { amount: 0 }), // Safe fallback if tx missing
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
            {/* UPLOAD VIEW (Empty State) */}
            {accounts.length === 0 && (
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                    Engine V2
                                </div>
                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" /> Encrypted Processing
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">{viewTitle}</h1>
                            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{viewDesc}</p>
                        </div>
                    </div>

                    <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center pb-40">
                        <Card className="border border-border bg-card shadow-none overflow-hidden">
                            <CardContent className="p-0">
                                {!isLoading ? (
                                    <div className="p-1">
                                        <div {...getRootProps()} className={cn(
                                            "relative group border border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer h-[300px]",
                                            file
                                                ? "border-primary/50 bg-primary/5"
                                                : isDragActive
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border bg-muted/30 hover:bg-muted/50 hover:border-border/80"
                                        )}>
                                            <input {...getInputProps()} />

                                            {file ? (
                                                <div className="w-full relative animate-in fade-in zoom-in-95 duration-200">
                                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); resetForm(); }} className="absolute -top-8 -right-8 h-8 w-8 rounded-full bg-muted text-muted-foreground hover:text-destructive hover:bg-muted/80 z-20">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                    <div className="relative mx-auto w-24 aspect-[3/4] bg-white rounded shadow-sm p-1 mb-4 opacity-90">
                                                        {previewUrl ? <img src={previewUrl} className="w-full h-full object-contain" alt="Preview" /> : <div className="h-full flex items-center justify-center"><FileText className="text-slate-400" /></div>}
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground truncate max-w-[200px] mx-auto">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 group-hover:bg-muted/80 transition-all">
                                                        <Upload className="h-8 w-8 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-foreground">{t('dropzone.click_to_upload')}</h3>
                                                        <p className="text-sm text-muted-foreground mt-1 max-w-[200px] mx-auto">
                                                            {t('dropzone.subtitle')}
                                                        </p>
                                                        <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-border">
                                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                                <Server className="h-3 w-3 text-muted-foreground" /> {t('dropzone.ram_only')}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                                <Trash2 className="h-3 w-3 text-muted-foreground" /> {t('dropzone.auto_wipe')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-12 px-8 text-center bg-card min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                                        <AnimatePresence mode="wait">
                                            {progress < 100 ? (
                                                <motion.div
                                                    key="processing"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="relative z-10 w-full max-w-md"
                                                >
                                                    <div className="relative mx-auto mb-8 w-24 h-32 bg-muted rounded-lg border border-border flex items-center justify-center shadow-2xl">
                                                        <FileText className="h-10 w-10 text-muted-foreground" />
                                                        <motion.div
                                                            className="absolute inset-0 bg-primary/10 border-b-2 border-primary"
                                                            animate={{ top: ["0%", "100%", "0%"] }}
                                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                            style={{ height: "4px" }}
                                                        />
                                                        <motion.div
                                                            className="absolute -top-6 -right-6"
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                        >
                                                            <ShieldCheck className="h-8 w-8 text-emerald-500" />
                                                        </motion.div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h3 className="text-xl font-bold text-foreground animate-pulse">{status || t('processing.title')}</h3>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                                                <span>{t('processing.encryption_active')}</span>
                                                                <span>{Math.round(progress)}%</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border">
                                                                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="shredding"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="relative z-10 text-center"
                                                >
                                                    <div className="relative mx-auto mb-8">
                                                        <motion.div
                                                            animate={{
                                                                y: [0, 50],
                                                                opacity: [1, 0],
                                                                scale: [1, 0.8]
                                                            }}
                                                            transition={{ duration: 1.5, ease: "easeInOut" }}
                                                            className="relative z-10 mx-auto w-20 h-24 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center"
                                                        >
                                                            <FileText className="h-10 w-10 text-red-500" />
                                                        </motion.div>

                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.5 }}
                                                            className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20"
                                                        >
                                                            <Trash2 className="h-12 w-12 text-slate-600" />
                                                        </motion.div>
                                                    </div>

                                                    <h3 className="text-2xl font-bold text-white mb-2">{t('processing.discarding')}</h3>
                                                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                                        {t('processing.discarding_desc')}
                                                        <span className="block mt-2 text-emerald-400 font-bold flex items-center justify-center gap-2">
                                                            <CheckCircle2 className="h-4 w-4" /> {t('processing.zero_retention')}
                                                        </span>
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {!isLoading && file && (
                                    <div className="p-4 bg-muted/30 border-t border-border">
                                        <Button size="lg" className="w-full font-bold shadow-none" onClick={handleExtract}>
                                            {t('processing.start_extraction')}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* RESULTS VIEW */}
            {accounts.length > 0 && (
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 min-h-0 flex flex-col overflow-hidden pb-4">

                    {/* 1. Task Header with Primary CTA */}
                    <TaskHeader
                        title={t('results.title')}
                        subtitle={t('results.subtitle')}
                        primaryCtaLabel={t('results.upload_another')}
                        onPrimaryCtaClick={resetForm}
                    />

                    {/* 2. File Summary Card - File Actions Only */}
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

                    {/* 3. KPI Cards Row (Existing but updated with onClick filters) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Credit */}
                        <Card
                            className={cn(
                                "bg-card border-border shadow-xl relative overflow-hidden group cursor-pointer transition-all",
                                typeFilter === 'credit' && "ring-2 ring-emerald-500/40 bg-muted/20"
                            )}
                            onClick={handleTotalCreditClick}
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                <TrendingUp className="h-12 w-12 text-emerald-500" />
                            </div>
                            <CardContent className="p-6 relative z-10">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-widest flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t('results.total_credit')}
                                </p>
                                <p className="text-2xl font-mono font-bold text-emerald-500">{formatCurrency(summary.totalCredit, accounts[0].currency)}</p>
                            </CardContent>
                        </Card>

                        {/* Total Debit */}
                        <Card
                            className={cn(
                                "bg-card border-border shadow-xl relative overflow-hidden group cursor-pointer transition-all",
                                typeFilter === 'debit' && "ring-2 ring-red-500/40 bg-muted/20"
                            )}
                            onClick={handleTotalDebitClick}
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                <TrendingDown className="h-12 w-12 text-red-500" />
                            </div>
                            <CardContent className="p-6 relative z-10">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-widest flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {t('results.total_debit')}
                                </p>
                                <p className="text-2xl font-mono font-bold text-red-400">{formatCurrency(Math.abs(summary.totalDebit), accounts[0].currency)}</p>
                            </CardContent>
                        </Card>

                        {/* Net Balance */}
                        <Card
                            className="bg-card border-blue-500/20 shadow-xl shadow-blue-900/10 relative overflow-hidden group cursor-pointer"
                            onClick={handleNetClick}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent" />
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                <Wallet className="h-12 w-12 text-blue-500" />
                            </div>
                            <CardContent className="p-6 relative z-10">
                                <p className="text-[10px] uppercase font-bold text-blue-500 mb-2 tracking-widest flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> {t('results.net_balance')}
                                </p>
                                <p className="text-2xl font-mono font-bold text-foreground">{formatCurrency(summary.net, accounts[0].currency)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 4. Transactions Toolbar */}
                    <TransactionsToolbar
                        search={search}
                        onSearchChange={setSearch}
                        typeFilter={typeFilter}
                        onTypeFilterChange={setTypeFilter}
                        chips={chips}
                        // Use string keys to remove
                        onRemoveChip={handleRemoveChip}
                        onClearAll={handleClearAll}
                    />

                    {/* 5. filtered Table */}
                    {filteredAccounts.map((acc, idx) => (
                        <Card key={idx} className="bg-card border-border overflow-hidden flex flex-col flex-1 min-h-0 shadow-sm mt-2">
                            {/* Detached Grid Header */}
                            <div className="bg-muted border-b border-border shrink-0 z-10 grid items-center"
                                style={{ gridTemplateColumns: `repeat(${acc.preview_headers.length}, minmax(150px, 1fr))` }}>
                                {acc.preview_headers.map((header, i) => (
                                    <div key={i} className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap truncate border-r border-border/50 last:border-0">
                                        {header}
                                    </div>
                                ))}
                            </div>

                            {/* Scrollable Grid Body */}
                            <div className="flex-1 overflow-auto bg-background [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full">
                                {acc.preview_rows.length > 0 ? (
                                    acc.preview_rows.map((row, i) => (
                                        <div key={i} className="group hover:bg-muted/50 transition-colors border-b border-border last:border-0 grid items-center"
                                            style={{ gridTemplateColumns: `repeat(${acc.preview_headers.length}, minmax(150px, 1fr))` }}>
                                            {acc.preview_headers.map((header, j) => (
                                                <div key={j} className="px-6 py-3 text-xs font-mono text-muted-foreground group-hover:text-foreground truncate border-r border-border/50 last:border-0">
                                                    {row[header]}
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                                        {t('results.no_results')}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <DocumentLimitModal
                isOpen={isLimitModalOpen}
                onClose={() => setIsLimitModalOpen(false)}
                onSubscribe={() => {
                    setIsLimitModalOpen(false);

                    // Navigate to Settings tab with Billing view
                    router.push("/dashboard?tab=settings&view=billing");

                    // Scroll to Starter plan and highlight it
                    setTimeout(() => {
                        const starterCard = document.getElementById('starter-plan-card');
                        if (starterCard) {
                            starterCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Add highlight animation
                            starterCard.classList.add('highlight-pulse');
                            setTimeout(() => starterCard.classList.remove('highlight-pulse'), 2000);
                        }
                    }, 500); // Increased timeout to ensure tab switch completes
                }}
                onViewPlans={() => {
                    setIsLimitModalOpen(false);
                    router.push("/dashboard?tab=settings&view=billing");
                }}
                accountCreatedAt={user?.createdAt?.toString()}
                welcomeOfferUsed={userMetrics?.welcome_offer_used}
                plan={(userMetrics?.subscription_tier as any) || 'free'}
                used={
                    (!userMetrics || !userMetrics.subscription_tier || userMetrics.subscription_tier === 'free')
                        ? (userMetrics?.free_documents_processed || 0)
                        : (userMetrics?.credits_used || 0)
                }
                limit={
                    (!userMetrics || !userMetrics.subscription_tier || userMetrics.subscription_tier === 'free')
                        ? 5
                        : (userMetrics?.credits_total || 0)
                }
                resetsAt={userMetrics?.subscription_current_period_end || undefined}
            />
        </div>
    );
}