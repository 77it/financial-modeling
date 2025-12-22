// test with deno test --allow-import --allow-sys

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_v7_x.js';
import { pow, modulo } from '../../../vendor/formula/adapters/decimal-adapter.js';
import { convertWhenFmlEvalRequiresIt, complexNestedFunctionsAndFormulasWithJSONX } from './_formula__tests_settings.js';
import { functions, reference__values_fromReference_andFromContext as reference, setReferenceValues } from './_formula__reference_and_functions.js';
import { DSB } from '../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import prettier from 'prettier';

import * as EXPECTED from './formula_custom_compilation.compiled.js';

import { test } from 'node:test';
import assert from 'node:assert';

/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('Compile-Time BigInt Conversion', async () => {
  const p1 = new Parser('100_000_000_000_000_999_888_777_666_555_444.12345678901234567890 + "200.50" * 3');

  assert.deepStrictEqual(
    p1.toFunction()(),
    DSB.add('100_000_000_000_000_999_888_777_666_555_444.12345678901234567890', DSB.mul('200.50', 3))
  );

  //@ts-ignore  _compiled is private
  await cmp(p1._compiled.toString(), EXPECTED.expected1);
});

t('Math Operations via Decimal Adapter with context without reference', async () => {
  const p2 = new Parser('(a + b) * c - d / e');

  const ctx = {
    a: 1000000n,  // 100.0000
    b: 500000n,   // 50.0000
    c: 20000n,    // 2.0000
    d: 2000000n,  // 200.0000
    e: 40000n     // 4.0000
  };

  const _sum = DSB.add(ctx.a, ctx.b);
  const _mul = DSB.mul(_sum, ctx.c);
  const _div = DSB.div(ctx.d, ctx.e);
  const _sub = DSB.sub(_mul, _div);
  assert.deepStrictEqual(p2.toFunction()(ctx), _sub);

  //@ts-ignore  _compiled is private
  await cmp(p2._compiled.toString(), EXPECTED.expected2);
});

t('Math Operations via Decimal Adapter with context with reference', async () => {
  const p2b = new Parser('(a + b) * c - d / e', { reference });

  const ctx = {
    a: 1000000n,  // 100.0000
    b: 500000n,   // 50.0000
    c: 20000n,    // 2.0000
    d: 2000000n,  // 200.0000
    e: 40000n     // 4.0000
  };

  const _sum = DSB.add(ctx.a, ctx.b);
  const _mul = DSB.mul(_sum, ctx.c);
  const _div = DSB.div(ctx.d, ctx.e);
  const _sub = DSB.sub(_mul, _div);
  assert.deepStrictEqual(p2b.toFunction()(ctx), _sub);

  //@ts-ignore  _compiled is private
  await cmp(p2b._compiled.toString(), EXPECTED.expected2b);
});

t('simple reference', async () => {
  const p3 = new Parser('x + y', { reference });

  const refValues = {
    x: 150000n, // 15.0000
    y: 250000n  // 25.0000
  };

  setReferenceValues(refValues);

  assert.deepStrictEqual(p3.toFunction()(), DSB.add(refValues.x, refValues.y));

  //@ts-ignore  _compiled is private
  await cmp(p3._compiled.toString(), EXPECTED.expected3);
});

t('reference and context', async () => {
  const p4 = new Parser('x + y', { reference });

  const refValues = {
    x: 150000n, // 15.0000
  };

  const ctx = {
    y: 250000n  // 25.0000
  };

  setReferenceValues(refValues);

  assert.deepStrictEqual(p4.toFunction()(ctx), DSB.add(refValues.x, ctx.y));

  //@ts-ignore  _compiled is private
  await cmp(p4._compiled.toString(), EXPECTED.expected4);
});

t('JSONX: root compilation via toFunction', async () => {
  const p5 = new Parser('{sum: a+b, items: [1+1, 2*2]}', { reference });

  const fn5 = p5.toFunction();

  const ctx = { a: 3, b: 4 };

  assert.deepStrictEqual(
    fn5(ctx),
    { sum: convertWhenFmlEvalRequiresIt(ctx.a + ctx.b), items: [convertWhenFmlEvalRequiresIt(1 + 1), convertWhenFmlEvalRequiresIt(2 * 2)] }
  );

  //@ts-ignore  _compiled is private
  await cmp(p5._compiled.toString(), EXPECTED.expected5);
});

t('All Math Operators', async () => {
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
    const p7 = new Parser(formula, { reference });
    const fn7 = p7.toFunction();

    assert.deepStrictEqual(fn7(), result);

    assert.deepStrictEqual(
      //@ts-ignore  _compiled is private
      p7._compiled.toString(),
      compiled
    );
  });
});

t(`String Concatenation DON'T Stays Native and are converted to numbers`, async () => {
  const p8 = new Parser('"Hello " + name + "!"', { reference });

  const fn8 = p8.toFunction();

  assert.deepStrictEqual(
    fn8({ name: 'World' }),
    0n
  );

  //@ts-ignore  _compiled is private
  await cmp(p8._compiled.toString(), EXPECTED.expected8);
});

