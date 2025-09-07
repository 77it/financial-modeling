export { parseRelaxedJSON };

import { deepFreeze } from '../obj_utils.js'

/**
 * @typedef {object} RJXOptions
 * @property {number} [maxBytes=16384]      Max input size guard
 * @property {number} [maxDepth=16]         Max nesting depth
 * @property {(key:string)=>boolean} [keyAllowed] Key guard (prototype pollution)
 */

/**
 * Parse relaxed JSON-like params (“RJX”) safely:
 *  - comments allowed
 *  - single quotes allowed
 *  - unquoted identifier keys in objects
 *  - trailing commas ignored
 *  - numbers in value position -> **JSON strings** (underscores removed)
 *  - forbids NaN/Infinity and dangerous keys
 *
 * Return the parsed value **and** a canonical JSON for caching/signing.
 *
 * @param {string} input
 * @param {RJXOptions} [opts]
 * @returns {{ value: unknown, canonicalJSON: string }}
 */
function parseRelaxedJSON(input, opts = {}) {
  const {
    maxBytes = 16_384,
    maxDepth = 16,
    keyAllowed = defaultKeyAllowed,
  } = opts;

  if (typeof input !== 'string') throw new TypeError('params must be a string');
  if (byteLength(input) > maxBytes) throw new Error(`params too large (> ${maxBytes} bytes)`);

  const strictJSON = relaxedJSONToStrictJSON(input, { maxDepth, keyAllowed });
  // Fast, native parse (no precision loss, all numbers were quoted)
  const value = JSON.parse(strictJSON);
  const canonicalJSON = canonicalStringify(value);
  return { value: deepFreeze(value), canonicalJSON };
}

/**
 * Return UTF-8 byte length of a string
 * @param {string} s
 * @returns {number}
 */
function byteLength(s) {
  return new TextEncoder().encode(s).length;
}

/** @param {string} k */
function defaultKeyAllowed(k) {
  return !(k === '__proto__' || k === 'constructor' || k === 'prototype');
}

/**
 * Convert relaxed JSON text to strict JSON text.
 * Single pass with basic state; keeps strings verbatim (normalized to double-quoted),
 * strips comments, quotes identifier keys, removes trailing commas, and
 * quotes numeric literals in value positions.
 *
 * @param {string} input
 * @param {{maxDepth:number, keyAllowed:(k:string)=>boolean}} cfg
 */
