"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, FileSpreadsheet, FileText, CheckCircle2, Zap, ShieldCheck,
  User, Laptop, Lightbulb, MousePointer2, FileJson, Clock, MoveRight,
  Layout, Monitor, X, Lock, CheckCircle
} from "lucide-react";
import { useAuth, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  // Ciclo de animação sequencial (9 segundos total)
  const DURATION = 9;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans selection:bg-blue-100 overflow-x-hidden">

      {/* NAVBAR */}
      <header className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full z-50">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-1.5 rounded-lg">
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">BankSplitter</span>
        </div>
        <nav className="flex items-center gap-3">
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md text-sm font-medium px-5">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <SignInButton mode="modal">
                <Button variant="ghost" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md text-sm font-medium px-5">
                  Get Started
                </Button>
              </SignUpButton>
            </>
          )}
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center pt-8 md:pt-12 px-4 relative z-10">

        {/* TITULO */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3" /> Private Processing
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            The <span className="text-blue-600">smart way</span> to handle <br />Bank Statements.
          </h1>
          <p className="text-lg text-slate-500 max-w-lg mx-auto">
            Stop manual data entry. Upload your PDFs and get clean CSV/QBO files ready for reconciliation in seconds.
          </p>
        </div>

        {/* --- CINESTAGE: A HISTÓRIA EM 3 ATOS --- */}
        <div className="w-full max-w-7xl mx-auto py-10 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24 relative">

            {/* SETAS DE CONEXÃO (Desktop) - Animadas com fluxo da esquerda para a direita */}
            <div className="hidden lg:block absolute top-1/2 left-[31.5%] -translate-y-1/2 z-0">
              <motion.div
                animate={{
                  x: [-25, -10, 0], // Move da esquerda para a direita
                  opacity: [0, 0.15, 0] // Aparece no meio e some no fim
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <MoveRight className="h-10 w-10 text-slate-900" />
              </motion.div>
            </div>

            <div className="hidden lg:block absolute top-1/2 right-[31.5%] -translate-y-1/2 z-0">
              <motion.div
                animate={{
                  x: [-10, 20, 20],
                  opacity: [0, 0.15, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5 // Pequeno atraso para criar um efeito de "onda" entre as duas setas
                }}
              >
                <MoveRight className="h-10 w-10 text-slate-900" />
              </motion.div>
            </div>

            {/* --- ATO 1: STORYTELLING RECALIBRADO (TEXTO NO PDF + VELOCIDADE ORIGINAL) --- */}
            <Card className="relative h-[440px] p-6 border-slate-100 bg-white overflow-hidden flex flex-col items-center shadow-sm">
              <div className="absolute top-4 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">The Problem</div>

              <div className="relative w-full h-full">

                {/* 1. JANELA PDF COM BADGE NO FOOTER */}
                <motion.div
                  className="absolute top-[9%] left-[0%] w-[150px] bg-white border border-slate-200 rounded-lg shadow-xl h-40 overflow-hidden flex flex-col z-10"
                  animate={{ opacity: [1, 1, 0, 0, 1] }}
                  transition={{ duration: 8, repeat: Infinity, times: [0, 0.45, 0.6, 0.95, 1] }}
                >
                  {/* Header */}
                  <div className="bg-slate-800 border-b p-2 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-red-400" />
                    <span className="text-[10px] font-bold text-white tracking-tight">Bank Statement</span>
                  </div>

                  {/* Conteúdo (flex-grow para empurrar o footer) */}
                  <div className="p-2 bg-slate-50/50 flex-grow">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="relative h-3.5 w-full bg-white border border-slate-100 rounded flex items-center px-1 justify-between overflow-hidden mb-1.5 last:mb-0">
                        {i === 1 ? (
                          <div className="flex justify-between w-full px-0.5 pointer-events-none">
                            <span className="text-[5px] font-mono text-slate-500 font-bold uppercase tracking-tighter">DAY SERVICE FEE</span>
                            <span className="text-[5px] font-mono text-slate-600 font-bold">-10.00</span>
                          </div>
                        ) : (
                          <div className="h-1 w-10 bg-slate-100 rounded" />
                        )}

                        {i === 1 && (
                          <motion.div
                            className="absolute inset-0 bg-blue-500/20 z-10 border-y border-blue-400/30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
                            transition={{ duration: 8, repeat: Infinity, times: [0, 0.19, 0.2, 0.4, 0.45, 1] }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* --- FOOTER DA JANELA COM O BADGE .PDF --- */}
                  <div className="mt-auto bg-white border-t border-slate-100 p-1.5 flex justify-end items-center">
                    <div className="bg-red-600 text-[7px] text-white px-1.5 py-0.5 rounded-sm font-black shadow-sm uppercase tracking-wider">
                      PDF
                    </div>
                  </div>
                </motion.div>

                {/* TECLAS CTRL + C */}
                <motion.div
                  className="absolute top-[68%] left-[10%] flex gap-2 z-20"
                  animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
                  transition={{ duration: 8, repeat: Infinity, times: [0, 0.15, 0.2, 0.4, 0.45, 1] }}
                >
                  {['Ctrl', 'C'].map((key, i) => (
                    <motion.div
                      key={key}
                      className="w-10 h-10 bg-white border-b-[6px] border-slate-300 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-700 shadow-lg"
                      animate={{ y: [0, 4, 0], borderBottomWidth: ["6px", "1px", "6px"] }}
                      transition={{ duration: 0.3, delay: 1.6 + (i * 0.1), repeat: Infinity, repeatDelay: 7.7 }}
                    >
                      {key}
                    </motion.div>
                  ))}
                </motion.div>

                {/* 2. JANELA EXCEL */}
                {/* 2. JANELA EXCEL COM FOOTER .CSV */}
                <motion.div
                  className="absolute bottom-[18%] right-[0%] w-[160px] bg-white border border-slate-200 rounded-lg shadow-xl h-40 overflow-hidden flex flex-col z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0, 1, 1, 0], x: [20, 20, 20, 0, 0, 20] }}
                  transition={{ duration: 8, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 0.9, 0.95] }}
                >
                  {/* HEADER DO EXCEL */}
                  <div className="bg-emerald-700 p-2 flex items-center gap-1.5 flex-shrink-0">
                    <div className="h-2 w-2 bg-white/30 rounded-sm text-white text-[5px] flex items-center justify-center">X</div>
                    <span className="text-[10px] font-bold text-white tracking-tight">Bank Statement</span>
                  </div>

                  {/* ÁREA DE CONTEÚDO (Ganhando flex-grow para empurrar o footer para baixo) */}
                  <div className="p-2 bg-slate-50 flex-grow">
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      <div className="h-1.5 bg-slate-200 rounded" />
                      <div className="h-1.5 bg-slate-200 rounded" />
                    </div>

                    {/* CÉLULA DE DESTINO */}
                    <div className="bg-white h-4 w-full mt-9 rounded border border-slate-200 relative overflow-hidden flex items-center px-1">

                      {/* Conteúdo de Texto e Valor aparecendo juntos */}
                      <motion.div
                        className="absolute inset-0 z-30 flex justify-between items-center px-1.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0, 0, 1, 1, 0] }}
                        transition={{ duration: 8, repeat: Infinity, times: [0, 0.72, 0.75, 0.85, 0.9, 1] }}
                      >
                        {/* Descrição */}
                        <span className="text-[5px] font-mono font-bold text-blue-500 uppercase tracking-tighter whitespace-nowrap">
                          DAY SERVICE FEE
                        </span>
                        {/* Valor */}
                        <span className="text-[6px] font-mono font-bold text-blue-600">
                          -10.00
                        </span>
                      </motion.div>

                      {/* Animação da Borda (Highlight) */}
                      <motion.div
                        className="absolute inset-0 border-2 border-blue-500 z-20"
                        animate={{ opacity: [0, 0, 0, 1, 1, 0] }}
                        transition={{ duration: 8, repeat: Infinity, times: [0, 0.68, 0.7, 0.85, 0.9, 1] }}
                      />

                      {/* Animação do Fundo (Fill) */}
                      <motion.div
                        className="absolute inset-0 bg-blue-50"
                        animate={{ width: [0, 0, 0, 100, 100, 0] }}
                        transition={{ duration: 8, repeat: Infinity, times: [0, 0.7, 0.72, 0.85, 0.9, 1] }}
                      />
                    </div>
                  </div>

                  {/* --- FOOTER DA JANELA COM APENAS O BADGE .CSV --- */}
                  <div className="mt-auto bg-white border-t border-slate-100 p-1.5 flex justify-end items-center">
                    <div className="bg-emerald-600 text-[7px] text-white px-1.5 py-0.5 rounded-sm font-black shadow-sm uppercase tracking-wider">
                      EXCEL
                    </div>
                  </div>
                </motion.div>

                {/* TECLAS CTRL + V (BRANCAS) */}
                <motion.div
                  className="absolute bottom-[2%] right-[10%] flex gap-2 z-20"
                  animate={{ opacity: [0, 0, 0, 1, 1, 0, 0] }}
                  transition={{ duration: 8, repeat: Infinity, times: [0, 0.6, 0.65, 0.7, 0.9, 0.95, 1] }}
                >
                  {['Ctrl', 'V'].map((key, i) => (
                    <motion.div
                      key={key}
                      className="w-10 h-10 bg-white border-b-[6px] border-slate-300 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-700 shadow-lg"
                      animate={{ y: [0, 4, 0], borderBottomWidth: ["6px", "1px", "6px"] }}
                      transition={{ duration: 0.3, delay: 5.2 + (i * 0.1), repeat: Infinity, repeatDelay: 7.7 }}
                    >
                      {key}
                    </motion.div>
                  ))}
                </motion.div>

                {/* 3. CURSOR DO MOUSE */}
                <motion.div
                  className="absolute z-50 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 1, 1, 1, 1, 0],
                    left: ["-5%", "18%", "18%", "18%", "78%", "78%", "78%", "105%"],
                    top: ["50%", "31%", "31%", "31%", "56%", "56%", "56%", "80%"],
                    scale: [1, 1, 0.7, 1, 1, 0.7, 1, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    times: [0, 0.1, 0.2, 0.3, 0.65, 0.7, 0.85, 0.95],
                    ease: "easeInOut"
                  }}
                >
                  <MousePointer2 className="h-6 w-6 text-slate-900 fill-slate-900 drop-shadow-2xl" />
                </motion.div>

              </div>

              <div className="mt-auto mb-6 text-center z-40">
                <h3 className="font-bold text-slate-900 text-lg">The Manual Grind</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto">
                  Copy-pasting transaction by transaction is slow, boring, and full of human errors.
                </p>
              </div>
            </Card>

            {/* --- ATO 2: A SOLUÇÃO (PDF COLADO AO MOUSE + CLIQUE REATIVO) --- */}
            <Card className="relative h-[440px] p-6 border-none bg-blue-50/30 overflow-hidden flex flex-col items-center shadow-sm">
              {/* Título do Step */}
              <div className="absolute top-4 left-4 text-[10px] font-bold text-blue-500 uppercase tracking-widest z-20">
                The Solution
              </div>

              {/* Container Principal */}
              <div className="relative w-full flex-grow flex flex-col items-center justify-center pt-12">

                {/* 1. JANELA BANKSPLITTER (Fix: Cadeado permanece até o fim) */}
                <div className="relative w-full max-w-[200px] z-10">

                  <div className="relative overflow-hidden rounded-xl border border-blue-100/50 shadow-xl bg-white">
                    <img
                      src="/banksplitter.png"
                      alt="SaaS Interface"
                      className="w-full h-auto block"
                    />

                    {/* MÁSCARA BRANCA (Agora cobre até o final do ciclo) */}
                    <motion.div
                      className="absolute top-[30%] left-[10%] right-[10%] bottom-[25%] bg-white z-20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0, 1, 1, 0] }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        // CORREÇÃO: Mantém opacidade 1 até 95% do tempo
                        times: [0, 0.45, 0.46, 0.95, 1]
                      }}
                    />

                    {/* BADGE DE SEGURANÇA (Fica visível até o final) */}
                    <motion.div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{
                        opacity: [0, 0, 1, 1, 0],
                        scale: [0.5, 0.5, 1.1, 1, 0.9]
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        // Mantém a sincronia original de entrada/saída
                        times: [0, 0.45, 0.46, 0.95, 1]
                      }}
                    >
                      <div className="bg-emerald-500 p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center">
                        <Lock className="h-5 w-5 text-white" />
                      </div>

                      {/* EFEITO DE PISCAR (BLINK) APENAS NO TEXTO */}
                      <motion.div
                        className="bg-slate-900/90 px-2 py-0.5 rounded-[4px] text-[8px] font-bold text-white uppercase tracking-wider backdrop-blur-sm shadow-sm"
                        animate={{ opacity: [1, 0.5, 1] }} // Vai para 50% de opacidade e volta
                        transition={{
                          duration: 1.5, // Duração de 1.5s (lento/médio)
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        Secure
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Barra de Progresso (Externa - Também estendida) */}
                  <motion.div
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner z-20"
                    animate={{ opacity: [0, 0, 1, 1, 0] }}
                    // CORREÇÃO: Visível até 0.95 para não sumir antes do cadeado
                    transition={{ duration: 8, repeat: Infinity, times: [0, 0.45, 0.5, 0.95, 1] }}
                  >
                    <motion.div
                      className="h-full bg-blue-600"
                      animate={{ width: ["0%", "0%", "100%", "100%"] }}
                      transition={{ duration: 8, repeat: Infinity, times: [0, 0.5, 0.8, 1] }}
                    />
                  </motion.div>
                </div>

                {/* --- GRUPO UNIFICADO: MOUSE + PDF --- */}
                <motion.div
                  className="absolute z-50 pointer-events-none flex flex-col items-start"
                  animate={{
                    left: ["15%", "48%", "48%", "52%"],
                    top: ["85%", "52%", "52%", "48%"],
                    opacity: [0, 1, 1, 0, 0], // Grupo todo aparece em 0.1 e some total em 0.6
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    times: [0, 0.1, 0.45, 0.6, 1],
                    ease: "easeInOut"
                  }}
                >
                  {/* O ARQUIVO PDF (Baseado no seu exemplo, colado ao mouse) */}
                  <motion.div
                    className="bg-white w-10 h-14 border-[3.5px] border-red-500 rounded-lg shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative flex flex-col p-2 mb-[-10px]"
                    animate={{
                      opacity: [1, 1, 0, 0], // Visível durante o arraste e some no drop (0.45)
                      scale: [1, 1, 0.4, 0.4],
                      y: [0, 0, -20, -20]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      times: [0, 0.4, 0.45, 1]
                    }}
                  >
                    <div className="mt-4 flex flex-col gap-2 px-0.5">
                      <div className="h-[2.5px] w-full bg-slate-300 rounded-full" />
                      <div className="h-[2.5px] w-full bg-slate-300 rounded-full" />
                      <div className="h-[2.5px] w-2/3 bg-slate-300 rounded-full" />
                    </div>

                    <div className="absolute -bottom-1.5 -left-4 bg-red-500 px-2 py-1 rounded shadow-[4px_4px_10px_rgba(0,0,0,0.3)] border-2 border-white">
                      <span className="text-[12px] font-black text-white italic tracking-tighter leading-none">PDF</span>
                    </div>
                  </motion.div>

                  {/* CURSOR DO MOUSE (Sincronizado com o clique de soltar o PDF) */}
                  <motion.div
                    className="ml-10"
                    animate={{
                      scale: [1, 1, 0.7, 1, 1], // O clique acontece em 0.45
                    }}
                    transition={{ duration: 8, repeat: Infinity, times: [0, 0.25, 0.3, 0.35, 1] }}
                  >
                    <MousePointer2 className="h-6 w-6 text-slate-900 fill-slate-900 drop-shadow-2xl" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Texto Inferior */}
              <div className="text-center mt-auto mb-4">
                <h3 className="font-bold text-blue-700 text-lg leading-tight">Smart Processing</h3>
                <p className="text-xs text-slate-400 mt-2 px-4 leading-relaxed max-w-[280px] mx-auto font-medium">
                  Drop your PDF and let our AI categorize every single row in seconds.
                </p>
              </div>
            </Card>

            {/* --- ATO 3: A VITÓRIA (CORREÇÃO FINAL: NO OVERLAP) --- */}
            <Card className="h-full min-h-[320px] p-5 border-none bg-emerald-50/20 overflow-hidden flex flex-col justify-between items-center shadow-sm group relative">

              <div className="w-full text-left z-20">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">The Victory</span>
              </div>

              <div className="relative w-full flex-1 flex items-center justify-center">

                {/* CONTAINER DO CENTRO */}
                <div className="relative w-[160px] h-40 flex items-center justify-center">

                  {/* --- O PDF QUE SE RASGA --- */}
                  {/* Ele começa a rasgar em 0.25 e SOME em 0.30 */}

                  {/* 1. METADE ESQUERDA */}
                  <motion.div
                    className="absolute z-30 overflow-hidden top-0 bottom-0 left-0 w-[50%]"
                    initial={{ x: 0, opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0, 0, 0],      // Fica visível até 0.25, some em 0.30
                      x: [0, 0, 0, -60, -120, 0],       // Rasga para esquerda
                      rotate: [0, 0, 0, -15, -45, 0]
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      // MUDANÇA: Fade out rápido entre 0.25 e 0.30
                      times: [0, 0.1, 0.25, 0.30, 0.45, 1],
                      ease: "easeInOut"
                    }}
                  >
                    <div className="w-[160px] h-40 bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col">
                      <div className="bg-slate-800 border-b p-2 flex items-center gap-1.5 h-8">
                        <FileText className="h-4 w-4 text-red-400" />
                        <span className="text-[10px] font-bold text-white tracking-tight">Bank Statement</span>
                      </div>
                      <div className="p-2 bg-slate-50/50 flex-grow space-y-1.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-3.5 w-full bg-white border border-slate-100 rounded flex items-center px-1">
                            {i === 1 ? <span className="text-[5px] font-mono text-slate-500 font-bold">DAY SERVICE...</span> : <div className="h-1 w-8 bg-slate-100 rounded" />}
                          </div>
                        ))}
                      </div>
                      <div className="mt-auto bg-white border-t border-slate-100 p-1.5 h-6"></div>
                    </div>
                  </motion.div>

                  {/* 2. METADE DIREITA */}
                  <motion.div
                    className="absolute z-30 overflow-hidden top-0 bottom-0 right-0 w-[50%]"
                    initial={{ x: 0, opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0, 0, 0],
                      x: [0, 0, 0, 60, 120, 0],
                      rotate: [0, 0, 0, 15, 45, 0]
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      times: [0, 0.1, 0.25, 0.30, 0.45, 1], // Sincronizado
                      ease: "easeInOut"
                    }}
                  >
                    <div className="w-[160px] h-40 bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col -ml-[80px]">
                      <div className="bg-slate-800 border-b p-2 flex items-center gap-1.5 h-8">
                        <div className="w-4" />
                        <span className="text-[10px] font-bold text-white tracking-tight">Bank Statement</span>
                      </div>
                      <div className="p-2 bg-slate-50/50 flex-grow space-y-1.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-3.5 w-full bg-white border border-slate-100 rounded flex items-center justify-end px-1">
                            {i === 1 ? <span className="text-[5px] font-mono text-slate-600 font-bold">-10.00</span> : <div className="h-1 w-8 bg-slate-100 rounded" />}
                          </div>
                        ))}
                      </div>
                      <div className="mt-auto bg-white border-t border-slate-100 p-1.5 h-6 flex justify-end items-center">
                        <div className="bg-red-600 text-[7px] text-white px-1.5 py-0.5 rounded-sm font-black shadow-sm uppercase tracking-wider">
                          PDF
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* EFEITO DE RAIO */}
                  <motion.div
                    className="absolute w-1 bg-white shadow-[0_0_25px_5px_rgba(250,204,21,0.8)] z-50 rounded-full"
                    animate={{
                      height: ["0%", "150%", "150%", "0%"],
                      opacity: [0, 1, 1, 0],
                      scaleX: [1, 2, 0.5, 0]
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      times: [0.23, 0.25, 0.27, 0.29]
                    }}
                  />

                  {/* --- O RESULTADO (CSV e QBO) --- */}

                  {/* ARQUIVO 1: CSV */}
                  <motion.div
                    className="absolute bg-white w-16 h-20 border-2 border-emerald-500 rounded-xl shadow-md flex flex-col items-center justify-center z-20"
                    animate={{
                      x: [-55, -55],
                      rotate: [-10, 0],
                      opacity: [0, 0, 1, 1, 1],
                      scale: [0.5, 0.5, 1, 1, 0.9, 1, 0.9, 1, 0.8]
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      // MUDANÇA: Agora some em 0.75 (1s mais cedo que antes)
                      times: [0, 0.32, 0.34, 0.41, 0.42, 0.44, 0.46, 0.48, 0.65]
                    }}
                  >
                    <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                    <span className="text-[9px] font-bold text-emerald-700 mt-1">.CSV</span>
                  </motion.div>

                  {/* ARQUIVO 2: QBO */}
                  <motion.div
                    className="absolute bg-white w-16 h-20 border-2 border-blue-500 rounded-xl shadow-md flex flex-col items-center justify-center z-10"
                    animate={{
                      x: [55, 55],
                      rotate: [10, 0],
                      opacity: [0, 0, 1, 1, 0],
                      scale: [0.5, 0.5, 1, 1, 1]
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      // MUDANÇA: Sincronizado para sumir em 0.75
                      times: [0, 0.32, 0.34, 0.65, 1]
                    }}
                  >
                    <FileJson className="h-8 w-8 text-blue-600" />
                    <span className="text-[9px] font-bold text-blue-700 mt-1">.QBO</span>
                  </motion.div>

                </div>

                {/* --- A JANELA EXCEL (UI REALISTA - Abre em 4.5s) --- */}
                <motion.div
                  className="absolute bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col z-50 border border-slate-300"
                  initial={{ width: 0, height: 0, opacity: 0 }}
                  animate={{
                    width: [0, 240, 240, 240, 0],
                    height: [0, 180, 180, 180, 0],
                    opacity: [0, 1, 1, 1, 0],
                    x: 0,
                    y: 0
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    // MUDANÇA: Abre em 0.45 (4.5s) em vez de 0.55. Ganho de 1s de tela.
                    times: [0.35, 0.50, 0.95, 0.98, 1],
                    ease: "circOut"
                  }}
                >
                  {/* ... (O conteúdo interno da janela continua igual, pode manter) ... */}
                  {/* Header Maior */}
                  <div className="bg-emerald-600 h-6 flex items-center px-2 justify-between shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400/80" />
                      <div className="w-2 h-2 rounded-full bg-yellow-400/80" />
                      <div className="w-2 h-2 rounded-full bg-green-400/80" />
                    </div>
                    <div className="flex items-center gap-1.5 opacity-90">
                      <FileSpreadsheet className="h-3 w-3 text-white" />
                      <span className="text-[9px] text-white font-medium tracking-tight">Checking.xlsx</span>
                    </div>
                    <div className="w-8" />
                  </div>

                  <div className="bg-slate-50 border-b border-slate-200 h-6 flex items-center px-2 gap-2 shrink-0">
                    <div className="text-[8px] font-bold text-slate-400 font-serif italic">fx</div>
                    <div className="bg-white border border-slate-200 h-4 w-full rounded-sm flex items-center px-1">
                      <span className="text-[7px] text-slate-400">=SUM(C2:C4)</span>
                    </div>
                  </div>

                  <div className="flex flex-col w-full h-full bg-white text-[8px]">
                    <div className="flex h-4 bg-slate-100 border-b border-slate-200">
                      <div className="w-6 border-r border-slate-200 bg-slate-100 shrink-0" />
                      <div className="flex-1 border-r border-slate-200 flex items-center justify-center font-bold text-slate-500">A</div>
                      <div className="w-20 border-r border-slate-200 flex items-center justify-center font-bold text-slate-500">B</div>
                      <div className="w-16 flex items-center justify-center font-bold text-slate-500">C</div>
                    </div>

                    {[
                      { d: "STRIPE PAYOUT", v: "+ 2,450.00", c: "text-emerald-700" },
                      { d: "AMAZON AWS", v: "- 154.20", c: "text-red-600" },
                      { d: "STARBUCKS", v: "- 8.50", c: "text-red-600" },
                      { d: "TOTAL", v: "2,287.30", c: "text-slate-900 font-bold" },
                    ].map((row, i) => (
                      <div key={i} className="flex h-5 border-b border-slate-100">
                        <div className="w-6 border-r border-slate-200 bg-slate-50 flex items-center justify-center font-bold text-slate-400 shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 border-r border-slate-100 flex items-center px-2 text-slate-600 truncate">
                          {row.d}
                        </div>
                        <div className="w-20 border-r border-slate-100 flex items-center px-2 text-slate-400 italic">
                          {i === 3 ? "" : "Expense"}
                        </div>
                        <div className={`w-16 flex items-center justify-end px-2 font-mono ${row.c} relative`}>
                          {row.v}
                          {i === 3 && (
                            <motion.div
                              className="absolute inset-0 border-2 border-emerald-500 z-10"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 1, 1] }}
                              transition={{ delay: 0.5, duration: 0.5 }}
                            >
                              <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-emerald-500 border border-white" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <motion.div
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-full shadow-lg z-50"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-[8px] font-bold uppercase tracking-wide">Ready to Reconcile</span>
                  </motion.div>

                </motion.div>

                {/* CURSOR DO MOUSE (Aparece embaixo -> Sobe -> Clica) */}
                <motion.div
                  className="absolute z-50 pointer-events-none"
                  animate={{
                    // Posição Y: Fica embaixo (100%) até 0.30, sobe para o ícone (45%) em 0.40
                    top: ["100%", "100%", "100%", "45%", "45%", "45%", "45%", "45%", "100%"],

                    // Posição X: Vai do centro (50%) para a esquerda (28%)
                    left: ["50%", "50%", "50%", "28%", "28%", "28%", "28%", "28%", "50%"],

                    // Opacidade: 0 antes de 0.29. Vira 1 (visível) em 0.30 (ainda embaixo).
                    opacity: [0, 0, 1, 1, 1, 1, 1, 1, 0],

                    // Escala: Normal, diminui nos cliques (0.42 e 0.46)
                    scale: [1, 1, 1, 1, 1, 1, 0.85, 0, 0]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    // Cronologia Precisa:
                    // 0.29: Invisível
                    // 0.30: Aparece (Visível embaixo)
                    // 0.40: Chega no topo (Movimento dura 1s)
                    // 0.42: Click 1
                    // 0.44: Solta
                    // 0.46: Click 2
                    // 0.48: Solta
                    times: [0, 0.29, 0.30, 0.40, 0.42, 0.44, 0.46, 0.48, 0.65],
                    ease: "easeInOut"
                  }}
                >
                  <MousePointer2 className="h-6 w-6 text-slate-900 fill-slate-900 drop-shadow-xl" />
                </motion.div>

              </div>

              {/* Texto Inferior */}
              <div className="mt-6 text-center w-full relative z-20">
                <h3 className="font-semibold text-emerald-700">Job Done</h3>
                <p className="text-xs text-slate-400 mt-1 px-2 font-medium">
                  Your files are perfectly structured and ready for accounting.
                </p>
              </div>
            </Card>

          </div>
        </div>

        {/* CTA FINAL */}


      </main>

      {/* FOOTER */}
      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-100">
        <p>&copy; 2026 BankSplitter. Built for Bookkeepers.</p>
      </footer>
    </div>
  );
}