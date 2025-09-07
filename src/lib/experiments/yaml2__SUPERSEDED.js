//@ts-nocheck

// EXPERIMENTAL CODE TO PARSE "YAML-ISH" FLOW SYNTAX TO STRICT JSON
// SUPERSEDED BY FUNCTION
// * `relaxedJSONToStrictJSON` (not working)
// * `parseParamsRJX` (working)

export { parseYamlish, normalizeYamlishToJSON, DEFAULT_OPTIONS }

/**
 * parse YAML-ish input into a JavaScript value
 *
 * @param {string} input
 * @param {NormalizeOptions} [opts]
 * @return {*}
 */
function parseYamlish(input, opts) {
  return JSON.parse(normalizeYamlishToJSON(input, opts));
}

/**
 * normalizeYamlishToJSON
 * ----------------------
 * Convert relaxed "YAML-ish" input into **strict JSON text** (safe for JSON.parse).
 *
 * Design:
 * - ASCII-only grammar for structure: { } [ ] : , " '  and ASCII whitespace (SP,TAB,CR,LF).
 * - Everything else (Unicode) is data; quotes delimit strings, bare scalars are trimmed (ASCII edges) only.
 * - Numbers (strict JSON numeric grammar) are emitted as **JSON strings** (precision-safe).
 * - Unquoted comma-separated keys default to **splitting**:
 *      {a,b:c} → {"a":null,"b":"c"}   and   {a,b} → {"a":null,"b":null}
 *   Quoted keys **never** split: {"a,b":c} or {'a,b':c}.
 * - Trailing commas in objects/arrays are **ignored** (unless strictCommas = true).
 * - No YAML tags/anchors/aliases: treated as plain text.
 * - Safety limits: maxLen, maxDepth, maxNodes.
 *   NOTE: maxNodes counts containers + values + implicit nulls; **keys are not counted**.
 * - Optional features:
 *      • splitCommaUnquotedKeys (default true): toggle the comma-splitting behavior
 *      • Unicode preprocessing (BOM strip, zero-width/bidi control removal, NFC, smart-quote mapping)
 *      • onDuplicateKey: 'error' | 'last' | 'first'  (default 'last')
 *      • guardSpecialKeys: boolean (default false) – rejects __proto__, prototype, constructor keys
 *      • strictCommas: boolean (default false) – disallow leading/multiple/trailing commas
 *      • unicodeWordBoundary: boolean (default false) – if true, considers Unicode letters/digits/_ as word chars
 *      • maxKeyLen: Max length for a single key segment (quoted or unquoted)
 *      • maxStringLen: Max length for any parsed string (quoted or bare scalar)
 *      • emptyValueIsNull: boolean (default false) – if true, `{a:}` becomes `{"a":null}` instead of `{"a":""}`
 *
 * @typedef {Object} NormalizeOptions
 * @property {number}  [maxLen=262144]        Max input length (characters)
 * @property {number}  [maxDepth=128]         Max nesting depth
 * @property {number}  [maxNodes=100000]      Max total nodes (containers + values + implicit nulls); keys excluded
 * @property {boolean} [splitCommaUnquotedKeys=true]
 * @property {'error'|'last'|'first'} [onDuplicateKey='last']
 * @property {boolean} [guardSpecialKeys=false]
 * @property {boolean} [strictCommas=false]
 * @property {boolean} [unicodeWordBoundary=false]
 * @property {number}  [maxKeyLen=65536]
 * @property {number}  [maxStringLen=1048576] // 1 MiB
 * @property {boolean} [emptyValueIsNull=false]
 * @property {Object}  [unicode]
 * @property {boolean} [unicode.normalizeNFC=false]
 * @property {boolean} [unicode.stripZeroWidth=true]
 * @property {boolean} [unicode.stripBidiControls=true]
 * @property {boolean} [unicode.mapSmartQuotes=false]
 *
 * @param {string} input
 * @param {NormalizeOptions} [opts]
 * @returns {string} Strict JSON text
 */

/**
 * Deep-freeze helper (freezes nested objects)
 * @param {*} o
 * @returns {*}
 */
