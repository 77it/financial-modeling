// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_v7_x.js';
import { pow, modulo } from '../../../vendor/formula/adapters/decimal-adapter.js';
import { convertWhenFmlEvalRequiresIt } from './_formula__tests_settings.js'
import { functions, reference__values_fromReference_andFromContext as reference, setReferenceValues } from './_formula__reference_and_functions.js';
import { DSB } from '../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('Compile-Time BigInt Conversion', () => {
  const p1 = new Parser('100_000_000_000_000_999_888_777_666_555_444.12345678901234567890 + "200.50" * 3');

  assert.deepStrictEqual(
    p1.toFunction()(),
    DSB.add("100_000_000_000_000_999_888_777_666_555_444.12345678901234567890", DSB.mul("200.50", 3))
  );

  assert.deepStrictEqual(
    //@ts-ignore  _compiled is private
    p1._compiled.toString(),
    "function(__ctx){ 'use strict'; return __mathOps.add(1000000000000009998887776665554441234567890n, __ensure(__mathOps.mul(2005000000000n, 30000000000n))); }"
  );
});

t('formula calling with custom sum and average functions', () => {
  const p6 = new Parser('avg(a, b, c) * 100', {
    functions
  });

  const ctx = {
    a: convertWhenFmlEvalRequiresIt(100000),
    b: convertWhenFmlEvalRequiresIt(200000),
    c: convertWhenFmlEvalRequiresIt(300000)
  };

  assert.deepStrictEqual(p6.toFunction()(ctx), DSB.mul(DSB.div(DSB.add(ctx.a, DSB.add(ctx.b, ctx.c)), 3), 100));

  assert.deepStrictEqual(
    //@ts-ignore  _compiled is private
    p6._compiled.toString(),
    `function(__ctx){ 'use strict'; return __mathOps.mul(__ensure(__fns["avg"].call(__ctx, (__ctx && Object.prototype.hasOwnProperty.call(__ctx, "a") ? __ctx["a"] : (() => { throw new Error('Unknown reference ' + "a"); })()), (__ctx && Object.prototype.hasOwnProperty.call(__ctx, "b") ? __ctx["b"] : (() => { throw new Error('Unknown reference ' + "b"); })()), (__ctx && Object.prototype.hasOwnProperty.call(__ctx, "c") ? __ctx["c"] : (() => { throw new Error('Unknown reference ' + "c"); })()))), 1000000000000n); }`
  );
});

t('Math Operations via Decimal Adapter', () => {
  const p2 = new Parser('a + b * c - d / e');

  const ctx = {
    a: 1000000n,  // 100.0000
    b: 500000n,   // 50.0000
    c: 20000n,    // 2.0000
    d: 2000000n,  // 200.0000
    e: 40000n     // 4.0000
  };

  assert.deepStrictEqual(p2.toFunction()(ctx), DSB.sub(DSB.add(ctx.a, DSB.mul(ctx.b, ctx.c)), DSB.div(ctx.d, ctx.e)));

  assert.deepStrictEqual(
    //@ts-ignore  _compiled is private
    p2._compiled.toString(),
    `function(__ctx){ 'use strict'; return __mathOps.sub(__ensure(__mathOps.add(__ensure((__ctx && Object.prototype.hasOwnProperty.call(__ctx, "a") ? __ctx["a"] : (() => { throw new Error('Unknown reference ' + "a"); })())), __ensure(__mathOps.mul(__ensure((__ctx && Object.prototype.hasOwnProperty.call(__ctx, "b") ? __ctx["b"] : (() => { throw new Error('Unknown reference ' + "b"); })())), __ensure((__ctx && Object.prototype.hasOwnProperty.call(__ctx, "c") ? __ctx["c"] : (() => { throw new Error('Unknown reference ' + "c"); })())))))), __ensure(__mathOps.div(__ensure((__ctx && Object.prototype.hasOwnProperty.call(__ctx, "d") ? __ctx["d"] : (() => { throw new Error('Unknown reference ' + "d"); })())), __ensure((__ctx && Object.prototype.hasOwnProperty.call(__ctx, "e") ? __ctx["e"] : (() => { throw new Error('Unknown reference ' + "e"); })()))))); }`
  );
});

