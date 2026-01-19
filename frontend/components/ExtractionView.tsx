"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload, X, Download, FileSpreadsheet, Loader2,
    FileText, Zap, ShieldCheck, Activity, CheckCircle2,
    TrendingUp, TrendingDown, Building, RefreshCcw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
}

// --- UTILS (CORRIGIDO) ---

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

    // Se estiver no mapa, retorna o ISO. Se não, retorna o original (esperando que seja ISO)
    // Se o original tiver mais de 3 letras e não estiver no mapa, forçamos um fallback seguro para não quebrar
    const code = map[clean] || clean;
    return code.length === 3 ? code : 'USD'; // Fallback final se o código for bizarro (ex: "UNK")
};

const formatCurrency = (value: number, currency: string) => {
    try {
        const isoCode = normalizeCurrencyCode(currency);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: isoCode,
        }).format(value);
    } catch (e) {
        // Fallback de segurança: Se ainda assim der erro, formata apenas como número
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value);
    }
};

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
        accept: mode === 'pdf' ? { 'application/pdf': ['.pdf'] } : { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
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

        // Timer visual de progresso (placebo para UX)
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

                    // Decodifica o chunk atual e adiciona ao buffer
                    buffer += decoder.decode(value, { stream: true });

                    // Tenta separar por dupla quebra de linha (padrão SSE)
                    const parts = buffer.split("\n\n");

                    // O último pedaço quase sempre está incompleto, então guardamos ele de volta no buffer
                    // para esperar o próximo chunk da rede completar ele.
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
                                setProgress(100);
                                setAccounts(payload.accounts);
                            }
                            else if (payload.type === "error") {
                                throw new Error(payload.message);
                            }
                        } catch (e) {
                            console.warn("JSON Parse warning (chunk ignorado):", e);
                        }
                    }
                }
            }

            clearInterval(interval);
            setTimeout(() => setIsLoading(false), 500);

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

    const downloadCSV = (acc: AccountData) => {
        if (acc.csv_content) downloadFile(acc.csv_content, `${acc.account_name}.csv`, "text/csv;charset=utf-8;");
    }

    const downloadQBO = (acc: AccountData) => {
        if (acc.qbo_content) downloadFile(acc.qbo_content, `${acc.account_name}.qbo`, "application/octet-stream");
    }

    return (
        <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {accounts.length === 0 && (
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
                                AI Powered Engine v2.0
                            </Badge>
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Bank-Grade Security
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
                        <p className="text-slate-500 mt-1 max-w-2xl">{description}</p>
                    </div>
                </div>
            )}

            {accounts.length === 0 && (
                <div className="w-full max-w-2xl mx-auto">
                    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden transition-all duration-500">
                        <CardContent className="p-0">
                            {!isLoading ? (
                                <div className="p-1">
                                    <div {...getRootProps()} className={`relative group border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${file ? 'border-blue-200 bg-blue-50/20' : isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300'}`}>
                                        <input {...getInputProps()} />

                                        {file ? (
                                            <div className="w-full relative animate-in zoom-in-95">
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); resetForm(); }} className="absolute -top-6 -right-6 h-7 w-7 rounded-full bg-white shadow border text-slate-400 hover:text-red-500 z-20">
                                                    <X className="h-3 w-3" />
                                                </Button>
                                                <div className="relative mx-auto w-32 aspect-[3/4] bg-white rounded shadow-sm border p-1 mb-3">
                                                    {previewUrl ? <img src={previewUrl} className="w-full h-full object-contain opacity-90" alt="Preview" /> : <div className="h-full flex items-center justify-center"><FileText className="text-slate-200" /></div>}
                                                </div>
                                                <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                                                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <div className="py-8">
                                                <div className="h-16 w-16 bg-white rounded-xl shadow-sm border flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:text-blue-600 transition-all">
                                                    <Upload className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900">Upload Statement</h3>
                                                <p className="text-sm text-slate-500 mt-1 max-w-[250px] mx-auto">
                                                    Drag and drop PDF documents or high-quality images.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-24 px-8 text-center bg-slate-50/30">
                                    <div className="mx-auto relative mb-6">
                                        <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-w-[240px] mx-auto">
                                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                            <span>Processing</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                                        </div>
                                        <p className="text-xs font-medium text-slate-500 animate-pulse">{status}</p>
                                    </div>
                                </div>
                            )}

                            {!isLoading && file && (
                                <div className="p-4 bg-slate-50 border-t border-slate-100">
                                    <Button className="w-full h-11 text-base bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg" onClick={handleExtract}>
                                        <Zap className="h-4 w-4 mr-2 text-yellow-400" /> Extract Data
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {accounts.length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* 1. CONTROL BAR */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="h-10 w-10 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-center text-emerald-600">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    {file?.name}
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] h-5 px-1.5 gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Processed
                                    </Badge>
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3 text-blue-500" />
                                        Deleted from server
                                    </span>
                                    <span className="text-slate-300">|</span>
                                    <span>{summary.count} transactions</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button variant="outline" size="sm" onClick={resetForm} className="text-slate-600 hover:text-slate-900 border-slate-200">
                                <RefreshCcw className="h-3.5 w-3.5 mr-2" /> New File
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                        <Download className="h-3.5 w-3.5 mr-2" /> Export
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => downloadCSV(accounts[0])} className="cursor-pointer">
                                        <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => downloadQBO(accounts[0])} className="cursor-pointer">
                                        <span className="mr-2 font-bold text-blue-600 text-xs border border-blue-200 rounded px-0.5">Qb</span> QBO
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* 2. METRICS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-slate-200 shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">CREDIT</span>
                                </div>
                                <p className="text-2xl font-mono font-bold text-slate-900">{formatCurrency(summary.totalCredit, accounts[0].currency)}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200 shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-red-50 rounded-lg"><TrendingDown className="h-4 w-4 text-red-600" /></div>
                                    <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">DEBIT</span>
                                </div>
                                <p className="text-2xl font-mono font-bold text-slate-900">{formatCurrency(Math.abs(summary.totalDebit), accounts[0].currency)}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-900 shadow-md text-white">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-white/10 rounded-lg"><Activity className="h-4 w-4 text-blue-300" /></div>
                                    <span className="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full">NET</span>
                                </div>
                                <p className="text-2xl font-mono font-bold text-white">{formatCurrency(summary.net, accounts[0].currency)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 3. FULL DATA TABLE (Scrollable) */}
                    {accounts.map((acc, idx) => (
                        <Card key={idx} className="border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                            {/* h-[600px] define a altura fixa do card para permitir scroll interno */}

                            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3 px-6 flex flex-row items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">{acc.account_name}</span>
                                    <span className="text-xs text-slate-400 font-mono ml-2">({acc.currency})</span>
                                </div>
                                <div className="text-xs text-slate-400">
                                    Showing all {acc.preview_rows.length} extracted rows
                                </div>
                            </CardHeader>

                            <div className="flex-1 overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                        <TableRow className="hover:bg-white border-b border-slate-200">
                                            {acc.preview_headers.map((header, i) => (
                                                <TableHead key={i} className="text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap px-6 h-10 bg-slate-50">
                                                    {header}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {acc.preview_rows.map((row, i) => (
                                            <TableRow key={i} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                                {acc.preview_headers.map((header, j) => (
                                                    <TableCell key={j} className="font-mono text-xs text-slate-600 px-6 py-3 whitespace-nowrap">
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