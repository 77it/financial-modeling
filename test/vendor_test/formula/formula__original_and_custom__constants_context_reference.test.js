//@ts-nocheck

import { Parser as OriginalParser } from '../../../vendor/formula/formula.js';
import { Parser as CustomParser } from '../../../vendor/formula/formula_v7_x.js';
import { setReferenceValues, reference__values_fromReference_andFromContext as reference } from './_formula__reference_and_functions.js';
import { convertWhenFmlEvalRequiresIt } from './_formula__tests_settings.js';
import { DSB } from '../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';

const OUTER_BONUS = 5;
const closure_computeBonus = (base) => base + OUTER_BONUS; // shows reference resolver closing over module scope using a closure

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

// Original parser uses Number, Custom parser uses DSB for BigInt compatibility
const originalFunctions = {
    x: (value) => Number(value) + 10,
    y: (value) => Number(value) + 2,
    z: (value) => Number(value) + 3,
    a: () => 9
};

const customFunctions = {
    x: (value) => DSB.add(value, 10),
    y: (value) => DSB.add(value, 2),
    z: (value) => DSB.add(value, 3),
    a: () => DSB.fromNumber(9)
};

const parserDefs = [
  { Parser: OriginalParser, opts: {}, functions: originalFunctions, numericMode: false },
  { Parser: CustomParser, opts: {}, functions: customFunctions, numericMode: true }
];

t('formula original and custom: test with constant and context', () => {
    for (const { Parser, opts, functions, numericMode } of parserDefs) {
        const formula = new Parser('1 + a.b.c.2.4.x + [b] + x(105)', { functions, ...opts });
        assert.deepStrictEqual(formula.evaluate({ 'a.b.c.2.4.x': 2, b: 3 }), _convertWhenFmlEvalRequiresIt(1 + 2 + 3 + 115, numericMode));

        const expectedWithStrings = numericMode ? _convertWhenFmlEvalRequiresIt(1 + 2 + 3 + 115, numericMode) : '123115';
        assert.deepStrictEqual(formula.evaluate({ 'a.b.c.2.4.x': '2', b: 3 }), expectedWithStrings);
    }
});

t('formula original and custom: multiple nested functions', () => {
    // Test Original Parser with Number-based functions
    {
        const functions = {
            x: (value) => Number(value) + 1,
            y: (value) => Number(value) + 2,
            z: (value) => Number(value) + 3,
            a: () => 9
        };
        const formula = new OriginalParser('x(y(3)) + x(10) + y(z(30)) + z(x(40)) + a()', { functions });
        assert.deepStrictEqual(formula.evaluate(), 6 + 11 + 35 + 44 + 9);
    }
    // Test Custom Parser with DSB-compatible functions
    {
        const functions = {
            x: (value) => DSB.add(value, 1),
            y: (value) => DSB.add(value, 2),
            z: (value) => DSB.add(value, 3),
            a: () => DSB.fromNumber(9)
        };
        const formula = new CustomParser('x(y(3)) + x(10) + y(z(30)) + z(x(40)) + a()', { functions });
        assert.deepStrictEqual(formula.evaluate(), convertWhenFmlEvalRequiresIt(6 + 11 + 35 + 44 + 9));
    }
});

t('arithmetics with strings and numbers', () => {
    for (const { Parser, opts, numericMode } of parserDefs) {
        if (numericMode) {
            assert.deepStrictEqual(new Parser('1 + "3" + 5', opts).evaluate(), _convertWhenFmlEvalRequiresIt(1 + 3 + 5, numericMode));
            assert.deepStrictEqual(new Parser('"1" + "mamma" + "5"', opts).evaluate(), _convertWhenFmlEvalRequiresIt(1 + 0 + 5, numericMode));
            assert.deepStrictEqual(new Parser('1 + "mamma" + 5', opts).evaluate(), _convertWhenFmlEvalRequiresIt(1 + 0 + 5, numericMode));
        } else {
            assert.deepStrictEqual(new Parser('1 + "3" + 5', opts).evaluate(), "135");
            assert.deepStrictEqual(new Parser('"1" + "mamma" + "5"', opts).evaluate(), "1mamma5");
            assert.deepStrictEqual(new Parser('1 + "mamma" + 5', opts).evaluate(), "1mamma5");
        }
    }
});

t('formula original and custom: custom variable reference resolver', () => {
    setReferenceValues({
        a: 1,
        'a.b': 2,
        b: 3,
        '$': 4,
        bonus: closure_computeBonus(7) // uses outer constants + helper
    });

    const string_to_parse_1 = 'a + 1.99 + a.b + (((a+1)*2)+1) + a + $ + ((10)-2*5 + mamma) + bonus';
    const expected_1 = 1 + 1.99 + 2 + (((1 + 1) * 2) + 1) + 1 + 4 + ((10) - 2 * 5 + 99) + closure_computeBonus(7);

    for (const { Parser, opts, numericMode } of parserDefs) {
        const formula1 = new Parser(string_to_parse_1, { reference, ...opts });
        assert.deepStrictEqual(formula1.evaluate({mamma: 99}), _convertWhenFmlEvalRequiresIt(expected_1, numericMode));
    }
});

/**
 * Converts a number to a string if the setting is enabled.
 * @param {*} value
 * @param {boolean} numericMode
 * @return {*|string}
 */
export function _convertWhenFmlEvalRequiresIt(value, numericMode) {
    if (numericMode && typeof value === "number") {
        return convertWhenFmlEvalRequiresIt(value);
    }
    return value;
}
