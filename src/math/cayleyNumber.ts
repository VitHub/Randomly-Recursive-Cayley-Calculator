/**
 * CayleyNumber.ts
 * Core mathematical engine for Free-Range Wildly Recursive Cayley Numbers
 * (Hypercomplex Numbers across arbitrary Cayley-Dickson / Clifford dimensions).
 */

export interface IndexBasis {
  type: "index";
  index: number; // e.g. 0 for scalar 1, 1 for e1, 2 for e2, 4 for e4, 11 for e11, etc.
}

export interface RecursiveBasis {
  type: "recursive";
  inner: CayleyNumber; // e.g. e_{inner}
}

export type CayleyBasis = IndexBasis | RecursiveBasis;

export interface CayleyTerm {
  coeff: number | CayleyNumber;
  basis: CayleyBasis;
}

// ============================================================================
// Cayley-Dickson Multiplication Table Generator
// ============================================================================

/**
 * Computes Cayley-Dickson multiplication sign and resulting basis index
 * for any non-negative integer indices a and b.
 * e_a * e_b = sign * e_{a ^ b}
 */
const cdSignCache = new Map<string, { sign: number; index: number }>();

export function cayleyMulBasisIndices(a: number, b: number): { sign: number; index: number } {
  if (a === 0) return { sign: 1, index: b };
  if (b === 0) return { sign: 1, index: a };
  if (a === b) return { sign: -1, index: 0 };

  const key = `${a},${b}`;
  const cached = cdSignCache.get(key);
  if (cached) return cached;

  const resultIndex = a ^ b;

  // Find M = highest power of 2 <= max(a, b)
  const maxVal = Math.max(a, b);
  let M = 1;
  while (M * 2 <= maxVal) {
    M *= 2;
  }

  let sign = 1;
  if (a < M && b >= M) {
    // e_a * (0, e_{b-M}) = (0, e_{b-M} * e_a*)
    const b1 = b - M;
    const isAScalarInSub = a === 0;
    const aSign = isAScalarInSub ? 1 : -1;
    const subResult = cayleyMulBasisIndices(b1, a);
    sign = aSign * subResult.sign;
  } else if (a >= M && b < M) {
    // (0, e_{a-M}) * e_b = (0, e_{a-M} * e_b*)
    const a1 = a - M;
    const isBScalarInSub = b === 0;
    const bSign = isBScalarInSub ? 1 : -1;
    const subResult = cayleyMulBasisIndices(a1, b);
    sign = bSign * subResult.sign;
  } else {
    // (0, e_{a-M}) * (0, e_{b-M}) = (-e_{b-M}* * e_{a-M}, 0)
    const a1 = a - M;
    const b1 = b - M;
    const isB1Scalar = b1 === 0;
    const b1Sign = isB1Scalar ? 1 : -1;
    const subResult = cayleyMulBasisIndices(b1, a1);
    sign = -1 * b1Sign * subResult.sign;
  }

  const res = { sign, index: resultIndex };
  cdSignCache.set(key, res);
  return res;
}

// Helper to stringify a CayleyBasis for map keys & display
export function basisToString(basis: CayleyBasis): string {
  if (basis.type === "index") {
    return basis.index === 0 ? "e0" : `e${basis.index}`;
  }
  return `e{${basis.inner.toString()}}`;
}

export function basisToKey(basis: CayleyBasis): string {
  if (basis.type === "index") {
    return `i:${basis.index}`;
  }
  return `r:${basis.inner.toCanonicalString()}`;
}

export function indexBasis(idx: number): IndexBasis {
  return { type: "index", index: idx };
}

export function recursiveBasis(inner: CayleyNumber): CayleyBasis {
  // If inner is scalar real k*e0, convert to indexBasis(k)
  if (inner.terms.length === 1 && inner.terms[0].basis.type === "index" && inner.terms[0].basis.index === 0) {
    const k = typeof inner.terms[0].coeff === "number" ? inner.terms[0].coeff : 0;
    if (Number.isInteger(k) && k >= 0) {
      return { type: "index", index: k };
    }
  }
  return { type: "recursive", inner };
}

