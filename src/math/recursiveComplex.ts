export type RecNum = number | RComplex;

export class RComplex {
  constructor(
    public readonly level: number,
    public readonly re: RecNum,
    public readonly im: RecNum
  ) {
    if (level < 1) {
      throw new Error("RComplex level must be at least 1");
    }
    const reLevel = getLevel(re);
    const imLevel = getLevel(im);
    if (reLevel !== level - 1 || imLevel !== level - 1) {
      throw new Error(
        `Component level mismatch. Expected level ${level - 1}, but got re: ${reLevel}, im: ${imLevel}`
      );
    }
  }

  /**
   * String formatting of the recursive complex number.
   */
  public toString(precision: number = 4): string {
    const formatPart = (p: RecNum): string => {
      if (typeof p === "number") {
        return Math.abs(p - Math.round(p)) < 1e-9 ? `${Math.round(p)}` : `${parseFloat(p.toFixed(precision))}`;
      }
      return p.toString(precision);
    };

    if (this.level === 1) {
      const r = this.re as number;
      const i = this.im as number;
      if (i === 0) return formatPart(r);
      if (r === 0) {
        if (i === 1) return `i1`;
        if (i === -1) return `-i1`;
        return `${formatPart(i)}*i1`;
      }
      const sign = i < 0 ? "-" : "+";
      const absI = Math.abs(i);
      const absIStr = absI === 1 ? "" : `${formatPart(absI)}*`;
      return `${formatPart(r)} ${sign} ${absIStr}i1`;
    }

    const reStr = typeof this.re === "number" ? formatPart(this.re) : `(${this.re.toString(precision)})`;
    const imStr = typeof this.im === "number" ? formatPart(this.im) : `(${this.im.toString(precision)})`;
    
    // If imaginary part is zero, just return real part representation
    if (isZero(this.im)) {
      return typeof this.re === "number" ? formatPart(this.re) : this.re.toString(precision);
    }
    
    // If real part is zero, just return imaginary * i_level
    if (isZero(this.re)) {
      return `${imStr}*i${this.level}`;
    }

    return `${reStr} + i${this.level}*${imStr}`;
  }
}

// ============================================================================
// Helper Utilities
// ============================================================================

export function getLevel(z: RecNum): number {
  return typeof z === "number" ? 0 : z.level;
}

export function isZero(z: RecNum, tolerance: number = 1e-9): boolean {
  const L = getLevel(z);
  if (L === 0) {
    return Math.abs(z as number) < tolerance;
  }
  const az = z as RComplex;
  return isZero(az.re, tolerance) && isZero(az.im, tolerance);
}

/**
 * Computes standard JS clone of the tree structure.
 */
export function cloneRecNum(z: RecNum): RecNum {
  if (typeof z === "number") return z;
  return new RComplex(z.level, cloneRecNum(z.re), cloneRecNum(z.im));
}

/**
 * Promotes a lower-level number to a higher target level.
 */
export function promote(z: RecNum, targetLevel: number): RecNum {
  const current = getLevel(z);
  if (current === targetLevel) return z;
  if (current > targetLevel) {
    throw new Error(`Promotion error: Cannot demote level ${current} to ${targetLevel}`);
  }
  if (targetLevel === 0) return z;

  return new RComplex(
    targetLevel,
    promote(z, targetLevel - 1),
    promote(0, targetLevel - 1)
  );
}

// ============================================================================
// Basic Operations
// ============================================================================

export function equals(z: RecNum, w: RecNum, tolerance: number = 1e-9): boolean {
  const L = Math.max(getLevel(z), getLevel(w));
  const pz = promote(z, L);
  const pw = promote(w, L);

  if (L === 0) return Math.abs((pz as number) - (pw as number)) < tolerance;
  const az = pz as RComplex;
  const aw = pw as RComplex;
  return equals(az.re, aw.re, tolerance) && equals(az.im, aw.im, tolerance);
}

export function add(z: RecNum, w: RecNum): RecNum {
  const L = Math.max(getLevel(z), getLevel(w));
  const pz = promote(z, L);
  const pw = promote(w, L);

  if (L === 0) return (pz as number) + (pw as number);
  const az = pz as RComplex;
  const aw = pw as RComplex;
  return new RComplex(L, add(az.re, aw.re), add(az.im, aw.im));
}

export function negate(z: RecNum): RecNum {
  const L = getLevel(z);
  if (L === 0) return -(z as number);
  const az = z as RComplex;
  return new RComplex(L, negate(az.re), negate(az.im));
}

export function sub(z: RecNum, w: RecNum): RecNum {
  return add(z, negate(w));
}

