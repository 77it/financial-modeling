export { quoteKeysNumbersAndDatesForRelaxedJSON };
import { regExp_YYYYMMDDTHHMMSSMMMZ as DATE_RE } from './date_utils.js';
import { IS_DIGIT, isPureDecimalNumber } from './number_utils.js';

// --- Hoisted tables (small, hot-path friendly) ---
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

/**
 * Transform a relaxed / JSON5-like input string into strict JSON syntax.
 *
 * v4: correctness from v1 (value reader) + v3 perf (string concat, fast no-marker path).
 *
 * @param {string} input
 * @param {string} [unquotedStringsMarker='']
 * @param {boolean} [formulaAdvancedParsing=false]
 * @returns {string}
 */
function quoteKeysNumbersAndDatesForRelaxedJSON(input, unquotedStringsMarker = '', formulaAdvancedParsing = false) {
  if (typeof input !== 'string') return '';

  if (formulaAdvancedParsing) {
    input = wrapFunctionLikeValues(input, unquotedStringsMarker);
  }

  const n = input.length;
  if (n === 0) return '';

  const hasDigit = /\d/.test(input);
  const needsMarker = unquotedStringsMarker.length > 0;
  return parseRelaxedJSON(input, unquotedStringsMarker, hasDigit, needsMarker);
}

/**
 * Core parser used by both fast and marker paths (keeps hot helpers in closure)
 * @param {string} input
 * @param {string} marker
 * @param {boolean} hasDigit
 * @param {boolean} needsMarker
 */
