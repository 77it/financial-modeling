//@ts-nocheck

import { Parser } from '../vendor/formula/formula_v7_x.js';







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
