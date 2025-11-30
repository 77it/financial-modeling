//@ts-nocheck

/**
 * Formula parser (v7) - Performance optimized version
 *
 * Use `new Parser(formulaText, options).evaluate(context)` to evaluate plain formulas
 * or JSONX fragments (unquoted values marked with FORMULA_MARKER).
 *
 * V7 Optimizations (over v6):
 * - Direct operator dispatch (no indirection through arithmetic module)
 * - Parse-time literal conversion (DSB.from() once at parse, not millions at runtime)
 * - JSONX scanning can be disabled via enableJsonx flag
 * - Non-throwing resolver (returns undefined instead of Error)
 * - Simplified code = better JIT optimization
 *
 * V6 Features (retained):
 * - Constants permanently disabled (use context instead)
 * - All function arguments always evaluated (no string fallback)
 * - JSONX support for object/array literals in formulas
 *
 * Options (all optional):
 * - `functions`: map of name -> (...args) => any.
 * - `useDecimal`: boolean (default: true) - use DSB arithmetic for precision.
 * - `enableJsonx`: boolean (default: true) - parse JSONX objects/arrays.
 * - `reference`: custom reference resolver function.
 */

// Import modular components
import { createJSONXFormula, evaluateStringFormula } from './modules/formula-jsonx-handler.js';
import { scanBracket, scanBrace } from './modules/formula-scanner.js';
import { DSB } from '../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import { pow as dsbPow, modulo as dsbMod } from './adapters/decimal-adapter.js';

