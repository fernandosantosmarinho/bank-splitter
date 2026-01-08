"use client";

import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle, Download, Loader2, FileText, FileJson, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
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

  // Estados para a UX de carregamento
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      toast.info("PDF ready for secure processing.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    multiple: false
  });

  // Função para simular etapas de processamento mais realistas
  const startSimulation = () => {
    setUploadProgress(0);

    const timers: NodeJS.Timeout[] = [];

    // Etapa 1: Upload rápido
    timers.push(setTimeout(() => {
      setUploadProgress(20);
      setLoadingText("Securely uploading document...");
    }, 500));

    // Etapa 2: Leitura (Docling demora um pouco aqui)
    timers.push(setTimeout(() => {
      setUploadProgress(45);
      setLoadingText("Reading document structure...");
    }, 2500));

    // Etapa 3: Análise (Onde geralmente demora mais)
    timers.push(setTimeout(() => {
      setUploadProgress(70);
      setLoadingText("Separating accounts and transactions...");
    }, 8000));

    // Etapa 4: Finalização
    timers.push(setTimeout(() => {
      setUploadProgress(90);
      setLoadingText("Finalizing formats (CSV & QBO)...");
    }, 18000));

    return timers;
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a PDF file first.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    // Inicia a simulação visual de progresso
    const timers = startSimulation();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await axios.post(`${apiUrl}/api/v1/extract`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Sucesso: Pula para 100%
      setUploadProgress(100);
      setLoadingText("Done!");
      setResult(response.data);
      toast.success("Document processed successfully!");

    } catch (error) {
      console.error(error);
      toast.error("Error processing file. Please try again.");
      setUploadProgress(0);
    } finally {
      // Limpa os timers se a resposta for muito rápida (para não sobrescrever o texto)
      timers.forEach(clearTimeout);
      setIsLoading(false);
    }
  };

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

      {/* Header com Login - Ajustado */}
      <div className="absolute top-5 right-5 z-50">
        <UserButton afterSignOutUrl="/" />
      </div>

      <div className="mb-10 text-center mt-10 px-4">
        {/* Título Atualizado (Sem "AI") */}
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-slate-900">
          Bank<span className="text-blue-600">Splitter</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-xl mx-auto">
          Securely convert PDF Bank Statements into clean formats (CSV/QBO).
          We automatically detect and split multiple accounts.
        </p>

        {/* Selo de Confiança */}
        <div className="mt-4 flex justify-center items-center gap-2 text-xs text-slate-500 font-medium bg-white/50 py-1 px-3 rounded-full w-fit mx-auto border border-slate-200">
          <ShieldCheck className="h-3 w-3 text-green-600" />
          <span>Private Processing &bull; Zero Data Retention</span>
        </div>
      </div>

      <Card className="w-full max-w-2xl shadow-lg border-slate-200">
        <CardHeader>
          <CardTitle>Upload Statement</CardTitle>
          <CardDescription>Supported format: PDF (Native Text or Scanned)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Área de Upload esconde quando está carregando para mostrar o progresso */}
          {!isLoading ? (
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
          ) : (
            // --- NOVA UI DE LOADING (Dentro do Card) ---
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center animate-in fade-in">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{loadingText}</h3>
              <Progress value={uploadProgress} className="h-2 w-full max-w-sm bg-slate-100" />
              <p className="text-xs text-slate-400 mt-4">
                This process usually takes 30-60 seconds for complex files.
              </p>
            </div>
          )}

          {/* Botão desaparece enquanto carrega para evitar duplo clique */}
          {!isLoading && (
            <Button
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleUpload}
              disabled={!file}
            >
              Convert & Split
            </Button>
          )}

        </CardContent>
      </Card>

      {result && (
        <div className="mt-10 w-full max-w-4xl space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Processing Complete!</AlertTitle>
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