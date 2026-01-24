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

import { Button } from "@/components/ui/button";
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
    onSuccess?: (file: File) => void;
    onDownload?: (type: "CSV" | "QBO", fileName: string) => void;
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
    onDownload
}: ExtractionViewProps) {
    const { user } = useUser();
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [accounts, setAccounts] = useState<AccountData[]>([]);
    const [status, setStatus] = useState("");
    const [progress, setProgress] = useState(0);

    // --- FINANCIAL MATH ---
    const summary = useMemo(() => {
        if (accounts.length === 0) return { totalCredit: 0, totalDebit: 0, net: 0, count: 0 };

        let totalCredit = 0;
        let totalDebit = 0;
        let count = 0;

        accounts.forEach(acc => {
            acc.transactions.forEach(tx => {
                count++;
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
                "Initializing secure enclave...",
                "Scanning layout & geometry...",
                "Detecting dynamic columns...",
                "Aligning financial types...",
                "Validating integrity...",
                "Formatting exports...",
                "Finalizing..."
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
            toast.info("Document loaded");
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
        setIsLoading(true);
        setStatus("Initializing extraction engine...");
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
                                    onSuccess(file);
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
            setStatus("Process Failed");
            toast.error(error.message || "Extraction interrupted");
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
        toast.success(`Downloaded ${fileName}`);
    };

    const downloadCSV = async (acc: AccountData) => {
        if (acc.csv_content) {
            const fileName = `${acc.account_name}.csv`;
            downloadFile(acc.csv_content, fileName, "text/csv;charset=utf-8;");
            await incrementMetric(user?.id, 'csv_exports', 1);
            if (onDownload) onDownload("CSV", fileName);
            // Trigger refresh (metrics update) - pass file if available, or just ignore since we handled download separately?
            // Since onSuccess signature changed, we shouldn't call it here without a file context, and it implies "New Extraction Success".
            // So we rely on onDownload for history updates.
            // But we might want to refresh metrics. For now let's assume metrics.ts handles DB updates and parent re-fetches on interval or we triggers a separate metrics refresh?
            // The previous code used onSuccess() to trigger re-fetch.
            // If I remove it, metrics might stale. 
            // Better to let onDownload handle history, and logic elsewhere handle metrics?
            // Actually, the parent `onSuccess` was `fetchMetrics`.
            // I should probably keep a way to just "refresh metrics".
            // But for now, let's just use onDownload.
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

    return (
        <div className="w-full max-w-7xl mx-auto pb-20">

            {accounts.length === 0 && (
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
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
                        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{description}</p>
                    </div>
                </div>
            )}

            {accounts.length === 0 && (
                <div className="w-full max-w-3xl mx-auto">
                    {/* AlGrow Style Card: Dark, Solid, Bordered */}
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
                                                    <h3 className="text-lg font-bold text-foreground">Click to Upload</h3>
                                                    <p className="text-sm text-muted-foreground mt-1 max-w-[200px] mx-auto">
                                                        PDF Statement or Check Image
                                                    </p>

                                                    {/* Trust Badges */}
                                                    <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-border">
                                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                            <Server className="h-3 w-3 text-muted-foreground" /> RAM-Only
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                            <Trash2 className="h-3 w-3 text-muted-foreground" /> Auto-Wipe
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 px-8 text-center bg-card min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
                                    {/* Background Grid Animation */}
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
                                                {/* SCANNING ANIMATION */}
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
                                                    <h3 className="text-xl font-bold text-foreground animate-pulse">{status || "Processing..."}</h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                                            <span>Encryption Active</span>
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

                                                <h3 className="text-2xl font-bold text-white mb-2">Discarding File</h3>
                                                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                                    Original document is being securely removed from server memory.
                                                    <span className="block mt-2 text-emerald-400 font-bold flex items-center justify-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4" /> Zero-Retention Policy
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
                                        Start Extraction
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {accounts.length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* RESULTS HEADER ACTION BAR */}
                    {/* RESULTS HEADER ACTION BAR */}
                    <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 pb-2">
                        <Button
                            onClick={resetForm}
                            className="bg-white dark:bg-[#0f172a] hover:bg-slate-100 dark:hover:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white shadow-xl dark:shadow-2xl shadow-blue-500/5 dark:shadow-blue-500/20 h-10 px-6 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] gap-2.5 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 group"
                        >
                            <RefreshCcw className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
                            <span className="animate-text-shine group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Process New File</span>
                        </Button>
                    </div>

                    {/* 1. RESULTS & ACTIONS CARD */}
                    <div className="bg-card rounded-2xl border border-border overflow-hidden p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                            {/* File Info */}
                            <div className="flex items-start gap-4">
                                <div className="shrink-0">
                                    <img
                                        src="https://png.pngtree.com/png-clipart/20250507/original/pngtree-modern-3d-icon-stylized-pdf-document-png-image_20937175.png"
                                        alt="PDF Icon"
                                        className="h-14 w-14 object-contain drop-shadow-2xl"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-foreground tracking-tight">{file?.name}</h2>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase border border-emerald-500/20">
                                            Success
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        Extraction complete • <span className="text-foreground font-bold">{summary.count} transactions</span> found
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3 w-full md:w-auto">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        onClick={() => downloadCSV(accounts[0])}
                                        className="bg-muted hover:bg-muted/80 text-foreground border border-border h-11 px-6 shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                                    >
                                        <div className="mr-3 h-5 w-5 bg-emerald-500/10 rounded flex items-center justify-center border border-emerald-500/20 shadow-sm">
                                            <FileSpreadsheet className="h-3 w-3 text-emerald-500" />
                                        </div>
                                        Download CSV
                                    </Button>
                                    <Button
                                        onClick={() => downloadQBO(accounts[0])}
                                        className="bg-muted hover:bg-muted/80 text-foreground border border-border h-11 px-6 shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                                    >
                                        <div className="mr-3 h-5 w-5 bg-[#2ca01c]/10 rounded flex items-center justify-center border border-[#2ca01c]/20 shadow-sm">
                                            <span className="text-[10px] font-black text-[#2ca01c] italic tracking-tighter">QB</span>
                                        </div>
                                        Download QBO
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. METRICS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Credit */}
                        <Card className="bg-card border-border shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                <TrendingUp className="h-12 w-12 text-emerald-500" />
                            </div>
                            <CardContent className="p-6 relative z-10">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-widest flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Total Credit
                                </p>
                                <p className="text-2xl font-mono font-bold text-emerald-500">{formatCurrency(summary.totalCredit, accounts[0].currency)}</p>
                            </CardContent>
                        </Card>

                        {/* Total Debit */}
                        <Card className="bg-card border-border shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                <TrendingDown className="h-12 w-12 text-red-500" />
                            </div>
                            <CardContent className="p-6 relative z-10">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-widest flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Total Debit
                                </p>
                                <p className="text-2xl font-mono font-bold text-red-400">{formatCurrency(Math.abs(summary.totalDebit), accounts[0].currency)}</p>
                            </CardContent>
                        </Card>

                        {/* Net Balance (Highlighted) */}
                        <Card className="bg-card border-blue-500/20 shadow-xl shadow-blue-900/10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent" />
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                <Wallet className="h-12 w-12 text-blue-500" />
                            </div>
                            <CardContent className="p-6 relative z-10">
                                <p className="text-[10px] uppercase font-bold text-blue-500 mb-2 tracking-widest flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> Net Balance
                                </p>
                                <p className="text-2xl font-mono font-bold text-foreground">{formatCurrency(summary.net, accounts[0].currency)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 3. FULL DATA TABLE */}
                    {accounts.map((acc, idx) => (
                        <Card key={idx} className="bg-card border-border overflow-hidden flex flex-col h-[600px]">

                            <CardHeader className="bg-muted/50 border-b border-border py-3 px-6 flex flex-row items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-bold text-foreground">{acc.account_name}</span>
                                </div>
                            </CardHeader>

                            <div className="flex-1 overflow-auto bg-background [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full">
                                <table className="w-full caption-bottom text-sm text-muted-foreground">
                                    <TableHeader className="sticky top-0 bg-muted z-10 border-b border-border">
                                        <TableRow className="border-border hover:bg-transparent">
                                            {acc.preview_headers.map((header, i) => (
                                                <TableHead key={i} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap px-6 h-10">
                                                    {header}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {acc.preview_rows.map((row, i) => (
                                            <TableRow key={i} className="group hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                                                {acc.preview_headers.map((header, j) => (
                                                    <TableCell key={j} className="font-mono text-xs px-6 py-3 whitespace-nowrap text-muted-foreground group-hover:text-foreground">
                                                        {row[header]}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </table>
                            </div>
                        </Card>
                    ))}
                </div>
            )
            }
        </div >
    );
}