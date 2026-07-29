import React from "react";
import { CayleyNumber, CayleyTerm, indexBasis, basisToString } from "../math/cayleyNumber";
import { Plus, Minus, Shuffle, Trash2, Sparkles } from "lucide-react";

interface CayleyNodeEditorProps {
  val: CayleyNumber;
  onChange: (newVal: CayleyNumber) => void;
  selectedTermKey: string | null;
  setSelectedTermKey: (key: string | null) => void;
}

export default function CayleyNodeEditor({
  val,
  onChange,
  selectedTermKey,
  setSelectedTermKey,
}: CayleyNodeEditorProps) {
  // Preset list of popular basis target indices to add easily
  const quickBases = [0, 1, 2, 3, 4, 5, 7, 10, 11, 13, 15];

  const handleUpdateCoeff = (basisIdx: number, delta: number) => {
    let existingTermFound = false;
    const newTerms: CayleyTerm[] = val.terms.map(t => {
      if (t.basis.type === "index" && t.basis.index === basisIdx) {
        existingTermFound = true;
        const currCoeff = typeof t.coeff === "number" ? t.coeff : t.coeff.getScalarValue();
        return { coeff: currCoeff + delta, basis: t.basis };
      }
      return t;
    });

    if (!existingTermFound && delta !== 0) {
      newTerms.push({ coeff: delta, basis: indexBasis(basisIdx) });
    }

    onChange(new CayleyNumber(newTerms));
  };

  const handleSetCoeff = (basisIdx: number, valNum: number) => {
    let existingTermFound = false;
    const newTerms: CayleyTerm[] = val.terms.map(t => {
      if (t.basis.type === "index" && t.basis.index === basisIdx) {
        existingTermFound = true;
        return { coeff: isNaN(valNum) ? 0 : valNum, basis: t.basis };
      }
      return t;
    });

    if (!existingTermFound) {
      newTerms.push({ coeff: isNaN(valNum) ? 0 : valNum, basis: indexBasis(basisIdx) });
    }

    onChange(new CayleyNumber(newTerms));
  };

  const handleRandomize = () => {
    const randomTerms: CayleyTerm[] = [];
    const count = Math.floor(Math.random() * 4) + 2; // 2 to 5 terms
    const usedBases = new Set<number>();

    for (let i = 0; i < count; i++) {
      const idxChoices = [0, 1, 2, 3, 4, 5, 8, 10, 11, 13, 15];
      const randomIdx = idxChoices[Math.floor(Math.random() * idxChoices.length)];
      if (!usedBases.has(randomIdx)) {
        usedBases.add(randomIdx);
        const randomVal = (Math.floor(Math.random() * 19) - 9) || 1; // -9 to 9 excluding 0
        randomTerms.push({ coeff: randomVal, basis: indexBasis(randomIdx) });
      }
    }

    onChange(new CayleyNumber(randomTerms));
  };

  const handleReset = () => {
    onChange(new CayleyNumber([]));
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 flex flex-col h-full">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-5 border-b border-slate-200/50 dark:border-slate-800/50">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Sparse Builder
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Set Non-Zero Coefficients
          </h3>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5 self-stretch sm:self-auto justify-end">
          <button
            onClick={handleRandomize}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Random
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Zero All
          </button>
        </div>
      </div>

      {/* Quick Add Basis Pills */}
      <div className="mb-4">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
          Quick Add / Adjust Basis Target:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickBases.map((idx) => {
            const hasTerm = val.terms.some(t => t.basis.type === "index" && t.basis.index === idx);
            return (
              <button
                key={idx}
                onClick={() => handleUpdateCoeff(idx, 1)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition cursor-pointer ${
                  hasTerm
                    ? "bg-teal-500 text-white border-teal-600 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-400"
                }`}
              >
                +e{idx}
              </button>
            );
          })}
        </div>
      </div>

      {/* List of active terms for direct numeric editing */}
      <div className="flex-1 overflow-y-auto max-h-[300px] sm:max-h-none pr-1 space-y-2.5 scrollbar-thin">
        {val.terms.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No terms set. Click a "+e[k]" button above or type an expression in the input box!
          </div>
        ) : (
          val.terms.map((term, idx) => {
            const bIdx = term.basis.type === "index" ? term.basis.index : 0;
            const bStr = basisToString(term.basis);
            const cVal = typeof term.coeff === "number" ? term.coeff : term.coeff.getScalarValue();

            return (
              <div
                key={`${bStr}-${idx}`}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-teal-400 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-md">
                    {bStr}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {bIdx === 0 ? "Real Scalar" : `Dimension ${bIdx}`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateCoeff(bIdx, -1)}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <input
                    type="number"
                    step="any"
                    value={cVal}
                    onChange={(e) => handleSetCoeff(bIdx, parseFloat(e.target.value))}
                    className="w-20 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-center font-mono text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  />

                  <button
                    onClick={() => handleUpdateCoeff(bIdx, 1)}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
