//@ts-nocheck

import { Parser as OriginalParser } from '../../../vendor/formula/formula.js';
import { Parser as CustomParser } from '../../../vendor/formula/formula_custom__accept_yaml_as_func_par__v5.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

const parsers = [ OriginalParser, CustomParser ];

t('formula original and custom: test with constant and context', () => {
    const functions = {
        x: (value) => Number(value) + 10
    };

    const constants = {
        Z: 100
    };

    for (const Parser of parsers) {
        const formula = new Parser('1 + a.b.c.2.4.x + [b] + x(105) + Z', { functions, constants });
        assert.deepStrictEqual(formula.evaluate({ 'a.b.c.2.4.x': 2, b: 3 }), 1 + 2 + 3 + 115 + 100);
        assert.deepStrictEqual(formula.evaluate({ 'a.b.c.2.4.x': '2', b: 3 }), '123115100');
    }
});

t('formula original and custom: multiple nested functions', () => {
    const functions = {
        x: (value) => value + 1,
        y: (value) => value + 2,
        z: (value) => value + 3,
        a: () => 9
    };

    for (const Parser of parsers) {
        const formula = new Parser('x(y(3)) + x(10 + 1 - 7) + y(z(30)) + z(x(40)) + a()', { functions });
        assert.deepStrictEqual(formula.evaluate(), (3 + 2 + 1) + (10 + 1 - 7 + 1) + (30 + 3 + 2) + (40 + 1 + 3) + 9);
    }
});

t('arithmetics with strings and numbers', () => {
    for (const Parser of parsers) {
        assert.deepStrictEqual(new Parser('1 + "3" + 5').evaluate(), "135");
        assert.deepStrictEqual(new Parser('"1" + "mamma" + "5"').evaluate(), "1mamma5");
        assert.deepStrictEqual(new Parser('1 + "mamma" + 5').evaluate(), "1mamma5");
    }
});

t('formula original and custom: custom variable reference resolver', () => {
    /**
     * @param {string} name
     * @return {*}
     */
    const reference = function (name) {
        /**
         * Custom variable resolver function
         *
         * Resolves variable names to their values based on `context` variable optionally passed to `.evaluate()`
         * or with the switch as fallback.
         @param {*} context
         @return {*}
         */
        function _resolve (context)
        {
            // if `name` is defined in context, return it, otherwise, go to the switch
            if (name in context) {
                return context[name];
            } else {
                switch (name) {
                    case 'a':
                        return 1;
                    case 'a.b':
                        return 2;
                    case 'b':
                        return 3;
                    case '$':
                        return 4;
                    default:
                        throw new Error('unrecognized value');
                }
            }
        }

        return _resolve;
    };

    const string_to_parse_1 = 'a + 1.99 + a.b + (((a+1)*2)+1) + a + $ + ((10)-2*5 + mamma)';
    const expected_1 = 1 + 1.99 + 2 + (((1 + 1) * 2) + 1) + 1 + 4 + ((10) - 2 * 5 + 99);

    for (const Parser of parsers) {
        const formula1 = new Parser(string_to_parse_1, { reference });
        assert.deepStrictEqual(Number(formula1.evaluate({mamma: 99})), expected_1);
    }
});
