export { quoteNumbersAndDatesForRelaxedJSON5 };

// Hoisted constants - moved to module scope to avoid per-call allocations
const DATE_RE = /^\d{4}(?:[-/.]\d{1,2}){2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:[Zz]|[+-]\d{2}:?\d{2})?)?$/;

const IS_JSON_SYNTAX = (() => {
  const a = new Array(128).fill(false);
  a[123] = a[125] = a[91] = a[93] = a[58] = a[44] = true; // { } [ ] : ,
  return a;
})();

const IS_WS = (() => {
  const a = new Array(128).fill(false);
  a[32] = a[9] = a[10] = a[13] = true; // space, tab, LF, CR
  return a;
})();

const IS_DIGIT = (() => {
  const a = new Array(128).fill(false);
  for (let c = 48; c <= 57; c++) a[c] = true; // 0-9
  return a;
})();

/**
 * Ultra-optimized JSON5 preprocessor that quotes decimal numbers and dates.
 * Features context-aware parsing to avoid quoting object keys.
 *
 * @param {string} input
 * @returns {string} transformed text safe for JSON5.parse
 */
function quoteNumbersAndDatesForRelaxedJSON5(input) {
  const n = input.length;
  if (n === 0) return '';

  // Fast bail: skip processing if no digits detected
  if (!/\d/.test(input)) return input;

  let i = 0;
  let out = '';

  // Context tracking - use bitmask for speed
  let contextStack = 0; // Even bits = nesting level, odd bit = inObjectKey flag
  let inObjectKey = false;

  // Ultra-fast string reading with minimal bounds checking
  /** @param {string} quote */
  function readString(quote) {
    out += quote;
    i++;

    while (i < n) {
      const c = input[i];
      out += c;
      i++;
      if (c === '\\') {
        // Skip the next character (it's escaped)
        if (i < n) {
          out += input[i];
          i++;
        }
        continue;
      }
      if (c === quote) break;
    }
  }

  // Optimized comment reading
  function readLineComment() {
    out += '//';
    i += 2;
    const start = i;
    while (i < n && input[i] !== '\n') i++;
    out += input.slice(start, i);
  }

  function readBlockComment() {
    out += '/*';
    i += 2;
    const start = i;
    while (i < n - 1) {
      if (input[i] === '*' && input[i + 1] === '/') {
        out += input.slice(start, i) + '*/';
        i += 2;
        return;
      }
      i++;
    }
    out += input.slice(start);
  }

  // Optimized date detection with cheap prechecks
  function tryReadDate() {
    if (inObjectKey) return false;

    const start = i;

    // Quick pattern check: must be YYYY-?? or YYYY.?? or YYYY/??
    if (i + 6 >= n) return false;

    // Verify first 4 chars are digits using lookup table
    let code = input.charCodeAt(i);
    if (code >= 128 || !IS_DIGIT[code]) return false;
    code = input.charCodeAt(i + 1);
    if (code >= 128 || !IS_DIGIT[code]) return false;
    code = input.charCodeAt(i + 2);
    if (code >= 128 || !IS_DIGIT[code]) return false;
    code = input.charCodeAt(i + 3);
    if (code >= 128 || !IS_DIGIT[code]) return false;

    // Check separator
    const sep = input[i + 4];
    if (sep !== '-' && sep !== '.' && sep !== '/') return false;

    // Fast scan to potential end
    i += 5;
    while (i < n) {
      const c = input[i];
      code = input.charCodeAt(i);
      if ((code < 128 && IS_DIGIT[code]) || c === '-' || c === '.' || c === '/' ||
        c === 'T' || c === ':' || c === 'Z' || c === 'z' || c === '+') {
        i++;
      } else {
        break;
      }
    }

    // Only slice and test regex after prechecks pass
    const s = input.slice(start, i);
    if (s.length >= 8 && s.length <= 35 && DATE_RE.test(s)) {
      // Check not part of identifier
      const code = input.charCodeAt(i) || 0;
      const isIdent = (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 36 || code === 95;
      if (!isIdent) {
        out += `"${s}"`;
        return true;
      }
    }

    i = start;
    return false;
  }

  // Hyper-optimized number validation with single pass
  /** @param {string} token */
  function isPureDecimalNumber(token) {
    let j = 0;
    const len = token.length;
    if (len === 0) return false;

    let c = token[0];
    let code = token.charCodeAt(0);

    // Optional sign
    if (c === '+' || c === '-') {
      if (len === 1) return false;
      j = 1;
      c = token[1];
      code = token.charCodeAt(1);
    }

    // Must start with digit or dot
    if (!(code < 128 && IS_DIGIT[code]) && c !== '.') return false;

    let sawDigit = false;
    let sawDot = false;
    let sawE = false;

    while (j < len) {
      c = token[j];
      code = token.charCodeAt(j);

      if (code < 128 && IS_DIGIT[code]) {
        sawDigit = true;
        j++;
      } else if (c === '_') {
        j++;
      } else if (c === '.' && !sawDot && !sawE) {
        sawDot = true;
        j++;
      } else if ((c === 'e' || c === 'E') && !sawE && sawDigit) {
        sawE = true;
        j++;
        // Handle exponent sign
        if (j < len && (token[j] === '+' || token[j] === '-')) j++;
        // Must have digits after e/E
        let expDigits = false;
        while (j < len) {
          code = token.charCodeAt(j);
          if (code < 128 && IS_DIGIT[code]) {
            expDigits = true;
            j++;
          } else if (token[j] === '_') {
            j++;
          } else {
            break;
          }
        }
        if (!expDigits) return false;
      } else {
        return false;
      }
    }

    return sawDigit;
  }

  // Blazing-fast token reader with lookup table optimization
  function readGeneralToken() {
    const start = i;

    // Optimized token boundary detection using lookup tables
    while (i < n) {
      const c = input[i];
      const code = input.charCodeAt(i);

      // Fast whitespace check using lookup table
      if (code < 128 && IS_WS[code]) break;
      // Fast syntax check using lookup table
      if (code < 128 && IS_JSON_SYNTAX[code]) break;
      // String delimiters
      if (c === '"' || c === "'" || c === '/') break;

      i++;
    }

    if (i === start) return null;

    const token = input.slice(start, i);

    // Skip processing in object key context
    if (inObjectKey) return token;

    // Optimized number check and processing with cheap cleanup branch
    if (isPureDecimalNumber(token)) {
      // avoid quoting numbers that are part of identifier-like date fragments
      // when we are OUTSIDE any JSON structure (e.g., plain text / inline strings).
      // Examples to preserve:
      //   abc2024-01-01T10:30:00Z  -> keep 30, 00 unquoted
      //   test2023/12/25           -> keep 12 and 25 unquoted
      // But still quote numbers inside objects/arrays (contextStack !== 0).
      if (contextStack === 0) {
        const prev = start > 0 ? input[start - 1] : '';
        const next = i < n ? input[i] : '';
        // Characters that commonly glue numeric chunks inside date-like strings
        /** @param {string} ch */
        const isDateJoiner = (ch) =>
          ch === '-' || ch === '.' || ch === '/' || ch === ':' ||
          ch === 'T' || ch === 't' || ch === 'Z' || ch === 'z' || ch === '+';
        if (isDateJoiner(prev) || isDateJoiner(next)) {
          return token; // treat as part of an identifier-like date; do not quote
        }
      }

      if (token.indexOf('_') === -1 && token.charCodeAt(0) !== 43 /* '+' */) {
        return `"${token}"`;            // common, zero-alloc path
      }
      let cleaned = '';
      for (let k = 0; k < token.length; k++) {
        const ch = token[k];
        if (ch === '_' || (k === 0 && ch === '+')) continue;
        cleaned += ch;
      }
      return `"${cleaned}"`;
    }

    return token;
  }

  // Main parsing loop with aggressive optimization
  while (i < n) {
    const c = input[i];
    const code = input.charCodeAt(i);

    // Ultra-fast whitespace handling using lookup table
    if (code < 128 && IS_WS[code]) {
      out += c;
      i++;
      continue;
    }

    // Context tracking with minimal overhead
    if (c === '{') {
      contextStack = (contextStack << 1) | 1; // Push object context
      inObjectKey = true;
      out += c;
      i++;
      continue;
    }
    if (c === '[') {
      contextStack = contextStack << 1; // Push array context
      inObjectKey = false;
      out += c;
      i++;
      continue;
    }
    if (c === ':') {
      inObjectKey = false;
      out += c;
      i++;
      continue;
    }
    if (c === ',') {
      inObjectKey = (contextStack & 1) === 1; // Check if current context is object
      out += c;
      i++;
      continue;
    }
    if (c === '}' || c === ']') {
      contextStack = contextStack >> 1; // Pop context
      inObjectKey = (contextStack & 1) === 1; // Set based on new top-of-stack
      out += c;
      i++;
      continue;
    }

    // String handling - optimized for common cases
    if (c === '"') { readString('"'); continue; }
    if (c === "'") { readString("'"); continue; }

    // Comment handling with fast lookahead
    if (c === '/' && i + 1 < n) {
      const next = input[i + 1];
      if (next === '/') { readLineComment(); continue; }
      if (next === '*') { readBlockComment(); continue; }
    }

    // Date detection (before general tokens)
    if (code < 128 && IS_DIGIT[code]) { // Starts with digit
      if (tryReadDate()) continue;
    }

    // General token processing
    const token = readGeneralToken();
    if (token !== null) {
      out += token;
      continue;
    }

    // Fallback
    out += c;
    i++;
  }

  return out;
}