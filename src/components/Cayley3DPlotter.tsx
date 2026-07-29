import React, { useRef, useEffect, useState, useMemo } from "react";
import { CayleyNumber, basisToString } from "../math/cayleyNumber";
import { Compass, RotateCw, ZoomIn, ZoomOut, Eye, Layers, Sparkles } from "lucide-react";

interface Cayley3DPlotterProps {
  valA: CayleyNumber;
  valB: CayleyNumber;
  resultVal: CayleyNumber | number | null;
}

export default function Cayley3DPlotter({ valA, valB, resultVal }: Cayley3DPlotterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dimension mapping for 3D axes X, Y, Z
  const [xAxisBasis, setXAxisBasis] = useState<number>(0); // e0
  const [yAxisBasis, setYAxisBasis] = useState<number>(1); // e1
  const [zAxisBasis, setZAxisBasis] = useState<number>(2); // e2

  // 3D View Camera Orbit state
  const [rotX, setRotX] = useState<number>(0.5); // Radians
  const [rotY, setRotY] = useState<number>(-0.6); // Radians
  const [zoom, setZoom] = useState<number>(1.0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTrajectory, setShowTrajectory] = useState<boolean>(true);

  // Dragging interaction state
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Extract 3D vector coordinates from Cayley Numbers
  const get3DCoords = (val: CayleyNumber | number | null): [number, number, number] => {
    if (val === null) return [0, 0, 0];
    if (typeof val === "number") {
      return [xAxisBasis === 0 ? val : 0, yAxisBasis === 0 ? val : 0, zAxisBasis === 0 ? val : 0];
    }

    let x = 0, y = 0, z = 0;
    for (const term of val.terms) {
      if (term.basis.type === "index") {
        const idx = term.basis.index;
        const cVal = typeof term.coeff === "number" ? term.coeff : term.coeff.getScalarValue();
        if (idx === xAxisBasis) x += cVal;
        if (idx === yAxisBasis) y += cVal;
        if (idx === zAxisBasis) z += cVal;
      }
    }
    return [x, y, z];
  };

  const coordsA = useMemo(() => get3DCoords(valA), [valA, xAxisBasis, yAxisBasis, zAxisBasis]);
  const coordsB = useMemo(() => get3DCoords(valB), [valB, xAxisBasis, yAxisBasis, zAxisBasis]);
  const coordsRes = useMemo(() => get3DCoords(resultVal), [resultVal, xAxisBasis, yAxisBasis, zAxisBasis]);

  // Main 3D Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let localRotY = rotY;

    const render = () => {
      if (autoRotate && !isDraggingRef.current) {
        localRotY += 0.008;
        setRotY(localRotY);
      }

      // Handle high DPI display
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const originX = width / 2;
      const originY = height / 2;
      const scale = Math.min(width, height) * 0.18 * zoom;

      // Clear background
      ctx.clearRect(0, 0, width, height);

      // 3D Projection Matrix (Yaw & Pitch)
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      const project = (x: number, y: number, z: number): [number, number] => {
        // Yaw around Y axis
        const x1 = x * cosY + z * sinY;
        const y1 = y;
        const z1 = -x * sinY + z * cosY;

        // Pitch around X axis
        const x2 = x1;
        const y2 = y1 * cosX - z1 * sinX;

        return [originX + x2 * scale, originY - y2 * scale];
      };

      // Draw Grid / Coordinate Planes
      if (showGrid) {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
        ctx.lineWidth = 1;

        const gridRange = 3;
        for (let i = -gridRange; i <= gridRange; i++) {
          if (i === 0) continue;

          // X-Z Grid Plane
          const [p1x, p1y] = project(i, 0, -gridRange);
          const [p2x, p2y] = project(i, 0, gridRange);
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.stroke();

          const [p3x, p3y] = project(-gridRange, 0, i);
          const [p4x, p4y] = project(gridRange, 0, i);
          ctx.beginPath();
          ctx.moveTo(p3x, p3y);
          ctx.lineTo(p4x, p4y);
          ctx.stroke();
        }
      }

      // Draw Axes (X = Teal, Y = Amber, Z = Violet)
      const axisLength = 3.5;
      const axes: { vec: [number, number, number]; color: string; label: string }[] = [
        { vec: [axisLength, 0, 0], color: "#14b8a6", label: `e${xAxisBasis} (X)` },
        { vec: [0, axisLength, 0], color: "#f59e0b", label: `e${yAxisBasis} (Y)` },
        { vec: [0, 0, axisLength], color: "#8b5cf6", label: `e${zAxisBasis} (Z)` },
      ];

      const [ox, oy] = project(0, 0, 0);

      axes.forEach(({ vec, color, label }) => {
        const [px, py] = project(vec[0], vec[1], vec[2]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(px, py);
        ctx.stroke();

        // Arrow head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = color;
        ctx.fillText(label, px + 8, py + 4);
      });

      // Helper function to draw 3D Vector Arrow
      const drawVector = (
        coords: [number, number, number],
        color: string,
        label: string,
        isDashed: boolean = false
      ) => {
        const [vx, vy] = project(coords[0], coords[1], coords[2]);
        if (Math.hypot(coords[0], coords[1], coords[2]) < 0.001) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        if (isDashed) ctx.setLineDash([4, 4]);
        else ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(vx, vy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Endpoint Point Glow
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(vx, vy, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(vx, vy, 2, 0, Math.PI * 2);
        ctx.fill();

        // Text tag
        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = color;
        ctx.fillText(label, vx + 10, vy - 6);
      };

      // Draw Trajectory Parallelogram or Path
      if (showTrajectory && resultVal !== null) {
        ctx.strokeStyle = "rgba(99, 102, 241, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);

        const [pAx, pAy] = project(coordsA[0], coordsA[1], coordsA[2]);
        const [pBx, pBy] = project(coordsB[0], coordsB[1], coordsB[2]);
        const [pRx, pRy] = project(coordsRes[0], coordsRes[1], coordsRes[2]);

        // A -> Res
        ctx.beginPath();
        ctx.moveTo(pAx, pAy);
        ctx.lineTo(pRx, pRy);
        ctx.stroke();

        // B -> Res
        ctx.beginPath();
        ctx.moveTo(pBx, pBy);
        ctx.lineTo(pRx, pRy);
        ctx.stroke();

        ctx.setLineDash([]);
      }

      // Draw Vector A (Teal)
      drawVector(coordsA, "#0d9488", "Register A");

      // Draw Vector B (Amber)
      drawVector(coordsB, "#d97706", "Register B");

      // Draw Result Vector (Indigo)
      if (resultVal !== null) {
        drawVector(coordsRes, "#6366f1", "Result");
      }

      if (autoRotate && !isDraggingRef.current) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [rotX, rotY, zoom, autoRotate, showGrid, showTrajectory, coordsA, coordsB, coordsRes, xAxisBasis, yAxisBasis, zAxisBasis]);

  // Mouse / Touch Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    setRotY((prev) => prev + dx * 0.01);
    setRotX((prev) => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev + dy * 0.01)));

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col h-full relative overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
              Multi-Dimensional Vector Space
            </span>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              3D Graphic Plotter Projection
            </h3>
          </div>
        </div>

        {/* Axis Selectors */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="text-[10px] text-slate-400 font-sans font-bold">Axes:</span>
          <select
            value={xAxisBasis}
            onChange={(e) => setXAxisBasis(parseInt(e.target.value))}
            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-teal-600 dark:text-teal-400 font-bold focus:outline-hidden"
          >
            {[0, 1, 2, 3, 4, 5, 7, 8, 10, 11, 13, 15].map((i) => (
              <option key={i} value={i}>X = e{i}</option>
            ))}
          </select>

          <select
            value={yAxisBasis}
            onChange={(e) => setYAxisBasis(parseInt(e.target.value))}
            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-amber-600 dark:text-amber-400 font-bold focus:outline-hidden"
          >
            {[0, 1, 2, 3, 4, 5, 7, 8, 10, 11, 13, 15].map((i) => (
              <option key={i} value={i}>Y = e{i}</option>
            ))}
          </select>

          <select
            value={zAxisBasis}
            onChange={(e) => setZAxisBasis(parseInt(e.target.value))}
            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-violet-600 dark:text-violet-400 font-bold focus:outline-hidden"
          >
            {[0, 1, 2, 3, 4, 5, 7, 8, 10, 11, 13, 15].map((i) => (
              <option key={i} value={i}>Z = e{i}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="relative flex-1 min-h-[300px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full block"
        />

        {/* On-Canvas Floating Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              autoRotate ? "bg-teal-500 text-white" : "hover:bg-slate-800 text-slate-400"
            }`}
            title="Toggle Auto Rotation"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              showGrid ? "bg-indigo-600 text-white" : "hover:bg-slate-800 text-slate-400"
            }`}
            title="Toggle 3D Grid"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Vector Coordinates Legend */}
        <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1">
          <div className="flex items-center gap-2 text-teal-400">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>Reg A: ({coordsA.map((v) => v.toFixed(2)).join(", ")})</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Reg B: ({coordsB.map((v) => v.toFixed(2)).join(", ")})</span>
          </div>
          {resultVal !== null && (
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Res: ({coordsRes.map((v) => v.toFixed(2)).join(", ")})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
