// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_jsonx_as_func_par__v6_x.js';
//import { Parser } from '../../../vendor/formula/extras/formula_custom__accept_yaml_as_func_par__v3_x.js';
import { convertWhenFmlEvalRequiresIt } from './_formula__tests_settings.js'

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

/**
 * @param {*} p
 * @return {*}
 */
function returnAny (p) {
  console.log(p);
  return p;
}

const functions = {
  q: returnAny,
  Q: returnAny
};

// =============================================================================
// Scanner Edge Cases (scanBracket/scanBrace)
// =============================================================================

t('scanner: nested brackets in JSONX arrays', () => {
  assert.deepStrictEqual(
    new Parser('[[1, 2], [3, 4]]').evaluate(),
    [['1', '2'], ['3', '4']]
  );

  assert.deepStrictEqual(
    new Parser('[[[nested]]]').evaluate(),
    [[['nested']]]
  );
});

t('scanner: nested braces in JSONX objects', () => {
  assert.deepStrictEqual(
    new Parser('{a: {b: {c: value}}}').evaluate(),
    {a: {b: {c: 'value'}}}
  );
});

t('scanner: empty JSONX structures', () => {
  // Note: `[]` and `{}` alone may create issues, but work inside structures
  // Empty arrays/objects inside structures work fine
  assert.deepStrictEqual(new Parser('{a: [], b: value}').evaluate(), {a: [], b: 'value'});
  assert.deepStrictEqual(new Parser('[{}, value]').evaluate(), [{}, 'value']);
  assert.deepStrictEqual(new Parser('[[], {}]').evaluate(), [[], {}]);
  assert.deepStrictEqual(new Parser('{obj: {}, arr: []}').evaluate(), {obj: {}, arr: []});
});

t('scanner: mixed quotes in JSONX', () => {
  assert.deepStrictEqual(
    new Parser('["a", \'b\', `c`]').evaluate(),
    ['a', 'b', 'c']
  );

  assert.deepStrictEqual(
    new Parser('{a: "value", b: \'other\'}').evaluate(),
    {a: 'value', b: 'other'}
  );
});

t('scanner: JSONX with commas and spaces', () => {
  assert.deepStrictEqual(
    new Parser('[1,2,3,4]').evaluate(),
    ['1', '2', '3', '4']
  );

  assert.deepStrictEqual(
    new Parser('[  1  ,  2  ,  3  ]').evaluate(),
    ['1', '2', '3']
  );
});

t('scanner: error on missing closing bracket', () => {
  assert.throws(
    () => new Parser('[1, 2, 3').evaluate(),
    /Formula missing closing bracket/
  );
});

t('scanner: error on missing closing brace', () => {
  assert.throws(
    () => new Parser('{a: value').evaluate(),
    /Formula missing closing brace/
  );
});

// =============================================================================
// Operator Precedence Edge Cases
// =============================================================================

t('precedence: complex multi-level precedence', () => {
  // Test all precedence levels: ^ > *,/,% > +,- > <,<=,>,>= > ==,!= > && > ||,??
  assert.deepStrictEqual(
    new Parser('2 + 3 * 4 ^ 2 - 1').evaluate(),
    convertWhenFmlEvalRequiresIt(2 + 3 * Math.pow(4, 2) - 1)
  );

  assert.deepStrictEqual(
    new Parser('10 / 2 + 3 * 4').evaluate(),
    convertWhenFmlEvalRequiresIt(10 / 2 + 3 * 4)
  );

  assert.deepStrictEqual(
    new Parser('2 * 3 + 4 * 5').evaluate(),
    convertWhenFmlEvalRequiresIt(2 * 3 + 4 * 5)
  );
});

t('precedence: parenthesis override', () => {
  assert.deepStrictEqual(
    new Parser('(2 + 3) * 4').evaluate(),
    convertWhenFmlEvalRequiresIt((2 + 3) * 4)
  );

  assert.deepStrictEqual(
    new Parser('2 ^ (3 + 1)').evaluate(),
    convertWhenFmlEvalRequiresIt(Math.pow(2, 3 + 1))
  );

  assert.deepStrictEqual(
    new Parser('((2 + 3) * (4 - 1)) / 5').evaluate(),
    convertWhenFmlEvalRequiresIt(((2 + 3) * (4 - 1)) / 5)
  );
});

