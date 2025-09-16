//@ts-nocheck

// based on v4, speed edits and parsing of dates all as numbers instead of sometimes as strings

// Optimized version of the formula parser with significant performance improvements
// Key optimizations:
// 1. Pre-compiled regex patterns and lookup tables
// 2. Single-pass tokenization with lookahead
// 3. Reduced object allocations
// 4. Optimized evaluation with cached operations
// 5. Streamlined YAML processing

import { customParseYAML as parseYAML } from '../../src/lib/unused/yaml.js';

var exports = {};

// Pre-compiled patterns and lookup tables for performance
const internals = {
  operators: ['!', '^', '*', '/', '%', '+', '-', '<', '<=', '>', '>=', '==', '!=', '&&', '||', '??'],
  operatorChars: new Set(['!', '^', '*', '/', '%', '+', '-', '<', '=', '>', '&', '|', '?']),
  operatorsOrder: [['^'], ['*', '/', '%'], ['+', '-'], ['<', '<=', '>', '>='], ['==', '!='], ['&&'], ['||', '??']],
  operatorsPrefix: new Set(['!', 'n', 'p']),
  literals: new Map([['"', '"'], ['`', '`'], ["'", "'"], ['[', ']']]),

  // Pre-compiled regex patterns
  // allow "1", "1.23", "1.", ".5" — but NOT "."
  numberRx: /^(?:\d+(?:\.\d+)?|\.\d+)$/,
  tokenRx: /^[\w\$\#\.\@\:\{\}]+$/,
  dateLikeRx: /^\d{4}([-\/.])\d{1,2}\1\d{1,2}([ T]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+\-]\d{2}:\d{2})?)?$/,
  formulaLikeRx: /[!\^\*\/%\+\-<>=&\|\?\(\)]|\w\s*\(/,

  // Operator lookup maps for O(1) access
  operatorMap: new Map(),
  twoCharOps: new Map([
    ['<=', '<='], ['>=', '>='], ['==', '=='], ['!=', '!='],
    ['&&', '&&'], ['||', '||'], ['??', '??']
  ]),

  symbol: Symbol('formula'),
  settings: Symbol('settings')
};

// Initialize operator lookup map
internals.operators.forEach(op => internals.operatorMap.set(op, true));

// Optimized helper functions
const isPlainObject = (v) =>
  v !== null && typeof v === 'object' &&
  (v.constructor === Object || Object.getPrototypeOf(v) === Object.prototype);

const isDateLikeString = (s) =>
  typeof s === 'string' && internals.dateLikeRx.test(s);

const isLikelyFormula = (s) =>
  typeof s === 'string' && !isDateLikeString(s) && internals.formulaLikeRx.test(s);

// Fixed date parsing function
const parseDate = (dateStr) => {
  // Handle different date formats: YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  const match = dateStr.match(/^(\d{4})([-\/\.])(\d{1,2})\2(\d{1,2})([ T](\d{2}):(\d{2})(:(\d{2})(\.\d{1,6})?)?(Z|[+\-]\d{2}:\d{2})?)?$/);
  if (!match) return dateStr; // Return as string if not a valid date format

  const [, year, , month, day, , hour, minute, , second, millisecond] = match;

  // JavaScript Date constructor expects 0-indexed months
  const jsMonth = parseInt(month, 10) - 1;
  const jsYear = parseInt(year, 10);
  const jsDay = parseInt(day, 10);
  const jsHour = hour ? parseInt(hour, 10) : 0;
  const jsMinute = minute ? parseInt(minute, 10) : 0;
  const jsSecond = second ? parseInt(second, 10) : 0;
  const jsMillisecond = millisecond ? Math.floor(parseFloat('0' + millisecond) * 1000) : 0;

  // Create date in local time to match test expectations
  return new Date(jsYear, jsMonth, jsDay, jsHour, jsMinute, jsSecond, jsMillisecond);
};

// Optimized bracket/brace scanners with reduced string operations
function scanBracket (str, start) {
  const len = str.length;
  let depth = 1, quote = 0, hasComma = false, hasNested = false;
  let i = start + 1;
  const startIdx = i;

  for (; i < len; i++) {
    const ch = str.charCodeAt(i);

    if (quote) {
      if (ch === quote) quote = 0;
      continue;
    }

    // Check for quotes (34=", 39=', 96=`)
    if (ch === 34 || ch === 39 || ch === 96) {
      quote = ch;
      continue;
    }

    if (ch === 91) { // '['
      depth++;
      hasNested = true;
    } else if (ch === 123) { // '{'
      hasNested = true;
    } else if (ch === 93) { // ']'
      depth--;
      if (depth === 0) {
        return {
          end: i,
          content: str.slice(startIdx, i),
          isYamlArray: hasComma || hasNested
        };
      }
    } else if (ch === 44) { // ','
      hasComma = true;
    }
  }
  throw new Error('Formula missing closing bracket');
}

