import { CayleyNumber } from "./math/cayleyNumber";

export interface HistoryItem {
  id: string;
  timestamp: string;
  equation: string;
  op: string;
  exprA: string;
  exprB: string;
  resultString: string;
}

export interface Plot3DPoint {
  x: number;
  y: number;
  z: number;
  label: string;
  color: string;
  size?: number;
}

export interface FractalConfig {
  type: "mandelbrot" | "julia";
  sliceXBasis: number; // e.g. 0 for e0, 1 for e1
  sliceYBasis: number; // e.g. 1 for e1, 2 for e2, 4 for e4
  maxIter: number;
  zoom: number;
  centerX: number;
  centerY: number;
  cReal: number;
  cImag: number;
  palette: "neon" | "fire" | "quantum" | "emerald" | "mono";
}
