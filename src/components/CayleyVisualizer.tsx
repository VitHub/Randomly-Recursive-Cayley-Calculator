import React, { useState, useMemo } from "react";
import { CayleyNumber, CayleyTerm, basisToString, basisToKey } from "../math/cayleyNumber";
import { Code, Layers, Sparkles, Eye, Info } from "lucide-react";

interface CayleyVisualizerProps {
  val: CayleyNumber;
  title?: string;
  onTermClick?: (term: CayleyTerm) => void;
  selectedTermKey?: string | null;
}

export default function CayleyVisualizer({
  val,
  title,
  onTermClick,
  selectedTermKey,
}: CayleyVisualizerProps) {
  const [viewMode, setViewMode] = useState<"sparse" | "spectrum" | "raw">("sparse");
  const [hoveredTermKey, setHoveredTermKey] = useState<string | null>(null);

  // Group terms by hypercomplex space order
  const termsBySpace = useMemo(() => {
    const groups: {
      spaceName: string;
      color: string;
      bgColor: string;
      borderColor: string;
      terms: CayleyTerm[];
    }[] = [
      {
        spaceName: "Real Scalar (e0)",
        color: "text-slate-700 dark:text-slate-300",
        bgColor: "bg-slate-100 dark:bg-slate-800/60",
        borderColor: "border-slate-300 dark:border-slate-700",
        terms: [],
      },
      {
        spaceName: "Complex (e1)",
        color: "text-teal-600 dark:text-teal-400",
        bgColor: "bg-teal-50 dark:bg-teal-950/40",
        borderColor: "border-teal-200 dark:border-teal-800",
        terms: [],
      },
      {
        spaceName: "Quaternion (e2 - e3)",
        color: "text-violet-600 dark:text-violet-400",
        bgColor: "bg-violet-50 dark:bg-violet-950/40",
        borderColor: "border-violet-200 dark:border-violet-800",
        terms: [],
      },
      {
        spaceName: "Octonion (e4 - e7)",
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
        borderColor: "border-indigo-200 dark:border-indigo-800",
        terms: [],
      },
      {
        spaceName: "Sedenion (e8 - e15)",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-950/40",
        borderColor: "border-amber-200 dark:border-amber-800",
        terms: [],
      },
      {
        spaceName: "Pathion & Beyond (e16+)",
        color: "text-rose-600 dark:text-rose-400",
        bgColor: "bg-rose-50 dark:bg-rose-950/40",
        borderColor: "border-rose-200 dark:border-rose-800",
        terms: [],
      },
    ];

    for (const term of val.terms) {
      if (term.basis.type === "index") {
        const idx = term.basis.index;
        if (idx === 0) groups[0].terms.push(term);
        else if (idx === 1) groups[1].terms.push(term);
        else if (idx <= 3) groups[2].terms.push(term);
        else if (idx <= 7) groups[3].terms.push(term);
        else if (idx <= 15) groups[4].terms.push(term);
        else groups[5].terms.push(term);
      } else {
        // Recursive basis
        groups[5].terms.push(term);
      }
    }

    return groups.filter(g => g.terms.length > 0);
  }, [val]);

  // Determine max basis index present
  const maxBasisIdx = useMemo(() => {
    let maxIdx = 0;
    for (const t of val.terms) {
      if (t.basis.type === "index") {
        if (t.basis.index > maxIdx) maxIdx = t.basis.index;
      }
    }
    return maxIdx;
  }, [val]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col h-full transition-all duration-300">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          {title && (
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 block mb-1">
              {title}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Free-Range Cayley Number
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-full">
              {val.terms.length} Non-Zero {val.terms.length === 1 ? "Term" : "Terms"}
            </span>
            {maxBasisIdx > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-full">
                Max Dim e{maxBasisIdx}
              </span>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-xs self-stretch sm:self-auto">
          <button
            onClick={() => setViewMode("sparse")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              viewMode === "sparse"
                ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Sparse Terms
          </button>
          <button
            onClick={() => setViewMode("spectrum")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              viewMode === "spectrum"
                ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Basis Spectrum
          </button>
          <button
            onClick={() => setViewMode("raw")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              viewMode === "raw"
                ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Input Syntax
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center min-h-[160px]">
        {viewMode === "sparse" && (
          val.isZero() ? (
            <div className="text-center py-8 text-slate-400 font-mono text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              0 (Empty / Zero Hypercomplex Number)
            </div>
          ) : (
            <div className="space-y-4">
              {/* Formula Display Banner */}
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 overflow-x-auto text-center scrollbar-thin">
                <div className="font-mono text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap inline-flex items-center gap-1">
                  {val.terms.map((term, idx) => {
                    const key = basisToKey(term.basis);
                    const isSelected = selectedTermKey === key;
                    const isHovered = hoveredTermKey === key;
                    const cVal = typeof term.coeff === "number" ? term.coeff : term.coeff.getScalarValue();
                    const bStr = basisToString(term.basis);
                    const absC = Math.abs(cVal);
                    const isNeg = cVal < 0;

                    return (
                      <span
                        key={key}
                        onClick={() => onTermClick && onTermClick(term)}
                        onMouseEnter={() => setHoveredTermKey(key)}
                        onMouseLeave={() => setHoveredTermKey(null)}
                        className={`inline-flex items-center px-2 py-1 rounded-lg border transition-all duration-200 cursor-pointer select-none ${
                          isSelected || isHovered
                            ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 shadow-xs scale-105"
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-teal-400"
                        }`}
                      >
                        <span className="text-slate-400 mr-1 font-sans font-light">
                          {idx === 0 ? (isNeg ? "-" : "") : isNeg ? " - " : " + "}
                        </span>
                        <span className="font-bold">{absC === 1 && bStr !== "e0" ? "" : parseFloat(absC.toFixed(4))}</span>
                        {bStr !== "e0" && (
                          <span className="ml-1 font-bold text-teal-600 dark:text-teal-400 text-sm">
                            {bStr}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Grouped by Hypercomplex Space */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Active Hypercomplex Dimensions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {termsBySpace.map((group, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border ${group.borderColor} ${group.bgColor} flex flex-col justify-between`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${group.color} block mb-1`}>
                        {group.spaceName}
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {group.terms.map((term) => {
                          const key = basisToKey(term.basis);
                          const bStr = basisToString(term.basis);
                          const cVal = typeof term.coeff === "number" ? term.coeff : term.coeff.getScalarValue();

                          return (
                            <span
                              key={key}
                              onClick={() => onTermClick && onTermClick(term)}
                              className="px-2 py-0.5 bg-white/80 dark:bg-slate-900/80 border border-current/20 rounded-md font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 hover:scale-105 transition cursor-pointer shadow-2xs"
                            >
                              <span className="text-slate-400 text-[10px] mr-0.5">{cVal > 0 ? "+" : ""}</span>
                              {parseFloat(cVal.toFixed(3))}
                              <span className={`ml-1 font-bold ${group.color}`}>{bStr}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        {viewMode === "spectrum" && (
          <div className="space-y-4 p-2">
            <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
              <span>Dimension Spectrum Index (e0 to e{Math.max(15, maxBasisIdx)})</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">Norm |A| = {val.norm().toFixed(4)}</span>
            </div>

            {/* Visual Bar chart of non-zero basis coefficients */}
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
              {val.terms.map((term) => {
                const bStr = basisToString(term.basis);
                const cVal = typeof term.coeff === "number" ? term.coeff : term.coeff.getScalarValue();
                const absCoeff = Math.abs(cVal);
                const pct = Math.min(100, Math.max(10, (absCoeff / Math.max(1, val.norm())) * 100));

                return (
                  <div key={basisToKey(term.basis)} className="flex items-center gap-3 text-xs font-mono">
                    <span className="w-12 font-bold text-teal-600 dark:text-teal-400 text-right">{bStr}</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-16 font-semibold text-slate-700 dark:text-slate-300 text-right">
                      {parseFloat(cVal.toFixed(3))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === "raw" && (
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 font-mono text-xs space-y-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Parsed String Representation
            </span>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-teal-600 dark:text-teal-400 font-bold break-all">
              {val.toInputFormatString()}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              This format uses explicit coefficient parentheses <code>(...)</code> and basis target curly brackets <code>{`{...}`}</code>, matching syntax like <code>((2+3e4)*{`{e0}`} + (7e3+4e5)*{`{e1}`})*{`{e{11}+e{13}}`}</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
