import React, { useState, useMemo, useEffect } from "react";
import { CayleyNumber, CayleyTerm, basisToString, basisToKey } from "./math/cayleyNumber";
import { parseCayleyNumber } from "./utils/cayleyParser";
import CayleyVisualizer from "./components/CayleyVisualizer";
import CayleyNodeEditor from "./components/CayleyNodeEditor";
import MathExplainer from "./components/MathExplainer";
import ZeroDivisorDemo from "./components/ZeroDivisorDemo";
import ComputationHistory from "./components/ComputationHistory";
import Cayley3DPlotter from "./components/Cayley3DPlotter";
import CayleyFractalGenerator from "./components/CayleyFractalGenerator";
import { HistoryItem } from "./types";
import {
  serializeCayleyNumber,
  generateCayleyReport,
  downloadJsonFile,
  downloadTextFile
} from "./utils/exportUtils";

// Icons from lucide-react
import { 
  Plus, 
  Minus, 
  X, 
  Percent, 
  Calculator, 
  Sparkles, 
  BookOpen, 
  ArrowRightLeft, 
  RefreshCw, 
  ArrowLeft, 
  HelpCircle,
  Equal,
  Compass,
  FileSpreadsheet,
  Download,
  FileText,
  Share2,
  Check,
  ShieldAlert,
  Code,
  Layers,
  Clock,
  Box,
  Maximize2
} from "lucide-react";