// ============================================================================
// CayleyNumber Class Definition
// ============================================================================

export class CayleyNumber {
  // Terms array stored in canonical order (by basis)
  public readonly terms: CayleyTerm[];

  constructor(terms: CayleyTerm[]) {
    this.terms = CayleyNumber.normalizeTerms(terms);
  }

  /**
   * Constructs a real scalar CayleyNumber k * e0.
   */
  public static scalar(val: number): CayleyNumber {
    if (Math.abs(val) < 1e-12) return new CayleyNumber([]);
    return new CayleyNumber([{ coeff: val, basis: indexBasis(0) }]);
  }

  /**
   * Constructs a single basis term k * e_idx.
   */
  public static term(coeff: number | CayleyNumber, basis: CayleyBasis | number): CayleyNumber {
    const b = typeof basis === "number" ? indexBasis(basis) : basis;
    return new CayleyNumber([{ coeff, basis: b }]);
  }

  /**
   * Normalizes, simplifies and combines like terms, filtering zero coefficients (< 1e-12).
   */
  private static normalizeTerms(rawTerms: CayleyTerm[]): CayleyTerm[] {
    const map = new Map<string, { coeff: number; basis: CayleyBasis }>();

    for (const t of rawTerms) {
      let numCoeff = 0;
      if (typeof t.coeff === "number") {
        numCoeff = t.coeff;
      } else {
        // If coeff is a CayleyNumber:
        // Check if it's scalar or expand if needed
        if (t.coeff.isScalar()) {
          numCoeff = t.coeff.getScalarValue();
        } else {
          // If coeff is a non-scalar CayleyNumber (wildly recursive coeff),
          // check if we can reduce or keep:
          // c * e_B = sum_i (c_i * e_i) * e_B
          // If e_B is index basis b, then c_i * e_i * e_b = c_i * sign * e_{i^b}
          if (t.basis.type === "index") {
            const bIdx = t.basis.index;
            for (const subT of t.coeff.terms) {
              if (subT.basis.type === "index" && typeof subT.coeff === "number") {
                const mulRes = cayleyMulBasisIndices(subT.basis.index, bIdx);
                const combinedVal = subT.coeff * mulRes.sign;
                const newB = indexBasis(mulRes.index);
                const key = basisToKey(newB);
                const existing = map.get(key);
                if (existing) {
                  existing.coeff += combinedVal;
                } else {
                  map.set(key, { coeff: combinedVal, basis: newB });
                }
              }
            }
            continue;
          } else {
            // Recursive basis with Cayley coeff
            if (t.coeff.terms.length === 1 && typeof t.coeff.terms[0].coeff === "number") {
              numCoeff = t.coeff.terms[0].coeff;
            } else {
              // Store as-is or flatten
              numCoeff = t.coeff.getScalarValue();
            }
          }
        }
      }

      if (Math.abs(numCoeff) < 1e-12) continue;

      const key = basisToKey(t.basis);
      const existing = map.get(key);
      if (existing) {
        existing.coeff += numCoeff;
      } else {
        map.set(key, { coeff: numCoeff, basis: t.basis });
      }
    }

    const result: CayleyTerm[] = [];
    for (const item of map.values()) {
      if (Math.abs(item.coeff) >= 1e-12) {
        result.push({ coeff: item.coeff, basis: item.basis });
      }
    }

    // Sort terms: scalar e0 first, then by basis index, then recursive
    result.sort((a, b) => {
      const keyA = basisToKey(a.basis);
      const keyB = basisToKey(b.basis);
      if (a.basis.type === "index" && b.basis.type === "index") {
        return a.basis.index - b.basis.index;
      }
      if (a.basis.type === "index") return -1;
      if (b.basis.type === "index") return 1;
      return keyA.localeCompare(keyB);
    });

    return result;
  }

