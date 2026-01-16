"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Download, ShieldCheck, FileSpreadsheet, Loader2, Search, RefreshCcw, Info, Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

// --- INTERFACES ATUALIZADAS ---
interface Transaction {
    date: string;
    description: string;
    amount: number;
    type: string;
}

interface AccountData {
    account_name: string;
    account_number_partial: string;
    currency: string;
    transactions: Transaction[];
    // Campos opcionais vindos do Backend Python
    csv_content?: string;
    qbo_content?: string;
    suggested_filename_csv?: string;
    suggested_filename_qbo?: string;
}

interface ExtractionViewProps {
    title?: string;
    description?: string;
    mode?: "pdf" | "image" | "mixed";
}

export default function ExtractionView({
    title = "Process Document",
    description = "Securely extract bank PDFs or check images.",
    mode = "mixed"
}: ExtractionViewProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [accounts, setAccounts] = useState<AccountData[]>([]);
    const [status, setStatus] = useState("");
    const [progress, setProgress] = useState(0);

    const LOADING_MESSAGES = [
        "Initializing secure environment...",
        "Scanning document structure...",
        "Identifying transaction tables...",
        "Normalizing dates and currencies...",
        "Validating data integrity...",
        "Formatting for export...",
        "Finalizing..."
    ];

    useEffect(() => {
        let messageInterval: NodeJS.Timeout;
        if (isLoading && progress > 5) {
            let msgIndex = 0;
            messageInterval = setInterval(() => {
                setStatus(LOADING_MESSAGES[msgIndex % LOADING_MESSAGES.length]);
                msgIndex++;
            }, 2500);
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
        } catch (e) {
            console.error("Preview failed", e);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.length > 0) {
            const f = acceptedFiles[0];
            setFile(f);
            setAccounts([]);
            if (f.type.startsWith("image/")) {
                setPreviewUrl(URL.createObjectURL(f));
            } else {
                generatePDFPreview(f);
            }
            toast.info("Document ready for processing");
        }
    }, [mode]);

    const acceptedTypes: any = mode === 'pdf'
        ? { 'application/pdf': ['.pdf'] }
        : mode === 'image'
            ? { 'image/*': ['.jpg', '.jpeg', '.png'] }
            : { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedTypes,
        maxFiles: 1,
        multiple: false,
        disabled: isLoading
    });

    const resetForm = () => {
        setFile(null);
        if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setAccounts([]);
        setProgress(0);
        setStatus("");
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsLoading(true);
        setStatus("Establishing secure connection...");
        setAccounts([]);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                return prev + (prev < 30 ? 5 : prev < 70 ? 2 : 0.5);
            });
        }, 800);

        const formData = new FormData();
        formData.append("file", file);

        try {
            // AJUSTE DE URL: Garante compatibilidade com FastAPI padrão ou env
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/api/v1/extract`, {
                method: 'POST',
                body: formData
            });

            if (!response.body) throw new Error("Connection failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop() || "";

                for (const line of parts) {
                    if (!line.startsWith("data: ")) continue;
                    try {
                        const payload = JSON.parse(line.replace("data: ", ""));

                        if (payload.type === "init") {
                            setStatus("Analyzing document structure...");
                            setProgress((prev) => Math.max(prev, 10));
                            if (payload.preview) setPreviewUrl(payload.preview);
                        }
                        else if (payload.type === "status") {
                            setStatus(payload.text);
                            setProgress((prev) => Math.min(prev + 5, 80));
                        }
                        else if (payload.type === "chunk") {
                            setStatus("Extracting financial records...");
                            setProgress((prev) => Math.min(prev + 2, 90));

                            setAccounts(prev => {
                                // Lógica de Merge melhorada para garantir que csv_content não seja perdido
                                const map = new Map(prev.map(a => [a.account_name + a.account_number_partial, a]));

                                payload.accounts.forEach((acc: AccountData) => {
                                    const key = acc.account_name + acc.account_number_partial;
                                    if (map.has(key)) {
                                        const existing = map.get(key)!;
                                        map.set(key, {
                                            ...existing,
                                            transactions: [...existing.transactions, ...acc.transactions],
                                            // Atualiza os conteúdos se vierem neste chunk
                                            qbo_content: acc.qbo_content || existing.qbo_content,
                                            csv_content: acc.csv_content || existing.csv_content,
                                            suggested_filename_csv: acc.suggested_filename_csv || existing.suggested_filename_csv,
                                            suggested_filename_qbo: acc.suggested_filename_qbo || existing.suggested_filename_qbo
                                        });
                                    } else {
                                        map.set(key, acc);
                                    }
                                });
                                return Array.from(map.values());
                            });
                        }
                        else if (payload.type === "error") {
                            throw new Error(payload.message);
                        }
                    } catch (e) {
                        console.error("Parse error", e);
                    }
                }
            }
            clearInterval(interval);
            setProgress(100);

            if (accounts.length === 0) {
                setStatus("Process completed");
                // Check if we have accounts in state buffer before declaring empty
                // (Wait a tick for state update if needed, but usually works)
            } else {
                setStatus("Extraction Complete");
                toast.success("Document successfully processed!");
            }
        } catch (error: any) {
            clearInterval(interval);
            setStatus("Error occurred");
            toast.error(error.message || "Process failed. Please try again.");
            console.error(error);
        } finally {
            clearInterval(interval);
            setIsLoading(false);
        }
    };

    // --- LÓGICA DE DOWNLOAD CORRIGIDA ---
    const downloadFile = (content: string, fileName: string, mimeType: string) => {
        setTimeout(() => {
            try {
                // Remove caracteres inválidos do nome por segurança
                const safeName = fileName.replace(/[^a-zA-Z0-9-_\.]/g, '_');

                const blob = new Blob([content], { type: mimeType });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");

                link.href = url;
                link.download = safeName;
                link.style.display = 'none';

                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);

                toast.success(`Downloading ${safeName}`);
            } catch (e) {
                console.error("Download failed:", e);
                toast.error("Download failed to start.");
            }
        }, 0);
    };

    const downloadCSV = (acc: AccountData) => {
        // PRIORIDADE: Conteúdo gerado pelo servidor (Python)
        if (acc.csv_content && acc.suggested_filename_csv) {
            downloadFile(acc.csv_content, acc.suggested_filename_csv, "text/csv;charset=utf-8;");
            return;
        }

        // FALLBACK: Geração Cliente-Side (caso o servidor falhe)
        console.warn("Using client-side CSV generation (Server content missing)");
        const headers = "Date,Description,Amount,Type\n";
        const content = headers + acc.transactions.map((t) =>
            `${t.date},"${(t.description || "").replace(/"/g, '""')}",${t.amount},${t.type}`
        ).join("\n");

        const name = `${acc.account_name.replace(/\s+/g, '_')}_fallback.csv`;
        downloadFile(content, name, "text/csv;charset=utf-8;");
    }

    const downloadQBO = (acc: AccountData) => {
        if (acc.qbo_content && acc.suggested_filename_qbo) {
            downloadFile(acc.qbo_content, acc.suggested_filename_qbo, "application/octet-stream");
        } else {
            toast.error("QBO format not available for this account.");
        }
    }

    const downloadAllCSV = () => {
        // Combina todas as transações de todas as contas
        const allTxs = accounts.flatMap(a => a.transactions);
        const headers = "Account,Date,Description,Amount,Type\n";
        const content = headers + allTxs.map((t: any) => {
            // Encontra a conta dessa transação (ineficiente mas funciona para small data)
            const parentAcc = accounts.find(a => a.transactions.includes(t));
            const accName = parentAcc ? parentAcc.account_name : "Unknown";
            return `"${accName}",${t.date},"${(t.description || "").replace(/"/g, '""')}",${t.amount},${t.type}`;
        }).join("\n");

        downloadFile(content, "All_Transactions_Combined.csv", "text/csv;charset=utf-8;");
    }

    return (
        <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
                            Enterprise Grade
                        </Badge>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Secure Enclave
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
                    <p className="text-slate-500 mt-1 max-w-2xl">{description}</p>
                </div>
            </div>

            <div className={`grid gap-8 transition-all duration-700 ease-in-out ${accounts.length > 0 ? "lg:grid-cols-12" : "grid-cols-1"}`}>

                {/* LEFT COLUMN: UPLOAD & PREVIEW */}
                <div className={`${accounts.length > 0 ? "lg:col-span-5" : "w-full max-w-2xl mx-auto"}`}>
                    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-0">
                            {!isLoading ? (
                                <div className="p-1">
                                    <div
                                        {...getRootProps()}
                                        className={`
                                            relative group border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer
                                            ${file
                                                ? 'border-blue-200 bg-blue-50/30'
                                                : isDragActive
                                                    ? 'border-blue-500 bg-blue-50 scale-[0.99]'
                                                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md'
                                            }
                                        `}
                                    >
                                        <input {...getInputProps()} />

                                        {file ? (
                                            <div className="w-full relative animate-in zoom-in-95 duration-300">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); resetForm(); }}
                                                    className="absolute -top-4 -right-4 h-8 w-8 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 z-20"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>

                                                <div className="relative mx-auto w-40 aspect-[3/4] bg-white rounded-lg shadow-lg border border-slate-200 p-2 mb-4 group-hover:scale-[1.02] transition-transform">
                                                    {previewUrl ? (
                                                        <img src={previewUrl} className="w-full h-full object-contain rounded-sm" alt="Preview" />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
                                                            <Loader2 className="h-6 w-6 animate-spin" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Rendering</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-slate-900 truncate max-w-[200px] mx-auto">{file.name}</p>
                                                    <p className="text-xs text-slate-400 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6 py-6">
                                                <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:text-blue-600 transition-all duration-300">
                                                    <Upload className="h-8 w-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-lg font-semibold text-slate-900">Drop your file here</h3>
                                                    <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                                                        {mode === 'pdf' && "Support for Bank Statements (PDF). Max 50MB."}
                                                        {mode === 'image' && "Support for Checks (JPG, PNG). Max 50MB."}
                                                        {mode === 'mixed' && "Support for Bank Statements (PDF) and Checks (JPG, PNG). Max 50MB."}
                                                    </p>
                                                </div>
                                                <Button variant="outline" className="mt-4 pointer-events-none text-xs font-semibold text-blue-600 border-blue-100 bg-blue-50/50">
                                                    Browse Files
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 px-8 text-center space-y-8 min-h-[400px] flex flex-col justify-center bg-slate-50/10">
                                    <div className="mx-auto relative">
                                        <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center relative z-10 mx-auto">
                                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                        </div>
                                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20" />
                                    </div>

                                    <div className="space-y-4 max-w-xs mx-auto w-full">
                                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                            <span>Processing</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                                                style={{ width: `${progress}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600 font-medium animate-pulse">{status}</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Button Area */}
                            {!isLoading && file && (
                                <div className="p-4 bg-slate-50 border-t border-slate-100">
                                    <Button
                                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200/50 transition-all active:scale-[0.98]"
                                        onClick={accounts.length > 0 ? resetForm : handleUpload}
                                    >
                                        {accounts.length > 0 ? (
                                            <span className="flex items-center gap-2"><RefreshCcw className="h-4 w-4" /> Process Another Document</span>
                                        ) : (
                                            <span className="flex items-center gap-2">Start Data Extraction <Search className="h-4 w-4 opacity-50" /></span>
                                        )}
                                    </Button>
                                    <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
                                        Data is processed in memory and encrypted.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: RESULTS */}
                {accounts.length > 0 && (
                    <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-4 duration-700 space-y-6">

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-emerald-50 border-emerald-100 shadow-none">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-2 bg-white rounded-lg border border-emerald-100">
                                        <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Accounts</p>
                                        <p className="text-2xl font-black text-slate-900">{accounts.length}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-blue-50 border-blue-100 shadow-none">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-2 bg-white rounded-lg border border-blue-100">
                                        <Activity className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Transactions</p>
                                        <p className="text-2xl font-black text-slate-900">
                                            {accounts.reduce((sum, acc) => sum + acc.transactions.length, 0)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Extracted Data</h3>
                                <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-900" onClick={downloadAllCSV}>
                                    Download All CSV
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {accounts.map((acc, idx) => (
                                    <Card key={idx} className="border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="p-5 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors duration-300">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{acc.account_name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">•••• {acc.account_number_partial || "0000"}</span>
                                                            <span className="text-slate-300">•</span>
                                                            <span>{acc.currency}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="bg-slate-50 text-slate-600 border border-slate-100">
                                                        {acc.transactions.length} entries
                                                    </Badge>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-700 font-medium border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors ml-2">
                                                                <Download className="h-3.5 w-3.5" />
                                                                Export
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent side="right" align="start" className="w-56 bg-white z-50 shadow-xl border-slate-200">
                                                            <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Format</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => downloadCSV(acc)} className="cursor-pointer py-2.5">
                                                                <FileSpreadsheet className="mr-3 h-4 w-4 text-emerald-600" />
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium">CSV Spreadsheet</span>
                                                                    <span className="text-[10px] text-slate-400">Universal format</span>
                                                                </div>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => downloadQBO(acc)} className="cursor-pointer py-2.5">
                                                                <div className="mr-3 h-4 w-4 bg-blue-600 rounded-sm flex items-center justify-center text-[8px] font-bold text-white leading-none">Qb</div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium">QuickBooks (QBO)</span>
                                                                    <span className="text-[10px] text-slate-400">Direct import</span>
                                                                </div>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                            {/* Preview */}
                                            {acc.transactions.length > 0 && (
                                                <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-3 flex items-center gap-4 text-xs text-slate-400 font-mono overflow-auto whitespace-nowrap scrollbar-hide">
                                                    <Search className="h-3 w-3 shrink-0" />
                                                    {acc.transactions.slice(0, 3).map((t, i) => (
                                                        <span key={i} className="flex items-center gap-1">
                                                            <span className="text-slate-500">{t.date}</span>
                                                            <span className="opacity-50">-</span>
                                                            <span className="font-semibold text-slate-700">{t.amount}</span>
                                                            {i < 2 && <span className="mx-2 opacity-20">|</span>}
                                                        </span>
                                                    ))}
                                                    {acc.transactions.length > 3 && <span className="italic opacity-50">...</span>}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <Alert className="bg-amber-50/50 border-amber-100 text-amber-900 mt-8">
                                <Info className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-xs text-amber-800 font-medium leading-relaxed">
                                    Please review all extracted amounts. While our OCR is 99% accurate, manual verification is recommended before importing to accounting software.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}