export default function App() {
  // Register Input Strings (Default to prompt's exact example)
  const [inputStringA, setInputStringA] = useState<string>("((2+3e4)*{e0} + (7e3+4e5)*{e1})*{e{11}+e{13}}");
  const [inputStringB, setInputStringB] = useState<string>("(4)*{e0} + (1+2e1)*{e2}");

  // Live parsed Cayley numbers
  const valA = useMemo(() => parseCayleyNumber(inputStringA), [inputStringA]);
  const valB = useMemo(() => parseCayleyNumber(inputStringB), [inputStringB]);

  // Selected Term Keys for inspector focus
  const [selectedTermKeyA, setSelectedTermKeyA] = useState<string | null>(null);
  const [selectedTermKeyB, setSelectedTermKeyB] = useState<string | null>(null);

  // Active Register View Tab ("A", "B", "3DPlot", "Fractal", "History", "ZeroDivisor")
  const [activeTab, setActiveTab] = useState<"A" | "B" | "3DPlot" | "Fractal" | "History" | "ZeroDivisor">("A");

  // Calculator Result state
  const [activeOp, setActiveOp] = useState<string>("");
  const [calcResult, setCalcResult] = useState<CayleyNumber | number | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Detailed equation string
  const [equationString, setEquationString] = useState<string>("");

  // Computation History state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("cayley_calc_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("cayley_calc_history", JSON.stringify(history));
    } catch (e) {
      console.warn("Unable to save history to localStorage", e);
    }
  }, [history]);

  // Helper to append a calculation to history
  const logToHistory = (op: string, eq: string, res: CayleyNumber | number) => {
    const newItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      op,
      equation: eq,
      exprA: inputStringA,
      exprB: inputStringB,
      resultString: typeof res === "number" ? `${res}` : res.toString(),
    };

    setHistory((prev) => [newItem, ...prev.slice(0, 49)]); // Keep last 50
  };

  // Theme selection state & Clipboard Copied status
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("rcomplex-theme") || "slate");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("rcomplex-theme", theme);
    const isDark = theme === "cyber";
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const bodyBgColorMap: Record<string, string> = {
      slate: "#f8fafc",
      cyber: "#020617",
      emerald: "#f5f5f4",
      sepia: "#faf6eb"
    };
    document.body.style.backgroundColor = bodyBgColorMap[theme] || "#f8fafc";
  }, [theme]);

  // Presets definition
  const presets = [
    {
      name: "1. Prompt Example (Wildly Recursive)",
      desc: "Multiplies nested coefficients by basis targets {e0}, {e1}, and {e{11}+e{13}}.",
      exprA: "((2+3e4)*{e0} + (7e3+4e5)*{e1})*{e{11}+e{13}}",
      exprB: "(4)*{e0} + (1+2e1)*{e2}",
    },
    {
      name: "2. Classical Complex Space (e1)",
      desc: "Standard 2D complex numbers: e1^2 = -1.",
      exprA: "3 + 4e1",
      exprB: "1 - 2e1",
    },
    {
      name: "3. Quaternion Space (e1, e2, e3)",
      desc: "4D non-commutative Quaternions where e1*e2 = e3 and e2*e1 = -e3.",
      exprA: "1 + 2e1 + 3e2 + 4e3",
      exprB: "2e1 - 1e2",
    },
    {
      name: "4. Octonion Space (e1..e7)",
      desc: "8D non-associative Octonion algebra.",
      exprA: "1 + 5e4 - 3e7",
      exprB: "2 + 4e5",
    },
    {
      name: "5. Sedenion Zero Divisors (16D)",
      desc: "Non-zero Sedenions that multiply to EXACTLY zero: (e1 + e10) * (e2 - e11) = 0.",
      exprA: "e1 + e10",
      exprB: "e2 - e11",
    },
    {
      name: "6. Recursive Basis Target",
      desc: "A basis element target whose index is itself a Cayley expression e_{3e2 + 4e5}.",
      exprA: "(5 + 2e1) * {e{3e2 + 4e5}}",
      exprB: "{e0}",
    },
  ];

  const handleApplyPreset = (p: typeof presets[number]) => {
    setInputStringA(p.exprA);
    setInputStringB(p.exprB);
    setCalcResult(null);
    setActiveOp("");
    setCalcError(null);
    setEquationString("Preset loaded successfully!");
  };

  // Safe operation executors
  const executeBinaryOp = (opCode: "add" | "sub" | "mul" | "div" | "eq") => {
    setCalcError(null);
    setActiveOp(opCode);
    try {
      let res: CayleyNumber | number = CayleyNumber.scalar(0);
      let symbol = "";

      switch (opCode) {
        case "add":
          res = valA.add(valB);
          symbol = "+";
          break;
        case "sub":
          res = valA.sub(valB);
          symbol = "-";
          break;
        case "mul":
          res = valA.mul(valB);
          symbol = "×";
          break;
        case "div":
          res = valA.div(valB);
          symbol = "÷";
          break;
        case "eq":
          res = valA.equals(valB) ? 1 : 0;
          symbol = "==";
          break;
      }

      setCalcResult(res);
      const resDisp = typeof res === "number" ? `${res}` : res.toString();
      const eqStr = `[A] ${symbol} [B] ➔ ${resDisp}`;
      setEquationString(eqStr);
      logToHistory(opCode, eqStr, res);
    } catch (err: any) {
      setCalcError(err.message || "Calculation failed.");
      setCalcResult(null);
    }
  };

  const executeUnaryOp = (opCode: "conj" | "norm" | "inv" | "exp" | "ln" | "sin" | "cos" | "tan") => {
    setCalcError(null);
    setActiveOp(opCode);
    try {
      let res: CayleyNumber | number = CayleyNumber.scalar(0);

      switch (opCode) {
        case "conj":
          res = valA.conjugate();
          break;
        case "norm":
          res = valA.norm();
          break;
        case "inv":
          res = valA.inverse();
          break;
        case "exp":
          res = valA.exp();
          break;
        case "ln":
          res = valA.ln();
          break;
        case "sin":
          res = valA.sin();
          break;
        case "cos":
          res = valA.cos();
          break;
        case "tan":
          res = valA.tan();
          break;
      }

      setCalcResult(res);
      const resDisp = typeof res === "number" ? `${res}` : res.toString();
      const eqStr = `${opCode.toUpperCase()}([A]) ➔ ${resDisp}`;
      setEquationString(eqStr);
      logToHistory(opCode, eqStr, res);
    } catch (err: any) {
      setCalcError(err.message || "Unary evaluation error.");
      setCalcResult(null);
    }
  };

  const handleSwapRegisters = () => {
    const temp = inputStringA;
    setInputStringA(inputStringB);
    setInputStringB(temp);
    setCalcResult(null);
    setActiveOp("");
    setEquationString("Swapped Register A ↔ Register B");
  };

  const handleCopyResult = () => {
    if (!calcResult) return;
    const str = typeof calcResult === "number" ? `${calcResult}` : calcResult.toString();
    navigator.clipboard.writeText(str);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = (format: "txt" | "json") => {
    if (calcResult === null) return;

    if (format === "json") {
      const data = {
        equation: equationString,
        operation: activeOp,
        registerA: serializeCayleyNumber(valA),
        registerB: serializeCayleyNumber(valB),
        result: typeof calcResult === "number" ? calcResult : serializeCayleyNumber(calcResult),
      };
      downloadJsonFile(data, "cayley-number-calculation.json");
    } else {
      const report = generateCayleyReport(
        equationString || "Cayley Computation",
        activeOp || "Evaluate",
        valA,
        valB,
        calcResult
      );
      downloadTextFile(report, "cayley-number-report.txt");
    }
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300 pb-16">
      
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-mono font-bold text-lg shadow-sm">
              Cⁿ
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Randomly Recursive Cayley Calculator
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Free-Range Wildly Recursive Hypercomplex Algebras across arbitrary Cayley-Dickson dimensions
              </p>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
              {[
                { id: "slate", label: "Slate" },
                { id: "cyber", label: "Cyber" },
                { id: "emerald", label: "Stone" },
                { id: "sepia", label: "Sepia" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    theme === t.id 
                      ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* Preset Selector Banner */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Preset Hypercomplex Spaces & Expression Examples
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(p)}
                className="p-3 bg-slate-50 hover:bg-teal-500/5 dark:bg-slate-950/40 dark:hover:bg-teal-500/10 border border-slate-200/70 dark:border-slate-800 rounded-xl text-left transition cursor-pointer group flex flex-col justify-between"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 block mb-1">
                  {p.name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-tight">
                  {p.desc}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Dual Input Registers Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Register A Input Card */}
          <div className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition ${
            activeTab === "A" ? "border-teal-500 ring-2 ring-teal-500/10" : "border-slate-200 dark:border-slate-800"
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-500 text-white font-mono font-bold text-xs flex items-center justify-center">
                  A
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Register A String Input
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold text-slate-400">
                Norm = {valA.norm().toFixed(3)}
              </span>
            </div>

            <textarea
              rows={2}
              value={inputStringA}
              onFocus={() => setActiveTab("A")}
              onChange={(e) => setInputStringA(e.target.value)}
              placeholder="e.g. ((2+3e4)*{e0} + (7e3+4e5)*{e1})*{e{11}+e{13}}"
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-teal-500 transition"
            />

            <div className="mt-2 flex justify-between items-center text-[10px] text-slate-400">
              <span>Syntax: <code>(coeff)*{`{basis}`}</code></span>
              <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">
                Parsed: {valA.toString()}
              </span>
            </div>
          </div>

          {/* Register B Input Card */}
          <div className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition ${
            activeTab === "B" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-slate-200 dark:border-slate-800"
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-mono font-bold text-xs flex items-center justify-center">
                  B
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Register B String Input
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold text-slate-400">
                Norm = {valB.norm().toFixed(3)}
              </span>
            </div>

            <textarea
              rows={2}
              value={inputStringB}
              onFocus={() => setActiveTab("B")}
              onChange={(e) => setInputStringB(e.target.value)}
              placeholder="e.g. (4)*{e0} + (1+2e1)*{e2}"
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-amber-500 transition"
            />

            <div className="mt-2 flex justify-between items-center text-[10px] text-slate-400">
              <button
                onClick={handleSwapRegisters}
                className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <ArrowRightLeft className="w-3 h-3" />
                Swap A ↔ B
              </button>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                Parsed: {valB.toString()}
              </span>
            </div>
          </div>
        </section>

        {/* Interactive Keyboard / Operations Panel */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-teal-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Hypercomplex Operations Keyboard
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {equationString || "Ready for computation"}
            </span>
          </div>

          {/* Operation Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
            {/* Binary Ops */}
            <button
              onClick={() => executeBinaryOp("add")}
              className="p-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs font-mono">A + B</span>
            </button>

            <button
              onClick={() => executeBinaryOp("sub")}
              className="p-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
              <span className="text-xs font-mono">A - B</span>
            </button>

            <button
              onClick={() => executeBinaryOp("mul")}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span className="text-xs font-mono">A × B</span>
            </button>

            <button
              onClick={() => executeBinaryOp("div")}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Percent className="w-4 h-4" />
              <span className="text-xs font-mono">A ÷ B</span>
            </button>

            {/* Unary Ops */}
            <button
              onClick={() => executeUnaryOp("conj")}
              className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <span className="text-sm font-mono font-bold">A*</span>
              <span className="text-[10px] font-sans text-slate-500">Conjugate</span>
            </button>

            <button
              onClick={() => executeUnaryOp("norm")}
              className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <span className="text-sm font-mono font-bold">|A|</span>
              <span className="text-[10px] font-sans text-slate-500">Euclidean Norm</span>
            </button>

            <button
              onClick={() => executeUnaryOp("inv")}
              className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <span className="text-sm font-mono font-bold">A⁻¹</span>
              <span className="text-[10px] font-sans text-slate-500">Inverse</span>
            </button>

            <button
              onClick={() => executeUnaryOp("exp")}
              className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <span className="text-sm font-mono font-bold">exp(A)</span>
              <span className="text-[10px] font-sans text-slate-500">Exponential</span>
            </button>
          </div>

          {/* Secondary Functions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {["ln", "sin", "cos", "tan"].map((funcName) => (
              <button
                key={funcName}
                onClick={() => executeUnaryOp(funcName as any)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950/40 hover:bg-teal-500/10 text-slate-700 dark:text-slate-300 font-mono font-semibold rounded-lg border border-slate-200/80 dark:border-slate-800 transition cursor-pointer"
              >
                {funcName}(A)
              </button>
            ))}
          </div>
        </section>

        {/* Computation Result & Export Tools */}
        {calcResult !== null && (
          <section className="bg-white dark:bg-slate-900 border border-teal-500/50 rounded-2xl p-6 shadow-md space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Equal className="w-5 h-5 text-teal-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Computed Hypercomplex Result
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyResult}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Result"}
                </button>

                <button
                  onClick={() => handleDownloadReport("txt")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Report (TXT)
                </button>
              </div>
            </div>

            {/* Output Display */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono text-base sm:text-xl font-bold text-teal-600 dark:text-teal-400 break-all text-center">
              {typeof calcResult === "number" ? calcResult : calcResult.toString()}
            </div>
          </section>
        )}

        {/* View Selection Tabs */}
        <section className="space-y-4">
          <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setActiveTab("A")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === "A"
                  ? "border-teal-500 text-teal-600 dark:text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Register A Inspector
            </button>
            <button
              onClick={() => setActiveTab("B")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === "B"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Register B Inspector
            </button>
            <button
              onClick={() => setActiveTab("3DPlot")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "3DPlot"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              3D Graphic Plotter
            </button>
            <button
              onClick={() => setActiveTab("Fractal")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "Fractal"
                  ? "border-teal-500 text-teal-600 dark:text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Hypercomplex Fractals
            </button>
            <button
              onClick={() => setActiveTab("History")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "History"
                  ? "border-teal-500 text-teal-600 dark:text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Computation Log ({history.length})
            </button>
            <button
              onClick={() => setActiveTab("ZeroDivisor")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "ZeroDivisor"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Zero Divisors Demo
            </button>
          </div>

          {/* Active Tab View */}
          {activeTab === "ZeroDivisor" ? (
            <ZeroDivisorDemo
              onLoadPair={(exprA, exprB) => {
                setInputStringA(exprA);
                setInputStringB(exprB);
                setActiveTab("A");
                setEquationString("Loaded Zero Divisor Pair into Registers A & B");
              }}
            />
          ) : activeTab === "3DPlot" ? (
            <Cayley3DPlotter valA={valA} valB={valB} resultVal={calcResult} />
          ) : activeTab === "Fractal" ? (
            <CayleyFractalGenerator
              valB={valB}
              onSendToRegisterA={(expr) => {
                setInputStringA(expr);
                setActiveTab("A");
              }}
            />
          ) : activeTab === "History" ? (
            <ComputationHistory
              history={history}
              onReload={(exprA, exprB) => {
                setInputStringA(exprA);
                setInputStringB(exprB);
                setActiveTab("A");
                setEquationString("Reloaded historical expression into Registers A & B");
              }}
              onClear={() => setHistory([])}
              onExport={() => {
                downloadJsonFile(history, "cayley-computation-history.json");
              }}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Visualizer */}
              <CayleyVisualizer
                title={activeTab === "A" ? "Register A Inspector" : "Register B Inspector"}
                val={activeTab === "A" ? valA : valB}
                selectedTermKey={activeTab === "A" ? selectedTermKeyA : selectedTermKeyB}
                onTermClick={(term) => {
                  const key = basisToKey(term.basis);
                  if (activeTab === "A") setSelectedTermKeyA(key);
                  else setSelectedTermKeyB(key);
                }}
              />

              {/* Node / Sparse Editor */}
              <CayleyNodeEditor
                val={activeTab === "A" ? valA : valB}
                onChange={(newVal) => {
                  const str = newVal.toString();
                  if (activeTab === "A") setInputStringA(str);
                  else setInputStringB(str);
                }}
                selectedTermKey={activeTab === "A" ? selectedTermKeyA : selectedTermKeyB}
                setSelectedTermKey={(key) => {
                  if (activeTab === "A") setSelectedTermKeyA(key);
                  else setSelectedTermKeyB(key);
                }}
              />
            </div>
          )}
        </section>

        {/* Step-by-Step Proof Explainer Section */}
        <section className="grid grid-cols-1 gap-6">
          <MathExplainer
            op={activeOp || "mul"}
            leftVal={valA}
            rightVal={valB}
            result={calcResult}
            error={calcError}
          />
        </section>

      </main>
    </div>
  );
}
