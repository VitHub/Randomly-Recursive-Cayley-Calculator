import { CayleyNumber, CayleyTerm, basisToString } from "../math/cayleyNumber";

export interface SerializedCayleyTerm {
  coeff: number | string;
  basis: string;
}

export function serializeCayleyNumber(val: CayleyNumber): SerializedCayleyTerm[] {
  return val.terms.map(t => ({
    coeff: typeof t.coeff === "number" ? t.coeff : t.coeff.toCanonicalString(),
    basis: basisToString(t.basis),
  }));
}

export function generateCayleyReport(
  eq: string,
  op: string,
  left: CayleyNumber,
  right: CayleyNumber | undefined,
  result: CayleyNumber | number
): string {
  const timestamp = new Date().toISOString();
  let text = `==========================================================\n`;
  text += `   FREE-RANGE CAYLEY NUMBER CALCULATION REPORT            \n`;
  text += `==========================================================\n\n`;
  text += `Report Generated : ${timestamp}\n`;
  text += `Equation Details : ${eq}\n`;
  text += `Active Operation : ${op.toUpperCase()}\n\n`;

  text += `----------------------------------------------------------\n`;
  text += `1. INPUT REGISTER A\n`;
  text += `----------------------------------------------------------\n`;
  text += `Sparse String : ${left.toString()}\n`;
  text += `Input Format  : ${left.toInputFormatString()}\n`;
  text += `Norm |A|       : ${left.norm().toFixed(6)}\n\n`;

  if (right !== undefined) {
    text += `----------------------------------------------------------\n`;
    text += `2. INPUT REGISTER B\n`;
    text += `----------------------------------------------------------\n`;
    text += `Sparse String : ${right.toString()}\n`;
    text += `Input Format  : ${right.toInputFormatString()}\n`;
    text += `Norm |B|       : ${right.norm().toFixed(6)}\n\n`;
  }

  text += `----------------------------------------------------------\n`;
  text += `3. COMPUTED RESULT\n`;
  text += `----------------------------------------------------------\n`;
  if (typeof result === "number") {
    text += `Scalar Result : ${result}\n\n`;
  } else {
    text += `Sparse String : ${result.toString()}\n`;
    text += `Input Format  : ${result.toInputFormatString()}\n`;
    text += `Norm |Result| : ${result.norm().toFixed(6)}\n\n`;
  }

  text += `==========================================================\n`;
  text += `End of Free-Range Cayley Number Calculation Report\n`;
  text += `==========================================================\n`;

  return text;
}

export function downloadJsonFile(data: any, fileName: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTextFile(text: string, fileName: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
