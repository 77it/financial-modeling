//@ts-nocheck

// v7: Based on v5 (fast) with targeted fixes from v6 (correct)
// Key insight: v6's slowdown comes from calling ensureBigIntScaled on EVERY math operation.
// We keep v5's fast direct mathOps and coerce values ONCE at the edges (reference lookup, constants).

// Import math operations from decimal-adapter
import { ensureBigIntScaled, fxAdd, fxSub, fxMul, fxDiv } from '../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import { pow, modulo } from './adapters/decimal-adapter.js';
import { isPureDecimalNumber } from '../../src/lib/number_utils.js';
import { cachedParseJSONrelaxed as parse } from '../../src/lib/json.js';
import { FORMULA_MARKER } from './modules/formula-marker.js';
import { lru } from '../tiny_lru/lru.js';

var exports = {};

const internals = {
  operators: ["!", "^", "*", "/", "%", "+", "-", "<", "<=", ">", ">=", "==", "!=", "&&", "||", "??"],
  operatorCharacters: ["!", "^", "*", "/", "%", "+", "-", "<", "=", ">", "&", "|", "?"],
  operatorsOrder: [["^"], ["*", "/", "%"], ["+", "-"], ["<", "<=", ">", ">="], ["==", "!="], ["&&"], ["||", "??"]],
  operatorsPrefix: ["!", "n", "p"],  // Added "p" for unary plus (from v6)
  literals: {
    "\"": "\"",
    "`": "`",
    "'": "'",
    "[": "]"
  },
  tokenRx: /^[\w\$\#\.\@\:\{\}]+$/,
  symbol: Symbol("formula"),
  settings: Symbol("settings")
};

// Small caches for object literal parsing keyed by settings + source
internals.objectLiteralCache = lru(128);
internals.settingsIds = new WeakMap();
internals.settingsIdCounter = 0;

// Helper functions for compiled code
internals.helpers = {
  // Null coalescing
  nullCoalesce(left, right) {
    return (left !== null && left !== undefined) ? left : right;
  },

  // Logical NOT
  not(value) {
    return value ? false : true;
  }
};

// Math operations - FAST: direct function references (from v5)
// Values must be pre-coerced before calling these
internals.mathOps = {
  add: fxAdd,
  sub: fxSub,
  mul: fxMul,
  div: fxDiv,
  pow,
  modulo
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
      functions: {},
      reference: null,  // Custom reference function
      compile: true,    // Enable compilation by default
      evaluateNumbersAsStrings: true  // From v6: enable numeric mode by default
    }, options);

    this.numericMode = this.settings.evaluateNumbersAsStrings !== false;  // From v6

    this.single = null;
    this._parts = null;
    this._compiled = null;
    this._parse(string);

    // Try to compile if enabled
    if (this.settings.compile && this._supportsCompilation()) {
      try {
        this._compiled = this._compile();
      } catch (err) {
        // Fall back to interpretation if compilation fails
        console.warn('Formula compilation failed, falling back to interpretation:', err.message);
        console.warn('Error details:', err);
      }
    }
  }

  _supportsCompilation() {
    if (internals.compilationSupported === undefined) {
      try {
        new Function('return 1')();
        internals.compilationSupported = true;
      } catch {
        internals.compilationSupported = false;
      }
    }
    return internals.compilationSupported;
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
        // Literal - if it looks like a number, treat as numeric constant
        if (isPureDecimalNumber(current)) {
          parts.push({
            type: "constant",
            value: current,
            isNumber: true
          });
        } else {
          parts.push({
            type: "literal",
            value: current
          }); // Literal
        }
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
        // Numeric literal - leave as string, normalize later
        parts.push({
          type: "constant",
          value: current,
          isNumber: true
        });
      } else if (this.settings.constants[current] !== undefined) {
        // Constant
        parts.push({
          type: "constant",
          value: this.settings.constants[current],
          isNumber: false
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

    // Replace prefix -/+ to internal operators (from v6: handles both - and +)
    parts = parts.map((part, i) => {
      if (part.type !== "operator" || !["-", "+"].includes(part.value) || i && parts[i - 1].type !== "operator") {
        return part;
      }
      return {
        type: "operator",
        value: part.value === "-" ? "n" : "p"
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

    // Store original parts for compilation
    this._originalParts = parts;

    // Process parts for interpretation (fallback)

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
        // From v6: wrap the reference function to return resolver
        const resolver = this.settings.reference(part.value);
        if (typeof resolver !== "function") {
          throw new Error("Reference resolver must return a function");
        }
        return function(context) {
          return resolver(context);
        };
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
        } else if (c in internals.literals && !parenthesis && !brace) {
          current += c;
          literal = internals.literals[c];
        } else if (c === "{") {
          current += c;
          ++brace;
        } else if (c === "}") {
          if (!brace) {
            throw new Error(`Formula contains function ${name} with invalid arguments ${string}`);
          }
          current += c;
          --brace;
        } else if ((c === "," || c === ";") && !parenthesis && !brace) {
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
      if (brace) {
        throw new Error(`Formula contains function ${name} with unbalanced object literal ${string}`);
      }
    }
    args = args.map(arg => this._parseArgument(arg));

    // Store for compilation
    const functionData = {
      name,
      args
    };

    const objectEvaluator = this._evaluateObjectNode.bind(this);
    const evaluator = function (context) {
      const innerValues = [];
      for (const arg of args) {
        if (arg && arg._isLiteralObject) {
          innerValues.push(objectEvaluator(arg._node, context));
        } else {
          innerValues.push(arg.evaluate(context));
        }
      }
      return method.call(context, ...innerValues);
    };

    evaluator._functionData = functionData;
    return evaluator;
  }

  _compile() {
    // Generate JavaScript code from the AST
    const code = this._generateCode(this._originalParts);

    // Build a small factory and eval it so math/refs/functions are lexically captured
    const mathOps = this.settings.mathOps || internals.mathOps;
    const helpers = internals.helpers;
    const functions = this.settings.functions || {};
    // From v6: cache reference resolvers for performance
    const reference = this.settings.reference
      ? (() => {
          const cache = new Map();
          const factory = this.settings.reference;
          return (name, ctx) => {
            let resolver = cache.get(name);
            if (!resolver) {
              resolver = factory(name);
              if (typeof resolver !== "function") {
                throw new Error("Reference resolver must return a function");
              }
              cache.set(name, resolver);
            }
            return resolver(ctx);
          };
        })()
      : ((name, ctx) => {
          if (ctx && Object.prototype.hasOwnProperty.call(ctx, name)) {
            return ctx[name];
          }
          throw new Error(`Unknown reference ${name}`);
        });
    const ensure = ensureBigIntScaled;  // For coercing references

    /* eslint-disable no-eval */
    const factorySrc = `(function(){ const __h = helpers; const __fns = functions; const __ref = reference; const __mathOps = mathOps; const __ensure = ensure; return function(__ctx){ 'use strict'; return ${code}; }; })()`;
    const compiled = eval(factorySrc);
    /* eslint-enable no-eval */
    return compiled;
  }

  _generateCode(parts) {
    // We need to respect operator precedence
    // Process prefix operators first (from right to left)
    // Then process binary operators by precedence order

    let code = this._generateCodeWithPrecedence(parts);
    return code;
  }

  _isStringOperation(parts, operatorIndex) {
    if (this.numericMode) {
      return false;  // In numeric mode, never treat + as string concat
    }

    // Check if this is a string concatenation operation
    // by examining the types of operands
    if (parts[operatorIndex] !== '+' && parts[operatorIndex]?.value !== '+') {
      return false;
    }

    const left = parts[operatorIndex - 1];
    const right = parts[operatorIndex + 1];

    // Check if either operand is a string literal
    if (left?.type === 'literal' || right?.type === 'literal') {
      return true;
    }

    return false;
  }

  _generateCodeWithPrecedence(parts) {
    if (parts.length === 0) {
      return 'null';
    }

    if (parts.length === 1) {
      return this._partToCode(parts[0]);
    }

    // Handle prefix operators (!, n, p) from right to left
    let workingParts = [...parts];

    for (let i = workingParts.length - 2; i >= 0; i--) {
      const part = workingParts[i];
      if (part.type === 'operator' && internals.operatorsPrefix.includes(part.value)) {
        const nextPart = workingParts[i + 1];
        const nextCode = this._partToCode(nextPart);

        let prefixCode;
        if (part.value === '!') {
          prefixCode = `__h.not(${nextCode})`;
        } else if (part.value === 'n') {
          // Unary minus - ensure then negate
          prefixCode = `(-__ensure(${nextCode}))`;
        } else if (part.value === 'p') {
          // Unary plus - ensure to numeric
          prefixCode = `(__ensure(${nextCode}))`;
        }

        // Replace the operator and next part with the generated code
        workingParts.splice(i, 2, { _code: prefixCode });
      }
    }

    // Now handle binary operators by precedence
    for (const precedenceGroup of internals.operatorsOrder) {
      for (let i = 1; i < workingParts.length - 1; i += 2) {
        const part = workingParts[i];
        const operator = part.type === 'operator' ? part.value : part;

        if (precedenceGroup.includes(operator)) {
          const left = workingParts[i - 1];
          const right = workingParts[i + 1];

          const leftCode = this._partToCode(left);
          const rightCode = this._partToCode(right);

          let opCode;

          // Special handling for string concatenation
          const isStringOp = this._isStringOperation(workingParts, i);

          switch (operator) {
            case '??':
              if (this.numericMode) {
                // From v6: ensure result is numeric if not null
                opCode = `(() => { const __v = __h.nullCoalesce(${leftCode}, ${rightCode}); return (__v === null || __v === undefined) ? null : __ensure(__v); })()`;
              } else {
                opCode = `__h.nullCoalesce(${leftCode}, ${rightCode})`;
              }
              break;
            case '+':
              opCode = isStringOp
                ? `(${leftCode} + ${rightCode})`
                : `__mathOps.add(__ensure(${leftCode}), __ensure(${rightCode}))`;
              break;
            case '-':
              opCode = `__mathOps.sub(__ensure(${leftCode}), __ensure(${rightCode}))`;
              break;
            case '*':
              opCode = `__mathOps.mul(__ensure(${leftCode}), __ensure(${rightCode}))`;
              break;
            case '/':
              opCode = `__mathOps.div(__ensure(${leftCode}), __ensure(${rightCode}))`;
              break;
            case '%':
              opCode = `__mathOps.modulo(__ensure(${leftCode}), __ensure(${rightCode}))`;
              break;
            case '^':
              opCode = `__mathOps.pow(__ensure(${leftCode}), __ensure(${rightCode}))`;
              break;
            case '<':
              opCode = `(__ensure(${leftCode}) < __ensure(${rightCode}))`;
              break;
            case '<=':
              opCode = `(__ensure(${leftCode}) <= __ensure(${rightCode}))`;
              break;
            case '>':
              opCode = `(__ensure(${leftCode}) > __ensure(${rightCode}))`;
              break;
            case '>=':
              opCode = `(__ensure(${leftCode}) >= __ensure(${rightCode}))`;
              break;
            case '==':
              opCode = `(__ensure(${leftCode}) === __ensure(${rightCode}))`;
              break;
            case '!=':
              opCode = `(__ensure(${leftCode}) !== __ensure(${rightCode}))`;
              break;
            case '&&':
              opCode = `(__ensure(${leftCode}) && __ensure(${rightCode}))`;
              break;
            case '||':
              opCode = `(__ensure(${leftCode}) || __ensure(${rightCode}))`;
              break;
            default:
              throw new Error(`Unknown operator: ${operator}`);
          }

          // Replace operator and operands with result
          workingParts.splice(i - 1, 3, { _code: opCode });
          i -= 2; // Adjust index after splice
        }
      }
    }

    return this._partToCode(workingParts[0]);
  }

  _partToCode(part) {
    // If already generated code
    if (part._code) {
      return part._code;
    }

    // Handle different part types from original parts
    switch (part.type) {
      case 'constant':
        // Convert to BigInt AT COMPILE TIME (v5's fast approach)
        if (part.isNumber) {
          // It's a number - convert to BigInt now and embed as literal
          const bigIntValue = ensureBigIntScaled(part.value);
          return `${bigIntValue}n`; // Embed as BigInt literal
        } else {
          // It's a constant from the constants registry
          return JSON.stringify(part.value);
        }

      case 'literal':
        return JSON.stringify(part.value);

      case 'reference':
        // Use custom reference function if provided
        // Don't coerce here - let operators handle coercion (needed for ?? to see null)
        if (this.settings.reference) {
          return `__ref(${JSON.stringify(part.value)}, __ctx)`;
        } else {
          // Fall back to default: access context property
          return `(__ctx && __ctx[${JSON.stringify(part.value)}] !== undefined ? __ctx[${JSON.stringify(part.value)}] : null)`;
        }

      case 'segment':
        // Recursively compile sub-parser
        return `(${part.value._generateCode(part.value._originalParts)})`;

      case 'function': {
        // Function call
        const funcData = part.value._functionData;
        if (!funcData) {
          throw new Error('Function missing metadata for compilation');
        }

        const argCodes = funcData.args.map(arg => {
          if (arg && arg._isLiteralObject) {
            return this._objectNodeToCode(arg._node);
          }
          return arg._generateCode(arg._originalParts);
        });
        return `__fns[${JSON.stringify(funcData.name)}].call(__ctx, ${argCodes.join(', ')})`;
      }

      default:
        throw new Error(`Unknown part type: ${part.type}`);
    }
  }

  toFunction() {
    // Return a direct callable function for maximum performance
    if (this._compiled) {
      return this._compiled;
    }

    // Fall back to bound evaluate method
    return this.evaluate.bind(this);
  }

  _parseArgument(arg) {
    const objectNode = this._parseObjectArgument(arg);
    if (objectNode) {
      return { _isLiteralObject: true, _node: objectNode };
    }
    return new exports.Parser(arg, this.settings);
  }

  _parseObjectArgument(arg) {
    const trimmed = arg.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return null;
    }

    const cacheKey = this._objectCacheKey(trimmed);
    const cached = internals.objectLiteralCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let parsed;
    try {
      // Enable advanced formula parsing to handle function-like values: fn({...})
      parsed = parse(trimmed, FORMULA_MARKER, true);
    } catch {
      return null;
    }

    // parseJSONX returns the original input when parsing fails
    if (parsed === trimmed) {
      return null;
    }

    const node = this._buildObjectNode(parsed);
    internals.objectLiteralCache.set(cacheKey, node);
    return node;
  }

  _objectCacheKey(source) {
    let id = internals.settingsIds.get(this.settings);
    if (!id) {
      id = ++internals.settingsIdCounter;
      internals.settingsIds.set(this.settings, id);
    }
    return `${id}::${source}`;
  }

  _buildObjectNode(value) {
    if (value === null) {
      return { kind: "literal", value: null };
    }
    const t = typeof value;
    if (t === "string") {
      const exprNode = this._maybeExpressionNode(value);
      if (exprNode) {
        return exprNode;
      }
      return { kind: "literal", value: this._coerceStringNumber(value) };
    }
    if (t === "number") {
      return { kind: "literal", value: ensureBigIntScaled(String(value)) };
    }
    if (t === "bigint" || t === "boolean") {
      return { kind: "literal", value };
    }
    if (Array.isArray(value)) {
      return { kind: "array", items: value.map(v => this._buildObjectNode(v)) };
    }
    if (t === "object") {
      const entries = [];
      for (const [k, v] of Object.entries(value)) {
        entries.push({ key: k, node: this._buildObjectNode(v) });
      }
      return { kind: "object", entries };
    }
    return { kind: "literal", value };
  }

  _maybeExpressionNode(str) {
    if (str.startsWith(FORMULA_MARKER)) {
      const inner = str.slice(FORMULA_MARKER.length);
      const parser = new exports.Parser(inner, this.settings);
      return { kind: "expr", parser };
    }
    return null;
  }

  _coerceStringNumber(value) {
    const trimmed = value.trim();
    if (isPureDecimalNumber(trimmed)) {
      return ensureBigIntScaled(trimmed);
    }
    return value;
  }

  _evaluateObjectNode(node, context) {
    if (!node || typeof node !== "object") {
      return node;
    }
    switch (node.kind) {
      case "literal":
        return node.value;
      case "expr":
        return node.parser.evaluate(context);
      case "array":
        return node.items.map(item => this._evaluateObjectNode(item, context));
      case "object": {
        const out = {};
        for (const { key, node: child } of node.entries) {
          out[key] = this._evaluateObjectNode(child, context);
        }
        return out;
      }
      default:
        return null;
    }
  }

  _objectNodeToCode(node) {
    switch (node.kind) {
      case "literal": {
        const value = node.value;
        if (value === null) return "null";
        if (typeof value === "bigint") return `${value}n`;
        if (typeof value === "string") return JSON.stringify(value);
        if (typeof value === "number") return JSON.stringify(value);
        if (typeof value === "boolean") return value ? "true" : "false";
        if (Array.isArray(value)) {
          const arrCode = value.map(v => this._objectNodeToCode(this._buildObjectNode(v))).join(", ");
          return `[${arrCode}]`;
        }
        if (value && typeof value === "object") {
          const parts = [];
          for (const [k, v] of Object.entries(value)) {
            const keyCode = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
            parts.push(`${keyCode}: ${this._objectNodeToCode(this._buildObjectNode(v))}`);
          }
          return `{ ${parts.join(", ")} }`;
        }
        throw new Error("Unsupported literal in object argument");
      }
      case "expr":
        return node.parser._generateCode(node.parser._originalParts);
      case "array": {
        const inner = node.items.map(item => this._objectNodeToCode(item)).join(", ");
        return `[${inner}]`;
      }
      case "object": {
        const parts = node.entries.map(({ key, node: child }) => {
          const keyCode = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
          return `${keyCode}: ${this._objectNodeToCode(child)}`;
        });
        return `{ ${parts.join(", ")} }`;
      }
      default:
        throw new Error("Unsupported object node");
    }
  }

  evaluate(context) {
    // Use compiled version if available
    if (this._compiled) {
      try {
        return this._compiled(context);
      } catch (err) {
        // Fall back to interpretation on runtime error
        console.warn('Compiled evaluation failed, falling back to interpretation:', err.message);
      }
    }

    // Original interpretation method
    const parts = this._parts.slice();

    // Prefix operators

    for (let i = parts.length - 2; i >= 0; --i) {
      const part = parts[i];
      if (part && part.type === "operator") {
        const current = parts[i + 1];
        parts.splice(i + 1, 1);
        const value = internals.evaluate(current, context);
        parts[i] = internals.single(part.value, value, this.numericMode);
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
          const result = internals.calculate(operator, left, right, this.numericMode);
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

internals.single = function (operator, value, numericMode = true) {
  if (operator === "!") {
    return value ? false : true;
  }

  // For n (negate) and p (plus), coerce to BigInt in numericMode
  const coerced = numericMode ? ensureBigIntScaled(value) : value;
  if (operator === "p") {
    return coerced;
  }

  // operator === 'n'
  const negative = numericMode ? -coerced : -value;
  if (negative === 0) {
    // Override -0
    return 0;
  }
  return negative;
};

internals.calculate = function (operator, left, right, numericMode = true) {
  if (operator === "??") {
    const result = internals.exists(left) ? left : right;
    if (!numericMode) return result;
    return internals.exists(result) ? ensureBigIntScaled(result) : null;
  }

  const mathOps = internals.mathOps;

  if (numericMode) {
    // Coerce ONCE before operations
    const leftVal = ensureBigIntScaled(left);
    const rightVal = ensureBigIntScaled(right);

    switch (operator) {
      case "^":
        return mathOps.pow(leftVal, rightVal);
      case "*":
        return mathOps.mul(leftVal, rightVal);
      case "/":
        return mathOps.div(leftVal, rightVal);
      case "%":
        return mathOps.modulo(leftVal, rightVal);
      case "+":
        return mathOps.add(leftVal, rightVal);
      case "-":
        return mathOps.sub(leftVal, rightVal);
      case "<":
        return leftVal < rightVal;
      case "<=":
        return leftVal <= rightVal;
      case ">":
        return leftVal > rightVal;
      case ">=":
        return leftVal >= rightVal;
      case "==":
        return leftVal === rightVal;
      case "!=":
        return leftVal !== rightVal;
      case "&&":
        return leftVal && rightVal;
      case "||":
        return leftVal || rightVal;
    }
  } else {
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
      case "&&":
        return left && right;
      case "||":
        return left || right;
    }
  }
  return null;
};

internals.exists = function (value) {
  return value !== null && value !== undefined;
};

const Parser = exports.Parser;

export { Parser, exports as default };
