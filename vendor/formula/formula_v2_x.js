//@ts-nocheck

var exports = {};

// V2 UPDATE: Import number detection utilities and decimal arithmetic
import { IS_DIGIT, isPureDecimalNumber } from '../../src/lib/number_utils.js';
import { decimalCalculate } from './modules/formula-arithmetic.js';

const internals = {
  operators: ["!", "^", "*", "/", "%", "+", "-", "<", "<=", ">", ">=", "==", "!=", "&&", "||", "??"],
  operatorCharacters: ["!", "^", "*", "/", "%", "+", "-", "<", "=", ">", "&", "|", "?"],
  operatorsOrder: [["^"], ["*", "/", "%"], ["+", "-"], ["<", "<=", ">", ">="], ["==", "!="], ["&&"], ["||", "??"]],
  operatorsPrefix: ["!", "n"],
  literals: {
    "\"": "\"",
    "`": "`",
    "'": "'",
    "[": "]"
  },
  // V2 UPDATE: IS_DIGIT imported from number_utils.js (see top of file)
  tokenRx: /^[\w\$\#\.\@\:\{\}]+$/,
  symbol: Symbol("formula"),
  settings: Symbol("settings"),
  // V2 UPDATE: Use decimal arithmetic by default
  calculate: decimalCalculate
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
      constants: {},
      functions: {}
    }, options);
    this.single = null;
    this._parts = null;
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
      } else if (internals.operatorCharacters.includes(current)) {
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
      } else if (isPureDecimalNumber(current)) {
        // V2 UPDATE: Numbers kept as strings for decimal precision
        // Clean underscores and leading + before storing
        let cleaned = '';
        for (let k = 0; k < current.length; k++) {
          const ch = current[k];
          if (ch === '_' || (k === 0 && ch === '+')) continue;
          cleaned += ch;
        }
        parts.push({
          type: "constant",
          value: cleaned  // V2 UPDATE: Keep as string, not parseFloat
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
      } else if (internals.operatorCharacters.includes(c)) {
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

    if (parts.length === 1 && ["reference", "literal", "constant"].includes(parts[0].type)) {
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
        } else if (c in internals.literals && !parenthesis) {
          current += c;
          literal = internals.literals[c];
        } else if (c === "," && !parenthesis) {
          flush();
        } else {
          current += c;
          if (c === "(") {
            ++parenthesis;
          } else if (c === ")") {
            --parenthesis;
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
  evaluate(context) {
    const parts = this._parts.slice();

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
          // V2 UPDATE: Use decimalCalculate for all arithmetic
          const result = internals.calculate(operator, left, right);
          parts[i - 1] = result === 0 ? 0 : result; // Convert -0
        } else {
          i += 2;
        }
      }
    });
    return internals.evaluate(parts[0], context);
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
    return part(context);
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

  // operator === 'n'

  const negative = -value;
  if (negative === 0) {
    // Override -0
    return 0;
  }
  return negative;
};
// V2 UPDATE: Use decimalCalculate from formula-arithmetic.js (assigned in internals above)
// Old native calculate function removed - now using decimal arithmetic
internals.exists = function (value) {
  return value !== null && value !== undefined;
};
const Parser = exports.Parser;

export { Parser, exports as default };

//# sourceMappingURL=formula@3.0.2!cjs.map