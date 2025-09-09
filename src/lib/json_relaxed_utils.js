export { quoteKeysNumbersAndDatesForRelaxedJSON };

// --- Pre-computed lookup tables for maximum speed ---
const CHAR_TYPE = new Uint8Array(128);
const WS = 1, DIGIT = 2, JSON_SYNTAX = 4, QUOTE = 8, SLASH = 16, ALPHA = 32, UNDERSCORE = 64;

// Initialize character type lookup table
for (let i = 0; i < 128; i++) {
  let flags = 0;

  // Whitespace: space, tab, LF, CR
  if (i === 32 || i === 9 || i === 10 || i === 13) flags |= WS;

  // Digits: 0-9
  if (i >= 48 && i <= 57) flags |= DIGIT;

  // JSON syntax: { } [ ] : ,
  if (i === 123 || i === 125 || i === 91 || i === 93 || i === 58 || i === 44) flags |= JSON_SYNTAX;

  // Quotes: " '
  if (i === 34 || i === 39) flags |= QUOTE;

  // Slash: /
  if (i === 47) flags |= SLASH;

  // Letters and $ for identifiers
  if ((i >= 65 && i <= 90) || (i >= 97 && i <= 122) || i === 36) flags |= ALPHA;

  // Underscore
  if (i === 95) flags |= UNDERSCORE;

  CHAR_TYPE[i] = flags;
}

// Optimized date regex - compiled once
const DATE_REGEX = /^\d{4}(?:[-/.]\d{1,2}){2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:[Zz]|[+-]\d{2}:?\d{2})?)?$/;

// Pre-computed escape table for JSON string escaping
const ESCAPE_TABLE = new Array(128);
for (let i = 0; i < 128; i++) {
  if (i === 34) ESCAPE_TABLE[i] = '\\"';      // "
  else if (i === 92) ESCAPE_TABLE[i] = '\\\\'; // \
  else if (i === 8) ESCAPE_TABLE[i] = '\\b';   // backspace
  else if (i === 12) ESCAPE_TABLE[i] = '\\f';  // form feed
  else if (i === 10) ESCAPE_TABLE[i] = '\\n';  // newline
  else if (i === 13) ESCAPE_TABLE[i] = '\\r';  // carriage return
  else if (i === 9) ESCAPE_TABLE[i] = '\\t';   // tab
  else if (i < 32) ESCAPE_TABLE[i] = '\\u' + i.toString(16).padStart(4, '0');
  else ESCAPE_TABLE[i] = null;
}

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
 * @param {string} input - The relaxed/JSON5-like string
 * @returns {string} A strict JSON string, safe for JSON.parse()
 */