  public isZero(): boolean {
    return this.terms.length === 0;
  }

  public isScalar(): boolean {
    if (this.terms.length === 0) return true;
    if (this.terms.length === 1 && this.terms[0].basis.type === "index" && this.terms[0].basis.index === 0) {
      return true;
    }
    return false;
  }

  public getScalarValue(): number {
    if (this.terms.length === 0) return 0;
    const scalarTerm = this.terms.find(t => t.basis.type === "index" && t.basis.index === 0);
    if (scalarTerm && typeof scalarTerm.coeff === "number") {
      return scalarTerm.coeff;
    }
    return 0;
  }

  /**
   * Returns vector imaginary part (all non-e0 terms).
   */
  public getVectorPart(): CayleyNumber {
    const vTerms = this.terms.filter(t => !(t.basis.type === "index" && t.basis.index === 0));
    return new CayleyNumber(vTerms);
  }

  /**
   * Euclidean norm |A| = sqrt(sum |c_i|^2).
   */
  public norm(): number {
    let sumSq = 0;
    for (const t of this.terms) {
      const c = typeof t.coeff === "number" ? t.coeff : t.coeff.norm();
      sumSq += c * c;
    }
    return Math.sqrt(sumSq);
  }

  /**
   * Total conjugate A* (negates all imaginary basis components e_k for k > 0).
   */
  public conjugate(): CayleyNumber {
    const conjTerms: CayleyTerm[] = this.terms.map(t => {
      if (t.basis.type === "index" && t.basis.index === 0) {
        return { coeff: t.coeff, basis: t.basis };
      }
      const c = typeof t.coeff === "number" ? -t.coeff : (t.coeff as CayleyNumber).negate();
      return { coeff: c, basis: t.basis };
    });
    return new CayleyNumber(conjTerms);
  }

  public negate(): CayleyNumber {
    const negTerms: CayleyTerm[] = this.terms.map(t => {
      const c = typeof t.coeff === "number" ? -t.coeff : (t.coeff as CayleyNumber).negate();
      return { coeff: c, basis: t.basis };
    });
    return new CayleyNumber(negTerms);
  }

  public equals(other: CayleyNumber, tol: number = 1e-9): boolean {
    return this.sub(other).norm() < tol;
  }

  // ============================================================================
  // Algebraic Operations
  // ============================================================================

  public add(other: CayleyNumber): CayleyNumber {
    return new CayleyNumber([...this.terms, ...other.terms]);
  }

  public sub(other: CayleyNumber): CayleyNumber {
    return this.add(other.negate());
  }

  public mulScalar(scalar: number): CayleyNumber {
    if (Math.abs(scalar) < 1e-12) return new CayleyNumber([]);
    const scaled = this.terms.map(t => ({
      coeff: typeof t.coeff === "number" ? t.coeff * scalar : (t.coeff as CayleyNumber).mulScalar(scalar),
      basis: t.basis
    }));
    return new CayleyNumber(scaled);
  }

