export { quoteNumbersAndDatesForRelaxedJSON5 };

/**
 * Preprocess a JSON5-ish parameter string so that:
 *  - decimal numbers (including with underscores) in **value** positions become JSON strings
 *  - dates matching specified format become JSON strings
 *  - underscores inside numeric literals are removed
 *  - leading + signs are removed from quoted numbers
 *  - strings and comments are preserved verbatim
 *
 * Limitations (intentional for param blocks):
 *  - Only handles decimal floats/ints (no hex/binary/oct).
 *  - Keys are left untouched (JSON5 already requires quotes for numeric keys).
 *
 * @param {string} input
 * @returns {string} transformed text safe for JSON5.parse (numbers and dates arrive as strings)
 */
function quoteNumbersAndDatesForRelaxedJSON5(input) {
  let i = 0;
  const n = input.length;
  let out = '';
  let inObjectKey = false; // Track if we're in an object key position
  let braceStack = []; // Track nesting: 'object' or 'array'

  /** peek char code or -1 */
  const ch = (k = 0) => (i + k < n ? input[i + k] : '');
  /**
   * Gets the character code at a specific index in the input string, or -1 if the index is out of bounds.
   * @param {number} k The index to retrieve the character code from.
   * @returns {number} The character code at the given index, or -1.
   */
  const ccAt = (k) => (k < n ? input.charCodeAt(k) : -1);
  /**
   * Gets the character at a specific index in the input string, or an empty string if the index is out of bounds.
   * @param {number} k The index to retrieve the character from.
   * @returns {string} The character at the given index, or an empty string.
   */
  const chAt = (k) => (k < n ? input[k] : '');
  /**
   * Checks if a character code represents a decimal digit (0-9).
   * @param {number} c The character code to check.
   * @returns {boolean} True if the character code is a decimal digit, otherwise false.
   */
  const isDec = (c) => c >= 48 && c <= 57;

  /**
   * Check if a character is JSON5 syntax (punctuation that separates tokens)
   * @param {string} c
   */
  const isJsonSyntax = (c) => /[{}[\]:,]/.test(c);
  
  /**
   * Check if a character is whitespace
   * @param {string} c
   */
  const isWhitespace = (c) => /\s/.test(c);

  // Date regex for multiple date formats
  const dateRegex = /^\d{4}(?:[-/.]\d{1,2}){2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:[Zz]|[+-]\d{2}:?\d{2})?)?$/;

  /** Copy one char */
  const emit1 = () => { out += input[i++]; };

  /**
   * Read and copy a string literal verbatim (honors simple escapes).
   * @param {string} quote The quote character that started the string (e.g., `'` or `"`).
   */
  function readString(quote) {
    out += quote; i++;
    while (i < n) {
      const c = ch();
      out += c; i++;
      if (c === '\\') { if (i < n) { out += ch(); i++; } continue; }
      if (c === quote) break;
    }
  }

  /** Read and copy a line comment verbatim. */
  function readLineComment() {
    out += '/'; out += '/'; i += 2;
    while (i < n && ch() !== '\n') { out += ch(); i++; }
  }

  /** Read and copy a block comment verbatim. */
  function readBlockComment() {
    out += '/'; out += '*'; i += 2;
    while (i < n) {
      if (ch() === '*' && ch(1) === '/') { out += '*'; out += '/'; i += 2; break; }
      out += ch(); i++;
    }
  }

  /**
   * Try to read a date token starting at i (outside strings/comments).
   * If present, return its quoted string representation,
   * else return null and leave i unchanged.
   */
  function tryReadDateAsString() {
    // Don't quote dates in object key positions
    if (inObjectKey) return null;
    
    let j = i;
    
    // Look for potential date pattern: YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD with optional time
    if (!isDec(ccAt(j))) return null;
    
    // Read until we hit a non-date character
    while (j < n) {
      const c = chAt(j);
      if (isDec(ccAt(j)) || c === '-' || c === '.' || c === '/' || c === 'T' || c === ':' || c === 'Z' || c === 'z' || c === '+') {
        j++;
      } else {
        break;
      }
    }
    
    // Check if what we found matches the date regex
    const candidate = input.slice(i, j);
    if (dateRegex.test(candidate)) {
      // Ensure we're not eating identifier chars
      const tail = chAt(j);
      if (tail && /[A-Za-z$_]/.test(tail)) return null;
      
      i = j;
      return `"${candidate}"`;
    }
    
    return null;
  }

  /**
   * Read any general token (sequence of non-whitespace, non-JSON-syntax characters).
   * Check if it's a valid decimal number - if so, return it quoted.
   * If not, return it unchanged.
   */
  function readGeneralToken() {
    const start = i;
    
    // Read the entire token until we hit whitespace or JSON syntax
    while (i < n && !isWhitespace(ch()) && !isJsonSyntax(ch()) && ch() !== '"' && ch() !== "'" && ch() !== '/' && ch() !== '*') {
      i++;
    }
    
    const token = input.slice(start, i);
    if (!token) return null;
    
    // Don't quote tokens in object key positions
    if (inObjectKey) return token;
    
    // Check if this token is a pure decimal number
    if (isPureDecimalNumber(token)) {
      // Clean up the number and quote it
      let cleaned = token.replace(/_/g, '');
      // Remove leading + if present
      if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
      }
      return `"${cleaned}"`;
    }
    
    // Not a pure decimal number - return unchanged
    return token;
  }

  /**
   * Check if a token is a pure decimal number (optionally signed)
   * @param {string} token
   */
  function isPureDecimalNumber(token) {
    let j = 0;
    const len = token.length;
    
    // Optional sign
    if (j < len && (token[j] === '+' || token[j] === '-')) {
      j++;
    }
    
    // Must have digits or dot after sign
    if (j >= len || (!isDec(token.charCodeAt(j)) && token[j] !== '.')) {
      return false;
    }
    
    let sawDigit = false;
    let sawDot = false;
    let sawE = false;
    
    while (j < len) {
      const c = token[j];
      
      if (isDec(c.charCodeAt(0))) {
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
        // Handle optional +/- after e/E
        if (j < len && (token[j] === '+' || token[j] === '-')) {
          j++;
        }
      } else {
        // Invalid character for decimal number
        return false;
      }
    }
    
    // Must have seen at least one digit
    if (!sawDigit) return false;
    
    // If we found an E, validate the exponent has digits
    if (sawE) {
      // Find the E and check what follows
      const eIndex = token.toLowerCase().lastIndexOf('e');
      if (eIndex >= 0) {
        let expStart = eIndex + 1;
        if (expStart < len && (token[expStart] === '+' || token[expStart] === '-')) {
          expStart++;
        }
        
        let expHasDigits = false;
        while (expStart < len && (isDec(token.charCodeAt(expStart)) || token[expStart] === '_')) {
          if (isDec(token.charCodeAt(expStart))) expHasDigits = true;
          expStart++;
        }
        if (!expHasDigits) return false;
      }
    }
    
    return true;
  }

  while (i < n) {
    const c = ch();

    // Skip whitespace
    if (isWhitespace(c)) {
      emit1();
      continue;
    }

    // Track object/array nesting and key context
    if (c === '{') {
      braceStack.push('object');
      inObjectKey = true; // In objects, start expecting a key
      emit1();
      continue;
    }
    if (c === '[') {
      braceStack.push('array');
      inObjectKey = false; // In arrays, we're always in value context
      emit1();
      continue;
    }
    if (c === ':') {
      inObjectKey = false; // After colon, we're in value context
      emit1();
      continue;
    }
    if (c === ',') {
      // After comma, context depends on whether we're in object or array
      const currentContext = braceStack[braceStack.length - 1];
      inObjectKey = (currentContext === 'object'); // Keys in objects, values in arrays
      emit1();
      continue;
    }
    if (c === '}' || c === ']') {
      braceStack.pop();
      // After closing, context depends on parent context
      const parentContext = braceStack[braceStack.length - 1];
      inObjectKey = (parentContext === 'object');
      emit1();
      continue;
    }

    // Strings & comments
    if (c === '"' ) { readString('"'); continue; }
    if (c === "'") { readString("'"); continue; }
    if (c === '/' && ch(1) === '/') { readLineComment(); continue; }
    if (c === '/' && ch(1) === '*') { readBlockComment(); continue; }

    // Try date → quoted string (check dates before general tokens to avoid conflicts)
    const d = tryReadDateAsString();
    if (d !== null) { out += d; continue; }

    // Read any general token and process it
    const token = readGeneralToken();
    if (token !== null) { out += token; continue; }

    // Default: copy (shouldn't happen)
    emit1();
  }

  return out;
}