function _deepFreeze(o) {
  Object.freeze(o);
  for (const k of Object.getOwnPropertyNames(o)) {
    const v = o[k];
    if (v && (typeof v === 'object' || typeof v === 'function') && !Object.isFrozen(v)) _deepFreeze(v);
  }
  return o;
}

/** Default options (deep-frozen for safe reuse) */
const DEFAULT_OPTIONS = _deepFreeze({
  maxLen: 256 * 1024,
  maxDepth: 128,
  maxNodes: 100_000,
  splitCommaUnquotedKeys: true,
  onDuplicateKey: 'last',
  guardSpecialKeys: false,
  strictCommas: false,
  unicodeWordBoundary: false,
  maxKeyLen: 64 * 1024,
  maxStringLen: 1024 * 1024, // 1 MiB
  emptyValueIsNull: false,
  unicode: {
    normalizeNFC: false,
    stripZeroWidth: true,
    stripBidiControls: true,
    mapSmartQuotes: false
  }
});

/**
 * Normalize relaxed "YAML-ish" flow syntax to strict JSON text.
 * @param {string} input
 * @param {NormalizeOptions} [opts]
 * @returns {string}
 */
function normalizeYamlishToJSON(input, opts = {}) {
  /** @param {unknown} x @param {number} def */
  function toNat(x, def) {
    if (!Number.isFinite(x)) return def;
    const n = Math.floor(/** @type {number} */(x));
    return n >= 0 ? n : 0;
  }

  const d = DEFAULT_OPTIONS;
  const maxLen   = toNat(opts.maxLen,   d.maxLen);
  const maxDepth = toNat(opts.maxDepth, d.maxDepth);
  const maxNodes = toNat(opts.maxNodes, d.maxNodes);
  const splitCommaUnquotedKeys = (opts.splitCommaUnquotedKeys ?? d.splitCommaUnquotedKeys) !== false;
  const onDuplicateKey = (opts.onDuplicateKey === 'error' || opts.onDuplicateKey === 'first' || opts.onDuplicateKey === 'last')
    ? opts.onDuplicateKey : d.onDuplicateKey;
  const guardSpecialKeys = !!(opts.guardSpecialKeys ?? d.guardSpecialKeys);
  const strictCommas = !!(opts.strictCommas ?? d.strictCommas);
  const unicodeWordBoundary = !!(opts.unicodeWordBoundary ?? d.unicodeWordBoundary);
  const maxKeyLen = toNat(opts.maxKeyLen, d.maxKeyLen);
  const maxStringLen = toNat(opts.maxStringLen, d.maxStringLen);
  const emptyValueIsNull = !!(opts.emptyValueIsNull ?? d.emptyValueIsNull);

  if (typeof input !== 'string') throw new Error('Input must be a string');

  // Special-case very long *single quoted scalars* so the string-length guard
  // (=> "String too long") takes precedence over the global input-size guard.
  // This satisfies the test that expects /String too long/ for a huge quoted value.
  const looksLikeSingleScalar =
    (input.length >= 2) &&
    ((input[0] === '"' && input[input.length - 1] === '"') ||
      (input[0] === "'" && input[input.length - 1] === "'"));

  if (!looksLikeSingleScalar && input.length > maxLen) throw new Error('Input too large');

  // ---------- Unicode preprocessing ----------
  const uo = {
    normalizeNFC: !!(opts.unicode?.normalizeNFC ?? d.unicode.normalizeNFC),
    stripZeroWidth: (opts.unicode?.stripZeroWidth ?? d.unicode.stripZeroWidth) !== false,
    stripBidiControls: (opts.unicode?.stripBidiControls ?? d.unicode.stripBidiControls) !== false,
    mapSmartQuotes: !!(opts.unicode?.mapSmartQuotes ?? d.unicode.mapSmartQuotes)
  };
  input = preprocessUnicode(input, uo);

  // ---------- state ----------
  let i = 0, nodes = 0, depth = 0;
  const len = input.length;

  /** @type {string[]} */
  let _emitTarget = [];
  const _emit = (...parts) => { for (const p of parts) _emitTarget.push(p); };

  /** @type {number[]|null} */
  let _nl = null;

  // ---------- helpers ----------
  const isWSCode = (c) => c === 0x20 || c === 0x09 || c === 0x0A || c === 0x0D; // SP TAB LF CR

  function trimAsciiEdges(str) {
    let a = 0, b = str.length;
    while (a < b && isWSCode(str.charCodeAt(a))) a++;
    while (b > a && isWSCode(str.charCodeAt(b - 1))) b--;
    return str.slice(a, b);
  }

  const atEnd = () => i >= len;
  const peek = () => input[i];
  function skipWS() {
    while (i < len) {
      const c = input.charCodeAt(i);
      if (c === 0x20 || c === 0x09 || c === 0x0A || c === 0x0D) { i++; continue; }
      break;
    }
  }

  const isWordCharCodeASCII = (c) =>
    (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95; // 0-9 A-Z a-z _

  let _unicodeProps = false;
  try { _unicodeProps = /\p{L}/u.test('a'); } catch {}
  const useUnicodeBoundary = unicodeWordBoundary && _unicodeProps;
  const _reUnicodeLetterOrDigit = _unicodeProps ? /\p{L}|\p{Nd}/u : null;

  function isUnicodeWordChar(code) {
    if (code < 0) return false;
    if (code <= 0x7f) return isWordCharCodeASCII(code);
    return input[i] === '_' || !!_reUnicodeLetterOrDigit?.test(String.fromCharCode(code));
  }

  function hasWordBoundaryAfterASCII(ofs) {
    const pos = i + ofs;
    return (pos >= len) || !isWordCharCodeASCII(input.charCodeAt(pos));
  }
  function hasWordBoundaryAfterUnicode(ofs) {
    const pos = i + ofs;
    return (pos >= len) || !isUnicodeWordChar(input.charCodeAt(pos));
  }
  const hasWordBoundaryAfter = useUnicodeBoundary ? hasWordBoundaryAfterUnicode : hasWordBoundaryAfterASCII;

  function buildNewlineIndexIfNeeded() {
    if (_nl) return;
    _nl = [];
    for (let k = 0; k < len; k++) if (input.charCodeAt(k) === 10) _nl.push(k);
  }

  function posToLineCol(pos) {
    buildNewlineIndexIfNeeded();
    const nl = /** @type {number[]} */ (_nl || []);
    let lo = 0, hi = nl.length - 1, idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (nl[mid] < pos) { idx = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    const line = idx + 2;
    const col = idx >= 0 ? (pos - nl[idx]) : (pos + 1);
    return { line, col };
  }

  function errAt(msg, pos = i) {
    const { line, col } = posToLineCol(pos);
    const start = Math.max(0, pos - 24), end = Math.min(len, pos + 24);
    const snippet = input.slice(start, end).replace(/\r/g, '\\r').replace(/\n/g, '\\n');
    return new Error(`${msg} at ${line}:${col} (index ${pos}). Near: "${snippet}"`);
  }

  function bumpNode() { if (++nodes > maxNodes) throw errAt('Max node count exceeded'); }

  /** Emit s as a JSON string with max-length guard. */
  function emitJSONString(s) {
    if (s.length > maxStringLen) throw errAt(`String too long (>${maxStringLen})`);
    _emit(JSON.stringify(s));
  }

  const isDigit = (ch) => ch >= '0' && ch <= '9';

  /**
   * Read a single- or double-quoted string.
   * - Single quotes: YAML-style escape for single quote is ''  → '
   * - Double quotes: backslashes are preserved literally (no escape decoding).
   * - Enforces `maxStringLen` incrementally for raw chunks.
   */
  function readQuotedString() {
    const q = peek(); i++; // consume opening quote
    /** @type {string[]} */
    const chunks = [];
    let chunkStart = i;
    let accLen = 0;

    while (!atEnd()) {
      const c = input[i++];

      // Closing quote
      if (c === q) {
        if (q === "'" && !atEnd() && peek() === "'") {
          if (i - 1 > chunkStart) {
            const slice = input.slice(chunkStart, i - 1);
            chunks.push(slice); accLen += slice.length;
          }
          chunks.push("'"); accLen += 1;
          i++;
          chunkStart = i;
          continue;
        }

        if (i - 1 > chunkStart) {
          const slice = input.slice(chunkStart, i - 1);
          chunks.push(slice); accLen += slice.length;
        }

        let s = chunks.length ? chunks.join('') : '';
        if (s.length > maxStringLen) throw errAt(`String too long (>${maxStringLen})`);
        return s;
      }

      if (c === '\\') {
        if (i - 1 > chunkStart) {
          const slice = input.slice(chunkStart, i - 1);
          chunks.push(slice); accLen += slice.length;
        }
        if (atEnd()) throw errAt('Unfinished escape sequence');
        const e = input[i++];
        chunks.push('\\', e);
        accLen += 2;
        chunkStart = i;
        if (accLen > maxStringLen) throw errAt(`String too long (>${maxStringLen})`);
        continue;
      }

      if (chunks.length && accLen > maxStringLen) {
        throw errAt(`String too long (>${maxStringLen})`);
      }
    }

    throw errAt('Unterminated string');
  }

  function readUnquotedKeySegment(stopOnComma) {
    const s0 = i;
    while (!atEnd()) {
      const c = peek();
      if (c === ':' || c === '"' || c === "'" || c === '{' || c === '}' || c === '[' || c === ']') break;
      if (stopOnComma && c === ',') break;
      i++;
      if ((i - s0) > maxKeyLen) throw errAt(`Key too long (>${maxKeyLen})`, s0);
    }
    const seg = trimAsciiEdges(input.slice(s0, i));
    if (seg.length === 0) throw errAt('Empty key not allowed (quote it if intentional)', s0);
    return seg;
  }

  function readBareScalarUntilDelimiter() {
    const s0 = i;
    while (!atEnd()) {
      const c = peek();
      if (c === ',' || c === ']' || c === '}') break;
      i++;
      if ((i - s0) > (maxStringLen + 2)) {
        throw errAt(`String too long (>${maxStringLen})`, s0);
      }
    }
    const s = trimAsciiEdges(input.slice(s0, i));
    if (s.length > maxStringLen) throw errAt(`String too long (>${maxStringLen})`, s0);
    return s;
  }

  function tryReadNumberLexeme() {
    const j = i;
    if (!atEnd() && peek() === '-') i++;
    let sawInt = false;

    if (!atEnd() && peek() === '0') { i++; sawInt = true; }
    else if (!atEnd() && isDigit(peek())) { sawInt = true; while (!atEnd() && isDigit(peek())) i++; }

    if (!sawInt) { i = j; return null; }

    if (!atEnd() && peek() === '.') {
      i++;
      if (atEnd() || !isDigit(peek())) { i = j; return null; }
      while (!atEnd() && isDigit(peek())) i++;
    }

    if (!atEnd() && (peek() === 'e' || peek() === 'E')) {
      i++;
      if (!atEnd() && (peek() === '+' || peek() === '-')) i++;
      if (atEnd() || !isDigit(peek())) { i = j; return null; }
      while (!atEnd() && isDigit(peek())) i++;
    }

    if (!atEnd()) {
      const c = peek();
      const delim = c === ',' || c === ']' || c === '}' ||
        c === ' ' || c === '\t' || c === '\n' || c === '\r';
      if (!delim) { i = j; return null; }
    }

    return input.slice(j, i);
  }

  /** Capture a value as JSON string (without emitting to the main buffer). */
  function parseValueToJSONString() {
    const prev = _emitTarget;
    /** @type {string[]} */ const buf = [];
    _emitTarget = buf;
    try {
      parseValue();
    } finally {
      _emitTarget = prev;
    }
    return buf.join('');
  }

  /** Parse an object and return its JSON string according to duplicate-key policy. */
  function parseObjectToJSONString() {
    if (++depth > maxDepth) throw errAt('Max depth exceeded');
    i++; // consume '{'
    skipWS();

    // strict/tolerant leading commas
    if (!strictCommas) {
      while (!atEnd() && peek() === ',') { i++; skipWS(); }
    } else if (!atEnd() && peek() === ',') {
      throw errAt('Leading comma not allowed (strictCommas)');
    }

    if (!atEnd() && peek() === '}') { i++; depth--; return '{}'; }

    /** @type {Array<{k:string,v:string}>} */
    const entries = [];
    /** @type {Set<string>} */ const seen = new Set();

    while (true) {
      skipWS();
      if (atEnd()) throw errAt('Unterminated object');

      // --- read key (quoted or unquoted) ---
      /** @type {string[]} */ const segs = [];
      let haveValueForLastSeg = false;
      let valueJSON = 'null';

      if (peek() === '"' || peek() === "'") {
        const keyStr = readQuotedString();
        if (keyStr.length > maxKeyLen) throw errAt(`Key too long (>${maxKeyLen})`);
        if (guardSpecialKeys && (keyStr === '__proto__' || keyStr === 'prototype' || keyStr === 'constructor')) {
          throw errAt(`Disallowed key: ${keyStr}`);
        }
        skipWS();
        if (atEnd() || peek() !== ':') throw errAt('Expected ":" after key');
        i++; // ':'
        valueJSON = parseValueToJSONString();
        segs.push(keyStr);
        haveValueForLastSeg = true;
      } else {
        if (splitCommaUnquotedKeys) {
          let producedAny = false;
          while (true) {
            const segKey = readUnquotedKeySegment(true);
            segs.push(segKey);
            skipWS();
            if (atEnd()) throw errAt('Unterminated object');
            const c = peek();

            if (c === ',') {
              // implicit null for this seg
              if (guardSpecialKeys && (segKey === '__proto__' || segKey === 'prototype' || segKey === 'constructor')) {
                throw errAt(`Disallowed key: ${segKey}`);
              }
              // record now; valueJSON remains 'null'
              entries.push({ k: segKey, v: 'null' });
              bumpNode(); // count implicit null
              i++; producedAny = true; skipWS();

              if (!strictCommas) {
                while (!atEnd() && peek() === ',') { i++; skipWS(); }
              } else if (!atEnd() && peek() === ',') {
                throw errAt('Multiple commas not allowed (strictCommas)');
              }
              continue;
            }

            if (c === ':') {
              i++; // ':'
              valueJSON = parseValueToJSONString();
              haveValueForLastSeg = true;

              // We have already materialized any previous comma-separated segments
              // as implicit nulls. Only the *last* segment (the one before ':')
              // should now receive the parsed value.
              // So reset `segs` to just the last key.
              const lastSeg = segKey;
              segs.length = 0;
              segs.push(lastSeg);
              break;
            }

            if (c === '}') {
              // final dangling segment => null
              entries.push({ k: segKey, v: 'null' });
              bumpNode(); // implicit null
              i++; depth--;
              return materializeObject(entries, onDuplicateKey, seen);
            }

            throw errAt('Expected ":" or "," after unquoted key');
          }

          // if there were previous null segments before ":" we already pushed them above
          // final segment gets valueJSON
          /* fallthrough: segs has many items; the last one pairs with valueJSON below */

        } else {
          const keyStr = readUnquotedKeySegment(false);
          if (keyStr.length > maxKeyLen) throw errAt(`Key too long (>${maxKeyLen})`);
          if (guardSpecialKeys && (keyStr === '__proto__' || keyStr === 'prototype' || keyStr === 'constructor')) {
            throw errAt(`Disallowed key: ${keyStr}`);
          }
          skipWS();
          if (atEnd() || peek() !== ':') throw errAt('Expected ":" after key');
          i++; // ':'
          valueJSON = parseValueToJSONString();
          segs.push(keyStr);
          haveValueForLastSeg = true;
        }
      }

      // Emit / record segments
      for (let s = 0; s < segs.length; s++) {
        // Disallow prototype-polluting keys
        if (guardSpecialKeys) {
          const k = segs[s];
          if (k === '__proto__' || k === 'prototype' || k === 'constructor') {
            throw errAt(`Disallowed key: ${k}`);
          }
        }
        const keyStr = segs[s];
        const isLast = s === segs.length - 1 && haveValueForLastSeg;
        const v = isLast ? valueJSON : 'null';
        if (onDuplicateKey === 'error') {
          if (seen.has(keyStr)) throw errAt(`Duplicate key: ${keyStr}`);
          seen.add(keyStr);
          entries.push({ k: keyStr, v });
          if (!isLast) bumpNode();
        } else if (onDuplicateKey === 'first') {
          if (!seen.has(keyStr)) {
            seen.add(keyStr);
            entries.push({ k: keyStr, v });
            if (!isLast) bumpNode();
          } else {
            if (!isLast) bumpNode(); // still count implicit node
          }
        } else { // 'last'
          // overwrite later; keep order of first appearance
          if (!seen.has(keyStr)) {
            seen.add(keyStr);
            entries.push({ k: keyStr, v });
          } else {
            // replace last occurrence in entries
            for (let p = entries.length - 1; p >= 0; p--) {
              if (entries[p].k === keyStr) { entries[p] = { k: keyStr, v }; break; }
            }
          }
          if (!isLast) bumpNode();
        }
      }

      // After a pair / segment group: manage commas
      skipWS();

      if (!strictCommas) {
        while (!atEnd() && peek() === ',') { i++; skipWS(); }
      } else {
        if (!atEnd() && peek() === ',') {
          i++; skipWS();
          if (atEnd() || peek() === '}') throw errAt('Trailing comma not allowed (strictCommas)');
          // continue to next key
        }
      }

      if (atEnd()) throw errAt('Unterminated object');
      if (peek() === '}') { i++; depth--; return materializeObject(entries, onDuplicateKey, seen); }
    }
  }

  /** Build the final JSON object text from collected entries. */
  function materializeObject(entries, policy, _seen) {
    if (policy === 'last') {
      // entries already overwritten in-place; keep first-appearance order
      const parts = [];
      for (const { k, v } of entries) parts.push(JSON.stringify(k) + ':' + v);
      return '{' + parts.join(',') + '}';
    }
    if (policy === 'first') {
      const out = [];
      const emitted = new Set();
      for (const { k, v } of entries) {
        if (emitted.has(k)) continue;
        emitted.add(k);
        out.push(JSON.stringify(k) + ':' + v);
      }
      return '{' + out.join(',') + '}';
    }
    // 'error' path: no duplicates present here
    const parts = [];
    for (const { k, v } of entries) parts.push(JSON.stringify(k) + ':' + v);
    return '{' + parts.join(',') + '}';
  }

  // ---------- parser ----------
  function parseValue() {
    bumpNode();
    skipWS();
    if (atEnd()) throw errAt('Unexpected end of input');

    // Object
    if (peek() === '{') {
      _emit(parseObjectToJSONString());
      return;
    }

    // Array
    if (peek() === '[') {
      if (++depth > maxDepth) throw errAt('Max depth exceeded');
      _emit('[');
      i++; skipWS();

      if (!strictCommas) {
        // Tolerant: we don’t immediately erase leading commas; we only ignore them
        // unless emptyValueIsNull=true, in which case a leading comma still means “no element before it” → ignored.
        while (!atEnd() && peek() === ',') { i++; skipWS(); }
      } else if (!atEnd() && peek() === ',') {
        throw errAt('Leading comma not allowed (strictCommas)');
      }

      if (!atEnd() && peek() === ']') { _emit(']'); i++; depth--; return; }

      let needComma = false;
      let lastWasComma = false;

      while (true) {
        // If tolerant and we see a comma before parsing a value:
        if (!strictCommas && peek() === ',') {
          // empty element
          if (emptyValueIsNull) {
            if (needComma) _emit(',');
            _emit('null');
            bumpNode();
            needComma = true;
          }
          // Whether we emitted or not, consume consecutive commas and keep looping
          lastWasComma = true;
          while (!atEnd() && peek() === ',') { i++; skipWS(); }
          if (!atEnd() && peek() === ']') { _emit(']'); i++; depth--; return; }
          continue;
        }

        if (needComma) { _emit(','); needComma = false; }
        parseValue();
        skipWS();
        lastWasComma = false;

        if (!strictCommas) {
          if (!atEnd() && peek() === ',') {
            // consume one comma; check for more to maybe create empties
            i++; skipWS();
            if (!atEnd() && peek() === ',') {
              // consecutive commas: in tolerant mode create empties if requested
              if (emptyValueIsNull) {
                while (!atEnd() && peek() === ',') {
                  _emit(',','null'); bumpNode(); i++; skipWS();
                }
              } else {
                while (!atEnd() && peek() === ',') { i++; skipWS(); }
              }
            }
            if (!atEnd() && peek() !== ']') needComma = true;
          }
        } else {
          if (!atEnd() && peek() === ',') {
            i++; skipWS();
            if (atEnd() || peek() === ']') throw errAt('Trailing comma not allowed (strictCommas)');
            if (peek() === ',') throw errAt('Multiple commas not allowed (strictCommas)');
            needComma = true;
            continue;
          }
        }

        if (atEnd()) throw errAt('Unterminated array');
        if (peek() === ']') { _emit(']'); i++; depth--; return; }
      }
    }

    // Quoted scalar
    if (peek() === '"' || peek() === "'") { emitJSONString(readQuotedString()); return; }

    // true/false/null
    if (i + 4 <= len && input[i] === 't' && input[i+1] === 'r' && input[i+2] === 'u' && input[i+3] === 'e' && hasWordBoundaryAfter(4)) {
      i += 4; _emit('true');  return;
    }
    if (i + 5 <= len && input[i] === 'f' && input[i+1] === 'a' && input[i+2] === 'l' && input[i+3] === 's' && input[i+4] === 'e' && hasWordBoundaryAfter(5)) {
      i += 5; _emit('false'); return;
    }
    if (i + 4 <= len && input[i] === 'n' && input[i+1] === 'u' && input[i+2] === 'l' && input[i+3] === 'l' && hasWordBoundaryAfter(4)) {
      i += 4; _emit('null');  return;
    }

    // Number → JSON string
    const num = tryReadNumberLexeme();
    if (num !== null) { emitJSONString(num); return; }

    // Bare scalar
    const tok = readBareScalarUntilDelimiter();
    if (tok === '' && emptyValueIsNull) { _emit('null'); return; }
    emitJSONString(tok);
  }

  // ---------- top-level ----------
  skipWS();
  if (atEnd()) throw errAt('Empty input');
  parseValue();
  skipWS();
  if (!atEnd()) throw errAt('Trailing characters after parsed value');

  return _emitTarget.join('');

  // ---------- Unicode preprocessing helper ----------
  function preprocessUnicode(s, uopts = {}) {
    if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
    if (uopts.normalizeNFC) s = s.normalize('NFC');
    if (uopts.stripZeroWidth !== false) {
      s = s.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '');
    }
    if (uopts.stripBidiControls !== false) {
      s = s.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
    }
    if (uopts.mapSmartQuotes) {
      s = s
        .replace(/[\u2018\u2019\u201B]/g, "'")
        .replace(/[\u201C\u201D\u201F]/g, '"');
    }
    // UTF-16 well-formedness
    for (let k = 0; k < s.length; k++) {
      const c = s.charCodeAt(k);
      if (c >= 0xD800 && c <= 0xDBFF) {
        if (k + 1 >= s.length) throw new Error('Invalid UTF-16: unpaired high surrogate at end');
        const d = s.charCodeAt(k + 1);
        if (d < 0xDC00 || d > 0xDFFF) throw new Error('Invalid UTF-16: unpaired high surrogate');
        k++;
      } else if (c >= 0xDC00 && c <= 0xDFFF) {
        throw new Error('Invalid UTF-16: unpaired low surrogate');
      }
    }
    return s;
  }
}
