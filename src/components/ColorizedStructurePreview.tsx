import React from "react";
import { RecNum, getLevel } from "../math/recursiveComplex";

interface ColorizedStructurePreviewProps {
  val: RecNum;
}

export default function ColorizedStructurePreview({ val }: ColorizedStructurePreviewProps) {
  const renderNode = (node: RecNum, depth: number): React.ReactNode => {
    const lvl = getLevel(node);
    
    // Choose theme colors for levels
    const levelThemes = [
      { border: "border-slate-200 dark:border-slate-800", bg: "bg-slate-50 dark:bg-slate-900/40", text: "text-slate-800 dark:text-slate-200", badgeColor: "text-slate-500 bg-slate-100 dark:bg-slate-800" },
      { border: "border-teal-500/30 dark:border-teal-500/20", bg: "bg-teal-500/5 dark:bg-teal-500/2", text: "text-teal-700 dark:text-teal-400", badgeColor: "text-teal-600 bg-teal-500/10 dark:bg-teal-500/20" },
      { border: "border-violet-500/45 dark:border-violet-500/20", bg: "bg-violet-500/5 dark:bg-violet-500/2", text: "text-violet-700 dark:text-violet-400", badgeColor: "text-violet-600 bg-violet-500/10 dark:bg-violet-500/20" },
      { border: "border-amber-500/45 dark:border-amber-500/20", bg: "bg-amber-500/5 dark:bg-amber-500/2", text: "text-amber-700 dark:text-amber-400", badgeColor: "text-amber-600 bg-amber-500/10 dark:bg-amber-500/20" },
      { border: "border-rose-500/45 dark:border-rose-500/20", bg: "bg-rose-500/5 dark:bg-rose-500/2", text: "text-rose-700 dark:text-rose-400", badgeColor: "text-rose-600 bg-rose-500/10 dark:bg-rose-500/20" },
    ];
    
    // Fallback theme for higher levels
    const currentTheme = levelThemes[lvl] || levelThemes[levelThemes.length - 1];

    if (typeof node === "number") {
      const formatted = Math.abs(node - Math.round(node)) < 1e-9 ? `${Math.round(node)}` : `${parseFloat(node.toFixed(4))}`;
      return (
        <span className="font-mono px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 rounded-xl inline-block shadow-xs">
          {formatted}
        </span>
      );
    }

    return (
      <div className={`inline-flex flex-col p-3 rounded-2xl border ${currentTheme.border} ${currentTheme.bg} transition-all duration-200 shadow-xs min-w-[200px] flex-1 md:flex-initial`}>
        {/* Component Header / Tag */}
        <div className="flex justify-between items-center gap-4 mb-2 select-none">
          <span className="text-[9px] uppercase tracking-wider font-bold opacity-60 font-mono">
            C^{node.level} Space
          </span>
          <span className={`px-2 py-0.5 text-[8px] font-bold font-mono rounded-md shrink-0 uppercase border opacity-90 ${currentTheme.badgeColor} border-current/15`}>
            {node.level === 1 ? `i1 Hyper` : `i${node.level} Hyper`}
          </span>
        </div>

        {/* Real and Imaginary inline blocks */}
        <div className="flex items-stretch gap-2">
          {/* Real part */}
          <div className="flex-1 p-2 bg-white/40 dark:bg-black/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-[9px] font-bold opacity-45 block mb-1 uppercase tracking-wider">
              Real (Left)
            </span>
            <div className="flex items-center justify-center py-1">
              {renderNode(node.re, depth + 1)}
            </div>
          </div>

          {/* imaginary unit separator */}
          <div className="flex items-center justify-center font-bold text-sm select-none opacity-40 px-1 font-mono">
            +
          </div>

          {/* Imaginary part */}
          <div className="flex-1 p-2 bg-white/40 dark:bg-black/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex justify-between items-center gap-1.5 mb-1 select-none">
              <span className="text-[9px] font-bold opacity-45 uppercase tracking-wider">
                Imag (Right)
              </span>
              <span className="font-bold text-[10px] text-teal-600 dark:text-teal-400 font-mono">*i{node.level}</span>
            </div>
            <div className="flex items-center justify-center py-1">
              {renderNode(node.im, depth + 1)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto py-2.5 flex flex-wrap gap-3 items-center">
      {renderNode(val, 0)}
    </div>
  );
}
