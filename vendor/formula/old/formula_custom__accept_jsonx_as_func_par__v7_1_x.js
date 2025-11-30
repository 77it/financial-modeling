//@ts-nocheck

/**
 * Formula parser (v7.1) - Ultra-optimized for native mode
 *
 * V7.1 Micro-optimizations (targeting the remaining 25-30% gap):
 * - Use slice() instead of manual array copy (faster in V8)
 * - Remove unary + operator support (not in original)
 * - Inline internals.evaluate() to reduce function calls
 * - Remove JSONX function result check in hot path
 * - Simplify single operator handling
 *
 * V7 Features (retained):
 * - Direct operator dispatch
 * - Parse-time literal conversion
 * - JSONX optional via flag
 * - Non-throwing resolver
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
  operatorChars: new Set(["!", "^", "*", "/", "%", "+", "-", "<", "=", ">", "&", "|", "?"]),
  operatorsOrder: [["^"], ["*", "/", "%"], ["+", "-"], ["<", "<=", ">", ">="], ["==", "!="], ["&&"], ["||", "??"]],
  operatorsPrefix: ["!", "n"],  // V7.1: Removed "p" (unary +)
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

const DECIMAL_OPS = Object.freeze({
  "^": dsbPow,
  "*": DSB.mul,
  "/": DSB.div,
  "%": dsbMod,
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
      enableJsonx: true
    }, options);
    this.single = null;
    this._parts = null;
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
        last.type = "function";
        last.value = this._subFormula(current, last.value);
        current = "";
        return;
      }
      if (inner === ")") {
        const sub = new exports.Parser(current, this.settings);
        parts.push({
          type: "segment",
          value: sub
        });
      } else if (literal) {
        if (literal === "]") {
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
        });
      } else if (internals.operatorChars.has(current)) {
        if (last && last.type === "operator" && internals.operators.includes(last.value + current)) {
          last.value += current;
        } else {
          parts.push({
            type: "operator",
            value: current
          });
        }
      } else if (current.match(internals.numberRx)) {
        // V7: Parse-time literal conversion
        if (useDecimal) {
          parts.push({
            type: "constant",
            value: DSB.fromString(current)
          });
        } else {
          parts.push({
            type: "constant",
            value: parseFloat(current)
          });
        }
      } else {
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

    // V7.1: Conditional JSONX scanning
    if (enableJsonx) {
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
          const { end, content, isJsonxArray } = scanBracket(string, i);
          flush();
          if (isJsonxArray) {
            parts.push({ type: "jsonx", value: this._jsonxFormula("[" + content + "]") });
          } else {
            parts.push({ type: "reference", value: content });
          }
          i = end;
        } else if (c === "{") {
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
      // V7.1: FAST PATH - no JSONX (matches original more closely)
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
    // V7.1: Simplified - only handle unary minus (like original)
    parts = parts.map((part, i) => {
      if (part.type !== "operator" || part.value !== "-" || i && parts[i - 1].type !== "operator") {
        return part;
      }
      return {
        type: "operator",
        value: "n"
      };
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
      if (part.type === "operator") {
        return internals.operatorsPrefix.includes(part.value) ? part : part.value;
      }
      if (part.type !== "reference") {
        return part.value;
      }
      if (this.settings.tokenRx && !this.settings.tokenRx.test(part.value)) {
        throw new Error(`Formula contains invalid reference ${part.value}`);
      }
      if (this.settings.reference) {
        return this.settings.reference(part.value);
      }
      return internals.reference(part.value);
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
    args = args.map(arg => new exports.Parser(arg, this.settings));
    return function (context) {
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
    // V7.1 OPTIMIZATION: Use native slice() - V8 optimizes this better than manual copy
    const parts = this._parts.slice();
    const useDecimal = this.settings.useDecimal;
    const enableJsonx = this.settings.enableJsonx;

    // Prefix operators
    for (let i = parts.length - 2; i >= 0; --i) {
      const part = parts[i];
      if (part && part.type === "operator") {
        const current = parts[i + 1];
        parts.splice(i + 1, 1);
        // V7.1: Inline evaluate for unary operators (reduce function call)
        const value = typeof current === "function" ? current(context) :
                      (current[internals.symbol] ? current.evaluate(context) : current);

        // V7.1: Simplified unary handling (only ! and n)
        if (part.value === "!") {
          parts[i] = value ? false : true;
        } else {
          // operator === 'n'
          if (useDecimal) {
            const negative = DSB.sub(0n, DSB.from(value));
            parts[i] = negative === 0n ? 0n : negative;
          } else {
            const negative = -value;
            parts[i] = negative === 0 ? 0 : negative;
          }
        }
      }
    }

    // Left-right operators
    internals.operatorsOrder.forEach(set => {
      for (let i = 1; i < parts.length - 1;) {
        if (set.includes(parts[i])) {
          const operator = parts[i];
          // V7.1: Inline evaluate (reduce function calls in hot path)
          const leftPart = parts[i - 1];
          const left = typeof leftPart === "function" ? leftPart(context) :
                       (leftPart[internals.symbol] ? leftPart.evaluate(context) : leftPart);

          const rightPart = parts[i + 1];
          const right = typeof rightPart === "function" ? rightPart(context) :
                        (rightPart[internals.symbol] ? rightPart.evaluate(context) : rightPart);

          parts.splice(i, 2);

          // V7.1: Direct dispatch
          let result;
          if (useDecimal) {
            result = internals.calculateDecimal(operator, left, right);
          } else {
            result = internals.calculateNative(operator, left, right);
          }

          parts[i - 1] = result === 0 ? 0 : result;
        } else {
          i += 2;
        }
      }
    });

    // V7.1: Conditional JSONX function check (only when enabled)
    const final = parts[0];
    if (enableJsonx && typeof final === "function") {
      const result = final(context);
      return typeof result === "function" ? result(context) : result;
    }

    // Fast path: direct evaluate
    return typeof final === "function" ? final(context) :
           (final === null ? null :
           (final[internals.symbol] ? final.evaluate(context) : final));
  }
};

exports.Parser.prototype[internals.symbol] = true;

internals.reference = function (name) {
  return function (context) {
    return context?.[name];
  };
};

/**
 * V7.1: Optimized decimal calculation
 */
