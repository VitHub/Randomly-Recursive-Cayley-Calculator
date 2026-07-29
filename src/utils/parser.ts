import { RecNum, RComplex, getLevel, promote } from "../math/recursiveComplex";

/**
 * Parses any reasonable nested parentheses/brackets representation of a recursive complex number.
 * e.g., "5" -> 5 (scalar)
 * e.g., "(1, 2)" -> C^1 with re = 1, im = 2
 * e.g., "((1, 2), (-3, 4.5))" -> C^2
 * e.g., "[(1, 2), 5]" -> C^2 with right part promoted to C^1
 */
export function parseRecNum(str: string): RecNum {
  // Clear all whitespaces or formatting junk
  const clean = str.trim().replace(/\s+/g, "");

  if (!clean) return 0;

  // Let's implement a recursive parser that parses slices of the string
  const parsePart = (s: string): RecNum => {
    if (!s) return 0;

    // Check if the overall expression is enclosed in parenthetical bounds which match
    if (
      (s.startsWith("(") && s.endsWith(")")) ||
      (s.startsWith("[") && s.endsWith("]")) ||
      (s.startsWith("{") && s.endsWith("}"))
    ) {
      // Ensure the starting and ending ones are actual outer boundaries and not sibling parenthesises
      // e.g. (1,2),(3,4) must not strip outer ones because they are not matching outers.
      let depth = 0;
      let matchesOuter = true;
      for (let i = 0; i < s.length - 1; i++) {
        const c = s[i];
        if (c === "(" || c === "[" || c === "{") depth++;
        if (c === ")" || c === "]" || c === "}") depth--;
        if (depth === 0) {
          matchesOuter = false;
          break;
        }
      }
      if (matchesOuter) {
        return parsePart(s.substring(1, s.length - 1));
      }
    }

    // Look for commas at depth 0 to partition the real and imaginary subtrees
    let commaIndex = -1;
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "(" || c === "[" || c === "{") {
        depth++;
      } else if (c === ")" || c === "]" || c === "}") {
        depth--;
      } else if (c === "," && depth === 0) {
        commaIndex = i;
        break; // Only take the primary dividing comma at root level
      }
    }

    if (commaIndex === -1) {
      // It must be a simple real number value
      const parsedFloat = parseFloat(s);
      return isNaN(parsedFloat) ? 0 : parsedFloat;
    }

    // Split into real and imaginary components
    const leftSubstring = s.substring(0, commaIndex);
    const rightSubstring = s.substring(commaIndex + 1);

    const leftVal = parsePart(leftSubstring);
    const rightVal = parsePart(rightSubstring);

    const leftL = getLevel(leftVal);
    const rightL = getLevel(rightVal);
    const maxL = Math.max(leftL, rightL);

    const promotedLeft = promote(leftVal, maxL);
    const promotedRight = promote(rightVal, maxL);

    return new RComplex(maxL + 1, promotedLeft, promotedRight);
  };

  try {
    return parsePart(clean);
  } catch (err) {
    console.error("RecursiveComplex parse error:", err);
    return 0;
  }
}

/**
 * Converts a RecNum back to its canonical parsing string representation with commas and parentheses.
 */
export function recNumToParsingString(val: RecNum): string {
  if (typeof val === "number") {
    return Math.abs(val - Math.round(val)) < 1e-9 
      ? `${Math.round(val)}` 
      : `${parseFloat(val.toFixed(6))}`;
  }
  return `(${recNumToParsingString(val.re)}, ${recNumToParsingString(val.im)})`;
}
