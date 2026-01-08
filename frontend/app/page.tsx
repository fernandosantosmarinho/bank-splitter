"use client";

import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle, Download, Loader2, FileText, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress"; // Import novo
import { toast } from "sonner";
import { UserButton } from "@clerk/nextjs";

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

interface ExtractionResult {
  file_summary: string;
  accounts: AccountData[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0); // Estado da barra

  // Drag & Drop Logic
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      toast.info("PDF selected ready for conversion.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  // Handle Upload
  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a PDF file first.");
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setResult(null); // Limpa resultados anteriores

    // --- TRUQUE DE UX: Progresso Simulado ---
    // Aumenta a barra devagar até 90% para mostrar que está vivo
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return 90; // Trava em 90% e espera o backend
        return prev + 5; // Aumenta 5% a cada meio segundo
      });
    }, 800);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await axios.post(`${apiUrl}/api/v1/extract`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Sucesso!
      clearInterval(progressInterval);
      setUploadProgress(100); // Completa a barra
      setResult(response.data);
      toast.success("File processed successfully!");

    } catch (error) {
      console.error(error);
      clearInterval(progressInterval);
      setUploadProgress(0); // Zera se der erro
      toast.error("Error processing file. Please try again.");
    } finally {
      // Pequeno delay para a animação do 100% aparecer antes de sumir o loading
      setTimeout(() => {
        setIsLoading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  // CSV Download
  const downloadCSV = (account: AccountData) => {
    if (!account.transactions || account.transactions.length === 0) {
      toast.warning("This account has no transactions to download.");
      return;
    }
    const headers = ["Date", "Description", "Amount", "Type"];
    const rows = account.transactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.type
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${account.account_name}_${account.account_number_partial}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded CSV for ${account.account_name}`);
  };

  // QBO Download
  const downloadQBO = (account: AccountData) => {
    if (!account.qbo_content) {
      toast.warning("QBO format not available for this account.");
      return;
    }
    const blob = new Blob([account.qbo_content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${account.account_name}_${account.account_number_partial}.qbo`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded QBO for ${account.account_name}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 font-sans relative">

      {/* --- TOP LOADING BAR --- */}
      {/* Só aparece quando está carregando */}
      {isLoading && (
        <div className="fixed top-0 left-0 w-full z-50">
          <Progress value={uploadProgress} className="h-1.5 w-full rounded-none bg-slate-200" />
          <p className="text-center text-xs font-medium text-slate-500 mt-1 bg-white/80 py-1">
            Analyzing bank statement with AI... please wait.
          </p>
        </div>
      )}

      {/* Header com Login */}
      <div className="absolute top-5 right-5">
        <UserButton afterSignOutUrl="/" />
      </div>

      <div className="mb-10 text-center mt-10">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-slate-900">
          BankSplitter <span className="text-blue-600">AI</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-xl">
          Convert PDF Bank Statements into clean formats (CSV/QBO).
          We automatically detect and split multiple accounts.
        </p>
      </div>

      <Card className="w-full max-w-2xl shadow-lg border-slate-200">
        <CardHeader>
          <CardTitle>Upload Statement</CardTitle>
          <CardDescription>Supported format: PDF (Native Text or Scanned)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200
              ${isDragActive
                ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400'
              }
            `}
          >
            <input {...getInputProps()} />

            {file ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="bg-green-100 p-4 rounded-full mb-3">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-slate-700">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                <p className="text-xs text-blue-600 mt-2 font-medium">Click or Drop to replace</p>
              </div>
            ) : (
              <>
                <div className={`p-4 rounded-full mb-3 ${isDragActive ? 'bg-blue-200' : 'bg-slate-100'}`}>
                  <Upload className={`h-8 w-8 ${isDragActive ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
                <p className="text-lg font-medium text-slate-700">
                  {isDragActive ? "Drop the PDF here!" : "Drag & drop your PDF here"}
                </p>
                <p className="text-sm text-slate-500 mt-1">or click to browse files</p>
              </>
            )}
          </div>

          <Button
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleUpload}
            disabled={!file || isLoading}
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing ({uploadProgress}%)...</>
            ) : (
              "Convert & Split"
            )}
          </Button>

        </CardContent>
      </Card>

      {result && (
        <div className="mt-10 w-full max-w-4xl space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription className="text-green-700">
              {result.file_summary}
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2">
            {result.accounts.map((account, idx) => (
              <Card key={idx} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center text-lg">
                    {account.account_name}
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono">
                      {account.currency}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Account ending in: <strong>{account.account_number_partial}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-slate-500">
                      Found <strong>{account.transactions.length}</strong> transactions
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-slate-300 hover:bg-slate-50"
                        onClick={() => downloadCSV(account)}
                        disabled={account.transactions.length === 0}
                      >
                        <Download className="h-4 w-4" />
                        CSV
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => downloadQBO(account)}
                        disabled={!account.qbo_content}
                      >
                        <FileJson className="h-4 w-4" />
                        QBO
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}