function relaxedJSONToStrictJSON(input, cfg) {
  let i = 0, n = input.length;
  let out = '';
  /** Stack of container types: '{' or '[' */
  /** @type {('{'|'[')[]} */ const stack = [];
  /** Are we expecting a key (inside object) or a value? */
  /** @type {('key'|'colon'|'value'|'comma_or_end')[]} */ const mode = [];

  const pushObj = () => { stack.push('{'); mode.push('key'); };
  const pushArr = () => { stack.push('['); mode.push('value'); };
  const pop = () => { stack.pop(); mode.pop(); };

  /**
   * Check if a character code is ASCII whitespace (SP, TAB, LF, CR)
   * @param {number} c - Character code
   * @returns {boolean}
   */
  const isWS = (c) => c === 32 || c === 9 || c === 10 || c === 13; // SP,TAB,LF,CR
  /**
   * @param {number} c - Character code
   * @returns {boolean}
   */
  const isIdentStart = (c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95 || c === 36; // A-Z a-z _ $
  /**
   * @param {number} c - Character code
   * @returns {boolean}
   */
  const isIdentPart  = (c) => isIdentStart(c) || (c >= 48 && c <= 57); // + 0-9
  const peek = (k=0) => (i+k < n ? input[i+k] : '');
  const code = (k=0) => (i+k < n ? input.charCodeAt(i+k) : -1);
  /**
   * @param {string} s
   */
  const emit = (s) => { out += s; };

  const expectDepth = () => {
    if (stack.length > cfg.maxDepth) throw new Error(`params too deep (> ${cfg.maxDepth})`);
  };

  /** Skip whitespace and comments, emit nothing */
  function skipWSAndComments() {
    for (;;) {
      // whitespace
      while (isWS(code())) i++;
      // // line comment
      if (peek() === '/' && peek(1) === '/') {
        i += 2; while (i < n && peek() !== '\n') i++;
        continue;
      }
      // /* block comment */
      if (peek() === '/' && peek(1) === '*') {
        i += 2;
        while (i < n && !(peek() === '*' && peek(1) === '/')) i++;
        if (i < n) i += 2;
        continue;
      }
      break;
    }
  }

  /** Read a string (single or double quoted) and re-emit as **double-quoted JSON** */
  function readString() {
    const quote = peek(); // ' or "
    i++;
    let s = '"';
    while (i < n) {
      const c = peek();
      if (c === '\\') {
        s += '\\'; i++;
        if (i < n) { s += escapeForJSON(peek()); i++; }
        continue;
      }
      if (c === quote) { i++; break; }
      // Escape double quote and backslash; preserve others verbatim
      if (c === '"') { s += '\\"'; i++; continue; }
      if (c === '\n' || c === '\r') throw new Error('Unterminated string');
      s += c; i++;
    }
    s += '"';
    emit(s);
  }

  /**
   * Escape a single escaped char for JSON string context
   * @param {string} c The character to be escaped.
   * @returns {string} The escaped character string.
   */
  function escapeForJSON(c) {
    // Map common escapes; everything else is copied as-is (JSON will accept \c)
    const map = { '"':'"', '\\':'\\', '/':'/', b:'b', f:'f', n:'n', r:'r', t:'t' };
    // @ts-ignore - we guard keys by map
    return map[c] || c;
  }

  /** Read identifier and emit as a quoted JSON key */
  function readIdentAsKey() {
    const s0 = i;
    i++; // first char already checked
    while (i < n && isIdentPart(code())) i++;
    const key = input.slice(s0, i);
    if (!cfg.keyAllowed(key)) throw new Error(`Illegal key: ${key}`);
    emit(JSON.stringify(key));
  }

  function readIdentAsValue() {
    const s0 = i;
    i++; // first char already checked
    while (i < n && isIdentPart(code())) i++;
    const val = input.slice(s0, i);
    emit(JSON.stringify(val));
  }

  /**
   * Try to read a number literal (underscores allowed) and emit it as a **quoted** cleaned string.
   * Returns true on success, false otherwise. No NaN/Infinity support.
   * @returns {boolean}
   */
  function tryReadNumberAsString() {
    const start = i;
    let j = i;

    // Small helpers that read using absolute index 'j'
    const ch = (k = j) => (k < n ? input[k] : '');
    /**
     * @param {string} c The character to check.
     * @returns {boolean} True if the character is a decimal digit, otherwise false.
     */
    const isDec = c => c >= '0' && c <= '9';
    /**
     * @param {string} c The character to check.
     * @returns {boolean} True if the character is a hexadecimal digit, otherwise false.
     */
    const isHex = c => (c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f');

    // optional sign
    if (ch() === '+' || ch() === '-') j++;

    // hex? 0x...
    if (ch() === '0' && (ch(j + 1) === 'x' || ch(j + 1) === 'X')) {
      j += 2;
      let saw = false;
      while (j < n && (isHex(ch()) || ch() === '_')) { if (ch() !== '_') saw = true; j++; }
      if (!saw) return false;
      // forbid identifier tail
      if (/[A-Za-z$]/.test(ch())) return false;
      emit(JSON.stringify(input.slice(start, j).replace(/_/g, '')));
      i = j;
      return true;
    }

    // decimal, fraction, exponent with underscores
    let sawDigit = false;
    while (isDec(ch()) || ch() === '_') { if (ch() !== '_') sawDigit = true; j++; }

    if (ch() === '.') {
      j++;
      while (isDec(ch()) || ch() === '_') { if (ch() !== '_') sawDigit = true; j++; }
    }

    if (ch() === 'e' || ch() === 'E') {
      let k = j + 1;
      if (ch(k) === '+' || ch(k) === '-') k++;
      let sawExp = false;
      while (isDec(ch(k)) || ch(k) === '_') { if (ch(k) !== '_') sawExp = true; k++; }
      if (!sawExp) return false;
      j = k;
    }

    if (!sawDigit) return false;
    // Disallow identifier tail (e.g., "123abc")
    if (/[A-Za-z$]/.test(ch())) return false;

    emit(JSON.stringify(input.slice(start, j).replace(/_/g, '')));
    i = j;
    return true;
  }


  // Main
  skipWSAndComments();
  if (i >= n) throw new Error('Empty params');

  // Top-level can be { [ or a scalar
  if (peek() === '{') { emit('{'); i++; pushObj(); expectDepth(); }
  else if (peek() === '[') { emit('['); i++; pushArr(); expectDepth(); }
  else {
    // scalar: read string or number as string
    if (peek() === '"' || peek() === "'") { readString(); }
    else if (!tryReadNumberAsString()) { throw new Error('Top-level must be object, array, or quoted string/number'); }
    skipWSAndComments();
    if (i !== n) throw new Error('Trailing characters after top-level value');
    return out;
  }

  while (i < n) {
    skipWSAndComments();
    const m = mode[mode.length - 1];
    if (!m) break;

    if (stack[stack.length - 1] === '{') {
      if (m === 'key') {
        // Check for empty object or trailing comma before closing
        if (peek() === '}') { emit('}'); i++; pop(); continue; }
        // key: identifier or string
        if (peek() === '"' || peek() === "'") { readString(); }
        else if (isIdentStart(code())) { readIdentAsKey(); }
        else throw new Error('Expected key');
        mode[mode.length - 1] = 'colon';
        continue;
      }
      if (m === 'colon') {
        skipWSAndComments();
        if (peek() !== ':') throw new Error('Expected ":" after key');
        emit(':'); i++;
        mode[mode.length - 1] = 'value';
        continue;
      }
      if (m === 'value') {
        skipWSAndComments();
        if (peek() === '{') { emit('{'); i++; pushObj(); expectDepth(); continue; }
        if (peek() === '[') { emit('['); i++; pushArr(); expectDepth(); continue; }
        if (peek() === '"' || peek() === "'") { readString(); }
        else if (isIdentStart(code())) { readIdentAsValue(); }
        else if (!tryReadNumberAsString()) { throw new Error('Expected value'); }
        mode[mode.length - 1] = 'comma_or_end';
        continue;
      }
      if (m === 'comma_or_end') {
        skipWSAndComments();
        if (peek() === ',') { 
          emit(','); 
          i++; 
          mode[mode.length - 1] = 'key'; 
          // Skip any trailing comma by checking what comes after whitespace/comments
          skipWSAndComments();
          if (peek() === '}') {
            // This was a trailing comma, don't emit it
            out = out.slice(0, -1); // Remove the comma we just added
          }
          continue; 
        }
        if (peek() === '}') { emit('}'); i++; pop(); continue; }
        if (peek()) throw new Error('Expected "," or "}"');
        break;
      }
    } else {
      // array
      if (m === 'value') {
        skipWSAndComments();
        if (peek() === ']') { emit(']'); i++; pop(); continue; }
        if (peek() === '{') { emit('{'); i++; pushObj(); expectDepth(); continue; }
        if (peek() === '[') { emit('['); i++; pushArr(); expectDepth(); continue; }
        if (peek() === '"' || peek() === "'") { readString(); }
        else if (isIdentStart(code())) { readIdentAsValue(); }
        else if (!tryReadNumberAsString()) { throw new Error('Expected value'); }
        mode[mode.length - 1] = 'comma_or_end';
        continue;
      }
      if (m === 'comma_or_end') {
        skipWSAndComments();
        if (peek() === ',') { 
          emit(','); 
          i++; 
          mode[mode.length - 1] = 'value'; 
          // Skip any trailing comma by checking what comes after whitespace/comments
          skipWSAndComments();
          if (peek() === ']') {
            // This was a trailing comma, don't emit it
            out = out.slice(0, -1); // Remove the comma we just added
          }
          continue; 
        }
        if (peek() === ']') { emit(']'); i++; pop(); continue; }
        if (peek()) throw new Error('Expected "," or "]"');
        break;
      }
    }
  }

  skipWSAndComments();
  if (i !== n) throw new Error('Trailing characters after structure end');
  return out;
}

/**
 * Deterministic stringify with sorted keys for caching/signing
 * @param {any} v The value to serialize. It can be a primitive, array, or object.
 * @returns {string} The canonical JSON string representation of the value.
 * @throws {Error} Throws an error if the value is not a stringifiable type (e.g., Symbol, undefined, or functions).
 */
function canonicalStringify(v) {
  if (v === null) return 'null';
  const t = typeof v;
  if (t === 'string') return JSON.stringify(v);
  if (t === 'number') return Number.isFinite(v) ? String(v) : 'null';
  if (t === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return `[${v.map(canonicalStringify).join(',')}]`;
  if (t === 'object') {
    const o = /** @type {Record<string, unknown>} */ (v);
    const keys = Object.keys(o).sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${canonicalStringify(o[k])}`).join(',')}}`;
  }
  throw new Error('Unstringifiable');
}
