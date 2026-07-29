import React, { useState, useMemo } from "react";
import { RecNum, getLevel, flattenRecNum, getComponentExpansionBases } from "../math/recursiveComplex";
import { Sparkles, Eye, Code, Layers } from "lucide-react";

interface VisualizerProps {
  val: RecNum;
  title?: string;
  onLeafClick?: (path: string) => void;
  focusedPath?: string | null;
  interactive?: boolean;
}

export default function RecursiveComplexVisualizer({
  val,
  title,
  onLeafClick,
  focusedPath,
  interactive = true,
}: VisualizerProps) {
  const [viewMode, setViewMode] = useState<"formula" | "tree" | "expansion">("formula");
  const [hoveredNode, setHoveredNode] = useState<{ path: string; expr: string; l: number } | null>(null);

  const level = getLevel(val);

  // Compute leaf nodes
  const leaves = useMemo(() => {
    if (level > 5) return [];
    return flattenRecNum(val);
  }, [val, level]);

  // Compute all bases for the algebraic expansion of C^level
  const expansionBases = useMemo(() => {
    if (level > 5) return [];
    return getComponentExpansionBases(level);
  }, [level]);

  // SVG dimensions & coordinates matching tree deepness
  const svgMetrics = useMemo(() => {
    const width = 600;
    const height = 180;
    const paddingX = 40;
    const paddingY = 30;

    const coords: Record<string, { x: number; y: number; label: string; subVal: string; recLevel: number }> = {};

    if (level > 5) {
      return { width, height, coords };
    }

    // Helper to traverse tree and map nodes
    const traverse = (node: RecNum, path: string, depth: number, minX: number, maxX: number) => {
      const currentLevel = getLevel(node);
      const x = minX + (maxX - minX) / 2;
      const y = paddingY + depth * ((height - 2 * paddingY) / Math.max(level, 1));
      
      let label = "";
      let subVal = "";
      if (typeof node === "number") {
        label = "R";
        subVal = node.toFixed(2);
      } else {
        label = `i${node.level}`;
        subVal = node.toString(2);
      }

      coords[path] = { x, y, label, subVal, recLevel: currentLevel };

      if (typeof node !== "number" && currentLevel > 0) {
        const mid = minX + (maxX - minX) / 2;
        traverse(node.re, path + "0", depth + 1, minX, mid);
        traverse(node.im, path + "1", depth + 1, mid, maxX);
      }
    };

    traverse(val, "", 0, paddingX, width - paddingX);
    return { width, height, coords };
  }, [val, level]);

  // Function to show sub-expression formula of a specific branch
  const getSubExpressionStr = (node: RecNum): string => {
    if (typeof node === "number") {
      return node.toFixed(4).replace(/\.?0+$/, "");
    }
    return node.toString(4);
  };

  /**
   * Return formula styled with beautiful rich span structures.
   */
  const renderRichFormula = (node: RecNum, levelCounter: number): React.ReactNode => {
    if (typeof node === "number") {
      const rounded = parseFloat(node.toFixed(4));
      return (
        <span className="font-mono text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-1 rounded transition">
          {rounded}
        </span>
      );
    }

    const az = node;
    const isImZero = typeof az.im === "number" && az.im === 0;
    const isReZero = typeof az.re === "number" && az.re === 0;

    // Sub levels
    const reNode = renderRichFormula(az.re, levelCounter - 1);
    const imNode = renderRichFormula(az.im, levelCounter - 1);

    if (isImZero) {
      return reNode;
    }

    if (isReZero) {
      return (
        <span className="inline-flex items-center">
          <span className="font-mono">{imNode}</span>
          <span className="mx-0.5 font-bold text-amber-550 text-xs select-none">*i{az.level}</span>
        </span>
      );
    }

    const levelThemes = [
      { border: "border-slate-200/50 dark:border-slate-800/50", bg: "bg-slate-50/40 dark:bg-slate-950/20", label: "text-slate-500" },
      { border: "border-teal-500/30 dark:border-teal-500/15", bg: "bg-teal-500/5 dark:bg-teal-500/2", label: "text-teal-600 dark:text-teal-400" },
      { border: "border-violet-500/35 dark:border-violet-500/15", bg: "bg-violet-500/5 dark:bg-violet-500/2", label: "text-violet-600 dark:text-violet-400" },
      { border: "border-amber-500/35 dark:border-amber-500/15", bg: "bg-amber-500/5 dark:bg-amber-500/2", label: "text-amber-600 dark:text-amber-400" },
      { border: "border-rose-500/35 dark:border-rose-500/15", bg: "bg-rose-500/5 dark:bg-rose-500/2", label: "text-rose-600 dark:text-rose-400" },
    ];
    const currentTheme = levelThemes[az.level] || levelThemes[levelThemes.length - 1];

    return (
      <span className={`inline-flex items-center border ${currentTheme.border} ${currentTheme.bg} px-2 py-0.5 rounded-lg my-0.5 whitespace-nowrap`}>
        {reNode}
        <span className="mx-1 text-slate-400 font-light">+</span>
        <span className="font-mono">{imNode}</span>
        <span className={`ml-0.5 font-bold text-xs select-none ${currentTheme.label}`}>*i{az.level}</span>
      </span>
    );
  };

  return (
    <div id="recursive-complex-visualizer" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col h-full transition-all duration-300">
      
      {/* Background glow lines decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          {title && <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 block mb-1">{title}</span>}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Recursive Complex Number
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50 rounded-full">
              level C^{level}
            </span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/40 dark:border-slate-700/40 self-stretch sm:self-auto text-xs">
          <button
            onClick={() => setViewMode("formula")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === "formula"
                ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Formula
          </button>
          <button
            onClick={() => setViewMode("tree")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === "tree"
                ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Tree Map
          </button>
          <button
            onClick={() => setViewMode("expansion")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === "expansion"
                ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Expansion
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col justify-center min-h-[160px]">
        {viewMode === "formula" && (
          <div className="text-center p-4">
            <div className="inline-block max-w-full overflow-x-auto overflow-y-hidden text-base sm:text-lg text-slate-800 dark:text-slate-100 py-4 px-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              <div className="flex items-center justify-center flex-wrap gap-1 leading-relaxed">
                {renderRichFormula(val, level)}
              </div>
            </div>
            
            {/* Real vs Imaginary Summary footer */}
            {level > 0 && typeof val !== "number" && (
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-dashed border-slate-100 dark:border-slate-800 pt-4 text-xs">
                <div className="text-left bg-teal-500/5 dark:bg-teal-500/2 hover:bg-teal-500/8 px-3 py-2 rounded-xl transition">
                  <span className="text-teal-600 dark:text-teal-400 font-semibold block mb-0.5">Real parts (re in C^{level-1})</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px] block truncate">
                    {getSubExpressionStr(val.re)}
                  </span>
                </div>
                <div className="text-right bg-amber-500/5 dark:bg-amber-500/2 hover:bg-amber-500/8 px-3 py-2 rounded-xl transition">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold block mb-0.5">Imaginary parts (im in C^{level-1})</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px] block truncate">
                    {getSubExpressionStr(val.im)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === "tree" && (
          level > 5 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50 dark:bg-slate-950/20">
              <span className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm font-bold mb-3">⚠️</span>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Tree Map Complexity Limit</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-550 max-w-sm leading-normal">
                At order <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-teal-600">r={level}</code>, the space contains <code className="font-mono">{Math.pow(2, level).toLocaleString()}</code> bases. Diagrams are disabled above order 5 to safeguard responsiveness.
              </p>
              <button 
                onClick={() => setViewMode("formula")}
                className="mt-4 px-3 py-1.5 text-[10px] font-bold bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition cursor-pointer"
              >
                Go to Formula View
              </button>
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto select-none overflow-y-hidden py-1">
              <div className="mx-auto" style={{ width: `${svgMetrics.width}px` }}>
                <svg width={svgMetrics.width} height={svgMetrics.height} className="overflow-visible">
                  {/* Connecting Lines */}
                  {(() => {
                    const coordsTyped = svgMetrics.coords as Record<string, { x: number; y: number; label: string; subVal: string; recLevel: number }>;
                    return Object.entries(coordsTyped).map(([path, pCoord]) => {
                      if (path === "") return null;
                      const parentPath = path.slice(0, -1);
                      const parentCoord = coordsTyped[parentPath];
                      if (!parentCoord) return null;

                      const isLeft = path.endsWith("0");
                      const strokeColor = isLeft 
                        ? "stroke-teal-500/40 dark:stroke-teal-500/20" 
                        : "stroke-amber-500/40 dark:stroke-amber-500/20";
                      
                      // Highlight active branch path
                      const isActivePath = focusedPath && focusedPath.startsWith(path);
                      const strokeWidth = isActivePath ? 3 : 1.5;
                      const activeColor = isLeft ? "stroke-teal-500" : "stroke-amber-500";

                      return (
                        <line
                          key={`line-${path}`}
                          x1={parentCoord.x}
                          y1={parentCoord.y}
                          x2={pCoord.x}
                          y2={pCoord.y}
                          className={`transition-all duration-300 ${isActivePath ? activeColor : strokeColor}`}
                          strokeWidth={strokeWidth}
                        />
                      );
                    });
                  })()}

                  {/* Nodes */}
                  {(() => {
                    const coordsTyped = svgMetrics.coords as Record<string, { x: number; y: number; label: string; subVal: string; recLevel: number }>;
                    return Object.entries(coordsTyped).map(([path, rCoord]) => {
                      const isLeaf = rCoord.recLevel === 0;
                      const isLeft = path.endsWith("0");
                      const isFocused = focusedPath === path;
                      
                      // Color highlights based on role
                      let nodeColor = "fill-slate-100 hover:fill-slate-200 stroke-slate-300 dark:fill-slate-800 dark:hover:fill-slate-700 dark:stroke-slate-600";
                      if (isLeaf) {
                        nodeColor = isLeft 
                          ? "fill-teal-50 hover:fill-teal-100 stroke-teal-200 dark:fill-teal-950/20 dark:hover:fill-teal-950/40 dark:stroke-teal-800"
                          : "fill-amber-50 hover:fill-amber-100 stroke-amber-200 dark:fill-amber-950/20 dark:hover:fill-amber-950/40 dark:stroke-amber-800";
                      }

                      if (isFocused) {
                        nodeColor = isLeft 
                          ? "fill-teal-500 stroke-teal-600 dark:fill-teal-500 dark:stroke-teal-400" 
                          : "fill-amber-500 stroke-amber-600 dark:fill-amber-500 dark:stroke-amber-400";
                      }

                      // Mouse interact
                      const handleNodeInteractionStart = () => {
                        let subNode = val;
                        for (let c of path) {
                          if (typeof subNode === "number") break;
                          subNode = c === "0" ? subNode.re : subNode.im;
                        }
                        const expr = getSubExpressionStr(subNode);
                        setHoveredNode({ path, expr, l: rCoord.recLevel });
                      };

                      return (
                        <g
                          key={`node-${path}`}
                          className="cursor-pointer group"
                          onClick={() => isLeaf && onLeafClick && onLeafClick(path)}
                          onMouseEnter={handleNodeInteractionStart}
                          onMouseLeave={() => setHoveredNode(null)}
                        >
                          <circle
                            cx={rCoord.x}
                            cy={rCoord.y}
                            r={isLeaf ? 15 : 17}
                            className={`transition-all duration-300 ${nodeColor}`}
                            strokeWidth={isFocused ? 2.5 : 1.5}
                          />
                          
                          {/* Inner Label */}
                          <text
                            x={rCoord.x}
                            y={rCoord.y + 4}
                            textAnchor="middle"
                            className={`text-[10px] font-mono leading-none tracking-tight font-bold select-none transition-colors duration-300 ${
                              isFocused 
                                ? "fill-white" 
                                : isLeaf
                                  ? isLeft ? "fill-teal-700 dark:fill-teal-300" : "fill-amber-700 dark:fill-amber-300"
                                  : "fill-slate-600 dark:fill-slate-300"
                            }`}
                          >
                            {rCoord.label}
                          </text>

                          {/* Tooltip on SVG hover */}
                          <title>{`Path: ${path || "root"} -> Level ${rCoord.recLevel}\nValue: ${rCoord.subVal}`}</title>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>

              {/* Sub-expression tracker card */}
              <div className="h-6 flex items-center justify-center text-xs mt-1 text-slate-500 dark:text-slate-400 transition-all font-mono">
                {hoveredNode ? (
                  <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full animate-fade-in text-[11px] border border-slate-200/40 dark:border-slate-700/40">
                    <span className="text-slate-400 mr-1">Subtree {hoveredNode.path? `(${hoveredNode.path})` : "Total"}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{hoveredNode.expr}</span>
                    <span className="ml-1.5 font-bold text-teal-600 text-[10px]">C^{hoveredNode.l}</span>
                  </span>
                ) : (
                  <span className="text-[10px] italic text-slate-400">Hover over any node to inspect sub-expression</span>
                )}
              </div>
            </div>
          )
        )}

        {viewMode === "expansion" && (
          level > 5 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50 dark:bg-slate-950/20">
              <span className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm font-bold mb-3">⚠️</span>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Expansion List Alert</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-550 max-w-sm leading-normal">
                Linear polyfield expansion is hidden above order 5 to safeguard performance (contains <code className="font-mono">{Math.pow(2, level).toLocaleString()}</code> dimension coefficients). Use the real-time component separation preview instead.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 font-mono text-[11px] leading-relaxed">
              <span className="text-slate-400 block mb-2 text-[10px] uppercase tracking-wider font-semibold">Flat Linear Polyfield Expansion</span>
              <div className="max-h-[140px] overflow-y-auto space-y-1.5 scrollbar-thin">
                {leaves.map((leaf, index) => {
                  const base = expansionBases[index];
                  const active = focusedPath === leaf.path;
                  return (
                    <div
                      key={`leaf-${index}`}
                      onClick={() => onLeafClick && onLeafClick(leaf.path)}
                      className={`flex justify-between items-center px-2.5 py-1 rounded-md transition cursor-pointer select-none ${
                        active
                          ? "bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-bold"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 font-normal">Idx {index}: path ({leaf.path})</span>
                        <span className={`font-semibold ${active ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {base === "1" ? "1" : base}
                        </span>
                      </div>
                      <span className="font-bold text-xs">
                        {parseFloat(leaf.value.toFixed(4))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>

    </div>
  );
}
