/**
 * cayleyParser.ts
 * Parser for Free-Range Wildly Recursive Cayley Numbers.
 * Supports syntax like:
 *   - "5" (real scalar)
 *   - "2 + 3e4"
 *   - "7e3 + 4e5"
 *   - "{e0}", "{e1}", "{e11}", "{e{11}+e{13}}"
 *   - "((2+3e4)*{e0} + (7e3+4e5)*{e1})*{e{11}+e{13}}"
 *   - "exp(2e1 + 3e2)"
 */

import { CayleyNumber, CayleyBasis, indexBasis, recursiveBasis } from "../math/cayleyNumber";

export function parseCayleyNumber(input: string): CayleyNumber {
  if (!input || !input.trim()) {
    return CayleyNumber.scalar(0);
  }

  const clean = input.trim();

  try {
    const parser = new CayleyExprParser(clean);
    return parser.parse();
  } catch (err) {
    console.warn("CayleyParser error:", err);
    // Fallback attempt: try simple parseFloat or return zero
    const f = parseFloat(clean);
    return isNaN(f) ? CayleyNumber.scalar(0) : CayleyNumber.scalar(f);
  }
}

class CayleyExprParser {
  private str: string;
  private pos: number = 0;

  constructor(str: string) {
    this.str = str;
  }

  private skipWhitespace() {
    while (this.pos < this.str.length && /\s/.test(this.str[this.pos])) {
      this.pos++;
    }
  }

  private peek(): string {
    this.skipWhitespace();
    if (this.pos >= this.str.length) return "";
    return this.str[this.pos];
  }

  private getChar(): string {
    this.skipWhitespace();
    if (this.pos >= this.str.length) return "";
    return this.str[this.pos++];
  }

  public parse(): CayleyNumber {
    const res = this.parseExpr();
    return res;
  }

  // Expr -> Term ( ('+' | '-') Term )*
  private parseExpr(): CayleyNumber {
    let left = this.parseTerm();

    while (true) {
      const ch = this.peek();
      if (ch === "+") {
        this.getChar();
        const right = this.parseTerm();
        left = left.add(right);
      } else if (ch === "-") {
        this.getChar();
        const right = this.parseTerm();
        left = left.sub(right);
      } else {
        break;
      }
    }

    return left;
  }

  // Term -> Factor ( ('*' | '/' | implicit_mul) Factor )*
  private parseTerm(): CayleyNumber {
    let left = this.parseFactor();

    while (true) {
      const ch = this.peek();
      if (ch === "*") {
        this.getChar();
        const right = this.parseFactor();
        left = left.mul(right);
      } else if (ch === "/") {
        this.getChar();
        const right = this.parseFactor();
        left = left.div(right);
      } else if (ch === "(" || ch === "{" || ch === "e" || /[0-9]/.test(ch) || /^[a-zA-Z]/.test(ch)) {
        // Implicit multiplication, e.g. (2+3)*{e0}, 3{e4}, {e1}{e2}
        const right = this.parseFactor();
        left = left.mul(right);
      } else {
        break;
      }
    }

    return left;
  }

  // Factor -> Primary
  private parseFactor(): CayleyNumber {
    const ch = this.peek();

    // Check for unary minus or plus
    if (ch === "-") {
      this.getChar();
      return this.parseFactor().negate();
    }
    if (ch === "+") {
      this.getChar();
      return this.parseFactor();
    }

    // Function calls or identifiers: exp, ln, sin, cos, tan, conj, abs, norm
    if (/^[a-zA-Z]/.test(ch) && !this.str.substring(this.pos).match(/^e(?![a-zA-Z])/)) {
      const identMatch = this.str.substring(this.pos).match(/^([a-zA-Z]+)/);
      if (identMatch) {
        const ident = identMatch[1].toLowerCase();
        // Check if function name
        if (["exp", "ln", "sin", "cos", "tan", "conj", "abs", "norm"].includes(ident)) {
          this.pos += ident.length;
          this.skipWhitespace();
          if (this.peek() === "(") {
            this.getChar(); // consume '('
            const arg = this.parseExpr();
            if (this.peek() === ")") this.getChar(); // consume ')'
            switch (ident) {
              case "exp": return arg.exp();
              case "ln": return arg.ln();
              case "sin": return arg.sin();
              case "cos": return arg.cos();
              case "tan": return arg.tan();
              case "conj": return arg.conjugate();
              case "abs":
              case "norm": return CayleyNumber.scalar(arg.norm());
            }
          }
        }
      }
    }

    // Parentheses ( Expr )
    if (ch === "(") {
      this.getChar(); // consume '('
      const inner = this.parseExpr();
      if (this.peek() === ")") this.getChar(); // consume ')'
      return inner;
    }

    // Curly bracket basis target { Expr } or { e11 + e13 }
    if (ch === "{") {
      this.getChar(); // consume '{'
      const inner = this.parseExpr();
      if (this.peek() === "}") this.getChar(); // consume '}'
      // If inner is a single basis, return 1 * inner basis, else if inner is CayleyNumber
      if (inner.terms.length === 1 && inner.terms[0].basis.type === "index" && inner.terms[0].basis.index !== 0) {
        return CayleyNumber.term(1, inner.terms[0].basis);
      }
      return CayleyNumber.term(1, recursiveBasis(inner));
    }

    // Basis starting with 'e': e0, e1, e4, e11, e{11}, e{11+13}
    if (ch === "e") {
      this.getChar(); // consume 'e'
      const nextCh = this.peek();
      if (nextCh === "{") {
        this.getChar(); // consume '{'
        const inner = this.parseExpr();
        if (this.peek() === "}") this.getChar(); // consume '}'
        return CayleyNumber.term(1, recursiveBasis(inner));
      } else if (/[0-9]/.test(nextCh)) {
        // e.g. e0, e1, e4, e11
        let numStr = "";
        while (/[0-9]/.test(this.peek())) {
          numStr += this.getChar();
        }
        const idx = parseInt(numStr, 10);
        return CayleyNumber.term(1, indexBasis(idx));
      } else {
        // standalone 'e' defaults to e1
        return CayleyNumber.term(1, indexBasis(1));
      }
    }

    // Number or Number + Basis (e.g. 2, 3.14, 3e4, 7e3, 4e5)
    if (/[0-9]/.test(ch) || ch === ".") {
      let numStr = "";
      while (/[0-9\.]/.test(this.peek())) {
        numStr += this.getChar();
      }
      const numVal = parseFloat(numStr);

      // Check if followed immediately by 'e' basis, e.g. 3e4, 7e3, 4e5
      if (this.peek() === "e") {
        this.getChar(); // consume 'e'
        const nextCh = this.peek();
        if (nextCh === "{") {
          this.getChar(); // consume '{'
          const inner = this.parseExpr();
          if (this.peek() === "}") this.getChar(); // consume '}'
          return CayleyNumber.term(numVal, recursiveBasis(inner));
        } else if (/[0-9]/.test(nextCh)) {
          let idxStr = "";
          while (/[0-9]/.test(this.peek())) {
            idxStr += this.getChar();
          }
          const idx = parseInt(idxStr, 10);
          return CayleyNumber.term(numVal, indexBasis(idx));
        } else {
          return CayleyNumber.term(numVal, indexBasis(1));
        }
      }

      return CayleyNumber.scalar(numVal);
    }

    // Fallback consume char to avoid loop
    this.getChar();
    return CayleyNumber.scalar(0);
  }
}