t('simple reference', () => {
  const p3 = new Parser('x + y', {
    reference
  });

  const refValues = {
    x: 150000n, // 15.0000
    y: 250000n  // 25.0000
  };

  setReferenceValues(refValues);

  assert.deepStrictEqual(p3.toFunction()(), DSB.add(refValues.x, refValues.y));

  assert.deepStrictEqual(
    //@ts-ignore  _compiled is private
    p3._compiled.toString(),
    `function(__ctx){ 'use strict'; return __mathOps.add(__ensure(__ref("x", __ctx)), __ensure(__ref("y", __ctx))); }`
  );
});

t('reference and context', () => {
  const p4 = new Parser('x + y', { reference });

  const refValues = {
    x: 150000n, // 15.0000
  };

  const ctx = {
    y: 250000n  // 25.0000
  };

  setReferenceValues(refValues);

  assert.deepStrictEqual(p4.toFunction()(ctx), DSB.add(refValues.x, ctx.y));

  assert.deepStrictEqual(
    //@ts-ignore  _compiled is private
    p4._compiled.toString(),
    `function(__ctx){ 'use strict'; return __mathOps.add(__ensure(__ref("x", __ctx)), __ensure(__ref("y", __ctx))); }`
  );
});

t('JSONX: root compilation via toFunction', () => {
  const p5 = new Parser('{sum: a+b, items: [1+1, 2*2]}', { reference });

  const fn5 = p5.toFunction();

  const ctx = {a: 3, b: 4};

  assert.deepStrictEqual(
    fn5(ctx),
    {sum: convertWhenFmlEvalRequiresIt(ctx.a + ctx.b), items: [convertWhenFmlEvalRequiresIt(1+1), convertWhenFmlEvalRequiresIt(2*2)]}
  );

  assert.deepStrictEqual(
    //@ts-ignore  _compiled is private
    p5._compiled.toString(),
    `function(__ctx){ 'use strict'; return { sum: __mathOps.add(__ensure(__ref("a", __ctx)), __ensure(__ref("b", __ctx))), items: [__mathOps.add(10000000000n, 10000000000n), __mathOps.mul(20000000000n, 20000000000n)] }; }`
  );
});

t('All Math Operators', () => {
  const testCases = [
    { formula: '10 + 5', result: DSB.add(10, 5), compiled: `function(__ctx){ 'use strict'; return __mathOps.add(100000000000n, 50000000000n); }` },
    { formula: '10 - 5', result: DSB.sub(10, 5), compiled: `function(__ctx){ 'use strict'; return __mathOps.sub(100000000000n, 50000000000n); }` },
    { formula: '10 * 5', result: DSB.mul(10, 5), compiled: `function(__ctx){ 'use strict'; return __mathOps.mul(100000000000n, 50000000000n); }` },
    { formula: '10 / 5', result: DSB.div(10, 5), compiled: `function(__ctx){ 'use strict'; return __mathOps.div(100000000000n, 50000000000n); }` },
    { formula: '10 ^ 2', result: pow(10, 2), compiled: `function(__ctx){ 'use strict'; return __mathOps.pow(100000000000n, 20000000000n); }` },
    { formula: '10 % 3', result: modulo(10, 3), compiled: `function(__ctx){ 'use strict'; return __mathOps.modulo(100000000000n, 30000000000n); }` },
    { formula: '-10', result: convertWhenFmlEvalRequiresIt(-10), compiled: `function(__ctx){ 'use strict'; return (-100000000000n); }` },
  ];

  testCases.forEach(({ formula, result, compiled }) => {
    const p6 = new Parser(formula, { reference });
    const fn6 = p6.toFunction();

    assert.deepStrictEqual(fn6(), result);

    assert.deepStrictEqual(
      //@ts-ignore  _compiled is private
      p6._compiled.toString(),
      compiled
    );
  });
});
