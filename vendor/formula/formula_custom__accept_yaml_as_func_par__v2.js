//@ts-nocheck

// from https://github.com/77it/formula/blob/aeb95946d444466d96cd7a9864c78a4530124f74/lib/formula.js
// updated to support YAML as function parameters
//
// based on v1, after many edits
//
// pass test   test/vendor/formula/formula__original_and_custom__base_tests.test.js
// pass test   test/vendor/formula/formula__original_and_custom__constants_context_reference.test.js
// pass test   test/vendor/formula/formula_custom_test.test.js

import { customParseYAML as parseYAML } from '../../src/lib/yaml.js';

// Keep CJS-style export compatibility used by your vendor code
var exports = {};

const internals = {
  operators: ["!", "^", "*", "/", "%", "+", "-", "<", "<=", ">", ">=", "==", "!=", "&&", "||", "??"],
  operatorCharacters: ["!", "^", "*", "/", "%", "+", "-", "<", "=", ">", "&", "|", "?"], // original set
  operatorsOrder: [["^"], ["*", "/", "%"], ["+", "-"], ["<", "<=", ">", ">="], ["==", "!="], ["&&"], ["||", "??"]],
  operatorsPrefix: ["!", "n"],
  literals: {
    "\"": "\"",
    "`": "`",
    "'": "'",
    "[": "]" // legacy bracketed reference (we preserve this behavior)
  },
  numberRx: /^(?:[0-9]*(\.[0-9]*)?){1}$/,
  tokenRx: /^[\w\$\#\.\@\:\{\}]+$/,
  symbol: Symbol("formula"),
  settings: Symbol("settings")
};

// ---------- YAML & parsing helpers ----------
internals.isPlainObject = (v) =>
  v !== null &&
  typeof v === "object" &&
  (v.constructor === Object || Object.getPrototypeOf(v) === Object.prototype);

internals.isDateLikeString = (s) =>
  typeof s === "string" &&
  /^\d{4}([-\/.])\d{1,2}\1\d{1,2}(?:[ T]\d{2}:\d{2}(?::\d{2})?(?:Z|[+\-]\d{2}:\d{2})?)?$/.test(s);

internals.isLikelyFormula = (s) =>
  typeof s === "string" &&
  !internals.isDateLikeString(s) &&
  (/[!\^\*\/%\+\-<>=&\|\?\(\)]/.test(s) || /\w\s*\(/.test(s));

/**
 * Scan ahead from `start` (at '[') and find the matching ']'.
 * Returns { end, content, isYamlArray }.
 * isYamlArray is true only when the content clearly represents a YAML array:
 * - contains at least one comma OR nested '[' or '{'
 */
internals.scanBracket = (str, start) => {
  let depth = 1;
  let content = "";
  let q = null;
  let hasComma = false;
  let hasNested = false;

  for (let i = start + 1; i < str.length; ++i) {
    const ch = str[i];
    if (q) {
      content += ch;
      if (ch === q) q = null;
      continue;
    }
    if (ch === "\"" || ch === "'" || ch === "`") {
      q = ch;
      content += ch;
      continue;
    }
    if (ch === "[") {
      depth++;
      hasNested = true;
      content += ch;
      continue;
    }
    if (ch === "]") {
      depth--;
      if (depth === 0) {
        return { end: i, content, isYamlArray: hasComma || hasNested };
      }
      content += ch;
      continue;
    }
    if (ch === "{") {
      hasNested = true;
      content += ch;
      continue;
    }
    if (ch === ",") hasComma = true;
    content += ch;
  }
  throw new Error("Formula missing closing bracket");
};

/**
 * Scan ahead from `start` (at '{') and find the matching '}' while
 * accounting for nested braces and quotes. Returns { end, content }.
 */
internals.scanBrace = (str, start) => {
  let depth = 1;
  let content = "";
  let q = null;

  for (let i = start + 1; i < str.length; ++i) {
    const ch = str[i];
    if (q) {
      content += ch;
      if (ch === q) q = null;
      continue;
    }
    if (ch === "\"" || ch === "'" || ch === "`") {
      q = ch;
      content += ch;
      continue;
    }
    if (ch === "{") {
      depth++;
      content += ch;
      continue;
    }
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        return { end: i, content };
      }
      content += ch;
      continue;
    }
    content += ch;
  }
  throw new Error("Formula missing closing brace");
};
// -------------------------------------------

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

    const flush = (inner) => {
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
        parts.push({ type: "segment", value: sub });
      } else if (inner === "}" || inner === "]") {
        // (braces/brackets are handled inline by scanners)
      } else if (literal) {
        if (literal === "]") {
          // Legacy bracketed reference
          parts.push({ type: "reference", value: current });
          current = "";
          return;
        }
        parts.push({ type: "literal", value: current });
      } else if (internals.operatorCharacters.includes(current)) {
        if (last && last.type === "operator" && internals.operators.includes(last.value + current)) {
          last.value += current;
        } else {
          parts.push({ type: "operator", value: current });
        }
      } else if (current.match(internals.numberRx)) {
        parts.push({ type: "constant", value: parseFloat(current) });
      } else if (this.settings.constants[current] !== undefined) {
        parts.push({ type: "constant", value: this.settings.constants[current] });
      } else {
        if (!current.match(internals.tokenRx)) {
          throw new Error(`Formula contains invalid token: ${current}`);
        }
        parts.push({ type: "reference", value: current });
      }
      current = "";
    };

    for (let i = 0; i < string.length; ++i) {
      const c = string[i];

      if (literal) {
        if (c === literal) {
          flush();
          literal = false;
        } else {
          current += c;
        }
        continue;
      }

      if (parenthesis) {
        if (c === "(") {
          current += c; ++parenthesis;
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
        continue;
      }

      // --- YAML / legacy bracket disambiguation ---
      if (c === "[") {
        const { end, content, isYamlArray } = internals.scanBracket(string, i);
        flush(); // flush what we had so far
        if (isYamlArray) {
          const yamlText = "[" + content + "]";
          parts.push({ type: "yaml", value: this._yamlFormula(yamlText) });
        } else {
          // Always legacy bracketed reference when not clearly an array
          parts.push({ type: "reference", value: content });
        }
        i = end; // jump past closing ]
        continue;
      }

      if (c === "{") {
        // Always treat as YAML flow mapping
        const { end, content } = internals.scanBrace(string, i);
        flush();
        const yamlText = "{" + content + "}";
        parts.push({ type: "yaml", value: this._yamlFormula(yamlText) });
        i = end; // jump past closing }
        continue;
      }
      // --------------------------------------------

      if (c in internals.literals) {
        literal = internals.literals[c];
        continue;
      }

      if (c === "(") {
        flush();
        ++parenthesis;
        continue;
      }

      if (internals.operatorCharacters.includes(c)) {
        flush();
        current = c;
        flush();
        continue;
      }

      if (c !== " ") {
        current += c;
      } else {
        flush();
      }
    }
    flush();

    // Replace prefix - to internal negative operator
    parts = parts.map((part, i) => {
      if (part.type !== "operator" || part.value !== "-" || (i && parts[i - 1].type !== "operator")) {
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
      if (part.type === "operator") {
        return internals.operatorsPrefix.includes(part.value) ? part : part.value;
      }
      if (part.type !== "reference") {
        // literal, constant, segment, yaml → passthrough
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
      // Track YAML flow so commas inside YAML don't split args
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
        } else if (!brace && !bracket && (c in internals.literals) && !parenthesis) {
          current += c;
          literal = internals.literals[c];
        } else if (!brace && !bracket && c === "," && !parenthesis) {
          flush();
        } else {
          current += c;
          if (c === "(") ++parenthesis;
          else if (c === ")") --parenthesis;
          else if (c === "{") ++brace;
          else if (c === "}") --brace;
          else if (c === "[") ++bracket;
          else if (c === "]") --bracket;
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
        return value.map((v) => walk(v, context));
      }

      if (internals.isPlainObject(value)) {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
          out[k] = walk(v, context);
        }
        return out;
      }

      if (typeof value === "string" && internals.isLikelyFormula(value)) {
        try {
          const p = new exports.Parser(value, self.settings);
          return p.evaluate(context);
        } catch {
          return value;
        }
      }

      return value;
    };

    return function (context) {
      return walk(parsed, context);
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
  if (part === null) return null;
  if (typeof part === "function") return part(context);
  if (part[internals.symbol]) return part.evaluate(context);
  return part;
};

internals.single = function (operator, value) {
  if (operator === "!") {
    return value ? false : true;
  }
  // operator === 'n'
  const negative = -value;
  if (negative === 0) return 0; // Override -0
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
      case "^": return Math.pow(left, right);
      case "*": return left * right;
      case "/": return left / right;
      case "%": return left % right;
      case "+": return left + right;
      case "-": return left - right;
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