internals.calculateDecimal = function (operator, left, right) {
  const _left = DSB.from(left);
  const _right = DSB.from(right);

  if (operator === "??") {
    if (left !== null && left !== undefined) return _left;
    if (right !== null && right !== undefined) return _right;
    return null;
  }

  if (left == null) {
    throw new Error(`Operator ${operator} not supported for null/undefined operands`);
  }

  const dsbOp = DECIMAL_OPS[operator];
  if (dsbOp) {
    return dsbOp(_left, _right);
  }

  // Comparisons
  switch (operator) {
    case "<": return _left < _right;
    case "<=": return _left <= _right;
    case ">": return _left > _right;
    case ">=": return _left >= _right;
    case "==": return _left === _right;
    case "!=": return _left !== _right;
  }

  // Logical
  switch (operator) {
    case "&&": return _left && _right;
    case "||": return _left || _right;
  }

  throw new Error(`Unsupported operator: ${operator}`);
};

/**
 * V7.1: Optimized native calculation
 */
internals.calculateNative = function (operator, left, right) {
  if (operator === "??") {
    return (left !== null && left !== undefined) ? left : right;
  }

  if (typeof left === "string" || typeof right === "string") {
    if (operator === "+") {
      left = (left !== null && left !== undefined) ? left : "";
      right = (right !== null && right !== undefined) ? right : "";
      return left + right;
    }
  }

  // Arithmetic
  switch (operator) {
    case "^": return left ** right;
    case "*": return left * right;
    case "/": return left / right;
    case "%": return left % right;
    case "+": return left + right;
    case "-": return left - right;
  }

  // Comparisons
  switch (operator) {
    case "<": return left < right;
    case "<=": return left <= right;
    case ">": return left > right;
    case ">=": return left >= right;
    case "==": return left === right;
    case "!=": return left !== right;
  }

  // Logical
  switch (operator) {
    case "&&": return left && right;
    case "||": return left || right;
  }

  throw new Error(`Unsupported operator: ${operator}`);
};

const Parser = exports.Parser;
export { Parser, exports as default };
