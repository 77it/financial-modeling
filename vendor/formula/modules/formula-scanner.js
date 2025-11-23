/**
 * Formula scanner utilities for JSONX detection.
 *
 * These functions scan ahead in formula strings to detect JSONX structures
 * (arrays and objects) versus legacy reference syntax.
 */

/**
 * Scans a bracket pair to determine if it's a JSONX array or legacy reference.
 *
 * @param {string} str - The formula string to scan
 * @param {number} start - The index of the opening bracket '['
 * @returns {{end: number, content: string, isJsonxArray: boolean}}
 * @throws {Error} If closing bracket is missing
 */
export function scanBracket(str, start) {
  const len = str.length;
  let depth = 1, quote = 0, hasComma = false, hasNested = false;
  let i = start + 1;
  const startIdx = i;

  for (; i < len; i++) {
    const ch = str.charCodeAt(i);
    if (quote) {
      if (ch === quote) quote = 0;
      continue;
    }
    if (ch === 34 || ch === 39 || ch === 96) {
      quote = ch;
      continue;
    }
    if (ch === 91) {
      depth++;
      hasNested = true;
    } else if (ch === 123) {
      hasNested = true;
    } else if (ch === 93) {
      depth--;
      if (depth === 0) {
        return {
          end: i,
          content: str.slice(startIdx, i),
          isJsonxArray: hasComma || hasNested
        };
      }
    } else if (ch === 44) {
      hasComma = true;
    }
  }
  throw new Error("Formula missing closing bracket");
}

/**
 * Scans a brace pair to extract JSONX object content.
 *
 * @param {string} str - The formula string to scan
 * @param {number} start - The index of the opening brace '{'
 * @returns {{end: number, content: string}}
 * @throws {Error} If closing brace is missing
 */
export function scanBrace(str, start) {
  const len = str.length;
  let depth = 1, quote = 0;
  let i = start + 1;
  const startIdx = i;

  for (; i < len; i++) {
    const ch = str.charCodeAt(i);
    if (quote) {
      if (ch === quote) quote = 0;
      continue;
    }
    if (ch === 34 || ch === 39 || ch === 96) {
      quote = ch;
    } else if (ch === 123) {
      depth++;
    } else if (ch === 125) {
      depth--;
      if (depth === 0) {
        return { end: i, content: str.slice(startIdx, i) };
      }
    }
  }
  throw new Error("Formula missing closing brace");
}