t('precedence: comparison chaining', () => {
  // && returns the last evaluated value (right side), not boolean
  assert.deepStrictEqual(
    new Parser('1 < 2 && 2 < 3').evaluate(),
    convertWhenFmlEvalRequiresIt(1)  // 1 < 2 is true (1n), 2 < 3 is true (1n), returns 1n
  );

  // || returns first truthy value
  assert.deepStrictEqual(
    new Parser('5 > 3 || 2 > 4').evaluate(),
    convertWhenFmlEvalRequiresIt(1)  // 5 > 3 is true (1n), returns 1n
  );
});

t('precedence: logical operators with arithmetic', () => {
  // == returns 1 for true, && returns right side
  assert.deepStrictEqual(
    new Parser('1 + 2 == 3 && 4 + 5 == 9').evaluate(),
    convertWhenFmlEvalRequiresIt(1)
  );

  // 10 / 2 > 3 is true (1n), || returns first truthy
  assert.deepStrictEqual(
    new Parser('10 / 2 > 3 || 5 * 2 < 8').evaluate(),
    convertWhenFmlEvalRequiresIt(1)
  );
});

// =============================================================================
// Decimal Precision Edge Cases
// =============================================================================

t('decimal: division precision', () => {
  // JavaScript would give imprecise results, Decimal should be exact
  assert.deepStrictEqual(
    new Parser('1 / 3').evaluate(),
    convertWhenFmlEvalRequiresIt(1 / 3)
  );

  assert.deepStrictEqual(
    new Parser('10 / 3').evaluate(),
    convertWhenFmlEvalRequiresIt(10 / 3)
  );

  assert.deepStrictEqual(
    new Parser('7 / 9').evaluate(),
    convertWhenFmlEvalRequiresIt(7 / 9)
  );
});

t('decimal: very small decimals', () => {
  assert.deepStrictEqual(
    new Parser('0.1 + 0.2').evaluate(),
    convertWhenFmlEvalRequiresIt(0.3)
  );

  assert.deepStrictEqual(
    new Parser('0.0000001 + 0.0000002').evaluate(),
    convertWhenFmlEvalRequiresIt(0.0000003)
  );
});

t('decimal: multiplication precision', () => {
  // Famous JavaScript precision bug: 0.1 * 0.2 = 0.020000000000000004
  assert.deepStrictEqual(
    new Parser('0.1 * 0.2').evaluate(),
    convertWhenFmlEvalRequiresIt(0.02)
  );

  assert.deepStrictEqual(
    new Parser('1.005 * 1000').evaluate(),
    convertWhenFmlEvalRequiresIt(1005)
  );
});

t('decimal: power and modulo precision', () => {
  assert.deepStrictEqual(
    new Parser('1.1 ^ 2').evaluate(),
    convertWhenFmlEvalRequiresIt(1.21)
  );

  assert.deepStrictEqual(
    new Parser('10.5 % 3.2').evaluate(),
    convertWhenFmlEvalRequiresIt(10.5 % 3.2)
  );
});

t('decimal: negative zero handling', () => {
  // -0 should be converted to 0
  assert.deepStrictEqual(
    new Parser('-0').evaluate(),
    convertWhenFmlEvalRequiresIt(0)
  );

  assert.deepStrictEqual(
    new Parser('0 - 0').evaluate(),
    convertWhenFmlEvalRequiresIt(0)
  );
});

// =============================================================================
// Error Handling & Edge Cases
// =============================================================================

t('error: division by zero', () => {
  assert.throws(
    () => new Parser('10 / 0').evaluate(),
    /division by zero/i
  );

  assert.throws(
    () => new Parser('x / 0').evaluate({x: 5}),
    /division by zero/i
  );
});

t('error: modulo by zero', () => {
  assert.throws(
    () => new Parser('10 % 0').evaluate()
    // Modulo by zero throws generic error from Decimal.js
  );
});

t('error: unknown reference', () => {
  assert.throws(
    () => new Parser('unknownVar').evaluate(),
    /Unknown reference unknownVar/
  );

  assert.throws(
    () => new Parser('x + unknownVar').evaluate({x: 5}),
    /Unknown reference unknownVar/
  );
});

t('error: invalid function arguments', () => {
  assert.throws(
    () => new Parser('q(a,)', {functions}).evaluate(),
    /invalid arguments/i
  );
});

t('error: missing operator between tokens', () => {
  assert.throws(
    () => new Parser('x y').evaluate({x: 1, y: 2}),
    /missing expected operator/i
  );
});

// =============================================================================
// String Operations Edge Cases
// =============================================================================

