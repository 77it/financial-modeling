//@ts-nocheck

// from https://github.com/77it/formula/blob/aeb95946d444466d96cd7a9864c78a4530124f74/lib/formula.js
// updated to support YAML as function parameters
//
// fresh merge of v2 in v1 to v3; should be a simpler code than v2
//
// pass test   test/vendor/formula/formula__original_and_custom__base_tests.test.js
// pass test   test/vendor/formula/formula__original_and_custom__constants_context_reference.test.js
// pass test   test/vendor/formula/formula_custom_test.test.js

import { customParseYAML as parseYAML } from '../../src/lib/yaml.js';

var exports = {};

const internals = {
  operators: ["!", "^", "*", "/", "%", "+", "-", "<", "<=", ">", ">=", "==", "!=", "&&", "||", "??"],
  operatorCharacters: ["!", "^", "*", "/", "%", "+", "-", "<", "=", ">", "&", "|", "?"], // keep original
  operatorsOrder: [["^"], ["*", "/", "%"], ["+", "-"], ["<", "<=", ">", ">="], ["==", "!="], ["&&"], ["||", "??"]],
  operatorsPrefix: ["!", "n"],
  literals: { "\"": "\"", "`": "`", "'": "'", "[": "]" }, // legacy bracketed reference stays
  numberRx: /^(?:[0-9]*(\.[0-9]*)?){1}$/,
  tokenRx: /^[\w\$\#\.\@\:\{\}]+$/,
  symbol: Symbol("formula"),
  settings: Symbol("settings")
};

// ---------- helpers ----------
const isPlainObject = (v) =>
  v !== null && typeof v === "object" &&
  (v.constructor === Object || Object.getPrototypeOf(v) === Object.prototype);

const isDateLikeString = (s) =>
  typeof s === "string" &&
  /^\d{4}([-\/.])\d{1,2}\1\d{1,2}(?:[ T]\d{2}:\d{2}(?::\d{2})?(?:Z|[+\-]\d{2}:\d{2})?)?$/.test(s);

const isLikelyFormula = (s) =>
  typeof s === "string" &&
  !isDateLikeString(s) &&
  (/[!\^\*\/%\+\-<>=&\|\?\(\)]/.test(s) || /\w\s*\(/.test(s));

function scanBracket(str, start) {
  // returns { end, content, isYamlArray } ; YAML array only if comma or nested [{...]
  let depth = 1, q = null, hasComma = false, hasNested = false, content = "";
  for (let i = start + 1; i < str.length; ++i) {
    const ch = str[i];
    if (q) { content += ch; if (ch === q) q = null; continue; }
    if (ch === "\"" || ch === "'" || ch === "`") { q = ch; content += ch; continue; }
    if (ch === "[") { depth++; hasNested = true; content += ch; continue; }
    if (ch === "{") { hasNested = true; content += ch; continue; }
    if (ch === "]") { depth--; if (!depth) return { end: i, content, isYamlArray: hasComma || hasNested }; content += ch; continue; }
    if (ch === ",") hasComma = true;
    content += ch;
  }
  throw new Error("Formula missing closing bracket");
}

function scanBrace(str, start) {
  // returns { end, content } for {...} with nested/quoted handling
  let depth = 1, q = null, content = "";
  for (let i = start + 1; i < str.length; ++i) {
    const ch = str[i];
    if (q) { content += ch; if (ch === q) q = null; continue; }
    if (ch === "\"" || ch === "'" || ch === "`") { q = ch; content += ch; continue; }
    if (ch === "{") { depth++; content += ch; continue; }
    if (ch === "}") { depth--; if (!depth) return { end: i, content }; content += ch; continue; }
    content += ch;
  }
  throw new Error("Formula missing closing brace");
}
// ----------------------------

exports.Parser = class {
  constructor(string, options = {}) {
    if (!options[internals.settings] && options.constants) {
      for (const k in options.constants) {
        const v = options.constants[k];
        if (v !== null && !["boolean", "number", "string"].includes(typeof v)) {
          throw new Error(`Formula constant ${k} contains invalid ${typeof v} value type`);
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
      if (parenthesis) throw new Error("Formula missing closing parenthesis");
      const last = parts.length ? parts[parts.length - 1] : null;
      if (!literal && !current && !inner) return;

      if (last && last.type === "reference" && inner === ")") {
        last.type = "function";
        last.value = this._subFormula(current, last.value);
        current = "";
        return;
      }

      if (inner === ")") {
        const sub = new exports.Parser(current, this.settings);
        parts.push({ type: "segment", value: sub });
      } else if (literal) {
        if (literal === "]") { // legacy bracketed reference
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

      if (literal) { if (c === literal) { flush(); literal = false; } else current += c; continue; }

      if (parenthesis) {
        if (c === "(") { current += c; ++parenthesis; }
        else if (c === ")") { --parenthesis; if (!parenthesis) flush(c); else current += c; }
        else current += c;
        continue;
      }

      // YAML / legacy-bracket handling with tiny look-ahead
      if (c === "[") {
        const { end, content, isYamlArray } = scanBracket(string, i);
        flush();
        if (isYamlArray) {
          parts.push({ type: "yaml", value: this._yamlFormula("[" + content + "]") });
        } else {
          parts.push({ type: "reference", value: content });
        }
        i = end;
        continue;
      }

      if (c === "{") {
        const { end, content } = scanBrace(string, i);
        flush();
        parts.push({ type: "yaml", value: this._yamlFormula("{" + content + "}") });
        i = end;
        continue;
      }

      if (c in internals.literals) { literal = internals.literals[c]; continue; }
      if (c === "(") { flush(); ++parenthesis; continue; }
      if (internals.operatorCharacters.includes(c)) { flush(); current = c; flush(); continue; }

      if (c !== " ") current += c; else flush();
    }
    flush();

    // normalize unary minus
    parts = parts.map((part, i) =>
      (part.type === "operator" && part.value === "-" && (!i || parts[i - 1].type === "operator"))
        ? { type: "operator", value: "n" }
        : part
    );

    // order validation (unchanged)
    let operator = false;
    for (const part of parts) {
      if (part.type === "operator") {
        if (internals.operatorsPrefix.includes(part.value)) continue;
        if (!operator) throw new Error("Formula contains an operator in invalid position");
        if (!internals.operators.includes(part.value)) throw new Error(`Formula contains an unknown operator ${part.value}`);
      } else if (operator) {
        throw new Error("Formula missing expected operator");
      }
      operator = !operator;
    }
    if (!operator) throw new Error("Formula contains invalid trailing operator");

    if (parts.length === 1 && ["reference", "literal", "constant", "yaml"].includes(parts[0].type)) {
      this.single = { type: parts[0].type === "reference" ? "reference" : "value", value: parts[0].value };
    }

    this._parts = parts.map((part) => {
      if (part.type === "operator") return internals.operatorsPrefix.includes(part.value) ? part : part.value;
      if (part.type !== "reference") return part.value; // literal/constant/segment/yaml passthrough
      if (this.settings.tokenRx && !this.settings.tokenRx.test(part.value)) {
        throw new Error(`Formula contains invalid reference ${part.value}`);
      }
      return this.settings.reference ? this.settings.reference(part.value) : internals.reference(part.value);
    });
  }

  _subFormula(string, name) {
    const method = this.settings.functions[name];
    if (typeof method !== "function") throw new Error(`Formula contains unknown function ${name}`);

    let args = [];
    if (string) {
      let current = "", parenthesis = 0, literal = false, brace = 0, bracket = 0;
      const flush = () => { if (!current) throw new Error(`Formula contains function ${name} with invalid arguments ${string}`); args.push(current); current = ""; };

      for (let i = 0; i < string.length; ++i) {
        const c = string[i];
        if (literal) { current += c; if (c === literal) literal = false; continue; }
        if (!brace && !bracket && (c in internals.literals) && !parenthesis) { current += c; literal = internals.literals[c]; continue; }
        if (!brace && !bracket && c === "," && !parenthesis) { flush(); continue; }

        current += c;
        if (c === "(") ++parenthesis;
        else if (c === ")") --parenthesis;
        else if (c === "{") ++brace;
        else if (c === "}") --brace;
        else if (c === "[") ++bracket;
        else if (c === "]") --bracket;
      }
      flush();
    }

    args = args.map(arg => new exports.Parser(arg, this.settings));
    return function (context) {
      const inner = args.map((a) => a.evaluate(context));
      return method.call(context, ...inner);
    };
  }

  _yamlFormula(text) {
    let parsed;
    try { parsed = parseYAML(text); }
    catch (err) { throw new Error(`Invalid YAML segment: ${err.message}`); }

    const self = this;
    const walk = (v, ctx) => {
      if (v == null) return v;
      if (Array.isArray(v)) return v.map(x => walk(x, ctx));
      if (isPlainObject(v)) {
        const out = {};
        for (const [k, val] of Object.entries(v)) out[k] = walk(val, ctx);
        return out;
      }
      if (isLikelyFormula(v)) {
        try { return new exports.Parser(String(v), self.settings).evaluate(ctx); }
        catch { return v; }
      }
      return v;
    };
    return (context) => walk(parsed, context);
  }

  evaluate(context) {
    const parts = this._parts.slice();

    // prefix
    for (let i = parts.length - 2; i >= 0; --i) {
      const p = parts[i];
      if (p && p.type === "operator") {
        const cur = parts[i + 1];
        parts.splice(i + 1, 1);
        const val = internals.evaluate(cur, context);
        parts[i] = internals.single(p.value, val);
      }
    }

    // left-right
    internals.operatorsOrder.forEach(set => {
      for (let i = 1; i < parts.length - 1;) {
        if (set.includes(parts[i])) {
          const op = parts[i];
          const left = internals.evaluate(parts[i - 1], context);
          const right = internals.evaluate(parts[i + 1], context);
          parts.splice(i, 2);
          const res = internals.calculate(op, left, right);
          parts[i - 1] = res === 0 ? 0 : res;
        } else {
          i += 2;
        }
      }
    });
    return internals.evaluate(parts[0], context);
  }
};

exports.Parser.prototype[internals.symbol] = true;

internals.reference = (name) => (context) =>
  context && context[name] !== undefined ? context[name] : null;

internals.evaluate = (part, context) => {
  if (part === null) return null;
  if (typeof part === "function") return part(context);
  if (part[internals.symbol]) return part.evaluate(context);
  return part;
};

internals.single = (operator, value) => {
  if (operator === "!") return value ? false : true;
  const negative = -value; // 'n'
  return negative === 0 ? 0 : negative;
};

internals.calculate = (operator, left, right) => {
  if (operator === "??") return (left !== null && left !== undefined) ? left : right;
  if (typeof left === "string" || typeof right === "string") {
    if (operator === "+") {
      left = (left !== null && left !== undefined) ? left : "";
      right = (right !== null && right !== undefined) ? right : "";
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

const Parser = exports.Parser;
export { Parser, exports as default };

//# sourceMappingURL=formula@3.0.2!cjs.map