var exports = {};
const internals = {
  operators: ["!", "^", "*", "/", "%", "+", "-", "<", "<=", ">", ">=", "==", "!=", "&&", "||", "??"],
  operatorCharacters: ["!", "^", "*", "/", "%", "+", "-", "<", "=", ">", "&", "|", "?"],
  // OPTIMIZATION: Set for O(1) operator lookup
  operatorChars: new Set(["!", "^", "*", "/", "%", "+", "-", "<", "=", ">", "&", "|", "?"]),
  operatorsOrder: [["^"], ["*", "/", "%"], ["+", "-"], ["<", "<=", ">", ">="], ["==", "!="], ["&&"], ["||", "??"]],
  operatorsPrefix: ["!", "n", "p"],
  literals: {
    "\"": "\"",
    "`": "`",
    "'": "'",
    "[": "]"
  },
  numberRx: /^(?:[0-9]*(\.[0-9]*)?){1}$/,
  tokenRx: /^[\w\$\#\.\@\:\{\}]+$/,
  symbol: Symbol("formula"),
  settings: Symbol("settings")
};

// V7 OPTIMIZATION: Direct DSB operator table (no indirection)
const DECIMAL_OPS = Object.freeze({
  "^": dsbPow,    // Uses decimal-adapter (Decimal.js fallback for now)
  "*": DSB.mul,
  "/": DSB.div,
  "%": dsbMod,    // Uses decimal-adapter (Decimal.js fallback for now)
  "+": DSB.add,
  "-": DSB.sub
});

exports.Parser = class {
  constructor(string, options = {}) {
    if (!options[internals.settings] && options.constants) {
      for (const constant in options.constants) {
        const value = options.constants[constant];
        if (value !== null && !["boolean", "number", "string"].includes(typeof value)) {
          throw new Error(`Formula constant ${constant} contains invalid ${typeof value} value type`);
        }
      }
    }
    this.settings = options[internals.settings] ? options : Object.assign({
      [internals.settings]: true,
      functions: {},
      useDecimal: true,
      enableJsonx: true  // V7: New flag to disable JSONX scanning
    }, options);
    this.single = null;
    this._parts = null;
    // OPTIMIZATION: Reuse array in evaluate()
    this._work = [];
    this._raw = string;
    this._parse(string);
  }
  _parse(string) {
    let parts = [];
    let current = "";
    let parenthesis = 0;
    let literal = false;
    const useDecimal = this.settings.useDecimal;
    const enableJsonx = this.settings.enableJsonx;

    const flush = inner => {
      if (parenthesis) {
        throw new Error("Formula missing closing parenthesis");
      }
      const last = parts.length ? parts[parts.length - 1] : null;
      if (!literal && !current && !inner) {
        return;
      }
      if (last && last.type === "reference" && inner === ")") {
        // Function
        last.type = "function";
        last.value = this._subFormula(current, last.value);
        current = "";
        return;
      }
      if (inner === ")") {
        // Segment
        const sub = new exports.Parser(current, this.settings);
        parts.push({
          type: "segment",
          value: sub
        });
      } else if (literal) {
        if (literal === "]") {
          // Reference
          parts.push({
            type: "reference",
            value: current
          });
          current = "";
          return;
        }
        parts.push({
          type: "literal",
          value: current
        }); // Literal
      } else if (internals.operatorChars.has(current)) {
        // OPTIMIZATION: Use Set.has() for O(1) lookup
        // Operator
        if (last && last.type === "operator" && internals.operators.includes(last.value + current)) {
          // 2 characters operator
          last.value += current;
        } else {
          parts.push({
            type: "operator",
            value: current
          });
        }
      } else if (current.match(internals.numberRx)) {
        // V7 OPTIMIZATION: Parse-time literal conversion
        // Convert once here, not millions of times during evaluate()
        if (useDecimal) {
          parts.push({
            type: "constant",
            value: DSB.fromString(current)  // Convert to bigint now
          });
        } else {
          parts.push({
            type: "constant",
            value: parseFloat(current)  // Convert to number now
          });
        }
      } else {
        // V6 OPTIMIZATION: Constants permanently disabled - always treat as reference
        if (!current.match(internals.tokenRx)) {
          throw new Error(`Formula contains invalid token: ${current}`);
        }
        parts.push({
          type: "reference",
          value: current
        });
      }
      current = "";
    };

    // V7 OPTIMIZATION: Conditional JSONX scanning
    if (enableJsonx) {
      // JSONX-enabled parsing (supports {}/[] as objects/arrays)
      for (let i = 0; i < string.length; ++i) {
        const c = string[i];
        if (literal) {
          if (c === literal) {
            flush();
            literal = false;
          } else {
            current += c;
          }
        } else if (parenthesis) {
          if (c === "(") {
            current += c;
            ++parenthesis;
          } else if (c === ")") {
            --parenthesis;
            if (!parenthesis) {
              flush(c);
            } else {
              current += c;
            }
          } else {
            current += c;
          }
        } else if (c === "[") {
          // Check if JSONX array or legacy reference
          const { end, content, isJsonxArray } = scanBracket(string, i);
          flush();
          if (isJsonxArray) {
            parts.push({ type: "jsonx", value: this._jsonxFormula("[" + content + "]") });
          } else {
            parts.push({ type: "reference", value: content });
          }
          i = end;
        } else if (c === "{") {
          // Handle JSONX objects
          const { end, content } = scanBrace(string, i);
          flush();
          parts.push({ type: "jsonx", value: this._jsonxFormula("{" + content + "}") });
          i = end;
        } else if (c in internals.literals) {
          literal = internals.literals[c];
        } else if (c === "(") {
          flush();
          ++parenthesis;
        } else if (internals.operatorChars.has(c)) {
          flush();
          current = c;
          flush();
        } else if (c !== " ") {
          current += c;
        } else {
          flush();
        }
      }
    } else {
      // V7 FAST PATH: JSONX disabled - simple character loop (like original)
      for (const c of string) {
        if (literal) {
          if (c === literal) {
            flush();
            literal = false;
          } else {
            current += c;
          }
        } else if (parenthesis) {
          if (c === "(") {
            current += c;
            ++parenthesis;
          } else if (c === ")") {
            --parenthesis;
            if (!parenthesis) {
              flush(c);
            } else {
              current += c;
            }
          } else {
            current += c;
          }
        } else if (c in internals.literals) {
          literal = internals.literals[c];
        } else if (c === "(") {
          flush();
          ++parenthesis;
        } else if (internals.operatorChars.has(c)) {
          flush();
          current = c;
          flush();
        } else if (c !== " ") {
          current += c;
        } else {
          flush();
        }
      }
    }

    flush();

    // Replace prefix - to internal negative operator

    parts = parts.map((part, i) => {
      if (part.type !== "operator" || i && parts[i - 1].type !== "operator") {
        return part;
      }
      // Map prefix + to "p" and prefix - to "n"
      if (part.value === "-") {
        return {
          type: "operator",
          value: "n"
        };
      }
      if (part.value === "+") {
        return {
          type: "operator",
          value: "p"
        };
      }
      return part;
    });

    // Validate tokens order

    let operator = false;
    for (const part of parts) {
      if (part.type === "operator") {
        if (internals.operatorsPrefix.includes(part.value)) {
          continue;
        }
        if (!operator) {
          throw new Error("Formula contains an operator in invalid position");
        }
        if (!internals.operators.includes(part.value)) {
          throw new Error(`Formula contains an unknown operator ${part.value}`);
        }
      } else if (operator) {
        throw new Error("Formula missing expected operator");
      }
      operator = !operator;
    }
    if (!operator) {
      throw new Error("Formula contains invalid trailing operator");
    }

    // Identify single part

    if (parts.length === 1 && ["reference", "literal", "constant", "jsonx"].includes(parts[0].type)) {
      this.single = {
        type: parts[0].type === "reference" ? "reference" : "value",
        value: parts[0].value
      };
    }

    // Process parts

    this._parts = parts.map(part => {
      // Operators

      if (part.type === "operator") {
        return internals.operatorsPrefix.includes(part.value) ? part : part.value;
      }

      // Literals, constants, segments

      if (part.type !== "reference") {
        return part.value;
      }

      // References

      if (this.settings.tokenRx && !this.settings.tokenRx.test(part.value)) {
        throw new Error(`Formula contains invalid reference ${part.value}`);
      }
      if (this.settings.reference) {
        return this.settings.reference(part.value);
      }
      return internals.reference(part.value, this.settings);
    });
  }
  _subFormula(string, name) {
    const method = this.settings.functions[name];
    if (typeof method !== "function") {
      throw new Error(`Formula contains unknown function ${name}`);
    }
    let args = [];
    if (string) {
      let current = "";
      let parenthesis = 0;
      let literal = false;
      // Track braces and brackets for JSONX
      let brace = 0;
      let bracket = 0;
      const flush = () => {
        if (!current) {
          throw new Error(`Formula contains function ${name} with invalid arguments ${string}`);
        }
        args.push(current);
        current = "";
      };
      for (let i = 0; i < string.length; ++i) {
        const c = string[i];
        if (literal) {
          current += c;
          if (c === literal) {
            literal = false;
          }
        } else if (c in internals.literals && !parenthesis && !brace && !bracket) {
          current += c;
          literal = internals.literals[c];
        } else if (c === "," && !parenthesis && !brace && !bracket) {
          flush();
        } else {
          current += c;
          if (c === "(") {
            ++parenthesis;
          } else if (c === ")") {
            --parenthesis;
          } else if (c === "{") {
            ++brace;
          } else if (c === "}") {
            --brace;
          } else if (c === "[") {
            ++bracket;
          } else if (c === "]") {
            --bracket;
          }
        }
      }
      flush();
    }
    // Always evaluate all arguments (v6 behavior)
    args = args.map(arg => new exports.Parser(arg, this.settings));
    return function (context) {
      // Simplified - just evaluate all arguments
      const innerValues = [];
      for (let i = 0; i < args.length; i++) {
        innerValues.push(args[i].evaluate(context));
      }
      return method.call(context, ...innerValues);
    };
  }
  _jsonxFormula(text) {
    return createJSONXFormula(text, exports.Parser, this.settings);
  }
  _evaluateStringFormula(str, context) {
    return evaluateStringFormula(str, exports.Parser, this.settings, context);
  }
  evaluate(context) {
    // OPTIMIZATION: Reuse scratch array instead of slice()
    const src = this._parts;
    const parts = this._work;
    const len = src.length;
    parts.length = len;
    for (let i = 0; i < len; i++) parts[i] = src[i];

    const useDecimal = this.settings.useDecimal;

    // Prefix operators

    for (let i = parts.length - 2; i >= 0; --i) {
      const part = parts[i];
      if (part && part.type === "operator") {
        const current = parts[i + 1];
        parts.splice(i + 1, 1);
        const value = internals.evaluate(current, context);
        parts[i] = internals.single(part.value, value, useDecimal);
      }
    }

    // Left-right operators
    // V7 OPTIMIZATION: Direct operator dispatch (no function call indirection)

    internals.operatorsOrder.forEach(set => {
      for (let i = 1; i < parts.length - 1;) {
        if (set.includes(parts[i])) {
          const operator = parts[i];
          const left = internals.evaluate(parts[i - 1], context);
          const right = internals.evaluate(parts[i + 1], context);
          parts.splice(i, 2);

          // V7 OPTIMIZATION: Direct dispatch based on mode
          let result;
          if (useDecimal) {
            // Decimal mode: direct DSB operations
            result = internals.calculateDecimal(operator, left, right);
          } else {
            // Native mode: inline operations
            result = internals.calculateNative(operator, left, right);
          }

          parts[i - 1] = result === 0 ? 0 : result; // Convert -0
        } else {
          i += 2;
        }
      }
    });

    // Handle function results (JSONX evaluators)
    const result = internals.evaluate(parts[0], context);
    return typeof result === "function" ? result(context) : result;
  }
};

exports.Parser.prototype[internals.symbol] = true;

// V7 OPTIMIZATION: Non-throwing resolver (returns undefined instead of Error)
internals.reference = function (name, settings) {
  return function (context) {
    return context?.[name];  // Returns undefined if missing
  };
};

internals.evaluate = function (part, context) {
  if (part === null) {
    return null;
  }
  if (typeof part === "function") {
    // Handle nested function results
    const result = part(context);
    return typeof result === "function" ? result(context) : result;
  }
  if (part[internals.symbol]) {
    return part.evaluate(context);
  }
  return part;
};

internals.single = function (operator, value, useDecimal) {
  if (operator === "!") {
    return value ? false : true;
  }

  // V7 OPTIMIZATION: Direct handling of unary operators
  if (operator === "p") {
    // Unary plus - coerce to appropriate type
    if (useDecimal) {
      return DSB.from(value);
    }
    return +value;
  }

  // operator === 'n' (unary minus)
  if (useDecimal) {
    const negative = DSB.sub(0n, DSB.from(value));
    return negative === 0n ? 0n : negative;
  }

  const negative = -value;
  return negative === 0 ? 0 : negative;
};

/**
 * V7 OPTIMIZATION: Direct decimal calculation (no indirection)
 * Inlined from formula-arithmetic.js for better JIT optimization
 */
internals.calculateDecimal = function (operator, left, right) {
  // Normalize to DSB (already done at parse time for literals)
  const _left = DSB.from(left);
  const _right = DSB.from(right);

  // Nullish coalescing
  if (operator === "??") {
    if (left !== null && left !== undefined) return _left;
    if (right !== null && right !== undefined) return _right;
    return null;
  }

  // Null check for other operators
  if (left == null) {
    throw new Error(`Operator ${operator} not supported for null/undefined operands`);
  }

  // Arithmetic operators - use direct DSB operations
  const dsbOp = DECIMAL_OPS[operator];
  if (dsbOp) {
    return dsbOp(_left, _right);
  }

  // Comparisons - use native (returns boolean)
  switch (operator) {
    case "<":
      return _left < _right;
    case "<=":
      return _left <= _right;
    case ">":
      return _left > _right;
    case ">=":
      return _left >= _right;
    case "==":
      return _left === _right;
    case "!=":
      return _left !== _right;
  }

  // Logical operators - return actual values
  switch (operator) {
    case "&&":
      return _left && _right;
    case "||":
      return _left || _right;
  }

  throw new Error(`Unsupported operator: ${operator}`);
};

/**
 * V7 OPTIMIZATION: Direct native calculation (inlined, no function calls)
 */
internals.calculateNative = function (operator, left, right) {
  // Nullish coalescing
  if (operator === "??") {
    return (left !== null && left !== undefined) ? left : right;
  }

  // String concatenation
  if (typeof left === "string" || typeof right === "string") {
    if (operator === "+") {
      left = (left !== null && left !== undefined) ? left : "";
      right = (right !== null && right !== undefined) ? right : "";
      return left + right;
    }
  }

  // Arithmetic operators
  switch (operator) {
    case "^":
      return left ** right;
    case "*":
      return left * right;
    case "/":
      return left / right;
    case "%":
      return left % right;
    case "+":
      return left + right;
    case "-":
      return left - right;
  }

  // Comparisons
  switch (operator) {
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    case ">=":
      return left >= right;
    case "==":
      return left === right;
    case "!=":
      return left !== right;
  }

  // Logical operators
  switch (operator) {
    case "&&":
      return left && right;
    case "||":
      return left || right;
  }

  throw new Error(`Unsupported operator: ${operator}`);
};

internals.exists = function (value) {
  return value !== null && value !== undefined;
};

/**
 Types for Parser are provided in the index.d.ts file
 */
const Parser = exports.Parser;

export { Parser, exports as default };