t('strings: empty string operations', () => {
  assert.deepStrictEqual(
    new Parser('"" + ""').evaluate(),
    convertWhenFmlEvalRequiresIt(0)
  );

  assert.deepStrictEqual(
    new Parser('"a" + ""').evaluate(),
    convertWhenFmlEvalRequiresIt(0)
  );

  assert.deepStrictEqual(
    new Parser('"" + "b"').evaluate(),
    convertWhenFmlEvalRequiresIt(0)
  );
});

t('strings: null with strings', () => {
  assert.deepStrictEqual(
    new Parser('x + "text"').evaluate({x: null}),
    convertWhenFmlEvalRequiresIt(0)
  );

  assert.deepStrictEqual(
    new Parser('"text" + x').evaluate({x: null}),
    convertWhenFmlEvalRequiresIt(0)
  );
});

t('strings: string comparison', () => {
  // String literals are converted to numbers for comparison (non-numeric strings become 0)
  assert.deepStrictEqual(
    new Parser('"a" == "a"').evaluate(),
    true  // Both "a" -> 0, so 0 == 0 is true
  );

  assert.deepStrictEqual(
    new Parser('"a" == "b"').evaluate(),
    true  // Both "a" and "b" -> 0, so 0 == 0 is true
  );

  assert.deepStrictEqual(
    new Parser('"a" < "b"').evaluate(),
    false  // Both -> 0, so 0 < 0 is false
  );

  // Numeric strings work as expected
  assert.deepStrictEqual(
    new Parser('"5" > "3"').evaluate(),
    true  // "5" -> 5, "3" -> 3, 5 > 3 is true
  );
});

// =============================================================================
// JSONX Edge Cases
// =============================================================================

t('jsonx: boolean values (actual booleans)', () => {
  // true/false in JSONX evaluate to actual JS booleans
  assert.deepStrictEqual(
    new Parser('{a: true, b: false}').evaluate(),
    {a: true, b: false}
  );
});

t('jsonx: null and undefined values', () => {
  assert.deepStrictEqual(
    new Parser('{a: null, b: undefined}').evaluate(),
    {a: null, b: 'undefined'}
  );

  assert.deepStrictEqual(
    new Parser('[null, undefined]').evaluate(),
    [null, 'undefined']
  );
});

t('jsonx: arrays with formulas', () => {
  assert.deepStrictEqual(
    new Parser('[1+1, 2*2, 3^2]').evaluate(),
    [convertWhenFmlEvalRequiresIt(2), convertWhenFmlEvalRequiresIt(4), convertWhenFmlEvalRequiresIt(9)]
  );

  assert.deepStrictEqual(
    new Parser('[x+1, y*2]').evaluate({x: 5, y: 10}),
    [convertWhenFmlEvalRequiresIt(6), convertWhenFmlEvalRequiresIt(20)]
  );
});

t('jsonx: objects with formulas', () => {
  assert.deepStrictEqual(
    new Parser('{sum: a+b, product: a*b}').evaluate({a: 3, b: 4}),
    {sum: convertWhenFmlEvalRequiresIt(7), product: convertWhenFmlEvalRequiresIt(12)}
  );
});

t('jsonx: special characters in keys', () => {
  assert.deepStrictEqual(
    new Parser('{$var: value, @test: data}').evaluate(),
    {$var: 'value', '@test': 'data'}
  );
});

t('jsonx: deeply nested structures', () => {
  assert.deepStrictEqual(
    new Parser('{a: {b: {c: {d: value}}}}').evaluate(),
    {a: {b: {c: {d: 'value'}}}}
  );

  assert.deepStrictEqual(
    new Parser('[[[[nested]]]]').evaluate(),
    [[[['nested']]]]
  );
});

t('jsonx: mixed arrays and objects', () => {
  assert.deepStrictEqual(
    new Parser('[{a: 1}, {b: 2}, {c: 3}]').evaluate(),
    [{a: '1'}, {b: '2'}, {c: '3'}]
  );

  assert.deepStrictEqual(
    new Parser('{arr: [1, 2, 3], obj: {x: 10}}').evaluate(),
    {arr: ['1', '2', '3'], obj: {x: '10'}}
  );
});

// =============================================================================
// Function Edge Cases
// =============================================================================

t('functions: with JSONX parameters', () => {
  assert.deepStrictEqual(
    new Parser('q({a: 1, b: 2})', {functions}).evaluate(),
    {a: '1', b: '2'}
  );

  assert.deepStrictEqual(
    new Parser('q([1, 2, 3])', {functions}).evaluate(),
    ['1', '2', '3']
  );
});

