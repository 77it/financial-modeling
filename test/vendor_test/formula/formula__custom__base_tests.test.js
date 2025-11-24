    //@ts-nocheck

// DISABLED A TEST IN "errors on invalid operator position" because with the new custom code
// 'x + + y' is evaluated correctly

// REMOVED OR UPDATED ALL TEST WITH CONSTANTS, NOW NO MORE SUPPORTED

// from https://github.com/77it/formula/blob/aeb95946d444466d96cd7a9864c78a4530124f74/test/index.js
// with the addition of region "BDD Jest-like globals"

import { Parser as CustomParser } from '../../../vendor/formula/formula_custom__accept_jsonx_as_func_par__v6_x.js';
import { convertWhenFmlEvalRequiresIt } from './_formula__tests_settings.js';
import { DSB } from '../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';

import { describe, it } from '../../lib/bdd_polyfill.js';
import assert from 'node:assert';

runTests({Parser: CustomParser});

/**
 * Run tests for the Parser passed as argument with options
 * @param {Object} p
 * @param {*} p.Parser
 */
function runTests({ Parser }) {
    // Wrapper for expect.toEqual to auto-convert numbers to required format
    const expectEqual = (actual, expected) => {
        expect(actual).toEqual(convertWhenFmlEvalRequiresIt(expected));
    };

    describe('Formula, original and custom, tests', () => {

        it('evaluates a formula', () => {

            const functions = {
                x: (value) => {
                    return DSB.add(value, 10);
                }
            };

            const formula = new Parser('1 + a.b.c.2.4.x + [b] + x([y + 4] + 100)', { functions });
            expectEqual(formula.evaluate({ 'a.b.c.2.4.x': 2, b: 3, 'y + 4': 5 }), 1 + 2 + 3 + 5 + 10 + 100);
            expectEqual(formula.evaluate({ 'a.b.c.2.4.x': '2', b: 3, 'y + 4': '5' }), 1 + 2 + 3 + 5 + 10 + 100);
        });

        it('evaluates a formula (custom reference handler)', () => {

            const functions = {
                x: (value) => {
                    return DSB.add(value, 10);
                }
            };

            const reference = function (name) {

                return (context) => context[name];
            };

            const formula = new Parser('1 + a.b.c.2.4.x + [b] + x([y + 4] + 100)', { functions, reference });
            expectEqual(formula.evaluate({ 'a.b.c.2.4.x': 2, b: 3, 'y + 4': 5 }), 1 + 2 + 3 + 5 + 10 + 100);
            expectEqual(formula.evaluate({ 'a.b.c.2.4.x': '2', b: 3, 'y + 4': '5' }), 1 + 2 + 3 + 5 + 10 + 100);
        });

        describe('single', () => {

            it('identifies single literal (string)', () => {

                const formula = new Parser('"2 + 2"');
                expectEqual(formula.single, { type: 'value', value: '2 + 2' });
            });

            it('identifies single literal (number)', () => {

                const formula = new Parser('123');
                expectEqual(formula.single, { type: 'value', value: '123' });
            });

            it('identifies single reference', () => {

                const formula = new Parser('x');
                expectEqual(formula.single, { type: 'reference', value: 'x' });
            });

            it('identifies non-single reference', () => {

                const formula = new Parser('-x');
                expect(formula.single).toBeNull();
            });
        });

        describe('_parse()', () => {

            it('parses multiple nested functions', () => {

                const functions = {
                    x: (value) => DSB.add(value, 1),
                    y: (value) => DSB.add(value, 2),
                    z: (value) => DSB.add(value, 3),
                    a: () => DSB.fromNumber(9)
                };

                const formula = new Parser('x(10) + y(z(30)) + z(x(40)) + a()', { functions });
                expectEqual(formula.evaluate(), 11 + 33 + 2 + 41 + 3 + 9);
            });

            it('passes context as this to functions', () => {

                const functions = {
                    x: function () {

                        return this.X;
                    }
                };

                const formula = new Parser('x()', { functions });
                expect(formula.evaluate({ X: '1' })).toEqual('1');
                expect(formula.evaluate({ X: 1 })).toEqual(1);
            });

            it('parses parenthesis', () => {

                const formula = new Parser('(x + 4) * (x - 5) / (x ^ 2)');
                expectEqual(formula.evaluate({ x: 10 }), (10 + 4) * (10 - 5) / (Math.pow(10, 2)));
            });

            it('parses string literals', () => {

                const formula = new Parser('"x+3" + `y()` + \'-z\'');
                expectEqual(formula.evaluate(), 0n);
            });

            it('validates token', () => {

                expect(() => new Parser('[xy]', { tokenRx: /^\w+$/ })).not.toThrow();
                expect(() => new Parser('[x y]', { tokenRx: /^\w+$/ })).toThrow('Formula contains invalid reference x y');
            });

            it('errors on missing closing parenthesis', () => {

                expect(() => new Parser('(a + 2(')).toThrow('Formula missing closing parenthesis');
            });

            it('errors on invalid character', () => {

                expect(() => new Parser('x\u0000')).toThrow('Formula contains invalid token: x\u0000');
            });

            it('errors on invalid operator position', () => {

                //expect(() => new Parser('x + + y')).toThrow('Formula contains an operator in invalid position');
                expect(() => new Parser('x + y +')).toThrow('Formula contains invalid trailing operator');
            });

            it('errors on invalid operator', () => {

                expect(() => new Parser('x | y')).toThrow('Formula contains an unknown operator |');
            });

            it('errors on invalid missing operator', () => {

                expect(() => new Parser('x y')).toThrow('Formula missing expected operator');
            });
        });

        describe('_subFormula', () => {

            it('parses multiple nested functions with arguments (numbers)', () => {

                const functions = {
                    x: (a, b, c) => DSB.add(DSB.add(a, b), c),
                    y: (a, b) => DSB.mul(a, b),
                    z: (value) => DSB.add(value, 3),
                    a: () => DSB.fromNumber(9)
                };

                const formula = new Parser('x(10, (y((1 + 2), z(30)) + a()), z(x(4, 5, 6)))', { functions });
                expectEqual(formula.evaluate(), 10 + (((1 + 2) * (30 + 3)) + 9) + (4 + 5 + 6) + 3);
            });

            it('parses multiple nested functions with arguments (strings)', () => {

                const functions = {
                    x: (a, b, c) => DSB.add(DSB.add(a, b), c),
                    y: (a, b) => DSB.add(a, b),
                    z: (value) => DSB.add(value, 3),
                    a: () => DSB.fromNumber(9)
                };

                const formula = new Parser('x("10", (y(("1" + "2"), z("30")) + a()), z(x("4", "5", "6")))', { functions });
                expectEqual(formula.evaluate(), 10 + (((1 + 2) + (30 + 3)) + 9) + (4 + 5 + 6) + 3);
            });

            it('errors on unknown function', () => {

                expect(() => new Parser('x()')).toThrow('Formula contains unknown function x');
            });

            it('errors on invalid function arguments', () => {

                expect(() => new Parser('x(y,)', { functions: { x: () => null } })).toThrow('Formula contains function x with invalid arguments y,');
            });
        });

        describe('single()', () => {

            it('calculates -', () => {

                const formula = new Parser('-x');

                expectEqual(formula.evaluate({ x: 1 }), -1);
                expectEqual(formula.evaluate({ x: -1 }), 1);
                expectEqual(formula.evaluate({ x: 0 }), 0);
            });

            it('handles --', () => {

                const formula = new Parser('10--x');

                expectEqual(formula.evaluate({ x: 1 }), 11);
                expectEqual(formula.evaluate({ x: -1 }), 9);
                expectEqual(formula.evaluate({ x: 0 }), 10);
            });

            it('calculates !', () => {

                const formula = new Parser('!x');

                expectEqual(formula.evaluate({ x: 1 }), false);
                expectEqual(formula.evaluate({ x: -1 }), false);
                expectEqual(formula.evaluate({ x: 0 }), true);
            });
        });

        describe('calculate()', () => {

            it('calculates +', () => {
                const formula = new Parser('x+y');

                expectEqual(formula.evaluate({ x: 1, y: 2 }), 3);
                expectEqual(formula.evaluate({ x: null, y: 2 }), 2);
                expectEqual(formula.evaluate({ x: 1, y: null }), 1);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), 3);
                expectEqual(formula.evaluate({ x: null, y: '2' }), 2);
                expectEqual(formula.evaluate({ x: '1', y: null }), 1);

                expectEqual(formula.evaluate({ x: 1, y: '2' }), 3);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), 3);
            });

            it('calculates -', () => {

                const formula = new Parser('x-y');

                expectEqual(formula.evaluate({ x: 1, y: 2 }), -1);
                expectEqual(formula.evaluate({ x: null, y: 2 }), -2);
                expectEqual(formula.evaluate({ x: 1, y: null }), 1);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), -1);
                expectEqual(formula.evaluate({ x: null, y: '2' }), -2);
                expectEqual(formula.evaluate({ x: '1', y: null }), 1);

                expectEqual(formula.evaluate({ x: 1, y: '2' }), -1);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), -1);
            });

            it('calculates *', () => {

                const formula = new Parser('x*y');

                expectEqual(formula.evaluate({ x: 20, y: 10 }), 200);
                expectEqual(formula.evaluate({ x: null, y: 2 }), 0);
                expectEqual(formula.evaluate({ x: 1, y: null }), 0);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), 2);
                expectEqual(formula.evaluate({ x: null, y: '2' }), 0);
                expectEqual(formula.evaluate({ x: '1', y: null }), 0);

                expectEqual(formula.evaluate({ x: 1, y: '2' }), 2);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), 2);
            });

            it('calculates /', () => {

                const formula = new Parser('x/y');

                expectEqual(formula.evaluate({ x: 20, y: 10 }), 2);
                expectEqual(formula.evaluate({ x: null, y: 2 }), 0);
                assert.throws(() => { formula.evaluate({ x: 1, y: null }); });

                expectEqual(formula.evaluate({ x: '1', y: '2' }), 0.5);
                expectEqual(formula.evaluate({ x: null, y: '2' }), 0);
                assert.throws(() => { formula.evaluate({ x: '1', y: null }); });

                expectEqual(formula.evaluate({ x: 1, y: '2' }), 0.5);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), 0.5);
            });

            it('calculates ^', () => {

                const formula = new Parser('x^y');

                expectEqual(formula.evaluate({ x: 2, y: 3 }), 8);
                expectEqual(formula.evaluate({ x: null, y: 2 }), 0);
                expectEqual(formula.evaluate({ x: 1, y: null }), 1);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), 1);
                expectEqual(formula.evaluate({ x: null, y: '2' }), 0);
                expectEqual(formula.evaluate({ x: '1', y: null }), 1);

                expectEqual(formula.evaluate({ x: 1, y: '2' }), 1);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), 1);
            });

            it('calculates %', () => {

                const formula = new Parser('x%y');

                expectEqual(formula.evaluate({ x: 10, y: 3 }), 1);
                expectEqual(formula.evaluate({ x: null, y: 2 }), 0);
                assert.throws(() => { formula.evaluate({ x: 1, y: null }); });

                expectEqual(formula.evaluate({ x: '1', y: '2' }), 1);
                expectEqual(formula.evaluate({ x: null, y: '2' }), 0);
                assert.throws(() => { formula.evaluate({ x: '1', y: null }); });

                expectEqual(formula.evaluate({ x: 1, y: '2' }), 1);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), 1);
            });

            it('compares <', () => {

                const formula = new Parser('x<y');

                expectEqual(formula.evaluate({ x: 10, y: 3 }), false);
                expectEqual(formula.evaluate({ x: 10, y: 10 }), false);
                expectEqual(formula.evaluate({ x: null, y: 2 }), true);
                expectEqual(formula.evaluate({ x: 1, y: null }), false);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), true);
                expectEqual(formula.evaluate({ x: '1', y: '1' }), false);
                expectEqual(formula.evaluate({ x: null, y: '2' }), true);
                expectEqual(formula.evaluate({ x: '1', y: null }), false);

                expectEqual(formula.evaluate({ x: 1, y: '2' }), true);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), true);
                expectEqual(formula.evaluate({ x: 1, y: '1' }), false);
                expectEqual(formula.evaluate({ x: '1', y: 1 }), false);

                expectEqual(formula.evaluate({ x: null, y: null }), false);
            });

            it('compares >', () => {

                const formula = new Parser('x>y');

                expectEqual(formula.evaluate({ x: 10, y: 3 }), true);
                expectEqual(formula.evaluate({ x: 10, y: 10 }), false);
                expectEqual(formula.evaluate({ x: null, y: 2 }), false);
                expectEqual(formula.evaluate({ x: 1, y: null }), true);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), false);
                expectEqual(formula.evaluate({ x: '1', y: '1' }), false);
                expectEqual(formula.evaluate({ x: null, y: '2' }), false);
                expectEqual(formula.evaluate({ x: '1', y: null }), true);

                expectEqual(formula.evaluate({ x: 1, y: '2' }), false);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), false);
                expectEqual(formula.evaluate({ x: 1, y: '1' }), false);
                expectEqual(formula.evaluate({ x: '1', y: 1 }), false);

                expectEqual(formula.evaluate({ x: null, y: null }), false);
            });

            it('compares <=', () => {

                const formula = new Parser('x<=y');

                expectEqual(formula.evaluate({ x: 10, y: 3 }), false);
                expectEqual(formula.evaluate({ x: 10, y: 10 }), true);
                expectEqual(formula.evaluate({ x: null, y: 2 }), true);
                expectEqual(formula.evaluate({ x: 1, y: null }), false);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), true);
                expectEqual(formula.evaluate({ x: '1', y: '1' }), true);
                expectEqual(formula.evaluate({ x: null, y: '2' }), true);
                expectEqual(formula.evaluate({ x: '1', y: null }), false);

                expectEqual(formula.evaluate({ x: 1, y: '2' }), true);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), true);
                expectEqual(formula.evaluate({ x: 1, y: '1' }), true);
                expectEqual(formula.evaluate({ x: '1', y: 1 }), true);

                expectEqual(formula.evaluate({ x: null, y: null }), true);
            });

            it('compares >=', () => {

                const formula = new Parser('x>=y');

                expectEqual(formula.evaluate({ x: 10, y: 3 }), true);
                expectEqual(formula.evaluate({ x: 10, y: 10 }), true);
                expectEqual(formula.evaluate({ x: null, y: 2 }), false);
                expectEqual(formula.evaluate({ x: 1, y: null }), true);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), false);
                expectEqual(formula.evaluate({ x: '1', y: '1' }), true);
                expectEqual(formula.evaluate({ x: null, y: '2' }), false);
                expectEqual(formula.evaluate({ x: '1', y: null }), true);

                expectEqual(formula.evaluate({ x: 1, y: '2' }), false);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), false);
                expectEqual(formula.evaluate({ x: 1, y: '1' }), true);
                expectEqual(formula.evaluate({ x: '1', y: 1 }), true);

                expectEqual(formula.evaluate({ x: null, y: null }), true);
            });

            it('compares ==', () => {

                const formula = new Parser('x==y');

                expectEqual(formula.evaluate({ x: 10, y: 3 }), false);
                expectEqual(formula.evaluate({ x: 10, y: 10 }), true);
                expectEqual(formula.evaluate({ x: null, y: 2 }), false);
                expectEqual(formula.evaluate({ x: 1, y: null }), false);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), false);
                expectEqual(formula.evaluate({ x: '1', y: '1' }), true);
                expectEqual(formula.evaluate({ x: null, y: '2' }), false);
                expectEqual(formula.evaluate({ x: '1', y: null }), false);

                expectEqual(formula.evaluate({ x: 1, y: '2' }), false);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), false);
                expectEqual(formula.evaluate({ x: 1, y: '1' }), true);
                expectEqual(formula.evaluate({ x: '1', y: 1 }), true);

                expectEqual(formula.evaluate({ x: null, y: null }), true);
            });

            it('compares !=', () => {

                const formula = new Parser('x!=y');

                expectEqual(formula.evaluate({ x: 10, y: 3 }), true);
                expectEqual(formula.evaluate({ x: 10, y: 10 }), false);
                expectEqual(formula.evaluate({ x: null, y: 2 }), true);
                expectEqual(formula.evaluate({ x: 1, y: null }), true);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), true);
                expectEqual(formula.evaluate({ x: '1', y: '1' }), false);
                expectEqual(formula.evaluate({ x: null, y: '2' }), true);
                expectEqual(formula.evaluate({ x: '1', y: null }), true);

                expectEqual(formula.evaluate({ x: 1, y: '2' }), true);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), true);
                expectEqual(formula.evaluate({ x: 1, y: '1' }), false);
                expectEqual(formula.evaluate({ x: '1', y: 1 }), false);

                expectEqual(formula.evaluate({ x: null, y: null }), false);
            });

            it('applies logical ||', () => {

                const formula = new Parser('x || y');

                expectEqual(formula.evaluate({ x: 10, y: 3 }), 10);
                expectEqual(formula.evaluate({ x: 10, y: 10 }), 10);
                expectEqual(formula.evaluate({ x: 0, y: 10 }), 10);
                expectEqual(formula.evaluate({ x: 0, y: 0 }), 0);
                expectEqual(formula.evaluate({ x: null, y: 2 }), 2);
                expectEqual(formula.evaluate({ x: 1, y: null }), 1);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), '1');
                expectEqual(formula.evaluate({ x: '1', y: '1' }), '1');
                expectEqual(formula.evaluate({ x: '', y: '1' }), '1');
                expectEqual(formula.evaluate({ x: '', y: '' }), '');
                expectEqual(formula.evaluate({ x: null, y: '2' }), '2');
                expectEqual(formula.evaluate({ x: '1', y: null }), '1');

                expectEqual(formula.evaluate({ x: 1, y: '2' }), 1);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), '1');
                expectEqual(formula.evaluate({ x: 1, y: '1' }), 1);
                expectEqual(formula.evaluate({ x: '1', y: 1 }), '1');

                expectEqual(formula.evaluate({ x: null, y: null }), 0);
            });

            it('applies logical &&', () => {

                const formula = new Parser('x && y');

                expectEqual(formula.evaluate({ x: 10, y: 3 }), 3);
                expectEqual(formula.evaluate({ x: 10, y: 10 }), 10);
                expectEqual(formula.evaluate({ x: 0, y: 10 }), 0);
                expectEqual(formula.evaluate({ x: 0, y: 0 }), 0);
                expectEqual(formula.evaluate({ x: null, y: 2 }), 0);
                expectEqual(formula.evaluate({ x: 1, y: null }), 0);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), '2');
                expectEqual(formula.evaluate({ x: '1', y: '1' }), '1');
                expectEqual(formula.evaluate({ x: '', y: '1' }), '');
                expectEqual(formula.evaluate({ x: '', y: '' }), '');
                expectEqual(formula.evaluate({ x: null, y: '2' }), 0);
                expectEqual(formula.evaluate({ x: '1', y: null }), 0);

                expectEqual(formula.evaluate({ x: 1, y: '2' }), '2');
                expectEqual(formula.evaluate({ x: '1', y: 2 }), 2);
                expectEqual(formula.evaluate({ x: 1, y: '1' }), '1');
                expectEqual(formula.evaluate({ x: '1', y: 1 }), 1);

                expectEqual(formula.evaluate({ x: null, y: null }), 0);
            });

            it('applies logical ??', () => {

                const formula = new Parser('x ?? y');

                expectEqual(formula.evaluate({ x: 10, y: 3 }), 10);
                expectEqual(formula.evaluate({ x: 10, y: 10 }), 10);
                expectEqual(formula.evaluate({ x: 0, y: 10 }), 0);
                expectEqual(formula.evaluate({ x: 0, y: 0 }), 0);
                expectEqual(formula.evaluate({ x: null, y: 2 }), 0);
                expectEqual(formula.evaluate({ x: 1, y: null }), 1);

                expectEqual(formula.evaluate({ x: '1', y: '2' }), 1);
                expectEqual(formula.evaluate({ x: '1', y: '1' }), 1);
                expectEqual(formula.evaluate({ x: '', y: '1' }), 0);
                expectEqual(formula.evaluate({ x: '', y: '' }), 0);
                expectEqual(formula.evaluate({ x: null, y: '2' }), 0);
                expectEqual(formula.evaluate({ x: '1', y: null }), 1);

                expectEqual(formula.evaluate({ x: 1, y: '2' }), 1);
                expectEqual(formula.evaluate({ x: '1', y: 2 }), 1);
                expectEqual(formula.evaluate({ x: 1, y: '1' }), 1);
                expectEqual(formula.evaluate({ x: '1', y: 1 }), 1);

                expectEqual(formula.evaluate({ x: null, y: null }), 0);
            });
        });
    });
}