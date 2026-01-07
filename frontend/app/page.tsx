"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone"; // Importação nova
import { Upload, CheckCircle, Download, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

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
}

interface ExtractionResult {
  file_summary: string;
  accounts: AccountData[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);

  // --- LÓGICA DO DRAG & DROP ---
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Aceita apenas o primeiro arquivo
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null); // Reseta resultados anteriores
      toast.info("PDF selected ready for conversion.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'] // Só aceita PDF
    },
    maxFiles: 1,
    multiple: false
  });

  // Handle Upload & Process
  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a PDF file first.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Ajuste a URL se necessário
      const response = await axios.post("http://localhost:8000/api/v1/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(response.data);
      toast.success("File processed successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error processing file. Check if Backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNÇÃO DE DOWNLOAD CSV ---
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

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-slate-900">
          BankSplitter <span className="text-blue-600">AI</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-xl">
          Convert PDF Bank Statements into clean formats (CSV).
          We automatically detect and split multiple accounts.
        </p>
      </div>

      <Card className="w-full max-w-2xl shadow-lg border-slate-200">
        <CardHeader>
          <CardTitle>Upload Statement</CardTitle>
          <CardDescription>Supported format: PDF (Native Text or Scanned)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* --- ÁREA DE DRAG & DROP --- */}
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
              // Estado: Arquivo Selecionado
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="bg-green-100 p-4 rounded-full mb-3">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-slate-700">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                <p className="text-xs text-blue-600 mt-2 font-medium">Click or Drop to replace</p>
              </div>
            ) : (
              // Estado: Nenhum arquivo (Esperando Drop)
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
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-slate-300 hover:bg-slate-50"
                      onClick={() => downloadCSV(account)}
                      disabled={account.transactions.length === 0}
                    >
                      <Download className="h-4 w-4" />
                      Download CSV
                    </Button>
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