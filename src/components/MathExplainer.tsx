import React from "react";
import { CayleyNumber, CayleyTerm, cayleyMulBasisIndices, basisToString } from "../math/cayleyNumber";
import { Info, HelpCircle, ArrowRight, CornerDownRight } from "lucide-react";

interface MathExplainerProps {
  op: string; // 'add' | 'sub' | 'mul' | 'div' | 'inv' | 'conj' | 'norm' | 'exp' | 'ln' | 'sin' | 'cos' | 'tan'
  leftVal: CayleyNumber;
  rightVal?: CayleyNumber;
  result: CayleyNumber | number | null;
  error?: string | null;
}

export default function MathExplainer({
  op,
  leftVal,
  rightVal,
  result,
  error,
}: MathExplainerProps) {
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-xs text-red-700 dark:text-red-300">
        <h4 className="font-bold flex items-center gap-1.5 mb-1.5 uppercase tracking-wider text-[10px]">
          Operation Error
        </h4>
        <p className="font-mono text-[11px] leading-relaxed">{error}</p>
      </div>
    );
  }

  if (result === null) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-5 text-center text-xs text-slate-400">
        <HelpCircle className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
        Type expressions in Register A & B and select an operation to view step-by-step Cayley-Dickson algebraic proofs!
      </div>
    );
  }

  const resultStr = typeof result === "number" ? `${result}` : result.toString();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Algebraic Proof Breakdown
          </span>
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            Cayley-Dickson System Deconstruction
          </h4>
        </div>
      </div>

      <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed overflow-y-auto max-h-[400px] pr-1 scrollbar-thin">
        {/* ADDITION / SUBTRACTION */}
        {(op === "add" || op === "sub") && (
          <div className="space-y-3">
            <p>
              In Cayley-Dickson hypercomplex spaces, addition and subtraction operate term-by-term on corresponding basis elements e_k.
            </p>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2 font-mono text-[11px]">
              <div className="font-bold text-teal-600 dark:text-teal-400">
                Formula:
              </div>
              <div className="pl-2 border-l border-slate-200 dark:border-slate-800">
                (&sum; c_i e_i) {op === "add" ? "+" : "-"} (&sum; d_i e_i) = &sum; (c_i {op === "add" ? "+" : "-"} d_i) e_i
              </div>
              <div className="font-bold text-slate-800 dark:text-slate-100 mt-2">➔ {resultStr}</div>
            </div>
          </div>
        )}

        {/* MULTIPLICATION */}
        {op === "mul" && rightVal && (
          <div className="space-y-3">
            <p>
              Multiplication uses the distributive property and the Cayley-Dickson product rule: <code>(c_a e_a) &middot; (c_b e_b) = (c_a &middot; c_b) &middot; &gamma;(a, b) e_{'{a &oplus; b}'}</code>, where <code>&oplus;</code> is bitwise XOR and <code>&gamma;(a, b) &isin; {'{-1, +1}'}</code> is the sign multiplier.
            </p>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 font-mono text-[11px]">
              <div className="font-bold text-teal-600 dark:text-teal-400">
                Term-by-Term Products Expansion:
              </div>
              <div className="space-y-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 max-h-[160px] overflow-y-auto scrollbar-thin">
                {leftVal.terms.flatMap((t1) =>
                  rightVal.terms.map((t2) => {
                    const c1 = typeof t1.coeff === "number" ? t1.coeff : t1.coeff.getScalarValue();
                    const c2 = typeof t2.coeff === "number" ? t2.coeff : t2.coeff.getScalarValue();
                    const idx1 = t1.basis.type === "index" ? t1.basis.index : 0;
                    const idx2 = t2.basis.type === "index" ? t2.basis.index : 0;
                    const cdRes = cayleyMulBasisIndices(idx1, idx2);
                    const prodCoeff = c1 * c2 * cdRes.sign;

                    return (
                      <div key={`${idx1}-${idx2}`} className="flex justify-between items-center py-0.5">
                        <span>({c1}{basisToString(t1.basis)}) * ({c2}{basisToString(t2.basis)})</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          = {prodCoeff > 0 ? "+" : ""}{parseFloat(prodCoeff.toFixed(3))}e{cdRes.index}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="font-bold text-slate-800 dark:text-slate-100 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                Final Simplified Product ➔ {resultStr}
              </div>
            </div>
          </div>
        )}

        {/* INVERSE / DIVISION */}
        {(op === "inv" || op === "div") && (
          <div className="space-y-3">
            <p>
              The multiplicative inverse of A is given by <code>A&#8315;&sup1; = A* / |A|&sup2;</code>, where A* is the conjugate (negating all imaginary basis components e_k for k &gt; 0) and <code>|A|&sup2; = &sum; |c_i|&sup2;</code> is the norm squared.
            </p>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2 font-mono text-[11px]">
              <div className="font-bold text-teal-600 dark:text-teal-400">
                Norm & Conjugate:
              </div>
              <div className="pl-2 border-l border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 space-y-1">
                <div>Conjugate A* = {leftVal.conjugate().toString()}</div>
                <div>Norm |A| = {leftVal.norm().toFixed(4)}</div>
                <div>|A|^2 = {(leftVal.norm() ** 2).toFixed(4)}</div>
              </div>
              <div className="font-bold text-slate-800 dark:text-slate-100 mt-2">➔ {resultStr}</div>
            </div>
          </div>
        )}

        {/* TRANSCENDENTAL FUNCTIONS (EXP, LN, SIN, COS, TAN) */}
        {["exp", "ln", "sin", "cos", "tan"].includes(op) && (
          <div className="space-y-3">
            <p>
              Evaluating hypercomplex functions decomposes A into scalar part S = c0*e0 and pure-imaginary vector part V = &sum;<sub>k &gt; 0</sub> c_k e_k. Since V&sup2; = -|V|&sup2; e0, V acts as an imaginary axis with unit direction V / |V|.
            </p>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 font-mono text-[11px]">
              <div className="font-bold text-teal-600 dark:text-teal-400">
                Decomposition Components:
              </div>
              <div className="pl-2 border-l border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 space-y-1">
                <div>Scalar Part S = {leftVal.getScalarValue()}</div>
                <div>Vector Part V = {leftVal.getVectorPart().toString() || "0"}</div>
                <div>Vector Norm |V| = {leftVal.getVectorPart().norm().toFixed(4)}</div>
              </div>

              {op === "exp" && (
                <div className="font-sans text-[10px] text-slate-500 leading-normal border-t border-slate-200/50 dark:border-slate-800 pt-2">
                  Euler Formula: <code>exp(S + V) = e^S * (cos(|V|) + (V / |V|) * sin(|V|))</code>
                </div>
              )}
              {op === "ln" && (
                <div className="font-sans text-[10px] text-slate-500 leading-normal border-t border-slate-200/50 dark:border-slate-800 pt-2">
                  Logarithm Formula: <code>ln(S + V) = ln(|A|) + (V / |V|) * atan2(|V|, S)</code>
                </div>
              )}
              {op === "sin" && (
                <div className="font-sans text-[10px] text-slate-500 leading-normal border-t border-slate-200/50 dark:border-slate-800 pt-2">
                  Hypercomplex Sine: <code>sin(S + V) = sin(S) cosh(|V|) + (V / |V|) cos(S) sinh(|V|)</code>
                </div>
              )}
              {op === "cos" && (
                <div className="font-sans text-[10px] text-slate-500 leading-normal border-t border-slate-200/50 dark:border-slate-800 pt-2">
                  Hypercomplex Cosine: <code>cos(S + V) = cos(S) cosh(|V|) - (V / |V|) sin(S) sinh(|V|)</code>
                </div>
              )}

              <div className="font-bold text-slate-800 dark:text-slate-100 mt-2">➔ {resultStr}</div>
            </div>
          </div>
        )}

        {/* NORM / CONJUGATE */}
        {op === "norm" && (
          <div className="space-y-3">
            <p>
              The Euclidean norm represents vector length in hypercomplex space |A| = &radic;(&sum; |c_i|&sup2;).
            </p>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2 font-mono text-[11px]">
              <div>|A| = {resultStr}</div>
            </div>
          </div>
        )}

        {op === "conj" && (
          <div className="space-y-3">
            <p>
              The conjugate A* negates all non-scalar basis components e_k (for k &gt; 0).
            </p>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2 font-mono text-[11px]">
              <div>A* = {resultStr}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
