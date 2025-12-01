export { quoteKeysNumbersAndDatesForRelaxedJSON };
import { regExp_YYYYMMDDTHHMMSSMMMZ as DATE_RE } from './date_utils.js';
import { IS_DIGIT, isPureDecimalNumber } from './number_utils.js';

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
 * 9. **Unquoted strings marker** (optional)
 *    - When the `unquotedStringsMarker` parameter is provided, it is prepended to
 *      unquoted string values (bare words that are not numbers, dates, booleans, or null).
 *    - This marker helps downstream processors (like formula evaluators) distinguish
 *      between originally-quoted strings (literals) and originally-unquoted strings
 *      (which might be formulas or identifiers).
 *    - The marker is added INSIDE the JSON string value, before the actual content.
 *    - Example with marker `"#FM#"`:
 *      - Input: `{a: hello, b: "world"}`
 *      - Output: `{"a": "#FM#hello", "b": "world"}`
 *    - Keys are never marked (only values).
 *    - Numbers and dates are not marked (they get their own string conversion).
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
 * @param {string} [unquotedStringsMarker=''] - Optional marker prepended to unquoted string values.
 *                                              When provided (e.g., "\u001f#"), this marker is added
 *                                              INSIDE the JSON string value, allowing downstream code
 *                                              to distinguish originally-unquoted strings from quoted ones.
 *                                              Useful for formula evaluation systems where unquoted strings
 *                                              should be evaluated as formulas, while quoted strings are literals.
 *                                              Example: with marker "#", {a: hello} → {"a": "#hello"}
 * @returns {string} A strict JSON string, safe for JSON.parse()
 */
