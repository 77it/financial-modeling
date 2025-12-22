/*
NODEJS run on P16S with Best Performance power mode with terminal in full screen

bigint sum For 1000 runs x 1,696,458 ops/sec ±14.15% (58 runs sampled)
bigint sum with fx For 1000 runs x 407,999 ops/sec ±2.38% (70 runs sampled)
bigint sum with type checking add For 1000 runs x 580,463 ops/sec ±3.02% (69 runs sampled)
bigint sum with fx & conversion from string For 1000 runs x 407 ops/sec ±4.03% (65 runs sampled)
bigint sum generated with Eval() For 1000 runs x 608,227 ops/sec ±6.39% (57 runs sampled)
sum with evaluate() formula Original Parser For 1000 runs x 2,355 ops/sec ±7.26% (57 runs sampled)
sum with evaluate() formula Custom v7 For 1000 runs x 57,590 ops/sec ±2.95% (60 runs sampled)
sum with COMPILED toFunction() formula Custom v7 For 1000 runs x 1,095,518 ops/sec ±6.36% (60 runs sampled)
formula with custom variable COMPILED toFunction() formula Custom v7 For 1000 runs x 982 ops/sec ±4.03% (67 runs sampled)
quick functions call COMPILED toFunction() formula Custom v7 For 1000 runs x 1,180,697 ops/sec ±3.33% (64 runs sampled)
complex functions call COMPILED toFunction() formula Custom v7 For 1000 runs x 556 ops/sec ±3.32% (77 runs sampled)
sum with COMPILED toFunction() formula Custom v6 For 1000 runs x 379 ops/sec ±3.05% (73 runs sampled)
sum with COMPILED toFunction() formula Custom v5 For 1000 runs x 522,193 ops/sec ±5.07% (67 runs sampled)
 */

// run it with `node --import ./__node__register-hooks.js`
// run it with `deno run --allow-read --allow-write --allow-net --allow-import`

import { fxAdd, add, ensureBigIntScaled, DSB } from '../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import { Parser as ParserOriginal } from "../../../vendor/formula/formula.js";
import { Parser as ParserCustom5 } from "../../../vendor/formula/old/formula_v5_eval2cached_x.js";
import { Parser as ParserCustom6 } from "../../../vendor/formula/old/formula_v6_eval2cached+old_behaviour_x.js";
import { Parser as ParserCustom7 } from '../../../vendor/formula/formula_v7_x.js';

import { functions, setReferenceValues, reference__values_fromReference_NOTfromContext as reference } from './_formula__reference_and_functions.js';
import { complexNestedFunctionsAndFormulasWithJSONX, convertWhenFmlEvalRequiresIt } from './_formula__tests_settings.js';
import * as Benchmark from "benchmark";

const suite = new Benchmark.default.Suite('');

// loop counter
const COUNTER = 1_000;

//#region arrange test helpers

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

setReferenceValues({
  'a': 2n,
  'a.b': 3n,
  'b': 4n,
  '$': 2n,
  '$.ciao': 5n
});

//#endregion arrange test helpers

//#region arrange test assets

// eval generated function
const sumEval = eval(`
    (function(x, y, z) {
      return x + y + z;
    })
  `);

// evaluated formula original parser
const formula_v0 = new ParserOriginal('1000000 + 2000000 + 3000000');

// preparsed formula v5
const formula_v5 = new ParserCustom5('1000000 + 2000000 + 3000000');
const compiled_v5 = formula_v5.toFunction();

// preparsed formula v6
const formula_v6 = new ParserCustom6('1000000 + 2000000 + 3000000');
const compiled_v6 = formula_v6.toFunction();

// preparsed formula v7
const formula_v7 = new ParserCustom7('1000000 + 2000000 + 3000000');
const compiled_v7 = formula_v7.toFunction();

// preparsed formula v7 with custom variable resolver
const compiled_v7_customVariableResolver = new ParserCustom7('a + 1.99 + a.b + (((a+1)*2)+1) + a + $.ciao + $ + $.ciao', { reference: reference }).toFunction();
const expected_v7_customVariableResolver = convertWhenFmlEvalRequiresIt(49900000023n);

// preparsed formula v7 with quick function call
const compiled_v7_quickFunctionCall = new ParserCustom7("50 + Q(0)", { functions }).toFunction();
const expected_v7_quickFunctionCall = 500000000000n ;

const compiled_v7_complexFunctionCall = new ParserCustom7(complexNestedFunctionsAndFormulasWithJSONX, { reference: reference, functions: functions10 }).toFunction();

//#region arrange test assets


// tests
suite
  .add(`bigint sum For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = 1000000n + 2000000n + 3000000n;
    }
  })

  .add(`bigint sum with fx For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = fxAdd(1000000n, fxAdd(2000000n, 3000000n));
    }
  })

  .add(`bigint sum with type checking add For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = add(1000000n, add(2000000n, 3000000n));
    }
  })

  .add(`bigint sum with fx & conversion from string For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = fxAdd(ensureBigIntScaled("1000000"), fxAdd(ensureBigIntScaled("2000000"), ensureBigIntScaled("3000000")));
    }
  })

  .add(`bigint sum generated with Eval() For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = sumEval(1000000n, 2000000n, 3000000n);
    }
  })

  .add(`sum with evaluate() formula Original Parser For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = formula_v0.evaluate();
    }
  })

  .add(`sum with evaluate() formula Custom v7 For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = formula_v7.evaluate();
    }
  })

  .add(`sum with COMPILED toFunction() formula Custom v7 For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = compiled_v7();
    }
  })

  .add(`formula with custom variable COMPILED toFunction() formula Custom v7 For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    if (compiled_v7_customVariableResolver() !== expected_v7_customVariableResolver) {
      throw new Error("formula should be " + expected_v7_customVariableResolver + ", instead is " + compiled_v7_customVariableResolver());
    }
    for (let i = 0; i < COUNTER; i++) {
      const a = compiled_v7_customVariableResolver();
    }
  })

  .add(`quick functions call COMPILED toFunction() formula Custom v7 For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    if (compiled_v7_quickFunctionCall() !== expected_v7_quickFunctionCall) {
      throw new Error("formula should be " + expected_v7_quickFunctionCall + ", instead is " + compiled_v7_quickFunctionCall());
    }
    for (let i = 0; i < COUNTER; i++) {
      const a = compiled_v7_quickFunctionCall();
    }
  })

  .add(`complex functions call COMPILED toFunction() formula Custom v7 For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = compiled_v7_complexFunctionCall();
    }
  })

  .add(`sum with COMPILED toFunction() formula Custom v6 For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = compiled_v6();
    }
  })

  .add(`sum with COMPILED toFunction() formula Custom v5 For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = compiled_v5();
    }
  })


  // add listeners
  .on('cycle', function(/** @type {Benchmark.Event} */ event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    // @ts-ignore types from benchmark may not include .filter in Deno ambient
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .on('error', function (/** @type {Benchmark.Event} */ event) {
    console.error(`Test "${event.target.name}" failed with error:`);
    // @ts-ignore ignore Deno errrors
    console.error(event.target.error); // logs the actual Error object
  })
  // run async
  .run({ 'async': true });
