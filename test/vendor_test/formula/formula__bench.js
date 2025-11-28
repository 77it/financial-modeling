//@ts-ignore Ignore Deno errors

// run it with `node --import ./__node__register-hooks.js`
// run it with `deno run --allow-read --allow-write --allow-net --allow-import`

import * as Benchmark from "benchmark";
import { Parser as OriginalParser } from "../../../vendor/formula/formula.js";
import { Parser as NewParser } from "../../../vendor/formula/formula_custom__accept_jsonx_as_func_par__v6_x.js";

const suite = new Benchmark.default.Suite('Formula Parser Benchmark');

// Benchmark configuration
const COUNTER = 1_000;

// Helper to convert BigInt to Number for operations
const toNum = (val) => typeof val === 'bigint' ? Number(val) : val;

// Sample functions for testing (handle both Number and BigInt)
const functions = {
  SUM: (...args) => args.map(toNum).reduce((a, b) => a + b, 0),
  MULTIPLY: (...args) => args.map(toNum).reduce((a, b) => a * b, 1),
  IF: (condition, trueVal, falseVal) => condition ? trueVal : falseVal,
  MAX: (...args) => Math.max(...args.map(toNum)),
  MIN: (...args) => Math.min(...args.map(toNum)),
  CONCAT: (...args) => args.map(toNum).join(''),
  AVERAGE: (...args) => {
    const nums = args.map(toNum);
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  },
  POW: (base, exp) => Math.pow(toNum(base), toNum(exp)),
  ABS: (val) => Math.abs(toNum(val)),
  ROUND: (val, decimals = 0) => {
    const num = toNum(val);
    const dec = toNum(decimals);
    return Number(Math.round(num + 'e' + dec) + 'e-' + dec);
  }
};

// Sample context for evaluation
const context = {
  price: 100,
  quantity: 5,
  discount: 0.1,
  taxRate: 0.15,
  shipping: 25,
  a: 10,
  b: 20,
  c: 30,
  d: 5,
  x: 100,
  y: 200,
  z: 300
};

// Test cases with increasing complexity
const testCases = [
  // Simplest function call
  { formula: "1 + 2 + 3", description: "Simplest function with constants" },

  // Simple function call
  { formula: "SUM(1, 2, 3)", description: "Simple function with constants" },

  // Function with variables
  { formula: "SUM(price, quantity, shipping)", description: "Function with variables" },

  // Nested functions
  { formula: "SUM(MULTIPLY(price, quantity), shipping)", description: "Nested functions" },

  // Complex nested with arithmetic
  { formula: "MULTIPLY(SUM(price, shipping), quantity) * (1 - discount)", description: "Complex nested with arithmetic" },

  // Conditional logic
  { formula: "IF(price > 50, MULTIPLY(price, 0.9), price)", description: "Conditional function" },

  // Multiple nested levels
  { formula: "SUM(MULTIPLY(price, quantity), MULTIPLY(shipping, 2), IF(discount > 0, MULTIPLY(price, quantity, discount), 0))", description: "Deep nesting" },

  // Complex calculation with many functions
  { formula: "ROUND(MULTIPLY(SUM(price, shipping), quantity, (1 - discount), (1 + taxRate)), 2)", description: "Complex calculation" },

  // Mixed operations
  { formula: "MAX(SUM(a, b), MULTIPLY(c, d)) + MIN(x, y, z)", description: "Mixed operations" },

  // Very complex
  { formula: "IF(SUM(price, shipping) > 100, ROUND(MULTIPLY(SUM(price, shipping), quantity, (1 - discount)), 2), MULTIPLY(price, quantity))", description: "Very complex formula" },

  // String operations
  { formula: "CONCAT('Total: ', SUM(price, quantity))", description: "String concatenation" },

  // Multiple arithmetic operations
  { formula: "SUM(a * 2, b / 2, c + 10, d - 5)", description: "Function with arithmetic args" },

  // Complex with all features
  { formula: "AVERAGE(POW(a, 2), POW(b, 2), POW(c, 2)) + IF(ABS(x - y) > 50, MAX(x, y), MIN(x, y))", description: "All features combined" }
];

// Add benchmarks for each test case
testCases.forEach(({ formula, description }) => {
  // Original parser test
  suite.add(`Original: ${description}`, function() {
    const parser = new OriginalParser(formula, { functions });
    for (let i = 0; i < COUNTER; i++) {
      parser.evaluate(context);
    }
  });

  // New parser test
  suite.add(`New:      ${description}`, function() {
    const parser = new NewParser(formula, { functions });
    for (let i = 0; i < COUNTER; i++) {
      parser.evaluate(context);
    }
  });
});

// Add a combined test that runs all formulas
suite.add(`Original: All formulas combined (${testCases.length} formulas)`, function() {
  for (let i = 0; i < COUNTER; i++) {
    testCases.forEach(({ formula }) => {
      const parser = new OriginalParser(formula, { functions });
      parser.evaluate(context);
    });
  }
});

suite.add(`New:      All formulas combined (${testCases.length} formulas)`, function() {
  for (let i = 0; i < COUNTER; i++) {
    testCases.forEach(({ formula }) => {
      const parser = new NewParser(formula, { functions });
      parser.evaluate(context);
    });
  }
});

// Add listeners
suite
  .on('cycle', function(/** @type {Benchmark.Event} */ event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('\n' + '='.repeat(80));
    console.log('BENCHMARK COMPLETE');
    console.log('='.repeat(80));

    // Group results by test case
    const results = {};
    this.forEach(function(bench) {
      const name = bench.name;
      const parts = name.split(': ');
      const version = parts[0];
      const testName = parts[1];

      if (!results[testName]) {
        results[testName] = {};
      }
      results[testName][version] = bench;
    });

    // Print comparison for each test
    console.log('\nPer-Test Comparison:');
    console.log('-'.repeat(80));
    Object.entries(results).forEach(([testName, versions]) => {
      const original = versions['Original'];
      const newVersion = versions['New'];

      if (original && newVersion) {
        const originalHz = original.hz;
        const newHz = newVersion.hz;
        const diff = ((newHz - originalHz) / originalHz * 100).toFixed(2);
        const faster = newHz > originalHz ? 'New' : 'Original';
        const percentage = Math.abs(diff);

        console.log(`\n${testName}:`);
        console.log(`  Original: ${originalHz.toFixed(2)} ops/sec`);
        console.log(`  New:      ${newHz.toFixed(2)} ops/sec`);
        console.log(`  Winner:   ${faster} is ${percentage}% ${newHz > originalHz ? 'faster' : 'slower'}`);
      }
    });

    console.log('\n' + '='.repeat(80));
  })
  .on('error', function (/** @type {Benchmark.Event} */ event) {
    console.error(`Test "${event.target.name}" failed with error:`);
    // @ts-ignore ignore Deno errors
    console.error(event.target.error);
  })
  // run async
  .run({ 'async': true });
