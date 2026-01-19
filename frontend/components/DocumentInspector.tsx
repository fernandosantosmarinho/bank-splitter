"use client";

import { useState } from "react";
import { Check, ZoomIn, ZoomOut, CheckCircle, Layout, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InspectorProps {
    data: any;
    onConfirm: (selectedText: string) => void;
    onCancel: () => void;
}

export default function DocumentInspector({ data, onConfirm, onCancel }: InspectorProps) {
    if (!data || !data.pages) {
        return (
            <div className="flex flex-col items-center justify-center h-96 p-8 text-center bg-white rounded-xl">
                <div className="text-red-500 mb-4">⚠️ Could not load document layout.</div>
                <Button onClick={onCancel} variant="outline">Close</Button>
            </div>
        );
    }

    const [zoom, setZoom] = useState(1);
    const [pages, setPages] = useState(data.pages);
    const [activeTab, setActiveTab] = useState("visual"); // Começa no Visual para ver o PDF

    // Se o backend não mandou preview, usa array vazio
    const previewRows = data.preview_table || [];

    const toggleItem = (pageIndex: number, itemIndex: number) => {
        const newPages = [...pages];
        const item = newPages[pageIndex].items[itemIndex];

        // Inverte o estado
        item.status = item.status === "selected" ? "ignored" : "selected";

        setPages(newPages);
    };

    const handleFinish = () => {
        // Coleta APENAS o texto dos quadrados VERDES (selected)
        let fullText = "";
        let count = 0;

        pages.forEach((p: any) => {
            // Ordena os itens pela posição Y (top) para manter a ordem de leitura
            const sortedItems = [...p.items].sort((a, b) => a.bbox[1] - b.bbox[1]);

            sortedItems.forEach((item: any) => {
                if (item.status === "selected") {
                    fullText += item.text + "\n";
                    count++;
                }
            });
        });

        console.log(`Sending ${count} lines of text to extraction engine.`);
        onConfirm(fullText);
    };

    return (
        <div className="flex flex-col h-[85vh] bg-slate-50 rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">

            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center z-20 shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        Review & Select Data
                    </h3>
                    <p className="text-xs text-slate-500">Click on green boxes to confirm. Gray boxes are ignored.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={onCancel} className="text-slate-600">Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md shadow-blue-200" onClick={handleFinish}>
                        Confirm & Extract <Check className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* TABS */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">

                <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex justify-center">
                    <TabsList className="bg-white border border-slate-200">
                        <TabsTrigger value="visual" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 gap-2">
                            <Layout className="h-4 w-4" /> Original PDF (Select)
                        </TabsTrigger>
                        <TabsTrigger value="table" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 gap-2">
                            <TableIcon className="h-4 w-4" /> AI Preview (Read-Only)
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* TAB 1: VISUAL (A PRINCIPAL) */}
                <TabsContent value="visual" className="flex-1 m-0 overflow-hidden relative">
                    <div className="absolute top-4 right-4 z-30 flex items-center bg-white/90 backdrop-blur rounded-lg border border-slate-200 p-1 shadow-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}><ZoomOut className="h-4 w-4" /></Button>
                        <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(2, z + 0.2))}><ZoomIn className="h-4 w-4" /></Button>
                    </div>

                    <ScrollArea className="h-full bg-slate-200/50 p-8">
                        <div className="flex flex-col items-center gap-8 pb-20">
                            {pages.map((page: any, pageIdx: number) => (
                                <div
                                    key={pageIdx}
                                    className="relative bg-white shadow-xl transition-transform duration-200 ease-out origin-top border border-slate-300"
                                    style={{ width: page.width * zoom, height: page.height * zoom }}
                                >
                                    <img
                                        src={page.image}
                                        alt={`Page ${page.page_number}`}
                                        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                                    />

                                    {/* OVERLAY DE CAIXAS */}
                                    {page.items.map((item: any, itemIdx: number) => {
                                        const style = {
                                            left: `${(item.bbox[0] / page.width) * 100}%`,
                                            top: `${(item.bbox[1] / page.height) * 100}%`,
                                            width: `${(item.bbox[2] / page.width) * 100}%`,
                                            height: `${(item.bbox[3] / page.height) * 100}%`,
                                        };
                                        const isSelected = item.status === "selected";
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleItem(pageIdx, itemIdx)}
                                                className={`absolute cursor-pointer transition-all duration-100 rounded-[2px]
                            ${isSelected
                                                        ? "bg-emerald-500/20 border-2 border-emerald-500 z-10 shadow-sm"
                                                        : "bg-slate-400/5 border border-slate-300/50 hover:bg-slate-400/20 hover:border-slate-400 z-0"
                                                    }`}
                                                style={style}
                                                title={item.text}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* TAB 2: TABELA (PREVIEW APENAS) */}
                <TabsContent value="table" className="flex-1 m-0 overflow-hidden bg-slate-900 p-6">
                    <div className="h-full w-full max-w-5xl mx-auto bg-slate-950 border border-slate-800 rounded-lg shadow-2xl flex flex-col overflow-hidden">
                        <ScrollArea className="flex-1">
                            <Table>
                                <TableHeader className="bg-slate-900 sticky top-0 z-10">
                                    <TableRow className="border-slate-800 hover:bg-slate-900">
                                        <TableHead className="text-slate-400 font-mono text-xs uppercase">Date</TableHead>
                                        <TableHead className="text-slate-400 font-mono text-xs uppercase w-[40%]">Description</TableHead>
                                        <TableHead className="text-slate-400 font-mono text-xs uppercase text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewRows.length > 0 ? previewRows.map((row: any, i: number) => (
                                        <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/50 transition-colors group">
                                            <TableCell className="text-slate-300 font-mono text-xs">{row.date}</TableCell>
                                            <TableCell className="text-slate-200 font-medium text-xs">{row.description}</TableCell>
                                            <TableCell className="text-emerald-400 font-mono text-xs text-right">{row.amount || row.debit || row.credit}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-20 text-slate-500">
                                                AI Preview not available. Use the Visual tab to select data manually.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}