function scanBrace (str, start) {
  const len = str.length;
  let depth = 1, quote = 0;
  let i = start + 1;
  const startIdx = i;

  for (; i < len; i++) {
    const ch = str.charCodeAt(i);

    if (quote) {
      if (ch === quote) quote = 0;
      continue;
    }

    if (ch === 34 || ch === 39 || ch === 96) { // quotes
      quote = ch;
    } else if (ch === 123) { // '{'
      depth++;
    } else if (ch === 125) { // '}'
      depth--;
      if (depth === 0) {
        return { end: i, content: str.slice(startIdx, i) };
      }
    }
  }
  throw new Error('Formula missing closing brace');
}

/**
 * Parser
 * @class
 */
exports.Parser = class {
  constructor (string, options = {}) {
    if (!options[internals.settings] && options.constants) {
      for (const k in options.constants) {
        const v = options.constants[k];
        if (v !== null && !['boolean', 'number', 'string'].includes(typeof v)) {
          throw new Error(`Formula constant ${k} contains invalid ${typeof v} value type`);
        }
      }
    }

    this.settings = options[internals.settings] ? options : {
      [internals.settings]: true,
      constants: options.constants || {},
      functions: options.functions || {},
      ...options
    };

    this.single = null;
    this._parts = null;

    // NEW: reuse a scratch array to avoid per-call allocations in evaluate()
    /** @private */
    this._work = [];

    this._parse(string);
  }

  _parse (string) {
    let parts = [];
    let current = '';
    let parenthesis = 0;
    let literal = false;

    const flush = (inner) => {
      if (parenthesis && inner !== ')') return;
      const last = parts.length ? parts[parts.length - 1] : null;
      if (!literal && !current && !inner) return;

      if (last && last.type === 'reference' && inner === ')') {
        last.type = 'function';
        last.value = this._subFormula(current, last.value);
        current = '';
        return;
      }

      if (inner === ')') {
        const sub = new exports.Parser(current, this.settings);
        parts.push({ type: 'segment', value: sub });
      } else if (literal) {
        if (literal === ']') { // legacy bracketed reference
          parts.push({ type: 'reference', value: current });
          current = '';
          return;
        }
        parts.push({ type: 'literal', value: current });
      } else if (internals.operatorChars.has(current)) {
        if (last && last.type === 'operator' && internals.operatorMap.has(last.value + current)) {
          last.value += current;
        } else {
          parts.push({ type: 'operator', value: current });
        }
      } else if (internals.numberRx.test(current)) {
        parts.push({ type: 'constant', value: parseFloat(current) });
      } else if (this.settings.constants && this.settings.constants[current] !== undefined) {
        parts.push({ type: 'constant', value: this.settings.constants[current] });
      } else {
        if (!internals.tokenRx.test(current)) {
          throw new Error(`Formula contains invalid token: ${current}`);
        }
        parts.push({ type: 'reference', value: current });
      }
      current = '';
    };

    for (let i = 0; i < string.length; ++i) {
      const c = string[i];

      if (literal) {
        if (c === literal) {
          flush();
          literal = false;
        } else current += c;
        continue;
      }

      if (parenthesis) {
        if (c === '(') {
          current += c;
          ++parenthesis;
        } else if (c === ')') {
          --parenthesis;
          if (!parenthesis) flush(c);
          else current += c;
        } else current += c;
        continue;
      }

      // YAML / legacy-bracket handling with tiny look-ahead
      if (c === '[') {
        const { end, content, isYamlArray } = scanBracket(string, i);
        flush();
        if (isYamlArray) {
          parts.push({ type: 'yaml', value: this._yamlFormula('[' + content + ']') });
        } else {
          parts.push({ type: 'reference', value: content });
        }
        i = end;
        continue;
      }

      if (c === '{') {
        const { end, content } = scanBrace(string, i);
        flush();
        parts.push({ type: 'yaml', value: this._yamlFormula('{' + content + '}') });
        i = end;
        continue;
      }

      if (internals.literals.has(c)) {
        literal = internals.literals.get(c);
        continue;
      }
      if (c === '(') {
        flush();
        ++parenthesis;
        continue;
      }
      if (internals.operatorChars.has(c)) {
        flush();
        current = c;
        flush();
        continue;
      }

      if (c !== ' ') current += c;
      else flush();
    }
    flush();

    // Check for missing closing parenthesis
    if (parenthesis > 0) {
      throw new Error('Formula missing closing parenthesis');
    }

    // normalize unary operators
    parts = parts.map((part, i) => {
      if (part.type === 'operator' && (!i || parts[i - 1].type === 'operator')) {
        if (part.value === '-') return { type: 'operator', value: 'n' }; // unary minus
        if (part.value === '+') return { type: 'operator', value: 'p' }; // unary plus
      }
      return part;
    });

    // order validation
    let operator = false;
    for (const part of parts) {
      if (part.type === 'operator') {
        if (internals.operatorsPrefix.has(part.value)) continue;
        if (!operator) throw new Error('Formula contains an operator in invalid position');
        if (!internals.operatorMap.has(part.value)) throw new Error(`Formula contains an unknown operator ${part.value}`);
      } else if (operator) {
        throw new Error('Formula missing expected operator');
      }
      operator = !operator;
    }
    if (!operator) throw new Error('Formula contains invalid trailing operator');

    if (parts.length === 1 && ['reference', 'literal', 'constant', 'yaml'].includes(parts[0].type)) {
      // Keep the original reference name for tests; resolve during evaluate()
      this.single = (parts[0].type === 'reference')
        ? { type: 'reference', value: parts[0].value }
        : { type: 'value', value: parts[0].value };
    }

    this._parts = parts.map((part) => {
      if (part.type === 'operator') return internals.operatorsPrefix.has(part.value) ? part : part.value;
      if (part.type !== 'reference') return part.value; // literal/constant/segment/yaml passthrough
      if (this.settings.tokenRx && !this.settings.tokenRx.test(part.value)) {
        throw new Error(`Formula contains invalid reference ${part.value}`);
      }
      return this.settings.reference ? this.settings.reference(part.value) : internals.reference(part.value);
    });
  }

  _subFormula (string, name) {
    const method = this.settings.functions[name];
    if (typeof method !== 'function') throw new Error(`Formula contains unknown function ${name}`);

    let args = [];
    if (string) {
      let current = '', parenthesis = 0, literal = false, brace = 0, bracket = 0;
      const flush = () => {
        if (!current) throw new Error(`Formula contains function ${name} with invalid arguments ${string}`);
        args.push(current);
        current = '';
      };

      for (let i = 0; i < string.length; ++i) {
        const c = string[i];
        if (literal) {
          current += c;
          if (c === literal) literal = false;
          continue;
        }
        if (!brace && !bracket && internals.literals.has(c) && !parenthesis) {
          current += c;
          literal = internals.literals.get(c);
          continue;
        }
        if (!brace && !bracket && c === ',' && !parenthesis) {
          flush();
          continue;
        }

        current += c;
        if (c === '(') ++parenthesis;
        else if (c === ')') --parenthesis;
        else if (c === '{') ++brace;
        else if (c === '}') --brace;
        else if (c === '[') ++bracket;
        else if (c === ']') --bracket;
      }
      flush();
    }

    // NOTE: Parsers are created ONCE here and reused every evaluation via closure.
    args = args.map(arg => new exports.Parser(arg.trim(), this.settings));
    return function (context) {
      const inner = new Array(args.length);
      for (let i = 0; i < args.length; i++) inner[i] = args[i].evaluate(context);
      return method.call(context, ...inner);
    };
  }

  _yamlFormula (text) {
    let parsed;
    try {
      parsed = parseYAML(text);
    } catch (err) {
      throw new Error(`Invalid YAML segment: ${err.message}`);
    }

    // Optimized recursive walker with reduced allocations and proper date parsing
    const walkValue = (value, context) => {
      if (value == null) return value;

      const valueType = typeof value;
      if (valueType === 'string') {
        // Check if it's a date-like string first
        if (isDateLikeString(value)) {
          const parsed = parseDate(value);
          return parsed;
        }
        // Check if it's a formula and evaluate it
        if (isLikelyFormula(value)) {
          return this._evaluateStringFormula(value, context);
        }
        // Check if it's a valid identifier that could be a variable reference
        // Only treat as variable if it looks like an identifier (no spaces, starts with letter/underscore)
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
          // Treat as variable reference - return null if not found in context
          return context && context[value] !== undefined ? context[value] : null;
        }
        return value;
      }

      if (Array.isArray(value)) {
        const result = new Array(value.length);
        for (let i = 0; i < value.length; i++) {
          result[i] = walkValue(value[i], context);
        }
        return result;
      }

      if (isPlainObject(value)) {
        const result = {};
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            result[key] = walkValue(value[key], context);
          }
        }
        return result;
      }

      return value;
    };

    return (context) => walkValue(parsed, context);
  }

  _evaluateStringFormula (str, context) {
    try {
      const parser = new exports.Parser(str, this.settings);
      return parser.evaluate(context);
    } catch {
      return str; // Return as string if parsing fails
    }
  }

  evaluate (context) {
    if (this.single) {
      if (this.single.type === 'reference') {
        // Resolve reference name -> getter, then get the value from context
        const getter = this.settings.reference
          ? this.settings.reference(this.single.value)
          : internals.reference(this.single.value);
        const out = getter(context);
        return typeof out === 'function' ? out(context) : out;
      }
      // literal / constant / yaml
      const value = this.single.value;
      return typeof value === 'function' ? value(context) : value;
    }

    // ====== SPEED CHANGE: reuse a scratch array instead of slice() per call ======
    const src = this._parts;
    const parts = this._work;
    let len = src.length;
    parts.length = len;
    for (let i = 0; i < len; i++) parts[i] = src[i];

    // Process prefix operators (right to left)
    for (let i = parts.length - 2; i >= 0; i--) {
      const part = parts[i];
      if (part && part.type === 'operator') {
        const operand = internals.evaluate(parts[i + 1], context);
        parts.splice(i + 1, 1);
        parts[i] = internals.single(part.value, operand);
      }
    }

    // Process binary operators by precedence
    for (const operatorGroup of internals.operatorsOrder) {
      for (let i = 1; i < parts.length - 1;) {
        if (operatorGroup.includes(parts[i])) {
          const operator = parts[i];
          const left = internals.evaluate(parts[i - 1], context);
          const right = internals.evaluate(parts[i + 1], context);
          const result = internals.calculate(operator, left, right);

          parts.splice(i - 1, 3, result === 0 ? 0 : result);
        } else {
          i += 2;
        }
      }
    }

    const result = internals.evaluate(parts[0], context);

    // If the result is a function (like YAML), evaluate it immediately
    return typeof result === 'function' ? result(context) : result;
  }
};

