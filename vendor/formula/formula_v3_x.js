//@ts-nocheck

// Import math operations from decimal-adapter
import { add, sub, mul, div, pow, modulo, ensureBigIntScaled } from './adapters/decimal-adapter2.js';

var exports = {};

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
  numberRx: /^(?:[0-9]*(\.[0-9]*)?){1}$/,
  tokenRx: /^[\w\$\#\.\@\:\{\}]+$/,
  symbol: Symbol("formula"),
  settings: Symbol("settings")
};

// Helper functions for compiled code
internals.helpers = {
  // Null coalescing
  nullCoalesce(left, right) {
    return (left !== null && left !== undefined) ? right : right;
  },

  // Logical NOT
  not(value) {
    return value ? false : true;
  }
};

// Math operations from decimal-adapter
internals.mathOps = {
  add,
  sub,
  mul,
  div,
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
      compile: true     // Enable compilation by default
    }, options);

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
      } else if (current.match(internals.numberRx)) {
        // Number - store as string for later conversion
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
        const refFn = this.settings.reference;
        const varName = part.value;
        return function(context) {
          return refFn(varName, context);
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

    // Store for compilation
    const functionData = {
      name,
      args
    };

    const evaluator = function (context) {
      const innerValues = [];
      for (const arg of args) {
        innerValues.push(arg.evaluate(context));
      }
      return method.call(context, ...innerValues);
    };

    evaluator._functionData = functionData;
    return evaluator;
  }

  _compile() {
    // Generate JavaScript code from the AST
    const code = this._generateCode(this._originalParts);

    // Create the compiled function
    // Parameters:
    // - __ctx: context object
    // - __h: helper functions
    // - __fns: functions registry
    // - __ref: custom reference function (if provided)
    // - __mathOps: math operations (add, sub, mul, div, pow, modulo)
    return new Function('__ctx', '__h', '__fns', '__ref', '__mathOps', `'use strict'; return ${code}`);
  }

  _generateCode(parts) {
    // We need to respect operator precedence
    // Process prefix operators first (from right to left)
    // Then process binary operators by precedence order

    let code = this._generateCodeWithPrecedence(parts);
    return code;
  }

  _isStringOperation(parts, operatorIndex) {
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

    // Handle prefix operators (!, n) from right to left
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
          // Unary minus - just prepend minus sign to BigInt
          prefixCode = `(-${nextCode})`;
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
              opCode = `__h.nullCoalesce(${leftCode}, ${rightCode})`;
              break;
            case '+':
              if (isStringOp) {
                // Native string concatenation
                opCode = `(${leftCode} + ${rightCode})`;
              } else {
                // BigInt addition via adapter
                opCode = `__mathOps.add(${leftCode}, ${rightCode})`;
              }
              break;
            case '-':
              opCode = `__mathOps.sub(${leftCode}, ${rightCode})`;
              break;
            case '*':
              opCode = `__mathOps.mul(${leftCode}, ${rightCode})`;
              break;
            case '/':
              opCode = `__mathOps.div(${leftCode}, ${rightCode})`;
              break;
            case '%':
              opCode = `__mathOps.modulo(${leftCode}, ${rightCode})`;
              break;
            case '^':
              opCode = `__mathOps.pow(${leftCode}, ${rightCode})`;
              break;
            case '<':
              opCode = `(${leftCode} < ${rightCode})`;
              break;
            case '<=':
              opCode = `(${leftCode} <= ${rightCode})`;
              break;
            case '>':
              opCode = `(${leftCode} > ${rightCode})`;
              break;
            case '>=':
              opCode = `(${leftCode} >= ${rightCode})`;
              break;
            case '==':
              opCode = `(${leftCode} === ${rightCode})`;
              break;
            case '!=':
              opCode = `(${leftCode} !== ${rightCode})`;
              break;
            case '&&':
              opCode = `(${leftCode} && ${rightCode})`;
              break;
            case '||':
              opCode = `(${leftCode} || ${rightCode})`;
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
        // Convert to BigInt AT COMPILE TIME
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
        if (this.settings.reference) {
          return `__ref(${JSON.stringify(part.value)}, __ctx)`;
        } else {
          // Fall back to default: access context property
          return `(__ctx && __ctx[${JSON.stringify(part.value)}] !== undefined ? __ctx[${JSON.stringify(part.value)}] : null)`;
        }

      case 'segment':
        // Recursively compile sub-parser
        return `(${part.value._generateCode(part.value._originalParts)})`;

      case 'function':
        // Function call
        const funcData = part.value._functionData;
        if (!funcData) {
          throw new Error('Function missing metadata for compilation');
        }

        const argCodes = funcData.args.map(arg => arg._generateCode(arg._originalParts));
        return `__fns[${JSON.stringify(funcData.name)}].call(__ctx, ${argCodes.join(', ')})`;

      default:
        throw new Error(`Unknown part type: ${part.type}`);
    }
  }

  toFunction() {
    // Return a direct callable function for maximum performance
    if (this._compiled) {
      const compiled = this._compiled;
      const helpers = internals.helpers;
      const functions = this.settings.functions;
      const reference = this.settings.reference;
      const mathOps = internals.mathOps;

      // Return a wrapper that binds all dependencies
      return function(context) {
        return compiled(context, helpers, functions, reference, mathOps);
      };
    }

    // Fall back to bound evaluate method
    return this.evaluate.bind(this);
  }

  evaluate(context) {
    // Use compiled version if available
    if (this._compiled) {
      try {
        return this._compiled(context, internals.helpers, this.settings.functions, this.settings.reference, internals.mathOps);
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
  return null;
};

internals.exists = function (value) {
  return value !== null && value !== undefined;
};

const Parser = exports.Parser;

export { Parser, exports as default };