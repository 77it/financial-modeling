//@ts-nocheck

// from https://github.com/77it/formula/blob/aeb95946d444466d96cd7a9864c78a4530124f74/lib/formula.js
// updated to support YAML as function parameters
//
// first version,
//
// pass test         test/vendor/formula/formula__original_and_custom__base_tests.test.js
// pass test         test/vendor/formula/formula__original_and_custom__constants_context_reference.test.js
// DON'T pass test   test/vendor/formula/formula_custom_test.test.js

import { customParseYAML as parseYAML } from '../../../src/lib/unused/yaml.js';

var exports = {};
const internals = {
  operators: ["!", "^", "*", "/", "%", "+", "-", "<", "<=", ">", ">=", "==", "!=", "&&", "||", "??"],
  operatorCharacters: ["!", "^", "*", "/", "%", "+", "-", "<", "=", ">", "&", "|", "?"], // keep original behavior
  operatorsOrder: [["^"], ["*", "/", "%"], ["+", "-"], ["<", "<=", ">", ">="], ["==", "!="], ["&&"], ["||", "??"]],
  operatorsPrefix: ["!", "n"],
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

// YAML support >>> Heuristic to decide if a string is likely a formula
internals.isLikelyFormula = function (s) {
  return typeof s === "string" && (/[!\^\*\/%\+\-<>=&\|\?\(\)]/.test(s) || /\w\s*\(/.test(s));
};
// YAML support <<<

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

    // YAML support >>> track flow-style YAML braces and brackets
    let brace = 0;     // {}
    let bracket = 0;   // [] (optional but supported for YAML arrays)
    // YAML support <<<

    const flush = inner => {
      if (parenthesis) {
        throw new Error("Formula missing closing parenthesis");
      }
      // YAML support >>>
      if (brace) {
        throw new Error("Formula missing closing YAML brace");
      }
      if (bracket) {
        throw new Error("Formula missing closing YAML bracket");
      }
      // YAML support <<<

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
        parts.push({ type: "segment", value: sub });
      }
      // YAML support >>>
      else if (inner === "}" || inner === "]") {
        // YAML segment (flow style). We capture exactly what was between the delimiters.
        const yamlText = inner === "}" ? `{${current}}` : `[${current}]`;
        parts.push({ type: "yaml", value: this._yamlFormula(yamlText) });
      }
      // YAML support <<<
      else if (literal) {
        if (literal === "]") {
          // Reference
          parts.push({ type: "reference", value: current });
          current = "";
          return;
        }
        parts.push({ type: "literal", value: current }); // Literal
      } else if (internals.operatorCharacters.includes(current)) {
        // Operator
        if (last && last.type === "operator" && internals.operators.includes(last.value + current)) {
          // 2 characters operator
          last.value += current;
        } else {
          parts.push({ type: "operator", value: current });
        }
      } else if (current.match(internals.numberRx)) {
        // Number
        parts.push({ type: "constant", value: parseFloat(current) });
      } else if (this.settings.constants[current] !== undefined) {
        // Constant
        parts.push({ type: "constant", value: this.settings.constants[current] });
      } else {
        // Reference
        if (!current.match(internals.tokenRx)) {
          throw new Error(`Formula contains invalid token: ${current}`);
        }
        parts.push({ type: "reference", value: current });
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
      }
      // YAML support >>> handle nested flow YAML braces/brackets
      else if (brace) {
        if (c === "{") {
          current += c;
          ++brace;
        } else if (c === "}") {
          --brace;
          if (!brace) {
            flush(c);
          } else {
            current += c;
          }
        } else {
          current += c;
        }
      } else if (bracket) {
        if (c === "[") {
          current += c;
          ++bracket;
        } else if (c === "]") {
          --bracket;
          if (!bracket) {
            flush(c);
          } else {
            current += c;
          }
        } else {
          current += c;
        }
      }
      // YAML support <<<
      else if (parenthesis) {
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
      }
      // YAML support >>> start YAML flow segments
      else if (c === "{") {
        flush();
        ++brace;
      } else if (c === "[") {
        flush();
        ++bracket;
      }
      // YAML support <<<
      else if (internals.operatorCharacters.includes(c)) {
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
      return { type: "operator", value: "n" };
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
    if (parts.length === 1 && ["reference", "literal", "constant", "yaml"].includes(parts[0].type)) {
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

      // Literals, constants, segments, yaml => pass through
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

      // YAML support >>> keep track of YAML flow braces/brackets so commas inside them don't split args
      let brace = 0;
      let bracket = 0;
      // YAML support <<<

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
        } else if (!brace && !bracket && (c in internals.literals) && !parenthesis) {
          current += c;
          literal = internals.literals[c];
        } else if (!brace && !bracket && c === "," && !parenthesis) {
          flush();
        } else {
          current += c;
          if (c === "(") {
            ++parenthesis;
          } else if (c === ")") {
            --parenthesis;
          }
          // YAML support >>>
          else if (c === "{") {
            ++brace;
          } else if (c === "}") {
            --brace;
          } else if (c === "[") {
            ++bracket;
          } else if (c === "]") {
            --bracket;
          }
          // YAML support <<<
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

  // YAML support >>> parse and prepare evaluation thunk
  _yamlFormula(text) {
    let parsed;
    try {
      parsed = parseYAML(text); // supports flow style {a:1} / [1,2]
    } catch (err) {
      throw new Error(`Invalid YAML segment: ${err.message}`);
    }

    const self = this;

    const walk = (value, context) => {
      if (value === null || value === undefined) return value;

      if (Array.isArray(value)) {
        return value.map(v => walk(v, context));
      }

      if (typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
          out[k] = walk(v, context);
        }
        return out;
      }

      if (internals.isLikelyFormula(value)) {
        try {
          const p = new exports.Parser(String(value), self.settings);
          return p.evaluate(context);
        } catch {
          // Not a valid formula for our grammar; return original scalar
          return value;
        }
      }

      return value;
    };

    // Return a function so evaluation happens with provided context at runtime
    return function (context) {
      return walk(parsed, context);
    };
  }
  // YAML support <<<

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

internals.calculate = function (operator, left, right) {
  if (operator === "??") {
    return internals.exists(left) ? left : right;
  }
  if (typeof left === "string" || typeof right === "string") {
    if (operator === "+") {
      left = internals.exists(left) ? left : "";
      right = internals.exists(right) ? right : "";
      return left + right;
    }
  } else {
    switch (operator) {
      case "^":
        return Math.pow(left, right);
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
  }
  switch (operator) {
    case "<":  return left < right;
    case "<=": return left <= right;
    case ">":  return left > right;
    case ">=": return left >= right;
    case "==": return left === right;
    case "!=": return left !== right;
    case "&&": return left && right;
    case "||": return left || right;
  }
  return null;
};

internals.exists = function (value) {
  return value !== null && value !== undefined;
};

const Parser = exports.Parser;
export { Parser, exports as default };

//# sourceMappingURL=formula@3.0.2!cjs.map
