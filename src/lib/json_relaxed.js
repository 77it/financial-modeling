export { relaxedJSONToStrictJSON };

/**
 * @file strict_json_translator.js
 * A minimal, single-pass translator from constrained JSON5-like input to strict JSON.
 *
 * Assumptions (by contract):
 * - No comments, no single-quoted strings, ASCII only, no trailing commas.
 * - Double-quoted strings (if present) are valid as-is and must be preserved verbatim.
 *
 * Behavior:
 * - Quotes all unquoted object keys (JSON requires "keys").
 * - In value positions:
 *    - Numbers and the specials (Infinity, -Infinity, NaN) are quoted => precision-safe strings.
 *    - true, false, null remain bare.
 *    - Any other bare token becomes a JSON string.
 * - Structural characters ({ } [ ] : ,) and whitespace are preserved.
 * - Value tokens support concatenation of adjacent bare segments:
 *      top-level:  123 mamma            => "123 mamma"
 *      object:     { mamma:123 babbo }  => {"mamma":"123 babbo"}
 *   Concatenation continues across ASCII whitespace (space, tab, CR, LF) until a structural char or a '"'.
 * - Numbers are still emitted as strings (precision-safe). Before detection/quoting, we remove underscores:
 *      12_345      => "12345"
 *      0xFF_FF     => "0xFFFF"
 * - Newlines (CR/LF) are treated as whitespace.
 * - BOM (U+FEFF) is stripped up front if present.
 * - No comments, no single-quoted strings, ASCII only. Double-quoted strings are preserved verbatim.
 * - JSON literals true/false/null remain bare; Infinity/-Infinity/NaN are quoted as strings.
 *
 * Example:
 *   Input:  {a: 12, b: x, c: -1.2e+30, d: Infinity, e: null, f: true, g: "ok", h: [x, 0xFF]}
 *   Output: {"a":"12","b":"x","c":"-1.2e+30","d":"Infinity","e":null,"f":true,"g":"ok","h":["x","0xFF"]}
 *
 *   Input:  {mamma:123 babbo,pino:999 pappa}
 *   Output: {"mamma":"123 babbo","pino":"999 pappa"}
 */

/**
 * Translate constrained JSON5-like text to strict JSON (see header for constraints).
 *
 * @param {string} input - Source text (ASCII; may include spaces/tabs/CR/LF; no comments/single quotes).
 * @returns {string} strict JSON text (safe for JSON.parse).
 */
