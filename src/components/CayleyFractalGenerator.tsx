import React, { useRef, useEffect, useState } from "react";
import { CayleyNumber, cayleyMulBasisIndices } from "../math/cayleyNumber";
import { parseCayleyNumber } from "../utils/cayleyParser";
import { FractalConfig } from "../types";
import { Sparkles, Maximize2, Minimize2, ExternalLink, RefreshCw, ZoomIn, ZoomOut, Move, Download } from "lucide-react";

interface CayleyFractalGeneratorProps {
  valB: CayleyNumber;
  onSendToRegisterA?: (expr: string) => void;
}

export default function CayleyFractalGenerator({
  valB,
  onSendToRegisterA,
}: CayleyFractalGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fractal Configuration state
  const [config, setConfig] = useState<FractalConfig>({
    type: "julia",
    sliceXBasis: 0, // e0
    sliceYBasis: 1, // e1
    maxIter: 40,
    zoom: 1.0,
    centerX: 0,
    centerY: 0,
    cReal: -0.4,
    cImag: 0.6,
    palette: "neon",
  });

  // Modal Window open state
  const [isPopoutOpen, setIsPopoutOpen] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Sync constant c from Register B if clicked
  const handleSyncFromRegB = () => {
    let r = 0, i = 0;
    for (const t of valB.terms) {
      if (t.basis.type === "index") {
        const cVal = typeof t.coeff === "number" ? t.coeff : t.coeff.getScalarValue();
        if (t.basis.index === config.sliceXBasis) r += cVal;
        if (t.basis.index === config.sliceYBasis) i += cVal;
      }
    }
    setConfig((prev) => ({ ...prev, cReal: r, cImag: i }));
  };

  // Main Canvas Fractal Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsRendering(true);

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.createImageData(width, height);
    const buf32 = new Uint32Array(imgData.data.buffer);

    // Hypercomplex iterate z -> z^2 + c in basis pair (e_x, e_y)
    const idxX = config.sliceXBasis;
    const idxY = config.sliceYBasis;

    // Check if e_y * e_y = -e0 (standard imaginary) or e_x * e_x
    const resYY = cayleyMulBasisIndices(idxY, idxY);
    const signYY = resYY.sign; // usually -1 for i, j, k...

    const cx = config.cReal;
    const cy = config.cImag;
    const maxI = config.maxIter;
    const zoomFactor = (3.0 / config.zoom);

    // Color Palette mapping
    const getColor = (iter: number): number => {
      if (iter >= maxI) return 0xff000000; // Black inside set

      const normI = iter / maxI;

      if (config.palette === "neon") {
        // Cyan -> Magenta -> Gold
        const r = Math.floor(Math.sin(normI * Math.PI * 2) * 127 + 128);
        const g = Math.floor(Math.sin(normI * Math.PI * 2 + 2) * 127 + 128);
        const b = Math.floor(Math.sin(normI * Math.PI * 2 + 4) * 127 + 128);
        return (0xff << 24) | (b << 16) | (g << 8) | r;
      } else if (config.palette === "fire") {
        const r = Math.floor(Math.min(255, normI * 3 * 255));
        const g = Math.floor(Math.min(255, Math.max(0, (normI - 0.3) * 3 * 255)));
        const b = Math.floor(Math.min(255, Math.max(0, (normI - 0.7) * 3 * 255)));
        return (0xff << 24) | (b << 16) | (g << 8) | r;
      } else if (config.palette === "quantum") {
        const b = Math.floor(normI * 255);
        const r = Math.floor((1 - normI) * 180);
        const g = Math.floor(Math.sin(normI * Math.PI) * 200);
        return (0xff << 24) | (b << 16) | (g << 8) | r;
      } else if (config.palette === "emerald") {
        const g = Math.floor(normI * 255);
        const b = Math.floor(normI * 150);
        const r = Math.floor(normI * 50);
        return (0xff << 24) | (b << 16) | (g << 8) | r;
      } else {
        const v = Math.floor(normI * 255);
        return (0xff << 24) | (v << 16) | (v << 8) | v;
      }
    };

    // Render loop
    for (let py = 0; py < height; py++) {
      const y0 = ((py - height / 2) / height) * zoomFactor + config.centerY;
      for (let px = 0; px < width; px++) {
        const x0 = ((px - width / 2) / width) * zoomFactor + config.centerX;

        let zx = config.type === "julia" ? x0 : 0;
        let zy = config.type === "julia" ? y0 : 0;
        const curCx = config.type === "julia" ? cx : x0;
        const curCy = config.type === "julia" ? cy : y0;

        let n = 0;
        while (n < maxI) {
          // z^2 = (zx*e_x + zy*e_y)^2 = zx^2 e_x^2 + zy^2 e_y^2 + 2*zx*zy*(e_x*e_y)
          const zx2 = zx * zx;
          const zy2 = zy * zy;

          if (zx2 + zy2 > 4.0) break;

          // Compute new zx, zy according to Cayley-Dickson product rules
          const nextZx = zx2 + signYY * zy2 + curCx;
          const nextZy = 2 * zx * zy + curCy;

          zx = nextZx;
          zy = nextZy;
          n++;
        }

        buf32[py * width + px] = getColor(n);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setIsRendering(false);
  }, [config]);

  // Click on fractal canvas to recenter
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const zoomFactor = (3.0 / config.zoom);
    const newCenterX = ((px - rect.width / 2) / rect.width) * zoomFactor + config.centerX;
    const newCenterY = ((py - rect.height / 2) / rect.height) * zoomFactor + config.centerY;

    setConfig((prev) => ({
      ...prev,
      centerX: newCenterX,
      centerY: newCenterY,
      zoom: prev.zoom * 1.5,
    }));
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `cayley-fractal-slice-e${config.sliceXBasis}-e${config.sliceYBasis}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
              Hypercomplex Chaos Theory
            </span>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Cayley Fractal Generator (Slice e{config.sliceXBasis} &times; e{config.sliceYBasis})
            </h3>
          </div>
        </div>

        {/* Modal Window Toggle */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => setIsPopoutOpen(!isPopoutOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-xs transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            {isPopoutOpen ? "Close Floating Window" : "Open in Modal Window"}
          </button>
        </div>
      </div>

      {/* Main Fractal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {/* Fractal Controls Panel */}
        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-4 text-xs font-mono">
          {/* Type Toggle */}
          <div>
            <label className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider block mb-1">
              Fractal Algorithm
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setConfig({ ...config, type: "julia" })}
                className={`py-1 text-center font-bold rounded-md transition cursor-pointer ${
                  config.type === "julia" ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs" : "text-slate-500"
                }`}
              >
                Julia Set
              </button>
              <button
                onClick={() => setConfig({ ...config, type: "mandelbrot" })}
                className={`py-1 text-center font-bold rounded-md transition cursor-pointer ${
                  config.type === "mandelbrot" ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs" : "text-slate-500"
                }`}
              >
                Mandelbrot
              </button>
            </div>
          </div>

          {/* Basis Pair Choice */}
          <div>
            <label className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider block mb-1">
              Cayley Basis Sub-Plane (X & Y Axes)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={config.sliceXBasis}
                onChange={(e) => setConfig({ ...config, sliceXBasis: parseInt(e.target.value) })}
                className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-teal-600 font-bold focus:outline-hidden"
              >
                {[0, 1, 2, 3, 4, 5, 7, 10, 11, 13, 15].map((i) => (
                  <option key={i} value={i}>X = e{i}</option>
                ))}
              </select>
              <select
                value={config.sliceYBasis}
                onChange={(e) => setConfig({ ...config, sliceYBasis: parseInt(e.target.value) })}
                className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-amber-600 font-bold focus:outline-hidden"
              >
                {[0, 1, 2, 3, 4, 5, 7, 10, 11, 13, 15].map((i) => (
                  <option key={i} value={i}>Y = e{i}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Julia Constant c Slider & Input */}
          {config.type === "julia" && (
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans font-bold">
                <span>Constant C (Real / Imag)</span>
                <button
                  onClick={handleSyncFromRegB}
                  className="text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Sync from Reg B
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.05"
                  value={config.cReal}
                  onChange={(e) => setConfig({ ...config, cReal: parseFloat(e.target.value) || 0 })}
                  className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center font-bold"
                />
                <input
                  type="number"
                  step="0.05"
                  value={config.cImag}
                  onChange={(e) => setConfig({ ...config, cImag: parseFloat(e.target.value) || 0 })}
                  className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center font-bold"
                />
              </div>
            </div>
          )}

          {/* Palette Selector */}
          <div>
            <label className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider block mb-1">
              Color Palette
            </label>
            <select
              value={config.palette}
              onChange={(e) => setConfig({ ...config, palette: e.target.value as any })}
              className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold focus:outline-hidden"
            >
              <option value="neon">Neon Cyan Glow</option>
              <option value="fire">Solar Flare Fire</option>
              <option value="quantum">Quantum Violet</option>
              <option value="emerald">Deep Emerald Matrix</option>
              <option value="mono">High Contrast Mono</option>
            </select>
          </div>

          {/* Iterations Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 font-sans font-bold mb-1">
              <span>Max Iterations</span>
              <span className="text-teal-600 dark:text-teal-400 font-mono">{config.maxIter}</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={config.maxIter}
              onChange={(e) => setConfig({ ...config, maxIter: parseInt(e.target.value) })}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          {/* Reset Zoom / Download */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setConfig({ ...config, zoom: 1.0, centerX: 0, centerY: 0 })}
              className="flex-1 py-1.5 text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Reset Zoom
            </button>
            <button
              onClick={handleDownloadImage}
              className="px-3 py-1.5 text-[11px] font-bold bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Download Canvas PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Canvas Display */}
        <div className="md:col-span-2 relative min-h-[340px] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={340}
            onClick={handleCanvasClick}
            className="w-full h-full object-contain cursor-crosshair"
          />

          <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300">
            Click Canvas to Zoom ({config.zoom.toFixed(1)}x) & Center
          </div>
        </div>
      </div>

      {/* Floating Pop-out Modal Window */}
      {isPopoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-4 sm:p-8 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">
                  Cayley Fractal Extended Viewer (e{config.sliceXBasis} &times; e{config.sliceYBasis})
                </h3>
              </div>
              <button
                onClick={() => setIsPopoutOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-black">
              <canvas
                width={700}
                height={480}
                ref={(el) => {
                  if (el) {
                    const ctx = el.getContext("2d");
                    if (ctx && canvasRef.current) {
                      ctx.drawImage(canvasRef.current, 0, 0, 700, 480);
                    }
                  }
                }}
                className="max-w-full rounded-xl border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
