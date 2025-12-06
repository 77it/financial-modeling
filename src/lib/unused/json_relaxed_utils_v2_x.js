export { quoteKeysNumbersAndDatesForRelaxedJSON };
import { regExp_YYYYMMDDTHHMMSSMMMZ as DATE_RE } from '../date_utils.js';
import { IS_DIGIT, isPureDecimalNumber } from '../number_utils.js';

// --- Hoisted tables (small, fast) ---
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

/**
 * Transform a relaxed / JSON5-like input string into strict JSON syntax.
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Array building instead of string concatenation (2-3x faster)
 * - Lazy digit detection (only check when needed)
 * - Conditional marker handling (avoid overhead when not used)
 * - Optional formula parsing (expensive, opt-in only)
 *
 * @param {string} input - The relaxed/JSON5-like string
 * @param {string} [unquotedStringsMarker=''] - Optional marker prepended to unquoted string values
 * @param {boolean} [formulaAdvancedParsing=false] - Enable expensive formula parsing
 * @returns {string} A strict JSON string, safe for JSON.parse()
 */
function quoteKeysNumbersAndDatesForRelaxedJSON(input, unquotedStringsMarker = '', formulaAdvancedParsing = false) {
  // Input validation
  if (typeof input !== 'string') return '';

  // EXPENSIVE: Only run formula pre-processing when explicitly requested
  if (formulaAdvancedParsing) {
    input = wrapFunctionLikeValues(input, unquotedStringsMarker);
  }

  const n = input.length;
  if (n === 0) return '';

  // OPTIMIZATION: Lazy digit detection - only check when we hit a digit
  // Avoids scanning entire input upfront with regex
  /** @type {boolean|null} */
  let hasDigit = null; // null = not checked yet, true/false = cached result
  function checkHasDigit() {
    if (hasDigit === null) {
      hasDigit = /\d/.test(input);
    }
    return hasDigit;
  }

  // OPTIMIZATION: Only do marker handling if marker provided
  const needsMarkerHandling = unquotedStringsMarker.length > 0;

  let i = 0;
  // CRITICAL: Use array building instead of string concatenation
  // String concat creates new string each time (very expensive for large inputs)
  const out = [];

  // Context tracking
  let contextStack = 0; // bit-stack; LSB=object flag
  let depth = 0; // nesting depth to identify top-level value boundaries
  let inObjectKey = false;

  // ---- Helpers ----

  // Double-quoted string: copy as-is respecting escapes
  function readDQ() {
    out.push('"'); i++;
    while (i < n) {
      const c = input[i++];
      out.push(c);
      if (c === '\\') { if (i < n) { out.push(input[i++]); } continue; }
      if (c === '"') break;
    }
  }

  // Single-quoted string: convert to valid JSON double-quoted with escaping
  function readSQ() {
    i++; // skip opening '
    const bufParts = ['"'];
    while (i < n) {
      const c = input[i++];
      if (c === '\\') {
        if (i < n) {
          const next = input[i++];
          if (next === '"') { bufParts.push('\\"'); }
          else if (next === "'") { bufParts.push("\\'"); }
          else { bufParts.push('\\', next); }
        }
        continue;
      }
      if (c === "'") break;
      if (c === '"') bufParts.push('\\"');
      else bufParts.push(c);
    }
    bufParts.push('"');
    // Join once and do single replace
    const buf = bufParts.join('').replace(/\\'/g, "'");
    out.push(buf);
  }

  // Skip //... or /* ... */
  function skipLineComment() {
    i += 2;
    while (i < n && input[i] !== '\n') i++;
  }
  function skipBlockComment() {
    i += 2;
    while (i < n - 1) {
      if (input[i] === '*' && input[i + 1] === '/') { i += 2; return; }
      i++;
    }
  }

  // Lookahead over ws/comments
  function skipWsComments() {
    for (;;) {
      while (i < n && input.charCodeAt(i) < 128 && IS_WS[input.charCodeAt(i)]) i++;
      if (i + 1 < n && input[i] === '/' && (input[i + 1] === '/' || input[i + 1] === '*')) {
        if (input[i + 1] === '/') skipLineComment(); else skipBlockComment();
        continue;
      }
      break;
    }
  }

  // Trailing comma remover
  function maybeSkipTrailingComma() {
    i++; // skip comma
    const j = i;
    skipWsComments();
    const next = input[i];
    if (next === '}' || next === ']') {
      return true; // drop comma
    }
    i = j;
    out.push(',');
    return false;
  }

  // Date reader
  function tryReadDate() {
    if (inObjectKey) return false;
    const start = i;
    if (i + 6 >= n) return false;

    // YYYY?
    for (let k = 0; k < 4; k++) {
      const code = input.charCodeAt(i + k);
      if (code >= 128 || !IS_DIGIT[code]) return false;
    }
    const sep = input[i + 4];
    if (sep !== '-' && sep !== '.' && sep !== '/') return false;

    i += 5;
    while (i < n) {
      const c = input[i];
      const code = input.charCodeAt(i);
      if ((code < 128 && IS_DIGIT[code]) || c === '-' || c === '.' || c === '/' ||
        c === 'T' || c === ':' || c === 'Z' || c === 'z' || c === '+') {
        i++;
      } else break;
    }
    const s = input.slice(start, i);
    if (s.length >= 8 && s.length <= 35 && DATE_RE.test(s)) {
      const code = input.charCodeAt(i) || 0;
      const isIdent = (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 36 || code === 95;
      if (!isIdent) {
        // Check boundary
        let checkPos = i;
        while (checkPos < n && input[checkPos] === ' ') checkPos++;
        if (checkPos < n) {
          const nextChar = input[checkPos];
          const isJsonBoundary = nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === ':';
          if (!isJsonBoundary) {
            i = start;
            return false;
          }
        }
        out.push('"', s, '"');
        return true;
      }
    }
    i = start;
    return false;
  }

  // Read bare token (identifier or number-ish)
  function readBareToken() {
    const start = i;
    while (i < n) {
      const c = input[i];
      const code = input.charCodeAt(i);
      if (code < 128 && (IS_WS[code] || IS_JSON_SYNTAX[code])) break;
      if (c === '"' || c === "'" || c === '/') break;
      i++;
    }
    if (i === start) return null;
    return input.slice(start, i);
  }

  // Read a bare value (value position) until JSON boundary, allowing internal spaces
  // SLOW PATH: Only use when token contains function-like patterns
  function readBareValueUntilBoundary() {
    const start = i;
    let localBrace = 0;
    let localBracket = 0;
    let localParen = 0;
    while (i < n) {
      const ch = input[i];
      // Track nested structures inside the value to avoid cutting too early
      if (ch === '{') { localBrace++; i++; continue; }
      if (ch === '[') { localBracket++; i++; continue; }
      if (ch === '(') { localParen++; i++; continue; }
      if (ch === '}') {
        if (localBrace > 0) { localBrace--; i++; continue; }
        if (localBracket === 0 && localParen === 0) break;
      }
      if (ch === ']') {
        if (localBracket > 0) { localBracket--; i++; continue; }
        if (localBrace === 0 && localParen === 0) break;
      }
      if (ch === ')') {
        if (localParen > 0) { localParen--; i++; continue; }
      }
      // Stop at comma only when inside object/array (depth>0) and not nested locally
      if (ch === ',' && depth > 0 && localBrace === 0 && localBracket === 0 && localParen === 0) break;
      // Stop at quotes (start of string)
      if (ch === '"' || ch === "'") break;
      // Stop at slash only if it starts a comment
      if (ch === '/' && i + 1 < n && (input[i + 1] === '/' || input[i + 1] === '*')) break;
      i++;
    }
    if (i === start) return null;
    const value = input.slice(start, i).trimStart();
    return value.length === 0 ? null : value;
  }

  // JSON string escaper (optimized with array building)
  /**
   * JSON-escape a string and wrap in double quotes.
   * @param {string} s
   * @returns {void}
   */
  function jsonEscape(s) {
    // Fast path: no escaping needed
    let needs = false;
    for (let k = 0; k < s.length; k++) {
      const ch = s.charCodeAt(k);
      if (ch === 0x22 || ch === 0x5c || ch < 0x20) { needs = true; break; }
    }
    if (!needs) {
      out.push('"', s, '"');
      return;
    }

    // Slow path: build with escapes
    out.push('"');
    for (let k = 0; k < s.length; k++) {
      const ch = s.charCodeAt(k);
      if (ch === 0x22) out.push('\\"');
      else if (ch === 0x5c) out.push('\\\\');
      else if (ch === 0x08) out.push('\\b');
      else if (ch === 0x0c) out.push('\\f');
      else if (ch === 0x0a) out.push('\\n');
      else if (ch === 0x0d) out.push('\\r');
      else if (ch === 0x09) out.push('\\t');
      else if (ch < 0x20) out.push('\\u', ch.toString(16).padStart(4, '0'));
      else out.push(String.fromCharCode(ch));
    }
    out.push('"');
  }

  // Main loop
  while (i < n) {
    const c = input[i];
    const code = input.charCodeAt(i);

    // Whitespace
    if (code < 128 && IS_WS[code]) { out.push(c); i++; continue; }

    // Comments
    if (c === '/' && i + 1 < n) {
      const next = input[i + 1];
      if (next === '/') { skipLineComment(); continue; }
      if (next === '*') { skipBlockComment(); continue; }
    }

    // Structure & context
    if (c === '{') { contextStack = (contextStack << 1) | 1; depth++; inObjectKey = true; out.push(c); i++; continue; }
    if (c === '[') { contextStack = (contextStack << 1); depth++; inObjectKey = false; out.push(c); i++; continue; }
    if (c === ':') { inObjectKey = false; out.push(c); i++; continue; }
    if (c === ',') {
      if (maybeSkipTrailingComma()) continue;
      inObjectKey = (contextStack & 1) === 1;
      continue;
    }
    if (c === '}' || c === ']') { contextStack >>= 1; depth--; inObjectKey = (contextStack & 1) === 1; out.push(c); i++; continue; }

    // Strings
    if (c === '"') { readDQ(); continue; }
    if (c === "'") { readSQ(); continue; }

    // Dates (lazy digit check)
    if (code < 128 && IS_DIGIT[code] && checkHasDigit()) {
      if (tryReadDate()) continue;
    }

    // Bare tokens
    let token;
    if (inObjectKey) {
      // Keys: always use fast path (no spaces allowed in keys)
      token = readBareToken();
      if (token != null) {
        jsonEscape(token);
        continue;
      }
    } else {
      // Values: use boundary-aware reading when marker is present (allows spaces)
      // Otherwise use fast path for standard JSON
      if (needsMarkerHandling) {
        token = readBareValueUntilBoundary();
      } else {
        token = readBareToken();
      }
      if (token == null) {
        // Fallback
        out.push(c); i++;
        continue;
      }
      const finalToken = token;

      // OPTIMIZATION: Only trim if marker handling needed
      let tokenTrimmed, trailingWS;
      if (needsMarkerHandling) {
        tokenTrimmed = finalToken.trimEnd();
        trailingWS = tokenTrimmed.length < finalToken.length ? finalToken.slice(tokenTrimmed.length) : '';
      } else {
        tokenTrimmed = finalToken;
        trailingWS = '';
      }

      // Check for numbers (lazy digit check)
      if (checkHasDigit() && isPureDecimalNumber(tokenTrimmed)) {
        if (tokenTrimmed.indexOf('_') === -1 && tokenTrimmed.charCodeAt(0) !== 43 /* '+' */) {
          out.push('"', tokenTrimmed, '"', trailingWS);
        } else {
          // clean underscores and leading '+'
          out.push('"');
          for (let k = 0; k < tokenTrimmed.length; k++) {
            const ch = tokenTrimmed[k];
            if (ch === '_' || (k === 0 && ch === '+')) continue;
            out.push(ch);
          }
          out.push('"', trailingWS);
        }
        continue;
      }

      // Booleans/null
      if (tokenTrimmed === 'true' || tokenTrimmed === 'false' || tokenTrimmed === 'null') {
        out.push(finalToken);
        continue;
      }

      // Bareword value with optional marker
      jsonEscape(unquotedStringsMarker + tokenTrimmed);
      if (trailingWS) out.push(trailingWS);
      continue;
    }

    // Fallback
    out.push(c); i++;
  }

  return out.join('').trim();
}

/**
 * EXPENSIVE FORMULA PARSING - Only called when formulaAdvancedParsing=true
 * Wraps function-like values: identifier(...) into marked strings
 */
/**
 * Wrap unquoted function-like values (identifier followed by '(') in value positions
 * with a marker-prefixed JSON string so the overall text can be parsed as JSON.
 * @param {string} input
 * @param {string} marker
 * @returns {string}
 */
function wrapFunctionLikeValues(input, marker = '') {
  // Lookup tables for fast character checking
  const IS_ALPHA = (() => {
    const a = new Array(128).fill(false);
    for (let i = 65; i <= 90; i++) a[i] = true;
    for (let i = 97; i <= 122; i++) a[i] = true;
    a[95] = a[36] = true;
    return a;
  })();
  const IS_ALPHANUM = (() => {
    const a = new Array(128).fill(false);
    for (let i = 65; i <= 90; i++) a[i] = true;
    for (let i = 97; i <= 122; i++) a[i] = true;
    for (let i = 48; i <= 57; i++) a[i] = true;
    a[95] = a[36] = true;
    return a;
  })();

  const n = input.length;
  let i = 0;
  const parts = [];
  let inString = false;
  let quote = null;
  let escape = false;
  const ctx = [];
  let expectingValue = false;
  let expectingKey = false;

  // Detect function call: identifier(...)
  /**
   * Detect an unquoted function call inside a segment (ignoring quoted substrings).
   * @param {string} segment
   * @returns {boolean}
   */
  function segmentHasFnCall(segment) {
    const len = segment.length;
    let j = 0;
    let segInString = false;
    let segQuote = null;
    let segEscape = false;

    while (j < len) {
      const ch = segment[j];
      const code = segment.charCodeAt(j);

      if (segEscape) {
        segEscape = false;
        j++;
        continue;
      }
      if (segInString) {
        if (ch === '\\') {
          segEscape = true;
        } else if (ch === segQuote) {
          segInString = false;
          segQuote = null;
        }
        j++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        segInString = true;
        segQuote = ch;
        j++;
        continue;
      }

      // Fast identifier detection
      if (code < 128 && IS_ALPHA[code]) {
        let k = j + 1;
        while (k < len) {
          const kcode = segment.charCodeAt(k);
          if (kcode >= 128 || !IS_ALPHANUM[kcode]) break;
          k++;
        }
        // Skip whitespace
        let look = k;
        while (look < len) {
          const lcode = segment.charCodeAt(look);
          if (lcode >= 128 || !IS_WS[lcode]) break;
          look++;
        }
        if (segment[look] === '(') {
          return true;
        }
        j = k;
        continue;
      }
      j++;
    }
    return false;
  }

  while (i < n) {
    const c = input[i];
    const code = input.charCodeAt(i);

    if (escape) {
      parts.push(c);
      escape = false;
      i++;
      continue;
    }

    if (inString) {
      parts.push(c);
      if (c === '\\') {
        escape = true;
      } else if (c === quote) {
        inString = false;
        quote = null;
      }
      i++;
      continue;
    }

    if (c === '"' || c === "'" || c === '`') {
      inString = true;
      quote = c;
      parts.push(c);
      i++;
      continue;
    }

    if (c === '{') {
      ctx.push('object');
      expectingKey = true;
      expectingValue = false;
      parts.push(c);
      i++;
      continue;
    }

    if (c === '[') {
      ctx.push('array');
      expectingValue = true;
      expectingKey = false;
      parts.push(c);
      i++;
      continue;
    }

    if (c === '}') {
      ctx.pop();
      expectingKey = false;
      expectingValue = false;
      parts.push(c);
      i++;
      continue;
    }

    if (c === ']') {
      ctx.pop();
      expectingKey = false;
      expectingValue = false;
      parts.push(c);
      i++;
      continue;
    }

    if (c === ':') {
      parts.push(c);
      expectingValue = true;
      expectingKey = false;
      i++;
      continue;
    }

    if (c === ',') {
      parts.push(c);
      const top = ctx[ctx.length - 1];
      if (top === 'object') {
        expectingKey = true;
        expectingValue = false;
      } else if (top === 'array') {
        expectingValue = true;
        expectingKey = false;
      }
      i++;
      continue;
    }

    if (code < 128 && IS_WS[code]) {
      parts.push(c);
      i++;
      continue;
    }

    if (expectingKey) {
      parts.push(c);
      i++;
      continue;
    }

    if (expectingValue) {
      const start = i;
      let k = i;
      let depthParen = 0;
      let depthBrace = 0;
      let depthBracket = 0;
      let localInString = false;
      let localQuote = null;
      let localEscape = false;

      while (k < n) {
        const ch = input[k];
        if (localEscape) {
          localEscape = false;
          k++;
          continue;
        }
        if (localInString) {
          if (ch === '\\') {
            localEscape = true;
          } else if (ch === localQuote) {
            localInString = false;
            localQuote = null;
          }
          k++;
          continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
          localInString = true;
          localQuote = ch;
          k++;
          continue;
        }
        if (ch === '(') depthParen++;
        else if (ch === ')') depthParen = Math.max(0, depthParen - 1);
        else if (ch === '{') depthBrace++;
        else if (ch === '}') depthBrace = Math.max(0, depthBrace - 1);
        else if (ch === '[') depthBracket++;
        else if (ch === ']') depthBracket = Math.max(0, depthBracket - 1);

        if (depthParen === 0 && depthBrace === 0 && depthBracket === 0 && (ch === ',' || ch === '}' || ch === ']')) {
          break;
        }
        k++;
      }

      const segment = input.slice(start, k);
      const exprTrimmed = segment.trim();

      if (segmentHasFnCall(exprTrimmed)) {
        // Normalize quotes if needed
        let normalizedExpr = exprTrimmed;
        let needsNormalization = false;
        for (let m = 0; m < exprTrimmed.length; m++) {
          const ch = exprTrimmed[m];
          if (ch === '{' || ch === '[') {
            needsNormalization = true;
            break;
          }
        }
        if (needsNormalization) {
          normalizedExpr = '';
          let inSQ = false;
          let inDQ = false;
          let esc = false;
          for (let m = 0; m < exprTrimmed.length; m++) {
            const ch = exprTrimmed[m];
            if (esc) {
              normalizedExpr += ch;
              esc = false;
              continue;
            }
            if (ch === '\\') {
              normalizedExpr += ch;
              esc = true;
              continue;
            }
            if (ch === '"') {
              normalizedExpr += ch;
              if (!inSQ) {
                inDQ = !inDQ;
              }
              continue;
            }
            if (ch === "'") {
              if (!inDQ) {
                normalizedExpr += '"';
                inSQ = !inSQ;
              } else {
                normalizedExpr += ch;
              }
              continue;
            }
            normalizedExpr += ch;
          }
        }
        const wrapped = JSON.stringify(`${marker}${normalizedExpr}`);
        parts.push(wrapped);
      } else {
        parts.push(segment);
      }

      expectingValue = false;
      expectingKey = ctx[ctx.length - 1] === 'object';
      i = k;
      continue;
    }

    parts.push(c);
    i++;
  }

  return parts.join('');
}