t('formula calling with custom sum and average functions with context without reference', async () => {
  const p6 = new Parser('avg(a, b, c) * 100', {
    functions
  });

  const ctx = {
    a: convertWhenFmlEvalRequiresIt(100000),
    b: convertWhenFmlEvalRequiresIt(200000),
    c: convertWhenFmlEvalRequiresIt(300000)
  };

  assert.deepStrictEqual(p6.toFunction()(ctx), DSB.mul(DSB.div(DSB.add(ctx.a, DSB.add(ctx.b, ctx.c)), 3), 100));

  //@ts-ignore  _compiled is private
  await cmp(p6._compiled.toString(), EXPECTED.expected6);
});

t('formula calling with custom sum and average functions with context with reference', async () => {
  const p6b = new Parser('avg(a, b, c) * 100', { functions, reference });

  const ctx = {
    a: convertWhenFmlEvalRequiresIt(100000),
    b: convertWhenFmlEvalRequiresIt(200000),
    c: convertWhenFmlEvalRequiresIt(300000)
  };

  assert.deepStrictEqual(p6b.toFunction()(ctx), DSB.mul(DSB.div(DSB.add(ctx.a, DSB.add(ctx.b, ctx.c)), 3), 100));

  //@ts-ignore  _compiled is private
  await cmp(p6b._compiled.toString(), EXPECTED.expected6b);
});

t('formula calling with custom sum and average nested functions with context with reference', async () => {
  const p6c = new Parser('avg(a, b, sum(c, d)) * 100', { functions, reference });

  const ctx = {
    a: convertWhenFmlEvalRequiresIt(100000),
    b: convertWhenFmlEvalRequiresIt(200000),
    c: convertWhenFmlEvalRequiresIt(300000),
    d: convertWhenFmlEvalRequiresIt(400000)
  };

  assert.deepStrictEqual(p6c.toFunction()(ctx), DSB.mul(DSB.div(DSB.add(ctx.a, DSB.add(ctx.b, DSB.add(ctx.c, ctx.d))), 3), 100));

  //@ts-ignore  _compiled is private
  await cmp(p6c._compiled.toString(), EXPECTED.expected6c);
});

t(`Nested function with json parameter`, async () => {
  const functions2 = {
    /**
     * @param {*} args - Values to add.
     * @returns {bigint} The sum of all provided values (0n if none).
     */
    sum: function (args) {
      return DSB.add(args.x, DSB.add(args.y, args.z));
    },

    /**
     * @param {*} args - Values to add.
     * @returns {bigint} The sum of all provided values (0n if none).
     */
    avg: function (args) {
      const total = DSB.add(args.a, DSB.add(args.b, args.c));
      return DSB.div(total, 3);
    }
  };

  const p9 = new Parser(`avg({a: 10, b: sum({x: 1, y: "988_444_444_333_333_222_111.999_888_77777", z: 10}), c: 300_888_777_666_555_444_333_222_111}) * 100`, { functions: functions2, reference });

  const fn9 = p9.toFunction();

  const sum = DSB.add(1, DSB.add('988_444_444_333_333_222_111.999_888_77777', 10));
  const avg = DSB.div(DSB.add(10, DSB.add(sum, '300_888_777_666_555_444_333_222_111')), 3);
  const mul = DSB.mul(avg, 100);

  assert.deepStrictEqual(
    fn9(),
    mul
  );

  //@ts-ignore  _compiled is private
  await cmp(p9._compiled.toString(), EXPECTED.expected9);
});

t('JSONX: complex nested functions and formulas', async () => {
  const refVal = { a: 10, b: 4 };
  setReferenceValues(refVal);

  const functions10 = {
    ...functions,
    /**
     * @param {{ x: any, y: any[], z: { w: any } }} obj
     * @returns {bigint}
     */
    sumObj: (obj) => {
      return DSB.add(
        obj.x,
        DSB.add(
          obj.y[0],
          DSB.add(obj.y[1], obj.z.w)
        )
      );
    }
  };

  const p10 = new Parser(complexNestedFunctionsAndFormulasWithJSONX, { functions: functions10, reference });
  const fn10 = p10.toFunction();

  const expectedCalc = DSB.add(
    DSB.add(
      '2.5',
      DSB.add(
        '3',
        DSB.add(
          convertWhenFmlEvalRequiresIt(5),
          DSB.mul(DSB.add(refVal.a, 1), 2)
        )
      )
    ),
    1
  );

  assert.deepStrictEqual(
    fn10(),
    {
      calc: expectedCalc,
      nested: {
        arr: [
          convertWhenFmlEvalRequiresIt(2),
          { v: DSB.add(1, DSB.add(2, 3)) },
          { deep: { n: convertWhenFmlEvalRequiresIt(5) } }
        ]
      },
      mix: {
        inside: [
          DSB.mul(DSB.add(refVal.b, 2), 3),
          { t: '7.75' }
        ]
      }
    }
  );

  //@ts-ignore  _compiled is private
  await cmp(p10._compiled.toString(), EXPECTED.expected10);
});

/**
 * Normalize code by removing extra whitespace and formatting differences
 * @param {string} code
 * @param {string} expected
 * @return {Promise<void>}
 */
async function cmp (code, expected) {
  const _code1 = await prettier.format(`(${code})`, { parser: 'babel' });
  const _code2 = await prettier.format(`${expected}`, { parser: 'babel' });

  assert.deepStrictEqual(_code1, _code2);
}