function quoteKeysNumbersAndDatesForRelaxedJSON(input, unquotedStringsMarker = '') {
  // Input validation
  if (typeof input !== 'string') return '';

  // Pre-wrap unquoted function-like values into marker-prefixed strings so they survive JSON.parse
  input = wrapFunctionLikeValues(input, unquotedStringsMarker);

  let n = input.length;
  if (n === 0) return '';

  // Bail quickly if nothing numeric (often means nothing to transform)
  // Still needed for keys/comments handling; keep it cheap.
  const hasDigit = /\d/.test(input);

  let i = 0;
  let out = '';

  // Context tracking
  let contextStack = 0; // bit-stack; LSB=object flag
  let depth = 0; // track nesting depth (0 = top level)
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
        // Check if there's meaningful content after the date
        // Skip whitespace and check if we hit a JSON boundary or end
        let checkPos = i;
        while (checkPos < n && input[checkPos] === ' ') checkPos++;

        // If the next non-space char is NOT a JSON boundary (,}]:) or end,
        // then this date is part of a larger bareword - don't treat as pure date
        if (checkPos < n) {
          const nextChar = input[checkPos];
          const isJsonBoundary = nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === ':';
          if (!isJsonBoundary) {
            // There's more bareword content after the date, treat entire thing as bareword
            i = start;
            return false;
          }
        }

        out += `"${s}"`;
        return true;
      }
    }
    i = start;
    return false;
  }


  // Read a bare value until JSON boundary (for value positions)
  // Includes all text including spaces until hitting boundaries based on context
  function readBareValueUntilBoundary() {
    const start = i;
    let localBraceDepth = 0;
    let localBracketDepth = 0;
    let localParenDepth = 0;
    while (i < n) {
      const c = input[i];
      // Track nested structures inside a value so we don't cut early
      if (c === '{') { localBraceDepth++; i++; continue; }
      if (c === '[') { localBracketDepth++; i++; continue; }
      if (c === '(') { localParenDepth++; i++; continue; }
      if (c === '}') {
        if (localBraceDepth > 0) { localBraceDepth--; i++; continue; }
        if (localBracketDepth === 0 && localParenDepth === 0) break;
      }
      if (c === ']') {
        if (localBracketDepth > 0) { localBracketDepth--; i++; continue; }
        if (localBraceDepth === 0 && localParenDepth === 0) break;
      }
      if (c === ')') {
        if (localParenDepth > 0) { localParenDepth--; i++; continue; }
      }
      // Stop at comma only if we're not nested inside value-local braces/brackets/parens
      if (c === ',' && depth > 0 && localBraceDepth === 0 && localBracketDepth === 0 && localParenDepth === 0) break;
      // Stop at quotes (start of string)
      if (c === '"' || c === "'") break;
      // Stop at slash only if it starts a comment
      if (c === '/' && i + 1 < n && (input[i + 1] === '/' || input[i + 1] === '*')) break;
      i++;
    }
    if (i === start) return null;
    // Only trim leading whitespace to preserve trailing space before closing braces
    const value = input.slice(start, i).trimStart();
    return value.length === 0 ? null : value;
  }

  // Read a bare token (identifier or number-ish) until JSON syntax/WS/comment
  function readBareToken() {
    const start = i;
    while (i < n) {
      const c = input[i];
      const code = input.charCodeAt(i);
      if (code < 128 && (IS_WS[code] || IS_JSON_SYNTAX[code])) break;
      if (c === '"' || c === "'") break;
      // Stop at slash only if it starts a comment
      if (c === '/' && i + 1 < n && (input[i + 1] === '/' || input[i + 1] === '*')) break;
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
    if (c === '{') { contextStack = (contextStack << 1) | 1; depth++; inObjectKey = true; out += c; i++; continue; }
    if (c === '[') { contextStack = (contextStack << 1); depth++; inObjectKey = false; out += c; i++; continue; }
    if (c === ':') { inObjectKey = false; out += c; i++; continue; }
    if (c === ',') {
      // maybe trailing comma
      if (maybeSkipTrailingComma()) continue;
      inObjectKey = (contextStack & 1) === 1;
      continue;
    }
    if (c === '}' || c === ']') { contextStack >>= 1; depth--; inObjectKey = (contextStack & 1) === 1; out += c; i++; continue; }

    // Strings
    if (c === '"') { readDQ(); continue; }
    if (c === "'") { readSQ(); continue; }

    // Dates (only if starts with digit) - check for pure dates not followed by bareword content
    if (hasDigit && code < 128 && IS_DIGIT[code]) {
      if (tryReadDate()) continue;
    }

    // Bare tokens: keys or values
    // For values, use readBareValueUntilBoundary to capture entire value including spaces
    const token = inObjectKey ? readBareToken() : readBareValueUntilBoundary();
    if (token != null) {
      if (inObjectKey) {
        // Quote ANY unquoted key (strict JSON)
        out += jsonEscape(token);
        continue;
      }

      // Values: quote pure decimal numbers (preserve as strings)
      // First strip trailing whitespace for number checking, but preserve it for output
      const tokenTrimmed = token.trimEnd();
      const trailingWS = token.slice(tokenTrimmed.length);

      if (hasDigit && isPureDecimalNumber(tokenTrimmed)) {
        if (tokenTrimmed.indexOf('_') === -1 && tokenTrimmed.charCodeAt(0) !== 43 /* '+' */) {
          out += `"${tokenTrimmed}"` + trailingWS;
        } else {
          // clean underscores and leading '+'
          let cleaned = '';
          for (let k = 0; k < tokenTrimmed.length; k++) {
            const ch = tokenTrimmed[k];
            if (ch === '_' || (k === 0 && ch === '+')) continue;
            cleaned += ch;
          }
          out += `"${cleaned}"` + trailingWS;
        }
        continue;
      }

      // Dates should remain as quoted strings (no marker)
      if (DATE_RE.test(tokenTrimmed)) {
        out += jsonEscape(tokenTrimmed) + trailingWS;
        continue;
      }

      // Booleans/null are raw JSON tokens (not quoted)
      if (tokenTrimmed === 'true' || tokenTrimmed === 'false' || tokenTrimmed === 'null') {
        out += tokenTrimmed + trailingWS;  // Keep as-is, not quoted
        continue;
      }

      /*
      // Infinity/NaN are non-standard but we quote them as strings
      if (tokenTrimmed === 'Infinity' || tokenTrimmed === '-Infinity' || tokenTrimmed === 'NaN') {
        out += jsonEscape(tokenTrimmed) + trailingWS;  // Quote these as strings since not standard JSON
        continue;
      }

      // Hex/binary/octal literals should be quoted without marker (but only if valid)
      // Valid patterns: [+-]?0x[0-9a-fA-F_]+, [+-]?0b[01_]+, [+-]?0o[0-7_]+
      const hexMatch = tokenTrimmed.match(/^([+-]?)0[xX]([0-9a-fA-F_]+)$/);
      const binMatch = tokenTrimmed.match(/^([+-]?)0[bB]([01_]+)$/);
      const octMatch = tokenTrimmed.match(/^([+-]?)0[oO]([0-7_]+)$/);
      if (hexMatch || binMatch || octMatch) {
        out += jsonEscape(tokenTrimmed) + trailingWS;
        continue;
      }
      */

      // Simple rule:
      // - If it's a pure number → quote without marker
      // - If it matches a date → quote without marker
      // - If it's true/false/null → leave unquoted
      // - Everything else unquoted → quote WITH marker (formula or user error, let formula engine decide)

      // Already checked: numbers and dates return earlier, so if we reach here with inObjectKey=false
      // and token is not a special keyword/value, it's an unquoted bareword → add marker

      // Add formula marker to indicate this was an unquoted string (not number, not date)
      out += jsonEscape(unquotedStringsMarker + tokenTrimmed) + trailingWS;
      continue;
    }

    // Fallback (should be rare)
    out += c; i++;
  }

  return out.trim();
}

