import React from "react";
import { HistoryItem } from "../types";
import { Clock, RotateCcw, Trash2, Download, Copy, Check, Search } from "lucide-react";

interface ComputationHistoryProps {
  history: HistoryItem[];
  onReload: (exprA: string, exprB: string) => void;
  onClear: () => void;
  onExport: () => void;
}

export default function ComputationHistory({
  history,
  onReload,
  onClear,
  onExport,
}: ComputationHistoryProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const filteredHistory = history.filter(
    (item) =>
      item.equation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.exprA.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.exprB.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.resultString.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
              Computation Log
            </span>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Calculation History ({history.length})
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {history.length > 0 && (
            <>
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/50 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Input */}
      {history.length > 0 && (
        <div className="relative mb-4">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter past calculations..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-teal-500"
          />
        </div>
      )}

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 pr-1 scrollbar-thin">
        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            No calculations performed yet. Execute operations using the keyboard above to build your computation history!
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No matching history records found for "{searchTerm}".
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl space-y-2 hover:border-teal-500/50 transition"
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span className="px-2 py-0.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold rounded-md">
                  {item.op.toUpperCase()}
                </span>
                <span>{item.timestamp}</span>
              </div>

              <div className="font-mono text-xs text-slate-800 dark:text-slate-200 font-semibold break-all bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                {item.equation}
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px]">
                <button
                  onClick={() => onReload(item.exprA, item.exprB)}
                  className="flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Load into Registers
                </button>

                <button
                  onClick={() => handleCopy(item.id, item.resultString)}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedId === item.id ? "Copied" : "Copy Result"}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