function quoteKeysNumbersAndDatesForRelaxedJSON(input) {
  const length = input.length;
  if (length === 0) return '';

  // Quick scan for digits - if none, skip numeric optimizations
  let hasDigits = false;
  for (let i = 0; i < length; i++) {
    const code = input.charCodeAt(i);
    if (code < 128 && (CHAR_TYPE[code] & DIGIT)) {
      hasDigits = true;
      break;
    }
  }

  let position = 0;
  let result = '';

  // Context tracking with bit operations for speed
  let contextStack = 0; // bit-stack; LSB=object flag
  let inObjectKey = false;

  // Fast character type check
  /** @param {number} code */
  const isWhitespace = (code) => code < 128 && (CHAR_TYPE[code] & WS);
  /** @param {number} code */
  const isDigit = (code) => code < 128 && (CHAR_TYPE[code] & DIGIT);
  /** @param {number} code */
  const isJsonSyntax = (code) => code < 128 && (CHAR_TYPE[code] & JSON_SYNTAX);
  /** @param {number} code */
  const isQuote = (code) => code < 128 && (CHAR_TYPE[code] & QUOTE);
  /** @param {number} code */
  const isAlpha = (code) => code < 128 && (CHAR_TYPE[code] & ALPHA);

  // Optimized string readers
  function readDoubleQuoted() {
    result += '"';
    position++;

    while (position < length) {
      const char = input[position++];
      result += char;

      if (char === '\\') {
        if (position < length) {
          result += input[position++];
        }
      } else if (char === '"') {
        break;
      }
    }
  }

  function readSingleQuoted() {
    position++; // skip opening '
    result += '"';

    while (position < length) {
      const char = input[position++];

      if (char === '\\') {
        if (position < length) {
          const next = input[position++];
          if (next === '"') {
            result += '\\"';
          } else if (next === "'") {
            result += "'";
          } else {
            result += '\\' + next;
          }
        }
      } else if (char === "'") {
        break;
      } else if (char === '"') {
        result += '\\"';
      } else {
        result += char;
      }
    }

    result += '"';
  }

  // Optimized comment skippers
  function skipLineComment() {
    position += 2;
    while (position < length && input[position] !== '\n') {
      position++;
    }
  }

  function skipBlockComment() {
    position += 2;
    while (position < length - 1) {
      if (input[position] === '*' && input[position + 1] === '/') {
        position += 2;
        return;
      }
      position++;
    }
  }

  // Fast whitespace and comment skipper
  function skipWhitespaceAndComments() {
    while (position < length) {
      const code = input.charCodeAt(position);

      // Skip whitespace
      if (isWhitespace(code)) {
        position++;
        continue;
      }

      // Skip comments
      if (input[position] === '/' && position + 1 < length) {
        const next = input[position + 1];
        if (next === '/') {
          skipLineComment();
          continue;
        }
        if (next === '*') {
          skipBlockComment();
          continue;
        }
      }

      break;
    }
  }

  // Optimized trailing comma handler
  function handleTrailingComma() {
    const savedPos = position;
    position++; // skip comma

    skipWhitespaceAndComments();

    if (position < length && (input[position] === '}' || input[position] === ']')) {
      return true; // trailing comma - skip it
    }

    // Not trailing - emit comma and continue
    result += ',';
    return false;
  }

  // Fast date detection (only when hasDigits is true)
  function tryReadDate() {
    if (inObjectKey || !hasDigits) return false;

    const start = position;

    // Quick check: need at least YYYY-MM-DD (10 chars)
    if (position + 9 >= length) return false;

    // Fast check for YYYY pattern
    const code1 = input.charCodeAt(position);
    const code2 = input.charCodeAt(position + 1);
    const code3 = input.charCodeAt(position + 2);
    const code4 = input.charCodeAt(position + 3);

    if (!(isDigit(code1) && isDigit(code2) && isDigit(code3) && isDigit(code4))) {
      return false;
    }

    const sep = input[position + 4];
    if (sep !== '-' && sep !== '.' && sep !== '/') {
      return false;
    }

    // Scan to end of potential date
    position += 5;
    while (position < length) {
      const char = input[position];
      const code = input.charCodeAt(position);

      if (isDigit(code) || char === '-' || char === '.' || char === '/' ||
        char === 'T' || char === ':' || char === 'Z' || char === 'z' || char === '+') {
        position++;
      } else {
        break;
      }
    }

    const dateStr = input.slice(start, position);

    // Quick length and regex check
    if (dateStr.length >= 8 && dateStr.length <= 35 && DATE_REGEX.test(dateStr)) {
      // Ensure not followed by identifier character
      if (position < length) {
        const nextCode = input.charCodeAt(position);
        if (isAlpha(nextCode) || nextCode === 95) { // 95 = underscore
          position = start;
          return false;
        }
      }

      result += '"' + dateStr + '"';
      return true;
    }

    position = start;
    return false;
  }

  // Optimized decimal number check
  /** @param {string} token */
  function isPureDecimal(token) {
    let idx = 0;
    const len = token.length;
    if (!len) return false;

    let char = token[0];

    // Handle optional sign
    if (char === '+' || char === '-') {
      if (len === 1) return false;
      idx = 1;
      char = token[1];
    }

    const firstCode = token.charCodeAt(idx);
    if (!(isDigit(firstCode) || char === '.')) return false;

    let foundDigit = false;
    let foundDot = false;
    let foundE = false;

    while (idx < len) {
      char = token[idx];
      const code = token.charCodeAt(idx);

      if (isDigit(code)) {
        foundDigit = true;
        idx++;
      } else if (char === '_') {
        idx++;
      } else if (char === '.' && !foundDot && !foundE) {
        foundDot = true;
        idx++;
      } else if ((char === 'e' || char === 'E') && !foundE && foundDigit) {
        foundE = true;
        idx++;

        // Handle optional exponent sign
        if (idx < len && (token[idx] === '+' || token[idx] === '-')) {
          idx++;
        }

        let expDigits = false;
        while (idx < len) {
          const expCode = token.charCodeAt(idx);
          if (isDigit(expCode)) {
            expDigits = true;
            idx++;
          } else if (token[idx] === '_') {
            idx++;
          } else {
            break;
          }
        }

        if (!expDigits) return false;
      } else {
        return false;
      }
    }

    return foundDigit;
  }

  // Fast bare token reader
  function readBareToken() {
    const start = position;

    while (position < length) {
      const code = input.charCodeAt(position);

      if (isWhitespace(code) || isJsonSyntax(code) || isQuote(code) || input[position] === '/') {
        break;
      }

      position++;
    }

    return position === start ? null : input.slice(start, position);
  }

  // Optimized JSON string escaping
  /** @param {string} str */
  function escapeJsonString(str) {
    let needsEscaping = false;

    // Fast scan for characters that need escaping
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 128 && ESCAPE_TABLE[code] !== null) {
        needsEscaping = true;
        break;
      }
    }

    if (!needsEscaping) {
      return '"' + str + '"';
    }

    let escaped = '"';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 128 && ESCAPE_TABLE[code] !== null) {
        escaped += ESCAPE_TABLE[code];
      } else {
        escaped += str[i];
      }
    }
    escaped += '"';

    return escaped;
  }

  // Main parsing loop
  while (position < length) {
    const char = input[position];
    const code = input.charCodeAt(position);

    // Whitespace - pass through
    if (isWhitespace(code)) {
      result += char;
      position++;
      continue;
    }

    // Comments - skip entirely
    if (char === '/' && position + 1 < length) {
      const next = input[position + 1];
      if (next === '/') {
        skipLineComment();
        continue;
      }
      if (next === '*') {
        skipBlockComment();
        continue;
      }
    }

    // JSON structure characters
    if (char === '{') {
      contextStack = (contextStack << 1) | 1;
      inObjectKey = true;
      result += char;
      position++;
      continue;
    }

    if (char === '[') {
      contextStack = contextStack << 1;
      inObjectKey = false;
      result += char;
      position++;
      continue;
    }

    if (char === ':') {
      inObjectKey = false;
      result += char;
      position++;
      continue;
    }

    if (char === ',') {
      if (handleTrailingComma()) continue;
      inObjectKey = (contextStack & 1) === 1;
      continue;
    }

    if (char === '}' || char === ']') {
      contextStack >>= 1;
      inObjectKey = (contextStack & 1) === 1;
      result += char;
      position++;
      continue;
    }

    // String literals
    if (char === '"') {
      readDoubleQuoted();
      continue;
    }

    if (char === "'") {
      readSingleQuoted();
      continue;
    }

    // Date detection (fast path when digits present)
    if (hasDigits && isDigit(code)) {
      if (tryReadDate()) continue;
    }

    // Bare tokens (identifiers, numbers, keywords)
    const token = readBareToken();
    if (token !== null) {
      if (inObjectKey) {
        // All unquoted keys must be quoted in strict JSON
        result += escapeJsonString(token);
        continue;
      }

      // Handle values
      if (hasDigits && isPureDecimal(token)) {
        // Convert numbers to quoted strings
        if (token.indexOf('_') === -1 && token[0] !== '+') {
          result += '"' + token + '"';
        } else {
          // Clean underscores and leading plus
          let cleaned = '';
          for (let i = 0; i < token.length; i++) {
            const ch = token[i];
            if (ch !== '_' && !(i === 0 && ch === '+')) {
              cleaned += ch;
            }
          }
          result += '"' + cleaned + '"';
        }
        continue;
      }

      // Preserve JSON literals
      if (token === 'true' || token === 'false' || token === 'null') {
        result += token;
        continue;
      }

      // Quote other bare words
      result += escapeJsonString(token);
      continue;
    }

    // Fallback - should be rare
    result += char;
    position++;
  }

  return result.trim();
}