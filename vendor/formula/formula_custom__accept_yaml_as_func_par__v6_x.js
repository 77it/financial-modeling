//@ts-nocheck

// REFACTOR: Import modular components
import { createJSONXFormula, evaluateStringFormula } from './modules/formula-jsonx-handler.js';
import { calculate as arithmeticCalculate } from './modules/formula-arithmetic.js';

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
// REFACTOR: Keep only core parsing helpers (scanBracket/scanBrace)
// Other helpers moved to modules/formula-jsonx-handler.js

function scanBracket(str, start) {
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
    if (ch === 34 || ch === 39 || ch === 96) {
      quote = ch;
      continue;
    }
    if (ch === 91) {
      depth++;
      hasNested = true;
    } else if (ch === 123) {
      hasNested = true;
    } else if (ch === 93) {
      depth--;
      if (depth === 0) {
        return {
          end: i,
          content: str.slice(startIdx, i),
          isJsonxArray: hasComma || hasNested
        };
      }
    } else if (ch === 44) {
      hasComma = true;
    }
  }
  throw new Error("Formula missing closing bracket");
}

function scanBrace(str, start) {
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
    if (ch === 34 || ch === 39 || ch === 96) {
      quote = ch;
    } else if (ch === 123) {
      depth++;
    } else if (ch === 125) {
      depth--;
      if (depth === 0) {
        return { end: i, content: str.slice(startIdx, i) };
      }
    }
  }
  throw new Error("Formula missing closing brace");
}
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
      constants: {},
      functions: {}
    }, options);
    this.single = null;
    this._parts = null;
    // OPTIMIZATION: Reuse array in evaluate()
    this._work = [];
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
        // Number
        parts.push({
          type: "constant",
          value: parseFloat(current)
        });
      } else if (this.settings.constants[current] !== undefined) {
        // Constant
        parts.push({
          type: "constant",
          value: this.settings.constants[current]
        });
      } else {
        // Reference
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
      // PATCH: Track braces and brackets for JSONX
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
      for (const arg of args) {
        innerValues.push(arg.evaluate(context));
      }
      return method.call(context, ...innerValues);
    };
  }
  // REFACTOR: Delegate JSONX handling to module
  _jsonxFormula(text) {
    return createJSONXFormula(text, exports.Parser, this.settings);
  }
  // REFACTOR: Delegate string formula evaluation to module
  _evaluateStringFormula(str, context) {
    return evaluateStringFormula(str, exports.Parser, this.settings, context);
  }
  evaluate(context) {
    // OPTIMIZATION: Reuse scratch array instead of slice()
    const src = this._parts;
    const parts = this._work;
    let len = src.length;
    parts.length = len;
    for (let i = 0; i < len; i++) parts[i] = src[i];

    // Prefix operators

    for (let i = parts.length - 2; i >= 0; --i) {
      const part = parts[i];
      if (part && part.type === "operator") {
        const current = parts[i + 1];
        parts.splice(i + 1, 1);
        const value = internals.evaluate(current, context);
        parts[i] = internals.single(part.value, value);
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
          // Always use Decimal for calculations
          const result = internals.calculate(operator, left, right);
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
internals.reference = function (name) {
  return function (context) {
    return context && context[name] !== undefined ? context[name] : null;
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
internals.single = function (operator, value) {
  if (operator === "!") {
    return value ? false : true;
  }
  // PATCH: Handle unary plus operator
  if (operator === "p") {
    return +value;
  }

  // operator === 'n'

  const negative = -value;
  if (negative === 0) {
    // Override -0
    return 0;
  }
  return negative;
};
// REFACTOR: Always use Decimal arithmetic for precision
/**
 * Calculate result of an operation using Decimal arithmetic
 * @param {string} operator - The operator (+, -, *, /, %, ^, ==, !=, <, <=, >, >=, &&, ||, ??)
 * @param {any} left - Left operand value
 * @param {any} right - Right operand value
 * @returns {any} Result of the operation
 */
internals.calculate = function (operator, left, right) {
  // Always use Decimal for calculations via arithmetic module
  return arithmeticCalculate(operator, left, right, true);
};
internals.exists = function (value) {
  return value !== null && value !== undefined;
};
const Parser = exports.Parser;

export { Parser, exports as default };

//# sourceMappingURL=formula@3.0.2!cjs.map