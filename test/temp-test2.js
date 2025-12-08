//@ts-nocheck

import { Parser } from '../vendor/formula/old/formula_v5_eval2cached_x.js';
import { ensureBigIntScaled } from '../vendor/formula/adapters/decimal-adapter2.js';
import { convertWhenFmlEvalRequiresIt } from './vendor_test/formula/_formula__tests_settings.js';
import { parseJSONrelaxed } from '../src/lib/json.js';

console.log(ensureBigIntScaled("1_0"));
console.log(ensureBigIntScaled("+1_0"));

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  Formula V4: Compile-Time BigInt + Decimal Adapter      ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// ============================================================================
// EXAMPLE 1: Compile-Time BigInt Conversion
// ============================================================================
console.log('📌 EXAMPLE 1: Compile-Time BigInt Conversion\n');

const parser1 = new Parser('100_000_000_000_000_999_888_777_666_555_444.12345678901234567890 + "200.50" * 3');
const fn1 = parser1.toFunction();

console.log('Formula: 100 + 200.50 * 3');
console.log('\n🔍 Generated Code:');
console.log(parser1._compiled.toString());
console.log('\n✅ Notice:');
console.log('  - Numbers are converted to BigInt ONCE during compilation');
console.log('  - Embedded as BigInt literals (e.g., 1000000n)');
console.log('  - NOT converted at runtime!\n');

console.log('Executing...');
const result1 = fn1({});
console.log(`\nResult: ${result1} (BigInt)\n`);
console.log('─'.repeat(60) + '\n');

// ============================================================================
// EXAMPLE 2: All Math Operations Use Decimal Adapter
// ============================================================================
console.log('📌 EXAMPLE 2: Math Operations via Decimal Adapter\n');

const parser2 = new Parser('a + b * c - d / e');
const fn2 = parser2.toFunction();

console.log('Formula: a + b * c - d / e');
console.log('\n🔍 Generated Code:');
console.log(parser2._compiled.toString());
console.log('\n✅ Notice:');
console.log('  - + becomes __mathOps.add(...)');
console.log('  - * becomes __mathOps.mul(...)');
console.log('  - - becomes __mathOps.sub(...)');
console.log('  - / becomes __mathOps.div(...)');
console.log('  - All operations logged by adapter\n');

console.log('Executing with: a=100, b=50, c=2, d=200, e=4');
const result2 = fn2({
  a: 1000000n,  // 100.0000
  b: 500000n,   // 50.0000
  c: 20000n,    // 2.0000
  d: 2000000n,  // 200.0000
  e: 40000n     // 4.0000
});
console.log(`\nResult: ${result2}\n`);
console.log('─'.repeat(60) + '\n');

// ============================================================================
// EXAMPLE 3: All Operators Covered
// ============================================================================
console.log('📌 EXAMPLE 3: All Math Operators\n');

const testCases = [
  { formula: '10 + 5', desc: 'Addition' },
  { formula: '10 - 5', desc: 'Subtraction' },
  { formula: '10 * 5', desc: 'Multiplication' },
  { formula: '10 / 5', desc: 'Division' },
  { formula: '10 ^ 2', desc: 'Power' },
  { formula: '10 % 3', desc: 'Modulo' },
  { formula: '-10', desc: 'Unary minus' }
];

testCases.forEach(({ formula, desc }) => {
  const parser = new Parser(formula);
  const fn = parser.toFunction();

  console.log(`${desc}: ${formula}`);
  const result = fn({});
  console.log(`  Result: ${result}\n`);
});

console.log('─'.repeat(60) + '\n');

// ============================================================================
// EXAMPLE 4: String Concatenation (Native)
// ============================================================================
console.log('📌 EXAMPLE 4: String Concatenation Stays Native\n');

const parser4 = new Parser('"Hello " + name + "!"');
const fn4 = parser4.toFunction();

console.log('Formula: "Hello " + name + "!"');
console.log('\n🔍 Generated Code:');
console.log(parser4._compiled.toString());
console.log('\n✅ Notice:');
console.log('  - String concatenation uses native + operator');
console.log('  - NOT using __mathOps.add() for strings\n');

console.log('Executing with: name="World"');
const result4 = fn4({ name: 'World' });
console.log(`Result: ${result4}\n`);
console.log('─'.repeat(60) + '\n');

// ============================================================================
// EXAMPLE 5: Custom Reference Function
// ============================================================================
console.log('📌 EXAMPLE 5: Custom Reference with Nested Paths\n');

function customReference(varName, context) {
  const parts = varName.split('.');
  let value = context;
  for (const part of parts) {
    if (value == null) return null;
    value = value[part];
  }
  return value;
}