export function mul(z: RecNum, w: RecNum): RecNum {
  const L = Math.max(getLevel(z), getLevel(w));
  const pz = promote(z, L);
  const pw = promote(w, L);

  if (L === 0) return (pz as number) * (pw as number);
  const az = pz as RComplex;
  const aw = pw as RComplex;

  // Formula: (a + i_L b)(c + i_L d) = (ac - bd) + i_L (ad + bc)
  const ac = mul(az.re, aw.re);
  const bd = mul(az.im, aw.im);
  const ad = mul(az.re, aw.im);
  const bc = mul(az.im, aw.re);

  return new RComplex(L, sub(ac, bd), add(ad, bc));
}

// ============================================================================
// Division and Conjugation
// ============================================================================

/**
 * Returns the total conjugate of z (negates all imaginary units).
 */
export function conjugateTotal(z: RecNum): RecNum {
  const L = getLevel(z);
  if (L === 0) return z;
  const az = z as RComplex;
  return new RComplex(L, conjugateTotal(az.re), negate(conjugateTotal(az.im)));
}

/**
 * Returns the level-k conjugate of z (negates only the imaginary unit i_k).
 */
export function conjugateLevel(z: RecNum, k: number): RecNum {
  const L = getLevel(z);
  if (L === 0 || k > L) return z;
  const az = z as RComplex;
  if (k === L) {
    return new RComplex(L, az.re, negate(az.im));
  }
  return new RComplex(L, conjugateLevel(az.re, k), conjugateLevel(az.im, k));
}

/**
 * Returns the absolute norm |z| as a real float number.
 * Under Miminis' L2-norm description, this corresponds to the Euclidean vector norm.
 */
export function abs(z: RecNum): number {
  const L = getLevel(z);
  if (L === 0) return Math.abs(z as number);
  const az = z as RComplex;
  const rAbs = abs(az.re);
  const iAbs = abs(az.im);
  return Math.sqrt(rAbs * rAbs + iAbs * iAbs);
}

/**
 * Algebraic multiplicative inverse: z^-1
 */
export function invert(z: RecNum): RecNum {
  const L = getLevel(z);
  if (L === 0) {
    const val = z as number;
    if (val === 0) throw new Error("Multiplicative inversion by zero");
    return 1 / val;
  }
  const az = z as RComplex;

  // D = a^2 + b^2 in C^{L-1}
  const a2 = mul(az.re, az.re);
  const b2 = mul(az.im, az.im);
  const D = add(a2, b2);

  try {
    const D_inv = invert(D);
    return new RComplex(L, mul(az.re, D_inv), negate(mul(az.im, D_inv)));
  } catch (err) {
    throw new Error(`Inversion failed: Element is a zero divisor or contains zero components in C^${L - 1}`);
  }
}

export function div(z: RecNum, w: RecNum): RecNum {
  return mul(z, invert(w));
}

// ============================================================================
// Transcendental Functions (Recursive Idempotent Framework)
// ============================================================================

/**
 * Decomposes an element of level L >= 2 to its orthogonal projections in level L-1,
 * applies a level L-1 function base, and re-assembles the result in level L.
 */
export function runTranscendental(
  z: RecNum,
  fBase: (x: RecNum) => RecNum,
  fRecurse: (x: RecNum) => RecNum
): RecNum {
  const L = getLevel(z);
  if (L === 0) {
    return fBase(z);
  }
  if (L === 1) {
    return fBase(z);
  }

  const az = z as RComplex;
  const a = az.re;
  const b = az.im;

  // Ensure real and imaginary elements are promoted to L-1
  const a_L1 = promote(a, L - 1) as RComplex;
  const b_L1 = promote(b, L - 1) as RComplex;

  const a_re = a_L1.re;
  const a_im = a_L1.im;
  const b_re = b_L1.re;
  const b_im = b_L1.im;

  // Projection formulas under idempotent theorem:
  // z1 = (a_re + b_im) + i_{L-1} * (a_im - b_re)
  // z2 = (a_re - b_im) + i_{L-1} * (a_im + b_re)
  const z1 = new RComplex(L - 1, add(a_re, b_im), sub(a_im, b_re));
  const z2 = new RComplex(L - 1, sub(a_re, b_im), add(a_im, b_re));

  const w1 = fRecurse(z1);
  const w2 = fRecurse(z2);

  // Re-composition formulas back into C^L:
  // w = w_sum + i_L * Y
  // w_sum = (w1 + w2) / 2
  // w_diff = (w1 - w2) / 2
  // Y = w_diff / i_{L-1} = w_diff * (-i_{L-1})
  // Let w_diff = U + i_{L-1} V. Then Y = V - i_{L-1} U.
  // In terms of RComplex: RComplex(L-1, V, -U)
  const w_sum = div(add(w1, w2), 2);
  const w_diff = div(sub(w1, w2), 2);

  const w_diff_L1 = promote(w_diff, L - 1) as RComplex;
  const diff_re = w_diff_L1.re;
  const diff_im = w_diff_L1.im;

  const Y = new RComplex(L - 1, diff_im, negate(diff_re));

  return new RComplex(L, w_sum, Y);
}