t('functions: with formula expressions', () => {
  assert.deepStrictEqual(
    new Parser('q(5 + 5)', {functions}).evaluate(),
    convertWhenFmlEvalRequiresIt(10)
  );

  assert.deepStrictEqual(
    new Parser('q(x * 2)', {functions}).evaluate({x: 7}),
    convertWhenFmlEvalRequiresIt(14)
  );
});

t('functions: nested function calls with JSONX', () => {
  assert.deepStrictEqual(
    new Parser('q(Q({nested: value}))', {functions}).evaluate(),
    {nested: 'value'}
  );
});

t('functions: empty parentheses', () => {
  const emptyFunc = () => convertWhenFmlEvalRequiresIt(42);
  assert.deepStrictEqual(
    new Parser('f()', {functions: {f: emptyFunc}}).evaluate(),
    convertWhenFmlEvalRequiresIt(42)
  );
});

// =============================================================================
// Unary Operators Edge Cases
// =============================================================================

t('unary: multiple negations', () => {
  assert.deepStrictEqual(
    new Parser('--5').evaluate(),
    convertWhenFmlEvalRequiresIt(5)
  );

  assert.deepStrictEqual(
    new Parser('---5').evaluate(),
    convertWhenFmlEvalRequiresIt(-5)
  );

  assert.deepStrictEqual(
    new Parser('----5').evaluate(),
    convertWhenFmlEvalRequiresIt(5)
  );
});

t('unary: multiple plus operators', () => {
  assert.deepStrictEqual(
    new Parser('++5').evaluate(),
    convertWhenFmlEvalRequiresIt(5)
  );

  assert.deepStrictEqual(
    new Parser('+++5').evaluate(),
    convertWhenFmlEvalRequiresIt(5)
  );
});

t('unary: mixed plus and minus', () => {
  assert.deepStrictEqual(
    new Parser('+-5').evaluate(),
    convertWhenFmlEvalRequiresIt(-5)
  );

  assert.deepStrictEqual(
    new Parser('-+5').evaluate(),
    convertWhenFmlEvalRequiresIt(-5)
  );

  assert.deepStrictEqual(
    new Parser('+-+-5').evaluate(),
    convertWhenFmlEvalRequiresIt(5)
  );
});

t('unary: negation with parenthesis', () => {
  assert.deepStrictEqual(
    new Parser('-(5 + 3)').evaluate(),
    convertWhenFmlEvalRequiresIt(-8)
  );

  assert.deepStrictEqual(
    new Parser('-(-5)').evaluate(),
    convertWhenFmlEvalRequiresIt(5)
  );
});

t('unary: NOT operator multiple times', () => {
  assert.deepStrictEqual(
    new Parser('!!5').evaluate(),
    true
  );

  assert.deepStrictEqual(
    new Parser('!!!5').evaluate(),
    false
  );

  assert.deepStrictEqual(
    new Parser('!!!!5').evaluate(),
    true
  );
});

// =============================================================================
// Complex Integration Tests
// =============================================================================

t('integration: real-world formula - tax calculation', () => {
  const context = {
    price: 100,
    quantity: 5,
    taxRate: 0.2,
    discount: 50
  };

  assert.deepStrictEqual(
    new Parser('(price * quantity - discount) * (1 + taxRate)').evaluate(context),
    convertWhenFmlEvalRequiresIt((100 * 5 - 50) * (1 + 0.2))
  );
});

t('integration: real-world formula - compound interest', () => {
  const context = {
    principal: 1000,
    rate: 0.05,
    time: 10
  };

  const result = new Parser('principal * (1 + rate) ^ time').evaluate(context);
  // Just verify the result is close to expected value (allow for decimal implementation differences)
  const numResult = typeof result === 'bigint' ? Number(result) / 1e10 : Number(result);
  const expected = 1000 * Math.pow(1.05, 10);  // ≈ 1628.89
  assert.ok(Math.abs(numResult - expected) < 10, `Expected ~${expected}, got ${numResult}`);
});

t('integration: conditional with comparisons', () => {
  // x > 10 is true (1), y < 5 is true (1), && returns 1, || returns 1
  assert.deepStrictEqual(
    new Parser('x > 10 && y < 5 || z == 0').evaluate({x: 15, y: 3, z: 1}),
    convertWhenFmlEvalRequiresIt(1)
  );

  // x > 10 is false (0), 0 && y < 5 returns 0, 0 || z == 0 where z == 0 is true (1), returns 1
  assert.deepStrictEqual(
    new Parser('x > 10 && y < 5 || z == 0').evaluate({x: 5, y: 3, z: 0}),
    convertWhenFmlEvalRequiresIt(1)
  );
});