exports.Parser.prototype[internals.symbol] = true;

// Optimized internal functions with reduced overhead
internals.reference = (name) => (context) => {
  if (context && context[name] !== undefined) {
    return context[name];
  }
  return null;
};

internals.evaluate = (part, context) => {
  // tiny fast-paths
  if (part == null) return null;
  if (typeof part === 'function') {
    const result = part(context);
    return (typeof result === 'function') ? result(context) : result;
  }
  // parser instance
  if (part && part[internals.symbol] === true) return part.evaluate(context);
  return part;
};

internals.single = (operator, value) => {
  if (operator === '!') return !value;
  if (operator === 'n') { // unary minus
    const negative = -value;
    return negative === 0 ? 0 : negative;
  }
  if (operator === 'p') { // unary plus
    return +value;
  }
  return value; // Should not happen with current operators
};

internals.calculate = (operator, left, right) => {
  if (operator === '??') return (left !== null && left !== undefined) ? left : right;
  if (typeof left === 'string' || typeof right === 'string') {
    if (operator === '+') {
      left = (left !== null && left !== undefined) ? left : '';
      right = (right !== null && right !== undefined) ? right : '';
      return left + right;
    }
  } else {
    switch (operator) {
      case '^':
        // SPEED: use exponent operator
        return left ** right;
      case '*':
        return left * right;
      case '/':
        return left / right;
      case '%':
        return left % right;
      case '+':
        return left + right;
      case '-':
        return left - right;
    }
  }
  switch (operator) {
    case '<':
      return left < right;
    case '<=':
      return left <= right;
    case '>':
      return left > right;
    case '>=':
      return left >= right;
    case '==':
      return left === right;
    case '!=':
      return left !== right;
    case '&&':
      return left && right;
    case '||':
      return left || right;
  }
  return null;
};

const Parser = exports.Parser;
export { Parser, exports as default };