/**
 * Wrap unquoted function-like values (identifier immediately followed by '(' in value position)
 * into JSON strings prefixed with the provided marker, so the relaxed JSON output stays parseable.
 *
 * This operates at the text level before the main normalizer:
 * - Only triggers when the parser is expecting a value (after ':' or ',' or '[' element).
 * - Skips quoted strings entirely.
 * - Reads balanced parentheses/braces/brackets and respects string escapes inside expressions.
 *
 * Examples:
 *   {a: fn({b:"c"})}  -> {\"a\":\"<marker>fn({b:\\\"c\\\"})\"}
 *
 * @param {string} input - relaxed JSON/JSON5-like text
 * @param {string} marker - marker to prefix the wrapped expression (e.g., FORMULA_MARKER)
 * @returns {string} rewritten text safe for subsequent JSON parsing
 */
function wrapFunctionLikeValues(input, marker = '') {
  const n = input.length;
  let i = 0;
  let out = '';
  let inString = false;
  let quote = null;
  let escape = false;
  const ctx = []; // 'object' | 'array'
  let expectingValue = false;
  let expectingKey = false;

  // Helper: detect an unquoted function call in a segment (ignores quoted substrings)
  /** @param {string} segment */
  function segmentHasFnCall(segment) {
    let j = 0;
    let segInString = false;
    let segQuote = null;
    let segEscape = false;
    while (j < segment.length) {
      const ch = segment[j];
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
      if (/[A-Za-z_$]/.test(ch)) {
        let k = j + 1;
        while (k < segment.length && /[A-Za-z0-9_$]/.test(segment[k])) k++;
        let look = k;
        while (look < segment.length && /\s/.test(segment[look])) look++;
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

    if (escape) {
      out += c;
      escape = false;
      i++;
      continue;
    }

    if (inString) {
      out += c;
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
      out += c;
      i++;
      continue;
    }

    if (c === '{') {
      ctx.push('object');
      expectingKey = true;
      expectingValue = false;
      out += c;
      i++;
      continue;
    }

    if (c === '[') {
      ctx.push('array');
      expectingValue = true;
      expectingKey = false;
      out += c;
      i++;
      continue;
    }

    if (c === '}') {
      ctx.pop();
      expectingKey = false;
      expectingValue = false;
      out += c;
      i++;
      continue;
    }

    if (c === ']') {
      ctx.pop();
      expectingKey = false;
      expectingValue = false;
      out += c;
      i++;
      continue;
    }

    if (c === ':') {
      out += c;
      expectingValue = true;
      expectingKey = false;
      i++;
      continue;
    }

    if (c === ',') {
      out += c;
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

    if (/\s/.test(c)) {
      out += c;
      i++;
      continue;
    }

    if (expectingKey) {
      out += c;
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
        const normalizedExpr = /[\\{\\[]/.test(exprTrimmed)
          ? exprTrimmed.replace(/'([^']*)'/g, "\"$1\"")
          : exprTrimmed;
        const wrapped = JSON.stringify(`${marker}${normalizedExpr}`);
        out += wrapped;
      } else {
        out += segment;
      }

      expectingValue = false;
      expectingKey = ctx[ctx.length - 1] === 'object';
      i = k;
      continue;
    }

    out += c;
    i++;
  }

  return out;
}