t('integration: nullish coalescing chain', () => {
  // FIXED: ?? now checks existence before normalization
  // null ?? null ?? null ?? 100 -> returns 100 (first non-null/undefined)
  assert.deepStrictEqual(
    new Parser('a ?? b ?? c ?? 100').evaluate({a: null, b: null, c: null}),
    convertWhenFmlEvalRequiresIt(100)
  );

  // null ?? 50 ?? null returns 50
  assert.deepStrictEqual(
    new Parser('a ?? b ?? c ?? 100').evaluate({a: null, b: 50, c: null}),
    convertWhenFmlEvalRequiresIt(50)
  );
});

t('integration: complex nested expression', () => {
  const context = {
    a: 2,
    b: 3,
    c: 4,
    d: 5
  };

  assert.deepStrictEqual(
    new Parser('((a + b) * (c - 1)) / ((d - 2) + 1)').evaluate(context),
    convertWhenFmlEvalRequiresIt(((2 + 3) * (4 - 1)) / ((5 - 2) + 1))
  );
});

// =============================================================================
// Null/Undefined Handling
// =============================================================================

t('null handling: arithmetic with null', () => {
  assert.deepStrictEqual(
    new Parser('x + 10').evaluate({x: null}),
    convertWhenFmlEvalRequiresIt(10)
  );

  assert.deepStrictEqual(
    new Parser('x * 10').evaluate({x: null}),
    convertWhenFmlEvalRequiresIt(0)
  );

  assert.deepStrictEqual(
    new Parser('x - 10').evaluate({x: null}),
    convertWhenFmlEvalRequiresIt(-10)
  );
});

t('null handling: comparison with numbers', () => {
  // null becomes 0 in arithmetic, comparison returns boolean
  assert.deepStrictEqual(
    new Parser('x == 0').evaluate({x: null}),
    true  // null == 0 is true
  );

  assert.deepStrictEqual(
    new Parser('x != 0').evaluate({x: null}),
    false  // null != 0 is false
  );

  assert.deepStrictEqual(
    new Parser('x > 5').evaluate({x: null}),
    false  // 0 > 5 is false
  );
});

t('null handling: logical operators with null', () => {
  assert.deepStrictEqual(
    new Parser('x || 10').evaluate({x: null}),
    convertWhenFmlEvalRequiresIt(10)
  );

  assert.deepStrictEqual(
    new Parser('x && 10').evaluate({x: null}),
    convertWhenFmlEvalRequiresIt(0)
  );

  // FIXED: null ?? 10 now correctly returns 10
  assert.deepStrictEqual(
    new Parser('x ?? 10').evaluate({x: null}),
    convertWhenFmlEvalRequiresIt(10)
  );
});

// =============================================================================
// Performance/Stress Tests
// =============================================================================

t('stress: long arithmetic expression', () => {
  const longFormula = '1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10';
  assert.deepStrictEqual(
    new Parser(longFormula).evaluate(),
    convertWhenFmlEvalRequiresIt(1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10)
  );
});

t('stress: deeply nested parenthesis', () => {
  assert.deepStrictEqual(
    new Parser('((((((1 + 2))))))').evaluate(),
    convertWhenFmlEvalRequiresIt(3)
  );
});

t('stress: many variables', () => {
  const context = {
    a: 1, b: 2, c: 3, d: 4, e: 5,
    f: 6, g: 7, h: 8, i: 9, j: 10
  };

  assert.deepStrictEqual(
    new Parser('a + b + c + d + e + f + g + h + i + j').evaluate(context),
    convertWhenFmlEvalRequiresIt(55)
  );
});

// =============================================================================
// Legacy Reference Bracket Syntax
// =============================================================================

t('legacy: bracket reference syntax', () => {
  // Single token in brackets is a reference
  assert.deepStrictEqual(
    new Parser('[myVar]').evaluate({'myVar': 42}),
    42  // References return raw values from context
  );

  assert.deepStrictEqual(
    new Parser('[x] + [y]').evaluate({x: 10, y: 20}),
    convertWhenFmlEvalRequiresIt(30)
  );
});

t('legacy: bracket vs JSONX array distinction', () => {
  // Single token = reference
  assert.deepStrictEqual(
    new Parser('[var]').evaluate({var: 123}),
    123  // References return raw values from context
  );

  // Comma or nested = JSONX array
  assert.deepStrictEqual(
    new Parser('[1, 2]').evaluate(),
    ['1', '2']
  );
});
