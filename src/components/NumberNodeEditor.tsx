import React, { useMemo } from "react";
import { RecNum, flattenRecNum, reconstructRecNum, getComponentExpansionBases } from "../math/recursiveComplex";
import { Plus, Minus, RefreshCw, Shuffle, Trash2 } from "lucide-react";

interface NumberNodeEditorProps {
  level: number;
  value: RecNum;
  onChange: (newValue: RecNum) => void;
  focusedPath: string | null;
  setFocusedPath: (path: string | null) => void;
}

export default function NumberNodeEditor({
  level,
  value,
  onChange,
  focusedPath,
  setFocusedPath,
}: NumberNodeEditorProps) {
  // Extract all leaves
  const leaves = useMemo(() => {
    return flattenRecNum(value, "", level);
  }, [value, level]);

  // Extract bases for labeling
  const bases = useMemo(() => {
    return getComponentExpansionBases(level);
  }, [level]);

  // Handle updates of a single leaf value
  const handleLeafChange = (path: string, numVal: number) => {
    const updatedNodes = leaves.map(leaf => {
      if (leaf.path === path) {
        return { ...leaf, value: isNaN(numVal) ? 0 : numVal };
      }
      return leaf;
    });
    const newVal = reconstructRecNum(updatedNodes, level);
    onChange(newVal);
  };

  // Utility to randomize all fields
  const handleRandomize = () => {
    const updatedNodes = leaves.map(leaf => {
      // Random integer between -9 and 9
      const randomInt = Math.floor(Math.random() * 19) - 9;
      return { ...leaf, value: randomInt };
    });
    const newVal = reconstructRecNum(updatedNodes, level);
    onChange(newVal);
  };

  // Utility to reset/zero all fields
  const handleReset = () => {
    const updatedNodes = leaves.map(leaf => ({ ...leaf, value: 0 }));
    const newVal = reconstructRecNum(updatedNodes, level);
    onChange(newVal);
  };

  // Helper description of the binary path
  const getPathDescription = (path: string) => {
    if (path === "") return "Real Scalar";
    return path
      .split("")
      .map((char, idx) => {
        // char '0' means Real branch of level (level - idx), '1' means imaginary
        const currL = level - idx;
        return char === "0" ? `Re(L${currL})` : `Im(L${currL})`;
      })
      .join(" ➔ ");
  };

  return (
    <div id="number-node-editor" className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 flex flex-col h-full">
      
      {/* Title & Level selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-5 border-b border-slate-200/50 dark:border-slate-800/50">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Structural Builder
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Set Real Coefficients
          </h3>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 self-stretch sm:self-auto justify-end">
          <button
            onClick={handleRandomize}
            title="Randomize Coefficients"
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Random
          </button>
          <button
            onClick={handleReset}
            title="Clear all fields"
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Zero All
          </button>
        </div>
      </div>

      {/* Grid of Leaf Inputs */}
      <div className="flex-1 overflow-y-auto max-h-[300px] sm:max-h-none pr-1 space-y-3 scrollbar-thin">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {leaves.map((leaf, index) => {
            const baseTerm = bases[index];
            const isFocused = focusedPath === leaf.path;

            return (
              <div
                key={`input-${leaf.path}`}
                onFocus={() => setFocusedPath(leaf.path)}
                onBlur={() => setFocusedPath(null)}
                className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  isFocused
                    ? "bg-white dark:bg-slate-900 border-teal-500 shadow-xs ring-2 ring-teal-500/10"
                    : "bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                }`}
              >
                {/* Meta details */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Basis Component
                    </span>
                    <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                      {baseTerm === "1" ? "1 (Real)" : baseTerm}
                    </span>
                  </div>
                  
                  {/* Small code indicator of leaf position in the tree */}
                  <span className="font-mono text-[9px] text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-sm">
                    {leaf.path || "root"}
                  </span>
                </div>

                {/* Number Input Field */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    onClick={() => handleLeafChange(leaf.path, leaf.value - 1)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer active:scale-95 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="number"
                    step="any"
                    value={leaf.value}
                    onChange={(e) => handleLeafChange(leaf.path, parseFloat(e.target.value))}
                    className="flex-1 min-w-0 bg-transparent text-center font-mono text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  />

                  <button
                    onClick={() => handleLeafChange(leaf.path, leaf.value + 1)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Helper Tree Road Path description */}
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 font-mono truncate block">
                  {getPathDescription(leaf.path)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
