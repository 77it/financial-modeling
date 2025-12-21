//@ts-nocheck

/**
 * Formula parser (v6) entry point.
 *
 * Use `new Parser(formulaText, options).evaluate(context)` to evaluate plain formulas
 * or JSONX fragments (unquoted values marked with FORMULA_MARKER).
 *
 * V6 Optimizations:
 * - Constants permanently disabled (use context instead)
 * - All function arguments always evaluated (no string fallback)
 * - Improved performance through simplified code paths
 *
 * Options (all optional):
 * - `functions`: map of name -> (...args) => any.
 * - `useDecimal`: boolean (default: true) - use Decimal arithmetic for precision.
 */

// REFACTOR: Import modular components
import { createJSONXFormula, evaluateStringFormula } from './formula-jsonx-handler.js';
import { calculate as arithmeticCalculate } from '../modules/formula-arithmetic.js';
import { scanBracket, scanBrace } from './formula-scanner.js';

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
      useDecimal: true
      // V6 REMOVED: constants option (permanently disabled for performance)
      // V6 REMOVED: disableConstantsAndPassArgsAsStringsToFunctions (always true for performance)
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
        // Number - keep as string for precision (arithmetic engine handles conversion)
        parts.push({
          type: "constant",
          value: current
        });
      } else {
        // V6 OPTIMIZATION: Constants permanently disabled - always treat as reference
        // This improves performance by removing conditional checks
        if (!current.match(internals.tokenRx)) {
          throw new Error(`Formula contains invalid token: ${current}`);
        }
        parts.push({
          type: "reference",
          value: current
        });
      }
      /* V6 REMOVED: Constants feature for performance
      } else if (!this.settings.disableConstantsAndPassArgsAsStringsToFunctions && this.settings.constants[current] !== undefined) {
        parts.push({
          type: "constant",
          value: this.settings.constants[current]
        });
      }
      */
      current = "";
    };
    // PATCH: Changed to index loop for JSONX scanning
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
        // PATCH: Check if JSONX array or legacy reference
        const { end, content, isJsonxArray } = scanBracket(string, i);
        flush();
        if (isJsonxArray) {
          parts.push({ type: "jsonx", value: this._jsonxFormula("[" + content + "]") });
        } else {
          parts.push({ type: "reference", value: content });
        }
        i = end;
      } else if (c === "{") {
        // PATCH: Handle JSONX objects
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
        // OPTIMIZATION: Use Set.has() for O(1) lookup
        flush();
        current = c;
        flush();
      } else if (c !== " ") {
        current += c;
      } else {
        flush();
      }
    }
    flush();

    // Replace prefix - to internal negative operator

    parts = parts.map((part, i) => {
      if (part.type !== "operator" || i && parts[i - 1].type !== "operator") {
        return part;
      }
      // PATCH: Map prefix + to "p" and prefix - to "n"
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
    // V6 REMOVED: argStrings array - no longer needed without string argument passing
    if (string) {
      let current = "";
      let parenthesis = 0;
      let literal = false;
      // PATCH: Track braces and brackets for JSONX
      let brace = 0;
      let bracket = 0;
      const flush = () => {
        if (!current) {
          throw new Error(`Formula contains function ${name} with invalid arguments ${string}`);
        }
        // V6 REMOVED: argStrings.push(current);
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
    // V6 REMOVED: pasStringsToFunctions logic - always evaluate all arguments
    args = args.map(arg => new exports.Parser(arg, this.settings));
    return function (context) {
      // V6 OPTIMIZATION: Simplified - just evaluate all arguments (no try-catch, no string fallback)
      const innerValues = [];
      for (let i = 0; i < args.length; i++) {
        innerValues.push(args[i].evaluate(context));
      }
      return method.call(context, ...innerValues);
    };

    /* V6 REMOVED: String argument passing feature (was slow with try-catch):
    return function (context) {
      const innerValues = [];
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const argStr = argStrings[i];

        if (pasStringsToFunctions && arg.single && arg.single.type === "reference") {
          try {
            innerValues.push(arg.evaluate(context));
          } catch (err) {
            innerValues.push(argStr);
          }
        } else {
          innerValues.push(arg.evaluate(context));
        }
      }
      return method.call(context, ...innerValues);
    };
    */
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

    internals.operatorsOrder.forEach(set => {
      for (let i = 1; i < parts.length - 1;) {
        if (set.includes(parts[i])) {
          const operator = parts[i];
          const left = internals.evaluate(parts[i - 1], context);
          const right = internals.evaluate(parts[i + 1], context);
          parts.splice(i, 2);
          const result = internals.calculate(operator, left, right, useDecimal);
          parts[i - 1] = result === 0 ? 0 : result; // Convert -0
        } else {
          i += 2;
        }
      }
    });
    // PATCH: Handle function results (JSONX evaluators)
    const result = internals.evaluate(parts[0], context);
    return typeof result === "function" ? result(context) : result;
  }
};
exports.Parser.prototype[internals.symbol] = true;
internals.reference = function (name, settings) {
  return function (context) {
    const hasContext = context && Object.prototype.hasOwnProperty.call(context, name);
    if (hasContext) {
      return context[name];
    }
    throw new Error(`Unknown reference ${name}`);
  };
};
internals.evaluate = function (part, context) {
  if (part === null) {
    return null;
  }
  if (typeof part === "function") {
    // PATCH: Handle nested function results
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
  // PATCH: Handle unary plus operator - use Decimal arithmetic for consistency
  if (operator === "p") {
    return arithmeticCalculate("+", 0, value, useDecimal);
  }

  // operator === 'n'
  // Use Decimal arithmetic for negation (0 - value) to maintain precision consistency with binary operators
  const negative = arithmeticCalculate("-", 0, value, useDecimal);
  if (negative === 0) {
    // Override -0
    return 0;
  }
  return negative;
};
/**
 * Calculate result of an operation using Decimal arithmetic
 * @param {string} operator - The operator (+, -, *, /, %, ^, ==, !=, <, <=, >, >=, &&, ||, ??)
 * @param {any} left - Left operand value
 * @param {any} right - Right operand value
 * @param {boolean} useDecimal - Whether to use Decimal precision (default: true)
 * @returns {any} Result of the operation
 */
internals.calculate = function (operator, left, right, useDecimal = true) {
  return arithmeticCalculate(operator, left, right, useDecimal);
};
internals.exists = function (value) {
  return value !== null && value !== undefined;
};
/**
 Types for Parser are provided in the index.d.ts file
 */
const Parser = exports.Parser;

export { Parser, exports as default };

//# sourceMappingURL=formula@3.0.2!cjs.map