  /**
   * Hypercomplex Multiplication (Cayley-Dickson product).
   */
  public mul(other: CayleyNumber): CayleyNumber {
    if (this.isZero() || other.isZero()) return new CayleyNumber([]);

    const productTerms: CayleyTerm[] = [];

    for (const t1 of this.terms) {
      for (const t2 of other.terms) {
        // Multiply coefficients
        let cProduct: number | CayleyNumber = 0;
        if (typeof t1.coeff === "number" && typeof t2.coeff === "number") {
          cProduct = t1.coeff * t2.coeff;
        } else if (typeof t1.coeff === "number") {
          cProduct = (t2.coeff as CayleyNumber).mulScalar(t1.coeff);
        } else if (typeof t2.coeff === "number") {
          cProduct = (t1.coeff as CayleyNumber).mulScalar(t2.coeff);
        } else {
          cProduct = (t1.coeff as CayleyNumber).mul(t2.coeff as CayleyNumber);
        }

        // Multiply bases
        if (t1.basis.type === "index" && t2.basis.type === "index") {
          const cdRes = cayleyMulBasisIndices(t1.basis.index, t2.basis.index);
          const finalCoeff = typeof cProduct === "number" ? cProduct * cdRes.sign : (cProduct as CayleyNumber).mulScalar(cdRes.sign);
          productTerms.push({ coeff: finalCoeff, basis: indexBasis(cdRes.index) });
        } else {
          // Recursive or mixed bases
          if (t1.basis.type === "index" && t1.basis.index === 0) {
            productTerms.push({ coeff: cProduct, basis: t2.basis });
          } else if (t2.basis.type === "index" && t2.basis.index === 0) {
            productTerms.push({ coeff: cProduct, basis: t1.basis });
          } else {
            // Compound or recursive basis: e_{b1} * e_{b2}
            // If bases are identical: e_B * e_B = -1
            if (basisToKey(t1.basis) === basisToKey(t2.basis)) {
              const negCoeff = typeof cProduct === "number" ? -cProduct : (cProduct as CayleyNumber).negate();
              productTerms.push({ coeff: negCoeff, basis: indexBasis(0) });
            } else {
              // Construct compound recursive basis
              const b1Str = basisToString(t1.basis);
              const b2Str = basisToString(t2.basis);
              // Store as recursive representation
              productTerms.push({ coeff: cProduct, basis: recursiveBasis(CayleyNumber.term(1, t1.basis).add(CayleyNumber.term(1, t2.basis))) });
            }
          }
        }
      }
    }

    return new CayleyNumber(productTerms);
  }

  /**
   * Multiplicative Inverse A^-1 = A* / |A|^2
   */
  public inverse(): CayleyNumber {
    if (this.isZero()) {
      throw new Error("Multiplicative inversion by zero");
    }
    const n = this.norm();
    if (n < 1e-12) {
      throw new Error("Inversion error: Norm is effectively zero");
    }
    const nSq = n * n;
    return this.conjugate().mulScalar(1 / nSq);
  }

  public div(other: CayleyNumber): CayleyNumber {
    return this.mul(other.inverse());
  }

  // ============================================================================
  // Transcendental Functions (Universal Euler / Hypercomplex Decomposition)
  // ============================================================================

  /**
   * Hypercomplex Exponential e^A
   * e^(S + V) = e^S * (cos(|V|) + (V / |V|) * sin(|V|))
   */
  public exp(): CayleyNumber {
    const S = this.getScalarValue();
    const V = this.getVectorPart();
    const vNorm = V.norm();
    const expS = Math.exp(S);

    if (vNorm < 1e-12) {
      return CayleyNumber.scalar(expS);
    }

    const cosV = Math.cos(vNorm);
    const sinV = Math.sin(vNorm);

    // Scalar component: expS * cosV
    const scalarPart = CayleyNumber.scalar(expS * cosV);

    // Vector component: expS * sinV * (V / vNorm)
    const vectorPart = V.mulScalar((expS * sinV) / vNorm);

    return scalarPart.add(vectorPart);
  }

  /**
   * Hypercomplex Natural Logarithm ln(A)
   * ln(S + V) = ln(|A|) + (V / |V|) * atan2(|V|, S)
   */
  public ln(): CayleyNumber {
    const aNorm = this.norm();
    if (aNorm < 1e-12) {
      throw new Error("Logarithm of zero is undefined");
    }

    const S = this.getScalarValue();
    const V = this.getVectorPart();
    const vNorm = V.norm();

    const lnNorm = Math.log(aNorm);
    const scalarPart = CayleyNumber.scalar(lnNorm);

    if (vNorm < 1e-12) {
      if (S < 0) {
        // Real negative scalar: ln(-r) = ln(r) + pi * e1
        return scalarPart.add(CayleyNumber.term(Math.PI, 1));
      }
      return scalarPart;
    }

    const angle = Math.atan2(vNorm, S);
    const vectorPart = V.mulScalar(angle / vNorm);

    return scalarPart.add(vectorPart);
  }