// --- 1. EXPONENTIATION ---
function expBase(z: RecNum): RecNum {
  const L = getLevel(z);
  if (L === 0) return Math.exp(z as number);
  const az = z as RComplex;
  const a = az.re as number;
  const b = az.im as number;
  const ea = Math.exp(a);
  return new RComplex(1, ea * Math.cos(b), ea * Math.sin(b));
}

export function exp(z: RecNum): RecNum {
  return runTranscendental(z, expBase, exp);
}

// --- 2. LOGARITHM ---
function lnBase(z: RecNum): RecNum {
  const L = getLevel(z);
  if (L === 0) {
    const val = z as number;
    if (val <= 0) throw new Error("Logarithm domain error: positive reals only at base");
    return Math.log(val);
  }
  const az = z as RComplex;
  const a = az.re as number;
  const b = az.im as number;
  const r = Math.sqrt(a * a + b * b);
  if (r === 0) throw new Error("Natural logarithm of zero is undefined");
  return new RComplex(1, Math.log(r), Math.atan2(b, a));
}

export function ln(z: RecNum): RecNum {
  return runTranscendental(z, lnBase, ln);
}

// --- 3. SINE ---
function sinBase(z: RecNum): RecNum {
  const L = getLevel(z);
  if (L === 0) return Math.sin(z as number);
  const az = z as RComplex;
  const a = az.re as number;
  const b = az.im as number;
  const cosh = (Math.exp(b) + Math.exp(-b)) / 2;
  const sinh = (Math.exp(b) - Math.exp(-b)) / 2;
  return new RComplex(1, Math.sin(a) * cosh, Math.cos(a) * sinh);
}

export function sin(z: RecNum): RecNum {
  return runTranscendental(z, sinBase, sin);
}

// --- 4. COSINE ---
function cosBase(z: RecNum): RecNum {
  const L = getLevel(z);
  if (L === 0) return Math.cos(z as number);
  const az = z as RComplex;
  const a = az.re as number;
  const b = az.im as number;
  const cosh = (Math.exp(b) + Math.exp(-b)) / 2;
  const sinh = (Math.exp(b) - Math.exp(-b)) / 2;
  return new RComplex(1, Math.cos(a) * cosh, -Math.sin(a) * sinh);
}

export function cos(z: RecNum): RecNum {
  return runTranscendental(z, cosBase, cos);
}

// --- 5. TANGENT (derived sin/cos) ---
export function tan(z: RecNum): RecNum {
  return div(sin(z), cos(z));
}

// ============================================================================
// Conversion Utilities to flat binary tree & text structures
// ============================================================================

export interface FlatNode {
  path: string; // binary path 'L' and 'R'
  level: number;
  value: number;
}

/**
 * Returns all real coefficients as flat leaf nodes.
 * Path is a sequence of bits: '0' for Real branch, '1' for Imaginary branch.
 * Real part of level L corresponds to path bit '0', Imaginary part to '1'.
 */
export function flattenRecNum(z: RecNum, currentPath: string = "", targetLevel?: number): FlatNode[] {
  const maxLevel = targetLevel ?? getLevel(z);
  const zPromoted = promote(cloneRecNum(z), maxLevel);

  if (maxLevel === 0) {
    return [{ path: currentPath, level: 0, value: zPromoted as number }];
  }

  const az = zPromoted as RComplex;
  const reLeaves = flattenRecNum(az.re, currentPath + "0", maxLevel - 1);
  const imLeaves = flattenRecNum(az.im, currentPath + "1", maxLevel - 1);
  return [...reLeaves, ...imLeaves];
}

/**
 * Reconstructs a brand-new RecNum from flat nodes at a given level.
 */
export function reconstructRecNum(nodes: FlatNode[], level: number): RecNum {
  if (level === 0) {
    const rootNode = nodes.find(n => n.path === "");
    return rootNode ? rootNode.value : 0;
  }

  const build = (pathPrefix: string, currentL: number): RecNum => {
    if (currentL === 0) {
      const leaf = nodes.find(n => n.path === pathPrefix);
      return leaf ? leaf.value : 0;
    }
    const leftPart = build(pathPrefix + "0", currentL - 1);
    const rightPart = build(pathPrefix + "1", currentL - 1);
    return new RComplex(currentL, leftPart, rightPart);
  };

  return build("", level);
}

/**
 * Generates an expansion representation listing all real dimensions and imaginary bases.
 * e.g., for level 2, bases are [1, i1, i2, i1*i2]
 */
export function getComponentExpansionBases(level: number): string[] {
  if (level === 0) return ["1"];
  const subBases = getComponentExpansionBases(level - 1);
  const reBases = subBases.map(b => b === "1" ? "1" : b);
  const imBases = subBases.map(b => b === "1" ? `i${level}` : `${b}*i${level}`);
  return [...reBases, ...imBases];
}
