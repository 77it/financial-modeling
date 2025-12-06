export { quoteKeysNumbersAndDatesForRelaxedJSON };

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
const IS_DIGIT = (() => {
  const a = new Array(128).fill(false);
  for (let c = 48; c <= 57; c++) a[c] = true; // 0-9
  return a;
})();
const DATE_RE = /^\d{4}(?:[-/.]\d{1,2}){2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:[Zz]|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Transform a relaxed / JSON5-like input string into strict JSON syntax.
 *
 * This function is designed as a preprocessing step before passing the result
 * to `JSON.parse()`. It accepts input that may contain JSON5-style relaxations
 * (unquoted keys, single quotes, comments, trailing commas, bare numbers/dates)
 * and rewrites them into valid, strict JSON.
 *
 * ### Main transformations
 *
 * 1. **Object keys**
 *    - Any unquoted key is always quoted (e.g. `{a:1}` → `{"a":"1"}`).
 *    - Proper JSON escaping is applied for control characters, quotes, and backslashes.
 *
 * 2. **String values**
 *    - Double-quoted strings are passed through unchanged (with escapes respected).
 *    - Single-quoted strings are rewritten as JSON double-quoted strings with correct escaping.
 *
 * 3. **Numbers**
 *    - Pure decimal numbers (integers, floats, with optional exponent, underscores, or sign)
 *      are converted to JSON **strings** to preserve precision and formatting
 *      (e.g. `1.23` → `"1.23"`, `1e10` → `"1e10"`, `1e1_0` → `"1e10"`).
 *    - `+` signs and `_` separators are stripped before quoting.
 *    - Hex (`0x`), binary (`0b`), and octal (`0o`) literals are **not supported**;
 *      they will be treated as plain identifiers and thus converted to JSON strings.
 *
 * 4. **Dates**
 *    - ISO-like date strings (e.g. `2024-01-01`, `2024/12/31T10:30Z`)
 *      are detected and quoted into strings (to avoid accidental parsing as numbers).
 *
 * 5. **Booleans / null**
 *    - The tokens `true`, `false`, and `null` are preserved as JSON literals
 *      (not quoted).
 *
 * 6. **Comments**
 *    - Both `// line` and `/* block` comments are removed completely,
 *      since strict JSON does not allow them.
 *
 * 7. **Trailing commas**
 *    - A comma before a closing `}` or `]` is removed.
 *
 * 8. **Bare words**
 *    - Any other unquoted token that does not fall into the categories above
 *      is converted to a JSON string (e.g. `{status: ok}` → `{"status":"ok"}`).
 *
 * ### Notes and limitations
 * - This is a *syntactic transformer*, not a full JSON5 parser:
 *   it rewrites the text to strict JSON rather than producing objects directly.
 * - The function does not guarantee recovery from arbitrarily malformed input.
 *   It assumes the input is "relaxed JSON5-like", not arbitrary garbage.
 * - The output is guaranteed to be valid strict JSON if the input was valid
 *   JSON5 without advanced features like hex/binary/octal literals or Infinity/NaN.
 *
 * ### Usage example
 * const src = "{a:1, b:'ciao', d:2024-01-01T10:30:00Z, // comment\n}";
 * const json = quoteKeysNumbersAndDatesForRelaxedJSON(src);
 * console.log(json);
 * // => {"a":"1","b":"ciao","d":"2024-01-01T10:30:00Z"}
 *
 * const obj = JSON.parse(json);
 *
 *
 * @param {string} input - The relaxed/JSON5-like string
 * @returns {string} A strict JSON string, safe for JSON.parse()
 */
function quoteKeysNumbersAndDatesForRelaxedJSON(input) {

  const n = input.length;
  if (n === 0) return '';

  // Bail quickly if nothing numeric (often means nothing to transform)
  // Still needed for keys/comments handling; keep it cheap.
  const hasDigit = /\d/.test(input);

  let i = 0;
  let out = '';

  // Context tracking
  let contextStack = 0; // bit-stack; LSB=object flag
  let inObjectKey = false;

  // ---- Helpers ----

  // Double-quoted string: copy as-is respecting escapes
  function readDQ() {
    out += '"'; i++;
    while (i < n) {
      const c = input[i++];
      out += c;
      if (c === '\\') { if (i < n) { out += input[i++]; } continue; }
      if (c === '"') break;
    }
  }

  // Single-quoted string: convert to valid JSON double-quoted with escaping
  function readSQ() {
    i++; // skip opening '
    let buf = '"';
    while (i < n) {
      const c = input[i++];
      if (c === '\\') {
        if (i < n) {
          const next = input[i++];
          // Keep escape semantics, but ensure final result is valid JSON
          if (next === '"') { buf += '\\"'; }
          else if (next === "'") { buf += "\\'"; } // will be normalized below
          else { buf += '\\' + next; }
        }
        continue;
      }
      if (c === "'") break;
      if (c === '"') buf += '\\"';
      else buf += c;
    }
    // Normalize any \' (from inside single-quoted source) to just '
    buf = buf.replace(/\\'/g, "'");
    out += buf + '"';
  }

  // Skip //... or /* ... */ (removed for strict JSON)
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

  // Lookahead over ws/comments without emitting
  function skipWsComments() {
    for (;;) {
      // ws
      while (i < n && input.charCodeAt(i) < 128 && IS_WS[input.charCodeAt(i)]) i++;
      // comments
      if (i + 1 < n && input[i] === '/' && (input[i + 1] === '/' || input[i + 1] === '*')) {
        if (input[i + 1] === '/') skipLineComment(); else skipBlockComment();
        continue;
      }
      break;
    }
  }

  // Trailing comma remover: if comma followed by ws/comments and then ] or }, drop it
  function maybeSkipTrailingComma() {
    const save = i; // at ','
    i++; // skip comma
    const j = i;
    skipWsComments();
    const next = input[i];
    if (next === '}' || next === ']') {
      // drop comma; keep i where it is (just before }/])
      return true;
    }
    // not trailing: restore i to right after comma; emit comma
    i = j;
    out += ',';
    return false;
  }

  // Date reader (only when not in key token)
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
      // ensure not glued to identifier char
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

  // Check simple decimal form with underscores and optional exponent/sign
  /** @param {string} token */
  function isPureDecimalNumber(token) {
    let j = 0, len = token.length;
    if (!len) return false;
    let c = token[0], code = token.charCodeAt(0);

    if (c === '+' || c === '-') {
      if (len === 1) return false;
      j = 1; c = token[1]; code = token.charCodeAt(1);
    }
    if (!(code < 128 && IS_DIGIT[code]) && c !== '.') return false;

    let sawDigit = false, sawDot = false, sawE = false;
    while (j < len) {
      c = token[j]; code = token.charCodeAt(j);
      if (code < 128 && IS_DIGIT[code]) { sawDigit = true; j++; }
      else if (c === '_') { j++; }
      else if (c === '.' && !sawDot && !sawE) { sawDot = true; j++; }
      else if ((c === 'e' || c === 'E') && !sawE && sawDigit) {
        sawE = true; j++;
        if (j < len && (token[j] === '+' || token[j] === '-')) j++;
        let expDigits = false;
        while (j < len) {
          const cc = token.charCodeAt(j);
          if (cc < 128 && IS_DIGIT[cc]) { expDigits = true; j++; }
          else if (token[j] === '_') { j++; }
          else break;
        }
        if (!expDigits) return false;
      } else return false;
    }
    return sawDigit;
  }

  // Read a bare token (identifier or number-ish) until JSON syntax/WS/comment
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

  // JSON string escaper for keys/values (input has no quotes)
  /** @param {string} s */
  function jsonEscape(s) {
    let needs = false;
    for (let k = 0; k < s.length; k++) {
      const ch = s.charCodeAt(k);
      if (ch === 0x22 || ch === 0x5c || ch < 0x20) { needs = true; break; }
    }
    if (!needs) return `"${s}"`;
    let out = '"';
    for (let k = 0; k < s.length; k++) {
      const ch = s.charCodeAt(k);
      if (ch === 0x22) out += '\\"';
      else if (ch === 0x5c) out += '\\\\';
      else if (ch === 0x08) out += '\\b';
      else if (ch === 0x0c) out += '\\f';
      else if (ch === 0x0a) out += '\\n';
      else if (ch === 0x0d) out += '\\r';
      else if (ch === 0x09) out += '\\t';
      else if (ch < 0x20) out += '\\u' + ch.toString(16).padStart(4, '0');
      else out += String.fromCharCode(ch);
    }
    out += '"';
    return out;
  }

  // Main loop
  while (i < n) {
    const c = input[i];
    const code = input.charCodeAt(i);

    // Whitespace
    if (code < 128 && IS_WS[code]) { out += c; i++; continue; }

    // Comments → skip (removed)
    if (c === '/' && i + 1 < n) {
      const next = input[i + 1];
      if (next === '/') { skipLineComment(); continue; }
      if (next === '*') { skipBlockComment(); continue; }
    }

    // Structure & context
    if (c === '{') { contextStack = (contextStack << 1) | 1; inObjectKey = true; out += c; i++; continue; }
    if (c === '[') { contextStack = (contextStack << 1);    inObjectKey = false; out += c; i++; continue; }
    if (c === ':') { inObjectKey = false; out += c; i++; continue; }
    if (c === ',') {
      // maybe trailing comma
      if (maybeSkipTrailingComma()) continue;
      inObjectKey = (contextStack & 1) === 1;
      continue;
    }
    if (c === '}' || c === ']') { contextStack >>= 1; inObjectKey = (contextStack & 1) === 1; out += c; i++; continue; }

    // Strings
    if (c === '"') { readDQ(); continue; }
    if (c === "'") { readSQ(); continue; }

    // Dates (only if starts with digit)
    if (hasDigit && code < 128 && IS_DIGIT[code]) {
      if (tryReadDate()) continue;
    }

    // Bare tokens: keys or values
    const token = readBareToken();
    if (token != null) {
      if (inObjectKey) {
        // Quote ANY unquoted key (strict JSON)
        out += jsonEscape(token);
        continue;
      }

      // Values: quote pure decimal numbers (preserve as strings)
      if (hasDigit && isPureDecimalNumber(token)) {
        if (token.indexOf('_') === -1 && token.charCodeAt(0) !== 43 /* '+' */) {
          out += `"${token}"`;
        } else {
          // clean underscores and leading '+'
          let cleaned = '';
          for (let k = 0; k < token.length; k++) {
            const ch = token[k];
            if (ch === '_' || (k === 0 && ch === '+')) continue;
            cleaned += ch;
          }
          out += `"${cleaned}"`;
        }
        continue;
      }

      // Booleans/null should remain raw JSON tokens if present
      if (token === 'true' || token === 'false' || token === 'null') {
        out += token;
        continue;
      }

      // Otherwise treat as unquoted bareword value -> JSON string
      out += jsonEscape(token);
      continue;
    }

    // Fallback (should be rare)
    out += c; i++;
  }

  return out.trim();
}