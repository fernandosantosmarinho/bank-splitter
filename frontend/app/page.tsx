"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, ShieldCheck, FileSpreadsheet, MoreHorizontal, ChevronDown, Zap, Loader2, Search, RefreshCcw, Info } from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { toast } from "sonner";
import { UserButton } from "@clerk/nextjs";

// --- INTERFACES ---
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
  qbo_content?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);

  // Rotating messages for long waits
  const LOADING_MESSAGES = [
    "Analyzing document structure...",
    "Identifying transaction tables...",
    "Normalizing currency formats...",
    "Cross-referencing dates...",
    "Verifying data integrity...",
    "Formatting for QuickBooks...",
    "Almost there, finalizing export..."
  ];

  useEffect(() => {
    let messageInterval: NodeJS.Timeout;
    if (isLoading && progress > 20) {
      let msgIndex = 0;
      messageInterval = setInterval(() => {
        // Cycle through messages, but don't override critical backend status updates if they are recent? 
        // Actually, let's just rotate "tip" messages if status is static for a while, or just append to status.
        // For now, let's just cycle the main status if it's generic "Processing..." equivalent
        // But we have "status" state. Let's create a separate "subStatus" or just rotate the main status if it's been static.
        // Simpler: Just force rotate messages if we are in "deep processing" mode.
        setStatus(LOADING_MESSAGES[msgIndex % LOADING_MESSAGES.length]);
        msgIndex++;
      }, 3000);
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
      toast.info("Document ready");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
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
    setStatus("Initializing connection...");
    setAccounts([]);
    setProgress(0);

    // Simulated progress to keep UI alive during long processing
    const interval = setInterval(() => {
      setProgress((prev) => {
        // cap at 95% until done
        if (prev >= 95) return prev;
        // Slow curve: fast initially, then very slow
        return prev + (prev < 30 ? 5 : prev < 70 ? 2 : 0.2);
      });
    }, 800);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/v1/extract`, { method: 'POST', body: formData });

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
              // Immediately visually jump to separate phase
              setStatus("Analyzing document structure...");
              setProgress((prev) => Math.max(prev, 15));
              if (payload.preview) setPreviewUrl(payload.preview);
            }
            else if (payload.type === "status") {
              // Backend is telling us something specific, let's show it (overriding the rotation for a moment)
              setStatus(payload.text);
              setProgress((prev) => Math.min(prev + 5, 80));
            }
            else if (payload.type === "chunk") {
              setStatus("Extracting financial records...");
              // Don't jump too high, leave room for "finalizing"
              setProgress((prev) => Math.min(prev + 2, 90));

              setAccounts(prev => {
                const map = new Map(prev.map(a => [a.account_name + a.account_number_partial, a]));
                payload.accounts.forEach((acc: AccountData) => {
                  const key = acc.account_name + acc.account_number_partial;
                  if (map.has(key)) {
                    const existing = map.get(key)!;
                    map.set(key, { ...existing, transactions: [...existing.transactions, ...acc.transactions], qbo_content: acc.qbo_content || existing.qbo_content });
                  } else {
                    map.set(key, acc);
                  }
                });
                return Array.from(map.values());
              });
            }
          } catch (e) { }
        }
      }
      clearInterval(interval);
      setProgress(100);

      if (accounts.length === 0) {
        setStatus("No transaction data found");
        toast.warning("No transactions found in this document.");
      } else {
        setStatus("Extraction Complete");
        toast.success("Document successfully processed!");
      }
    } catch (error) {
      clearInterval(interval);
      toast.error("Process failed. Please try again.");
      console.error(error);
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const downloadFile = (content: string, name: string, ext: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/\s+/g, '_')}.${ext}`;
    link.click();
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans antialiased">
      {/* NAVBAR */}
      <nav className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xl sticky top-0 z-50 px-8 py-4 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="bg-slate-900 p-2 rounded-xl shadow-lg shadow-slate-200"><Zap className="h-5 w-5 text-white fill-white" /></div>
          <span className="text-xl font-bold tracking-tight text-slate-800">BankSplitter</span>
        </a>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200/50">
            <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">End-to-End Secure</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className={`grid gap-16 transition-all duration-700 ${accounts.length > 0 ? "lg:grid-cols-12" : "max-w-xl mx-auto"}`}>

          {/* LEFT: UPLOAD PANEL */}
          <div className={`${accounts.length > 0 ? "lg:col-span-5" : "w-full"}`}>
            <div className="mb-8 space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Process Document</h1>
              <p className="text-slate-500 font-medium italic">Securely extract bank PDFs or check images.</p>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-6 space-y-6">
                {!isLoading ? (
                  <div
                    {...getRootProps()}
                    className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer
                    ${file
                        ? 'border-blue-300 bg-blue-50/40'
                        : isDragActive
                          ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200'}`}
                  >
                    <input {...getInputProps()} />
                    {file ? (
                      <div className="w-full py-4 text-center relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); resetForm(); }}
                          className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white shadow border border-slate-100 text-slate-400 hover:text-red-500 cursor-pointer z-30"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div onClick={(e) => e.stopPropagation()} className="relative inline-block cursor-default">
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="mx-auto w-32 h-44 bg-white rounded-lg shadow-lg border border-slate-200 flex items-center justify-center overflow-hidden mb-4 cursor-zoom-in group relative transition-transform hover:scale-[1.03]">
                                {previewUrl ? <img src={previewUrl} className="w-full h-full object-contain p-1" alt="Preview" /> : <div className="flex flex-col items-center gap-2"><Loader2 className="animate-spin h-5 w-5 text-slate-300" /><span className="text-[10px] text-slate-300 uppercase font-black tracking-tighter">Loading</span></div>}
                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-all flex items-center justify-center">
                                  <Search className="text-white opacity-0 group-hover:opacity-100 h-6 w-6 drop-shadow" />
                                </div>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl h-[92vh] p-0 bg-slate-900/95 border-none shadow-2xl flex flex-col items-center justify-center [&>button]:text-white [&>button]:opacity-80 [&>button]:hover:opacity-100">
                              <DialogHeader className="sr-only"><DialogTitle>Preview</DialogTitle><DialogDescription>Document</DialogDescription></DialogHeader>
                              <img src={previewUrl || ""} className="max-w-full max-h-full object-contain" alt="Full Preview" />
                            </DialogContent>
                          </Dialog>
                        </div>
                        <p className="text-sm font-bold text-slate-700 truncate px-4">{file.name}</p>
                        <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-700 border-none text-[10px] font-black uppercase tracking-widest px-3 italic cursor-default">Ready</Badge>
                      </div>
                    ) : (
                      <div className="py-12 text-center group">
                        <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110 group-hover:text-blue-600">
                          <Upload className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-700">Drop PDF or Image</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative mx-auto">
                      <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                      </div>
                      {/* Status Text Area */}
                      <div className="h-12 flex flex-col items-center justify-center">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest animate-in slide-in-from-bottom-2 fade-in duration-300 key={status}">{status}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Processing document intelligence...</p>
                      </div>
                    </div>

                    <div className="space-y-3 px-8 max-w-sm mx-auto">
                      {/* Enhanced Progress Bar */}
                      <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300 ease-out ${progress > 85 ? 'animate-progress-stripe bg-[length:20px_20px] bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600' : ''}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>{Math.round(progress)}%</span>
                        <span>Estimating time...</span>
                      </div>
                    </div>

                    {/* Comforting Message */}
                    <Alert className="bg-blue-50/50 border-blue-100 max-w-xs mx-auto text-left">
                      <Info className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-xs text-blue-600 font-medium leading-relaxed">
                        Large files (50+ pages) may take 1-2 minutes. We're running OCR and validating transaction data.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {!isLoading && file && (
                  <Button
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-200 cursor-pointer"
                    onClick={accounts.length > 0 ? resetForm : handleUpload}
                  >
                    {accounts.length > 0 ? <><RefreshCcw className="mr-2 h-4 w-4" /> Process Another</> : "Start Conversion"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div >

          {/* RIGHT: DYNAMIC ASSETS */}
          < div className={`${accounts.length > 0 ? "lg:col-span-7" : "hidden"} space-y-6 animate-in fade-in slide-in-from-right-10 duration-1000`
          }>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Generated Assets</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{accounts.length} Accounts Found</span>
            </div>

            <div className="grid gap-4">
              {accounts.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Generated Assets</h3>
                    <span className="text-xs text-slate-500">{accounts.length} found</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
                    {accounts.map((acc, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{acc.account_name}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="font-mono">•••• {acc.account_number_partial || "0000"}</span>
                              <span>•</span>
                              <span>{acc.transactions.length} entries</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 gap-2 text-slate-600 border-slate-200 hover:text-slate-900">
                                <Download className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only">Export</span>
                                <ChevronDown className="h-3 w-3 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Download Format</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => downloadCSV(acc)} className="cursor-pointer">
                                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                                <span>CSV Spreadsheet</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadQBO(acc)} className="cursor-pointer">
                                <FileText className="mr-2 h-4 w-4 text-blue-600" />
                                <span>QuickBooks (QBO)</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 gap-4 bg-white/50 animate-pulse">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Continuing Background Scan...</p>
                      </div>
                    )}
                  </div>

                  <Alert className="bg-slate-100/50 border-slate-200 mt-10">
                    <Info className="h-4 w-4 text-slate-400" />
                    <AlertDescription className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-tighter">
                      Verification: Please spot-check amounts against the original source.
                      Private session: all local data is purged upon refresh.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div >
        </div >
      </div >
    </main >
  );

  function downloadCSV(acc: any) {
    const headers = "Date,Description,Amount,Type\n";
    const rows = acc.transactions.map((t: any) => `${t.date},"${t.description}",${t.amount},${t.type}`).join("\n");
    download(headers + rows, acc.account_name, "csv");
  }

  function downloadQBO(acc: any) {
    download(acc.qbo_content || "", acc.account_name, "qbo");
  }

  function download(content: string, name: string, ext: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}