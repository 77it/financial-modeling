//@ts-nocheck

// V7.1 ULTRA-OPTIMIZED NATIVE MODE
// Targeting the remaining 25-30% gap to original

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

import { Parser } from '../../../vendor/formula/formula_custom__accept_jsonx_as_func_par__v7_1.js';
import { parseJSONrelaxed } from '../../../src/lib/json.js';

function parseJSONX (value) {
  try {
    if (value == null) return undefined;
    return parseJSONrelaxed(value);
  } catch (e) {
    return undefined;
  }
}

function q (value) {
  if (!value.trim().startsWith("{")) value = "{" + value;
  if (!value.trim().endsWith("}")) value = value + "}";
  let parsed = parseJSONX(value);
  return 50;
}

const functions = { Q: q, q: q };

function q_quick (value) {
  return 50;
}

const functions_quick = { Q: q_quick, q: q_quick };

const reference = function (name) {
  function resolve(context) {
    switch (name) {
      case 'a': return 1;
      case 'a.b': return 2;
      case 'b': return 3;
      case '$': return 1;
      case '$.ciao': return 4;
      default: return undefined;
    }
  }
  return resolve;
};

const formula1 = new Parser('a + 1.99 + a.b + (((a+1)*2)+1) + a + $.ciao + $ + $.ciao', {
  reference: reference,
  useDecimal: false,
  enableJsonx: false
});

const fmlText2 = "Q(\"{a: 11, b: mam ma, c: null, t: 2024-01-12:2025-05-07, e: 7\") + q(\"a: 55, b: -1000, x: 'ciao,, ciao'}\")";
const fmlText2_simple = "50 + Q('ten')";
const formula2 = new Parser(fmlText2, { functions, useDecimal: false, enableJsonx: false });
const formula3 = new Parser(fmlText2, { functions: functions_quick, useDecimal: false, enableJsonx: false });
const formula4 = new Parser(fmlText2_simple, { functions: functions_quick, useDecimal: false, enableJsonx: false });

console.log('V7.1 Results:');
console.log('Formula 1:', formula1.evaluate());
console.log('Formula 2:', formula2.evaluate());
console.log('Formula 3:', formula3.evaluate());
console.log('Formula 4:', formula4.evaluate());

suite.add('hapi formula calling function with a string parameter parsed as JSONX', function() {
  formula2.evaluate();
})
  .add('hapi formula with custom variable resolver', function() {
    formula1.evaluate();
  })
  .add('quick functions call', function() {
    formula3.evaluate();
  })
  .add('simple formula + quick function call', function() {
    formula4.evaluate();
  })
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .on('error', function (event) {
    console.error(`Test "${event.target.name}" failed with error:`);
    console.error(event.target.error);
  })
  .run({ 'async': true });