const parser5 = new Parser('user.balance * 1.05', {
  reference: customReference
});
const fn5 = parser5.toFunction();

console.log('Formula: user.balance * 1.05');
console.log('Context: { user: { balance: 1000000n } } // 100.0000');
console.log('\nExecuting...');
const result5 = fn5({
  user: { balance: 1000000n }  // calling a function passing context
});
console.log(`Result: ${result5} // Should be 105.0000\n`);
console.log('─'.repeat(60) + '\n');

// ============================================================================
// EXAMPLE 6: Function Registry
// ============================================================================
{
  console.log('📌 EXAMPLE 6: Callable Functions\n');

  const functions = {
    sum: function (...args) {
      console.log(`  [sum] called with ${args.length} arguments`);
      return args.reduce((a, b) => a + b, 0n);
    },

    avg: function (...args) {
      console.log(`  [avg] called with ${args.length} arguments`);
      const total = args.reduce((a, b) => a + b, 0n);
      return total / BigInt(args.length);
    }
  };

  const parser6 = new Parser('avg(a, b, c) * 100', {
    functions
  });
  const fn6 = parser6.toFunction();

  console.log('Formula: avg(a, b, c) * 100');
  console.log('Context: { a: 100000, b: 200000, c: 300000 }');
  console.log('\nExecuting...');
  const result6 = fn6({
    a: 100000n,
    b: 200000n,
    c: 300000n
  });
  console.log(`Result: ${result6}\n`);
  console.log('─'.repeat(60) + '\n');
}
// ============================================================================
// EXAMPLE 6b: Function with json parameter
// ============================================================================
{
  console.log('📌 EXAMPLE 6b: Function with json parameter\n');

  const functions = {
    sum: function (args) {
      return args.x + args.y + args.z;
    },

    avg: function (args) {
      const total = args.a + args.b + args.c;
      return BigInt(total) / BigInt(3);
    }
  };

  const parser6 = new Parser('avg({a: 10, b: sum({x: 1, y: "988_444_444_333_333_222_111.999_888_77777", z: 10}), c: 300_888_777_666_555_444_333_222_111}) * 100', {
    functions
  });
  const fn6 = parser6.toFunction();

  console.log('\n🔍 Generated Code:');
  console.log(parser6._compiled.toString());

  console.log('Formula: avg(a, b, c) * 100');
  console.log('Context: { a: 100000, b: 200000, c: 300000 }');
  console.log('\nExecuting...');
  const result6 = fn6({
    a: 100000n,
    b: 200000n,
    c: 300000n
  });
  console.log(`Result: ${result6}\n`);
  console.log('─'.repeat(60) + '\n');
}
// ============================================================================
// EXAMPLE 7: Complex Real-World Formula
// ============================================================================
console.log('📌 EXAMPLE 7: Real-World E-commerce Formula\n');

const pricing = {
  subtotal: function(...items) {
    return items.reduce((a, b) => a + b, 0n);
  },

  applyDiscount: function(amount, rate) {
    // rate is in basis points (e.g., 1000 = 10%)
    const discount = (amount * rate) / 10000n;
    return amount - discount;
  }
};

function priceReference(varName, context) {
  const parts = varName.split('.');
  let value = context;
  for (const part of parts) {
    if (value == null) return null;
    if (!isNaN(part)) {
      value = value[parseInt(part)];
    } else {
      value = value[part];
    }
  }
  return value;
}

const formulaString = 'applyDiscount(subtotal(items.0.total, items.1.total, items.2.total), discount) + shipping';

const parser7 = new Parser(formulaString, {
  reference: priceReference,
  functions: pricing
});
const fn7 = parser7.toFunction();

console.log('Formula:');
console.log('  applyDiscount(subtotal(items.0.total, items.1.total, items.2.total), discount) + shipping');
console.log('\nContext:');
const orderContext = {
  items: [
    { total: 500000n },   // $50.00
    { total: 750000n },   // $75.00
    { total: 1000000n }   // $100.00
  ],
  discount: 1000n,        // 10% (1000 basis points)
  shipping: 100000n       // $10.00
};
console.log(JSON.stringify(orderContext, (k, v) => typeof v === 'bigint' ? v.toString() + 'n' : v, 2));

console.log('\nExecuting...');
const result7 = fn7(orderContext);
console.log(`\nResult: ${result7}`);
console.log(`In dollars: $${(Number(result7) / 10000).toFixed(2)}\n`);
console.log('─'.repeat(60) + '\n');

// ============================================================================
// EXAMPLE 8: Inspect Generated Code
// ============================================================================
console.log('📌 EXAMPLE 8: Inspect Complete Generated Code\n');

