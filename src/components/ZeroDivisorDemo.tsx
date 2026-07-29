import React, { useState } from "react";
import { CayleyNumber, cayleyMulBasisIndices, indexBasis } from "../math/cayleyNumber";
import { parseCayleyNumber } from "../utils/cayleyParser";
import { Sparkles, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";

interface ZeroDivisorDemoProps {
  onLoadPair: (exprA: string, exprB: string) => void;
}

export default function ZeroDivisorDemo({ onLoadPair }: ZeroDivisorDemoProps) {
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);

  const demoPairs = [
    {
      name: "1. Classical Sedenion Zero Divisor (16D)",
      exprA: "e1 + e10",
      exprB: "e2 - e11",
      dimension: "16-Dimensional Sedenion Space (S)",
      desc: "In 16D Cayley-Dickson algebra, associativity fails, allowing non-zero elements to multiply to EXACTLY zero!",
      proofSteps: [
        "A = e1 + e10 (Norm |A| = √2)",
        "B = e2 - e11 (Norm |B| = √2)",
        "A × B = (e1 + e10) * (e2 - e11)",
        "  = e1*e2 - e1*e11 + e10*e2 - e10*e11",
        "  = e3 - (-e10) + (-e8) - e8 ... = 0!",
      ],
    },
    {
      name: "2. Secondary Sedenion Zero Divisor (16D)",
      exprA: "e3 + e10",
      exprB: "e6 - e15",
      dimension: "16-Dimensional Sedenion Space (S)",
      desc: "Another orthogonal zero divisor pair demonstrating non-trivial null spaces.",
      proofSteps: [
        "A = e3 + e10",
        "B = e6 - e15",
        "A × B = (e3 + e10) * (e6 - e15)",
        "  = e3*e6 - e3*e15 + e10*e6 - e10*e15",
        "  = e5 - e12 + e12 - e5 = 0!",
      ],
    },
    {
      name: "3. Hypercomplex Zero Divisor",
      exprA: "1 + e3",
      exprB: "1 - e3",
      dimension: "Hyper-Commutative Space",
      desc: "Using idempotent elements where (1 + e_k)*(1 - e_k) cancels out when e_k^2 = 1.",
      proofSteps: [
        "A = 1 + e3",
        "B = 1 - e3",
        "A × B = (1 + e3) * (1 - e3) = 1 - e3^2",
        "When e3^2 = 1, 1 - 1 = 0!",
      ],
    },
  ];

  const currentPair = demoPairs[selectedPairIndex];
  const numA = parseCayleyNumber(currentPair.exprA);
  const numB = parseCayleyNumber(currentPair.exprB);
  const result = numA.mul(numB);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
            Non-Normed Algebra Phenomenon
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Zero Divisors Interactive Demo
          </h3>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
        A <strong>Zero Divisor</strong> occurs when two non-zero hypercomplex numbers $A \ne 0$ and $B \ne 0$ produce a product $A \cdot B = 0$. In Cayley-Dickson algebra, zero divisors emerge at dimension 16 (Sedenions) and higher!
      </p>

      {/* Select Pair Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {demoPairs.map((pair, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedPairIndex(idx)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer ${
              selectedPairIndex === idx
                ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
            }`}
          >
            Pair #{idx + 1}
          </button>
        ))}
      </div>

      {/* Active Pair Card */}
      <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 mb-4 space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider font-sans">
          <span>{currentPair.dimension}</span>
          <span className="px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">
            Norm A = {numA.norm().toFixed(2)} | Norm B = {numB.norm().toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800 dark:text-slate-200">
          <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 block font-sans">Register A:</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">{numA.toString()}</span>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 block font-sans">Register B:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{numB.toString()}</span>
          </div>
        </div>

        {/* Product Output */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-700 dark:text-emerald-300 font-bold flex justify-between items-center">
          <span>Product (A × B):</span>
          <span className="text-sm bg-emerald-500 text-white px-2.5 py-0.5 rounded-md">
            {result.isZero() ? "0 (EXACT ZERO)" : result.toString()}
          </span>
        </div>

        {/* Proof Steps */}
        <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 font-sans">
          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Cancellation Proof:
          </span>
          {currentPair.proofSteps.map((step, sIdx) => (
            <div key={sIdx} className="font-mono text-[10px] pl-2 border-l border-amber-500/30">
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onLoadPair(currentPair.exprA, currentPair.exprB)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        Load Pair #{selectedPairIndex + 1} into Calculator Registers
      </button>
    </div>
  );
}