  /**
   * Hypercomplex Sine sin(A)
   * sin(S + V) = sin(S) cosh(|V|) + (V / |V|) cos(S) sinh(|V|)
   */
  public sin(): CayleyNumber {
    const S = this.getScalarValue();
    const V = this.getVectorPart();
    const vNorm = V.norm();

    if (vNorm < 1e-12) {
      return CayleyNumber.scalar(Math.sin(S));
    }

    const coshV = Math.cosh(vNorm);
    const sinhV = Math.sinh(vNorm);

    const scalarPart = CayleyNumber.scalar(Math.sin(S) * coshV);
    const vectorPart = V.mulScalar((Math.cos(S) * sinhV) / vNorm);

    return scalarPart.add(vectorPart);
  }

  /**
   * Hypercomplex Cosine cos(A)
   * cos(S + V) = cos(S) cosh(|V|) - (V / |V|) sin(S) sinh(|V|)
   */
  public cos(): CayleyNumber {
    const S = this.getScalarValue();
    const V = this.getVectorPart();
    const vNorm = V.norm();

    if (vNorm < 1e-12) {
      return CayleyNumber.scalar(Math.cos(S));
    }

    const coshV = Math.cosh(vNorm);
    const sinhV = Math.sinh(vNorm);

    const scalarPart = CayleyNumber.scalar(Math.cos(S) * coshV);
    const vectorPart = V.mulScalar((-Math.sin(S) * sinhV) / vNorm);

    return scalarPart.add(vectorPart);
  }

  /**
   * Hypercomplex Tangent tan(A) = sin(A) / cos(A)
   */
  public tan(): CayleyNumber {
    return this.sin().div(this.cos());
  }

  // ============================================================================
  // String Formatting
  // ============================================================================

  /**
   * Returns sparse algebraic string omitting zero terms.
   * e.g. "2 + 3e4 - 7e2 + 11e13"
   */
  public toString(precision: number = 4): string {
    if (this.terms.length === 0) return "0";

    const formatNum = (num: number): string => {
      if (Math.abs(num - Math.round(num)) < 1e-9) {
        return `${Math.round(num)}`;
      }
      return `${parseFloat(num.toFixed(precision))}`;
    };

    const parts: string[] = [];

    for (let i = 0; i < this.terms.length; i++) {
      const term = this.terms[i];
      const coeffVal = typeof term.coeff === "number" ? term.coeff : term.coeff.getScalarValue();
      const basisStr = basisToString(term.basis);

      const absCoeff = Math.abs(coeffVal);
      const isNegative = coeffVal < 0;

      let signStr = "";
      if (i === 0) {
        signStr = isNegative ? "-" : "";
      } else {
        signStr = isNegative ? " - " : " + ";
      }

      if (term.basis.type === "index" && term.basis.index === 0) {
        // Scalar e0
        parts.push(`${signStr}${formatNum(absCoeff)}`);
      } else {
        // Non-scalar basis e_k
        const coeffStr = absCoeff === 1 ? "" : `${formatNum(absCoeff)}`;
        parts.push(`${signStr}${coeffStr}${basisStr}`);
      }
    }

    return parts.join("");
  }

  /**
   * Canonical string for mapping & debugging.
   */
  public toCanonicalString(): string {
    return this.toString(6);
  }

  /**
   * User input format representation e.g. "((2+3e4)*{e0} + (7e3)*{e1})"
   */
  public toInputFormatString(): string {
    if (this.terms.length === 0) return "0";
    return this.terms
      .map(t => {
        const cStr = typeof t.coeff === "number" ? `${t.coeff}` : `(${t.coeff.toString()})`;
        const bStr = basisToString(t.basis);
        if (bStr === "e0") return cStr;
        return `(${cStr})*{${bStr}}`;
      })
      .join(" + ");
  }
}