const parser8 = new Parser('(a + b) * 100 - c / 2', {
  reference: (v, ctx) => ctx[v]
});
const fn8 = parser8.toFunction();

console.log('Formula: (a + b) * 100 - c / 2');
console.log('\n📋 Complete Generated Function:\n');
console.log(parser8._compiled.toString());
console.log('\n✅ Key Points:');
console.log('  1. Numbers converted to BigInt literals at compile time (1000000n)');
console.log('  2. All math ops use __mathOps (add, mul, sub, div)');
console.log('  3. Variables resolved via __ref()');
console.log('  4. Zero runtime overhead for number conversion\n');
console.log('─'.repeat(60) + '\n');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  ✅ ALL REQUIREMENTS IMPLEMENTED                         ║');
console.log('╠══════════════════════════════════════════════════════════╣');
console.log('║                                                          ║');
console.log('║  1. ✅ BigInt conversion at COMPILE TIME                ║');
console.log('║     - Numbers converted once during parsing             ║');
console.log('║     - Embedded as BigInt literals (e.g., 1000000n)      ║');
console.log('║     - Zero runtime conversion overhead                  ║');
console.log('║                                                          ║');
console.log('║  2. ✅ All math ops use decimal-adapter2.js             ║');
console.log('║     - + → __mathOps.add(a, b)                           ║');
console.log('║     - - → __mathOps.sub(a, b)                           ║');
console.log('║     - * → __mathOps.mul(a, b)                           ║');
console.log('║     - / → __mathOps.div(a, b)                           ║');
console.log('║     - ^ → __mathOps.pow(a, b)                           ║');
console.log('║     - % → __mathOps.modulo(a, b)                        ║');
console.log('║                                                          ║');
console.log('║  3. ✅ String concatenation stays native                ║');
console.log('║     - "Hello " + name uses native +                     ║');
console.log('║                                                          ║');
console.log('║  4. ✅ Unary minus with prepended sign                  ║');
console.log('║     - -100 becomes -(1000000n)                          ║');
console.log('║                                                          ║');
console.log('║  5. ✅ Custom reference function                        ║');
console.log('║     - Variables call reference(varName, context)        ║');
console.log('║                                                          ║');
console.log('║  6. ✅ Function registry support                        ║');
console.log('║     - Functions callable with evaluated args            ║');
console.log('║                                                          ║');
console.log('╚══════════════════════════════════════════════════════════╝');






















/**
 * @param {string} value
 * @return {number}
 */
function q (value) {
  // if value is missing opening or closing brackets, add them
  if (!value.trim().startsWith("{"))
    value = "{" + value;
  if (!value.trim().endsWith("}"))
    value = value + "}";

  return 50;
}

const functions = {
  Q: q,
  q: q
};

/**
 * @param {string} value
 * @return {bigint}
 */
function q_quick (value) {
  return 50n;
}

const functions_quick = {
  Q: q_quick,
  q: q_quick
};

const multiplier = 1;

/**
 * New v5 signature: (name, context) => value
 * Still supports closures - can capture external state
 * @param {string} name
 * @param {*} context
 * @return {bigint}
 */
const reference = function (name, context) {
  // Closure example: can access external variables
  // const externalData = { ... };  // Would be captured here

  switch (name) {
    case 'a':
      return ensureBigIntScaled(0 + multiplier);
    case 'a.b':
      return ensureBigIntScaled('2');
    case 'b':
      return ensureBigIntScaled('3');
    case '$':
      return ensureBigIntScaled('1');
    case '$.ciao':
      return ensureBigIntScaled('4');
    default:
      throw new Error('unrecognized value');
  }
};

// shared data
let data;

const formula1 = new Parser('a + 1.99 + a.b + (((a+1)*2)+1) + a + $.ciao + $ + $.ciao', { reference: reference }).toFunction();
const expected1 = convertWhenFmlEvalRequiresIt(19.99);

const fmlText2 = "Q(\"{a: 11, b: mam ma, c: null, t: 2024-01-12:2025-05-07, e: 7\") + q(\"a: 55, b: -1000, x: 'ciao,, ciao'}\")";  //missing closing / opening brackets
const fmlText2_simple = "50 + Q('ten')";
const expected2 = convertWhenFmlEvalRequiresIt(100);
const formula2 = new Parser(fmlText2, { functions }).toFunction();

const formula3 = new Parser(fmlText2, { functions: functions_quick }).toFunction();

const formula4 = new Parser(fmlText2_simple, { functions: functions_quick }).toFunction();

console.log(formula1());
console.log(`Expected: ${expected1}`);
console.log(formula2());
console.log(`Expected: ${expected2}`);
console.log(formula3());
console.log(formula4());
console.log('All done.');