function relaxedJSONToStrictJSON(input) {
  // Strip UTF-8 BOM if present.
  if (input && input.charCodeAt(0) === 0xFEFF) input = input.slice(1);

  /** @type {string[]} */
  const out = [];
  let i = 0;

  /** @typedef {'top'|'object'|'array'} CtxType */
  /** @typedef {{type: CtxType, state: 'expectKey'|'afterKey'|'expectValue'|'afterValue'}} Ctx */
  /** @type {Ctx[]} */
  const ctxStack = [{ type: 'top', state: 'expectValue' }];

  // --- Char utilities (ASCII only by contract) ---
  const atEnd = () => i >= input.length;
  const ch = () => input.charCodeAt(i);
  const curChar = () => input[i];

  /**
   * Checks if a character code is a whitespace character.
   * @param {number} c The character code to check.
   * @returns {boolean} True if the character code is a whitespace character, otherwise false.
   */
  const isWS = (c) =>
    c === 0x20 || // space
    c === 0x09 || // tab
    c === 0x0A || // LF
    c === 0x0D;   // CR

  /**
   * Checks if a character code is a structural character used in data formats like JSON.
   * @param {number} c The character code to check.
   * @returns {boolean} True if the character code is a structural character, otherwise false.
   */
  const isStruct = (c) =>
    c === 0x7b || // {
    c === 0x7d || // }
    c === 0x5b || // [
    c === 0x5d || // ]
    c === 0x3a || // :
    c === 0x2c;   // ,

  /**
   * Checks if a character code is a double quote.
   * @param {number} c The character code to check.
   * @returns {boolean} True if the character code is a double quote, otherwise false.
   */
  const isDq = (c) => c === 0x22; // "

  /**
   * Checks if a character code is a backslash.
   * @param {number} c The character code to check.
   * @returns {boolean} True if the character code is a backslash, otherwise false.
   */
  const isBS = (c) => c === 0x5c; // \

  // JSON literals to keep bare in value position
  const RESERVED = new Set(['true', 'false', 'null']);

  // Numeric detection for whole tokens (after underscore removal)
  // sign? ( hex | bin | oct | decimals [opt exponent] | .decimals [opt exponent] )
  const NUM_RE =
    /^[+-]?(?:0[xX][0-9A-Fa-f]+|0[bB][01]+|0[oO][0-7]+|(?:(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?))$/;

  // --- Emit helpers ---
  /** Push current character and advance. */
  function pushChar() { out.push(curChar()); i++; }
  /**
   * Push string literal.
   * @param {string} s The string to be pushed.
   */
  function pushStr(s) { out.push(s); }

  /**
   * Copy a double-quoted string verbatim (assumes current char is the opening quote `"`).
   * Preserves escape sequences exactly as provided, but copies in CHUNKS to reduce push calls.
   * Safe if the input ends with a dangling backslash (we copy the `\` and stop).
   */
  function copyDQStringVerbatim() {
    // Emit opening quote and advance
    out.push('"'); i++;

    let runStart = i;
    while (!atEnd()) {
      const c = ch();

      if (isDq(c)) {
        if (i > runStart) out.push(input.slice(runStart, i));
        out.push('"');
        i++;
        return;
      }

      if (isBS(c)) {
        if (i > runStart) out.push(input.slice(runStart, i));
        out.push('\\'); i++;
        if (!atEnd()) { out.push(input[i]); i++; }
        runStart = i;
        continue;
      }

      i++;
    }

    // Unterminated: flush what we saw so translators don't crash; JSON.parse will fail later.
    if (i > runStart) out.push(input.slice(runStart, i));
  }

  /** Copy and preserve consecutive ASCII spaces/tabs/newlines in a single slice. */
  function copyWS() {
    const startWS = i;
    while (!atEnd() && isWS(ch())) i++;
    if (i > startWS) out.push(input.slice(startWS, i));
  }

  /**
   * Read a concatenated *value* token: first bare token plus any number of subsequent
   * bare tokens separated only by whitespace. If `stopBeforeKeyCandidate` is true,
   * do not consume a next token if the next non-whitespace char *after that token*
   * is a colon (i.e., the token is the start of the next key).
   * @param {boolean} stopBeforeKeyCandidate
   * @returns {string}
   */
  function readConcatenatedValueToken(stopBeforeKeyCandidate) {
    const parts = [];
    const first = readBareTokenForValue();
    if (first.length > 0) parts.push(first);

    for (;;) {
      // skip WS
      let j = i;
      while (j < input.length && isWS(input.charCodeAt(j))) j++;

      if (!(j < input.length)) break;
      const cj = input.charCodeAt(j);
      if (isStruct(cj)) break;                 // struct always stops
      if (isDq(cj)) break;                     // a new quoted string starts; do not eat it

      // key lookahead if requested
      if (stopBeforeKeyCandidate) {
        const len = peekBareTokenLenFrom(j, /*allowQuote*/ true);
        if (len === 0) break;
        let k = j + len;
        while (k < input.length && isWS(input.charCodeAt(k))) k++;
        if (k < input.length && input.charCodeAt(k) === 0x3a /* : */) break;
        // consume the part
        parts.push(input.slice(j, j + len));
        i = j + len;
        continue;
      }

      // normal concatenation
      i = j;
      const next = readBareTokenForValue();
      if (next.length === 0) break;
      parts.push(next);
    }

    return parts.join(' ');
  }

  /**
   * Read a concatenated *key* token up to, but not including, the following ':'.
   * Concatenates adjacent bare tokens separated only by ASCII whitespace (SP/TAB/CR/LF).
   * Stops if it hits a colon (leaves `i` on the colon), or any structural char/" (which ends the key).
   * Parts are joined with a single space.
   * @returns {string}
   */
  function readConcatenatedKeyToken() {
    const parts = [];
    const first = readBareTokenForKey();
    if (first.length === 0) return '';
    parts.push(first);
    for (;;) {
      let j = i;
      while (j < input.length && isWS(input.charCodeAt(j))) j++;
      if (!(j < input.length)) break;
      const cj = input.charCodeAt(j);
      if (cj === 0x3a /* : */) { i = j; break; }
      if (isDq(cj) || isStruct(cj)) break;

      const len = peekBareTokenLenFrom(j, /*allowQuote*/ false);
      if (len === 0) break;
      parts.push(input.slice(j, j + len));
      i = j + len;
    }
    return parts.join(' ');
  }

  /**
   * Emit a strict-JSON value from a bare token.
   * - Exact JSON literals (true/false/null) stay bare.
   * - Numeric tokens are emitted as **strings** for precision safety (after '_' cleanup).
   * - Everything else => JSON string with minimal escaping of `"` and `\`.
   * @param {string} token
   */
  function emitValueFromBare(token) {
    if (token.length === 0) { out.push('""'); return; }

    if (RESERVED.has(token)) { // true | false | null
      out.push(token);
      return;
    }

    // Cheap precheck first; also rules out tokens with whitespace.
    if (looksNumericish(token)) {
      // Remove underscores ONCE for numeric validation. This is cheap and avoids
      // constructing a second temporary unless needed.
      const cleaned = token.indexOf('_') >= 0 ? token.replace(/_/g, '') : token;

      if (NUM_RE.test(cleaned)) {
        // Policy: numbers are emitted as JSON strings (precision safety).
        out.push('"', cleaned, '"');
        return;
      }
      // If regex fails, fall through to generic string emission
    }

    // Generic string: minimal escaping only
    // Optimization: skip regex replace if no '"' or '\' present
    if (token.indexOf('"') === -1 && token.indexOf('\\') === -1) {
      out.push('"', token, '"');
    } else {
      const escaped = token.replace(/["\\]/g, '\\$&');
      out.push('"', escaped, '"');
    }
  }

  /**
   * Emit a JSON object key from a previously parsed key token.
   * Keys are always strings in JSON, so wrap and escape as needed.
   * Always quotes and minimally escapes `"` and `\`.
   * Uses batched out.push(...) (multi-push style) for consistency/perf.
   * @param {string} key
   */
  function emitKeyToken(key) {
    // optimized escaping for keys:
    // avoid regex unless the key actually contains '"' or '\'
    if (key.indexOf('"') === -1 && key.indexOf('\\') === -1) {
      out.push('"', key, '"');
    } else {
      const escaped = key.replace(/["\\]/g, '\\$&');
      out.push('"', escaped, '"');
    }
  }

  /**
   * Read a bare token until WS or structural. Quotes may be allowed or not.
   * @param {boolean} allowQuote If true, a double quote character `"` will not stop the reading process.
   * @returns {string} The bare token string that was read.
   */
  function readBareTokenBase(allowQuote) {
    const start = i;
    while (!atEnd()) {
      const c = ch();
      if (isWS(c) || isStruct(c)) break;
      if (!allowQuote && isDq(c)) break; // stop on " only when not allowed
      i++;
    }
    return input.slice(start, i);
  }

  /** Bare token for VALUEs: allow embedded quotes. */
  function readBareTokenForValue() {
    return readBareTokenBase(true);
  }

  /** Bare token for KEYs: be conservative, stop on quotes. */
  function readBareTokenForKey() {
    return readBareTokenBase(false);
  }

  /**
   * Peek bare token length with selectable quote policy.
   * @param {number} start The starting index in the input string.
   * @param {boolean} allowQuote If true, a double quote character `"` will not stop the peeking process.
   * @returns {number} The length of the bare token.
   */
  function peekBareTokenLenFrom(start, allowQuote) {
    let k = start;
    while (k < input.length) {
      const c = input.charCodeAt(k);
      if (isWS(c) || isStruct(c)) break;
      if (!allowQuote && c === 0x22 /* " */) break;
      k++;
    }
    return k - start;
  }

  /**
   * Very cheap pre-check for "numeric-ish" tokens, tolerant of leading sign and underscores.
   * We intentionally allow runs of '_' before the first significant char so that cases like
   * "_123" or "__.5" don't force the full regex unless they *could* be numbers after cleanup.
   * Also early-return false if the token contains ASCII whitespace – concatenated tokens are
   * not numeric by design (e.g., "123_456 789_012").
   * @param {string} s
   * @returns {boolean}
   */
  function looksNumericish(s) {
    if (s.length === 0) return false;

    // Any ASCII whitespace inside => not a number token (avoid paying NUM_RE later).
    // (space, tab, CR, LF). Extend if your grammar ever adds other whitespace.
    if (/[ \t\r\n]/.test(s)) return false;

    let j = 0;
    const c0 = s.charCodeAt(0);
    // optional sign
    if (c0 === 0x2B /*+*/ || c0 === 0x2D /*-*/) j = 1;

    // skip leading underscores (JSON5-style readability separators users sometimes type)
    while (j < s.length && s.charCodeAt(j) === 0x5F /* _ */) j++;

    if (j >= s.length) return false;
    const c = s.charCodeAt(j);
    // allow either '.' or a digit as the first significant character
    return c === 0x2E /* . */ || (c >= 0x30 && c <= 0x39); /* 0-9 */
  }

  // --- Main scan ---
  while (!atEnd()) {
    const c = ch();
    const ctx = ctxStack[ctxStack.length - 1];

    // Strings
    if (isDq(c)) {
      // If we're at an object key, copy the quoted key and make the state explicit.
      if (ctx.type === 'object' && ctx.state === 'expectKey') {
        copyDQStringVerbatim();
        ctx.state = 'afterKey';   // Make the key->colon control flow explicit
      } else if (ctx.state === 'expectValue') {
        copyDQStringVerbatim();
        ctx.state = 'afterValue';
      } else {
        // Other contexts: just copy
        copyDQStringVerbatim();
      }
      continue;
    }

    // Whitespace
    if (isWS(c)) { copyWS(); continue; }

    // Structural: braces/brackets/colon/comma
    if (c === 0x7b) { // {
      pushChar();
      ctxStack.push({ type: 'object', state: 'expectKey' });
      continue;
    }
    if (c === 0x7d) { // }
      pushChar();
      ctxStack.pop();
      const parent = ctxStack[ctxStack.length - 1];
      if (parent) parent.state = 'afterValue'; // unconditional, simpler & robust
      continue;
    }
    if (c === 0x5b) { // [
      pushChar();
      ctxStack.push({ type: 'array', state: 'expectValue' });
      continue;
    }
    if (c === 0x5d) { // ]
      pushChar();
      ctxStack.pop();
      const parent = ctxStack[ctxStack.length - 1];
      if (parent) parent.state = 'afterValue'; // unconditional
      continue;
    }
    if (c === 0x2c) { // ,
      pushChar();
      const top = ctxStack[ctxStack.length - 1];
      if (top) {
        if (top.type === 'object') top.state = 'expectKey';
        else if (top.type === 'array') top.state = 'expectValue';
        else top.state = 'expectValue';
      }
      continue;
    }
    if (c === 0x3a) { // :
      pushChar();
      const top = ctxStack[ctxStack.length - 1];
      if (top && top.type === 'object') top.state = 'expectValue';
      continue;
    }

    // Non-space, non-structural, non-string
    if (ctx.type === 'object') {
      if (ctx.state === 'expectKey') {
        // Bare key (double-quoted handled above)
        const token = readConcatenatedKeyToken();
        emitKeyToken(token);
        ctx.state = 'afterKey';
        continue;
      } else if (ctx.state === 'afterKey') {
        // Allow only whitespace until the colon. If the colon is missing,
        // auto-insert it (lenient) rather than copying stray characters.
        // This avoids corrupting JSON with unexpected bytes.
        while (!atEnd() && isWS(ch())) pushChar();
        if (!atEnd() && ch() === 0x3a /* : */) {
          pushChar();                 // emit colon
          ctx.state = 'expectValue';  // and move on to value
          continue;
        }
        // Lenient fallback: synthesize a colon if it's not there.
        pushStr(':');
        ctx.state = 'expectValue';
        continue;
      } else if (ctx.state === 'expectValue') {
        // Bare value with concatenation
        const token = readConcatenatedValueToken(true);
        emitValueFromBare(token);
        ctx.state = 'afterValue';
        continue;
      } else {
        // afterValue: copy through (commas/braces handled above)
        pushChar();
        continue;
      }
    } else if (ctx.type === 'array') {
      if (ctx.state === 'expectValue') {
        const token = readConcatenatedValueToken(false);
        emitValueFromBare(token);
        ctx.state = 'afterValue';
        continue;
      } else {
        pushChar();
        continue;
      }
    } else {
      // top-level scalar
      if (ctx.state === 'expectValue') {
        const token = readConcatenatedValueToken(false);
        emitValueFromBare(token);
        ctx.state = 'afterValue';
        continue;
      } else {
        // If extra chars exist after a top-level value, they'll be structural or whitespace normally.
        // Any stray non-structural char is copied (but typical inputs won't hit this).
        pushChar();
        continue;
      }
    }
  }

  return out.join('');
}