function parseRelaxedJSON(input, marker, hasDigit, needsMarker) {
  const n = input.length;
  let i = 0;
  let out = '';
  let contextStack = 0; // bit-stack; LSB=object flag
  let depth = 0; // nesting depth to gate comma stopping
  let inObjectKey = false;

  // --- Helpers ---
  /** @param {string} s */
  function jsonEscape(s) {
    let needs = false;
    for (let k = 0; k < s.length; k++) {
      const ch = s.charCodeAt(k);
      if (ch === 0x22 || ch === 0x5c || ch < 0x20) { needs = true; break; }
    }
    if (!needs) return '"' + s + '"';

    let result = '"';
    for (let k = 0; k < s.length; k++) {
      const ch = s.charCodeAt(k);
      if (ch === 0x22) result += '\\"';
      else if (ch === 0x5c) result += '\\\\';
      else if (ch === 0x08) result += '\\b';
      else if (ch === 0x0c) result += '\\f';
      else if (ch === 0x0a) result += '\\n';
      else if (ch === 0x0d) result += '\\r';
      else if (ch === 0x09) result += '\\t';
      else if (ch < 0x20) result += '\\u' + ch.toString(16).padStart(4, '0');
      else result += String.fromCharCode(ch);
    }
    return result + '"';
  }

  function readDQ() {
    out += '"'; i++;
    while (i < n) {
      const c = input[i++];
      out += c;
      if (c === '\\') { if (i < n) { out += input[i++]; } continue; }
      if (c === '"') break;
    }
  }

  function readSQ() {
    i++; // skip opening '
    let buf = '"';
    while (i < n) {
      const c = input[i++];
      if (c === '\\') {
        if (i < n) {
          const next = input[i++];
          if (next === '"') { buf += '\\"'; }
          else if (next === "'") { buf += "\\'"; }
          else { buf += '\\' + next; }
        }
        continue;
      }
      if (c === "'") break;
      if (c === '"') buf += '\\"';
      else buf += c;
    }
    buf = buf.replace(/\\'/g, "'");
    out += buf + '"';
  }

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

  function maybeSkipTrailingComma() {
    i++; // skip comma
    const j = i;
    skipWsComments();
    const next = input[i];
    if (next === '}' || next === ']') return true;
    i = j;
    out += ',';
    return false;
  }

  function tryReadDate() {
    if (!hasDigit || inObjectKey) return false;
    const start = i;
    if (i + 6 >= n) return false;

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
        out += '"' + s + '"';
        return true;
      }
    }
    i = start;
    return false;
  }

  function readBareToken() {
    const start = i;
    while (i < n) {
      const c = input[i];
      const code = input.charCodeAt(i);
      if (code < 128 && (IS_WS[code] || IS_JSON_SYNTAX[code])) break;
      if (c === '"' || c === "'") break;
      if (c === '/' && i + 1 < n && (input[i + 1] === '/' || input[i + 1] === '*')) break;
      i++;
    }
    if (i === start) return null;
    return input.slice(start, i);
  }

  function readBareValueUntilBoundary() {
    const start = i;
    let localBrace = 0;
    let localBracket = 0;
    let localParen = 0;
    while (i < n) {
      const ch = input[i];
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
      if (ch === ',' && depth > 0 && localBrace === 0 && localBracket === 0 && localParen === 0) break;
      if (ch === '"' || ch === "'") break;
      if (ch === '/' && i + 1 < n && (input[i + 1] === '/' || input[i + 1] === '*')) break;
      i++;
    }
    if (i === start) return null;
    const value = input.slice(start, i).trimStart();
    return value.length === 0 ? null : value;
  }

  // --- Main loop ---
  while (i < n) {
    const c = input[i];
    const code = input.charCodeAt(i);

    if (code < 128 && IS_WS[code]) { out += c; i++; continue; }

    if (c === '/' && i + 1 < n) {
      const next = input[i + 1];
      if (next === '/') { skipLineComment(); continue; }
      if (next === '*') { skipBlockComment(); continue; }
    }

    if (c === '{') { contextStack = (contextStack << 1) | 1; depth++; inObjectKey = true; out += c; i++; continue; }
    if (c === '[') { contextStack = (contextStack << 1); depth++; inObjectKey = false; out += c; i++; continue; }
    if (c === ':') { inObjectKey = false; out += c; i++; continue; }
    if (c === ',') {
      if (maybeSkipTrailingComma()) continue;
      inObjectKey = (contextStack & 1) === 1;
      continue;
    }
    if (c === '}' || c === ']') { contextStack >>= 1; depth--; inObjectKey = (contextStack & 1) === 1; out += c; i++; continue; }

    if (c === '"') { readDQ(); continue; }
    if (c === "'") { readSQ(); continue; }

    if (code < 128 && IS_DIGIT[code]) {
      if (tryReadDate()) continue;
    }

    if (inObjectKey) {
      const token = readBareToken();
      if (token != null) {
        out += jsonEscape(token);
        continue;
      }
    } else {
      const token = readBareValueUntilBoundary();
      if (token == null) {
        out += c; i++;
        continue;
      }

      const tokenTrimmed = token.trimEnd();
      const trailingWS = token.length > tokenTrimmed.length ? token.slice(tokenTrimmed.length) : '';

      if (hasDigit && isPureDecimalNumber(tokenTrimmed)) {
        if (tokenTrimmed.indexOf('_') === -1 && tokenTrimmed.charCodeAt(0) !== 43 /* '+' */) {
          out += '"' + tokenTrimmed + '"' + trailingWS;
        } else {
          let cleaned = '';
          for (let k = 0; k < tokenTrimmed.length; k++) {
            const ch = tokenTrimmed[k];
            if (ch === '_' || (k === 0 && ch === '+')) continue;
            cleaned += ch;
          }
          out += '"' + cleaned + '"' + trailingWS;
        }
        continue;
      }

      if (DATE_RE.test(tokenTrimmed)) {
        out += jsonEscape(tokenTrimmed) + trailingWS;
        continue;
      }

      if (tokenTrimmed === 'true' || tokenTrimmed === 'false' || tokenTrimmed === 'null') {
        out += tokenTrimmed + trailingWS;
        continue;
      }

      if (needsMarker) {
        out += jsonEscape(marker + tokenTrimmed) + trailingWS;
      } else {
        out += jsonEscape(tokenTrimmed) + trailingWS;
      }
      continue;
    }

    out += c; i++;
  }

  return out.trim();
}

/**
 * EXPENSIVE FORMULA PARSING - Only called when formulaAdvancedParsing=true
 * Wraps function-like values: identifier(...) into marked strings
 * @param {string} input
 * @param {string} marker
 * @returns {string}
 */
function wrapFunctionLikeValues(input, marker = '') {
  const n = input.length;
  let i = 0;
  let out = '';
  let inString = false;
  let quote = null;
  let escape = false;
  const ctx = [];
  let expectingValue = false;
  let expectingKey = false;

  /** @param {string} segment */
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

      if (code < 128 && IS_ALPHA[code]) {
        let k = j + 1;
        while (k < len) {
          const kcode = segment.charCodeAt(k);
          if (kcode >= 128 || !IS_ALPHANUM[kcode]) break;
          k++;
        }
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

    if (code < 128 && IS_WS[code]) {
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
