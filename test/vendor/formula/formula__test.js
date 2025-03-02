//@ts-nocheck

// from https://github.com/77it/formula/blob/aeb95946d444466d96cd7a9864c78a4530124f74/test/index.js
// with the addition of region "BDD Jest-like globals"

import { Parser } from '../../../vendor/formula/formula.js';
import assert from 'node:assert';
import { describe as describe_node, it as it_node } from 'node:test';

/*
  ____    _____    _____        _____     ____    _       __     __  ______   _____   _        _
 |  _ \  |  __ \  |  __ \      |  __ \   / __ \  | |      \ \   / / |  ____| |_   _| | |      | |
 | |_) | | |  | | | |  | |     | |__) | | |  | | | |       \ \_/ /  | |__      | |   | |      | |
 |  _ <  | |  | | | |  | |     |  ___/  | |  | | | |        \   /   |  __|     | |   | |      | |
 | |_) | | |__| | | |__| |     | |      | |__| | | |____     | |    | |       _| |_  | |____  | |____
 |____/  |_____/  |_____/      |_|       \____/  |______|    |_|    |_|      |_____| |______| |______|
 */
//#region BDD Jest-like globals

/**
 * Creates an object with Jest-like test globals.
 * @returns {Promise<{describe: function, it: function}>} An object containing `describe` and `it` functions.
 */
async function createDescribeAndItForNodeAndDeno() {
    let _describe;
    let _it;

    // /** @type {any} */ const describe = (typeof Deno !== 'undefined') ? await import { describe } from "jsr:@std/testing/bdd" : describe_node;  // to force testing under Deno with its logic and internals

    // if Deno is defined, import the BDD module from its standard library
    if (typeof Deno !== 'undefined') {
        const bdd = await import ("jsr:@std/testing/bdd");
        _describe = bdd.describe;
        _it = bdd.it;
    } else {
        _describe = describe_node;
        _it = it_node;
    }

    return {describe: _describe, it: _it};
}

const { describe, it } = await createDescribeAndItForNodeAndDeno();

// Create Jest‑style global `expect` function
if (typeof expect === "undefined") {
    globalThis.expect = (received) => {
        const matchers = {
            toBe(expected) {
                assert.strictEqual(
                  received,
                  expected,
                  `Expected ${received} to be ${expected}`
                );
            },
            toEqual(expected) {
                assert.deepStrictEqual(
                  received,
                  expected,
                  `Expected ${JSON.stringify(received)} to equal ${JSON.stringify(expected)}`
                );
            },
            toThrow(expectedError) {
                let threw = false;
                try {
                    received();
                } catch (error) {
                    threw = true;
                    if (expectedError) {
                        if (typeof expectedError === 'string') {
                            assert.strictEqual(
                              error.message,
                              expectedError,
                              `Expected error message "${error.message}" to be "${expectedError}"`
                            );
                        } else if (error instanceof expectedError) {
                            return;
                        } else {
                            throw new assert.AssertionError({
                                message: `Expected error to be instance of ${expectedError.name}, but got ${error.constructor.name}`,
                                actual: error.constructor.name,
                                expected: expectedError.name,
                            });
                        }
                    }
                }
                if (!threw) {
                    throw new assert.AssertionError({
                        message: 'Expected function to throw an error, but it did not',
                    });
                }
            },
            toBeNull() {
                assert.strictEqual(
                  received,
                  null,
                  `Expected ${received} to be null`
                );
            }
        };

        return {
            ...matchers,
            not: {
                toBe(expected) {
                    assert.notStrictEqual(
                      received,
                      expected,
                      `Expected ${received} not to be ${expected}`
                    );
                },
                toEqual(expected) {
                    assert.notDeepStrictEqual(
                      received,
                      expected,
                      `Expected ${JSON.stringify(received)} not to equal ${JSON.stringify(expected)}`
                    );
                },
                toThrow(expectedError) {
                    let threw = false;
                    try {
                        received();
                    } catch (error) {
                        threw = true;
                        if (expectedError) {
                            if (typeof expectedError === 'string') {
                                assert.notStrictEqual(
                                  error.message,
                                  expectedError,
                                  `Expected error message "${error.message}" not to be "${expectedError}"`
                                );
                            } else if (error instanceof expectedError) {
                                throw new assert.AssertionError({
                                    message: `Expected error not to be instance of ${expectedError.name}, but it was`,
                                    actual: error.constructor.name,
                                    expected: expectedError.name,
                                });
                            }
                        }
                    }
                    if (!threw) {
                        return;
                    }
                    throw new assert.AssertionError({
                        message: 'Expected function not to throw an error, but it did',
                    });
                },
                toBeNull() {
                    assert.notStrictEqual(
                      received,
                      null,
                      `Expected ${received} not to be null`
                    );
                }
            }
        };
    };
}
//#endregion BDD Jest-like globals

describe('Formula', () => {

    it('evaluates a formula', () => {

        const functions = {
            x: (value) => value + 10
        };

        const constants = {
            Z: 100
        };

        const formula = new Parser('1 + a.b.c.2.4.x + [b] + x([y + 4] + Z)', { functions, constants });
        expect(formula.evaluate({ 'a.b.c.2.4.x': 2, b: 3, 'y + 4': 5 })).toEqual(1 + 2 + 3 + 5 + 10 + 100);
        expect(formula.evaluate({ 'a.b.c.2.4.x': '2', b: 3, 'y + 4': '5' })).toEqual('123510010');
    });

    it('evaluates a formula (custom reference handler)', () => {

        const functions = {
            x: (value) => value + 10
        };

        const constants = {
            Z: 100
        };

        const reference = function (name) {

            return (context) => context[name];
        };

        const formula = new Parser('1 + a.b.c.2.4.x + [b] + x([y + 4] + Z)', { functions, constants, reference });
        expect(formula.evaluate({ 'a.b.c.2.4.x': 2, b: 3, 'y + 4': 5 })).toEqual(1 + 2 + 3 + 5 + 10 + 100);
        expect(formula.evaluate({ 'a.b.c.2.4.x': '2', b: 3, 'y + 4': '5' })).toEqual('123510010');
    });

    describe('constructor()', () => {

        it('allows valid constant', () => {

            expect(() => new Parser('1 + x', { constants: { x: true } })).not.toThrow();
            expect(() => new Parser('1 + x', { constants: { x: 1 } })).not.toThrow();
            expect(() => new Parser('1 + x', { constants: { x: 'x' } })).not.toThrow();
            expect(() => new Parser('1 + x', { constants: { x: null } })).not.toThrow();
        });

        it('errors on invalid constant', () => {

            expect(() => new Parser('1 + x', { constants: { x: {} } })).toThrow('Formula constant x contains invalid object value type');
            expect(() => new Parser('1 + x', { constants: { x: () => null } })).toThrow('Formula constant x contains invalid function value type');
            expect(() => new Parser('1 + x', { constants: { x: undefined } })).toThrow('Formula constant x contains invalid undefined value type');
        });
    });

    describe('single', () => {

        it('identifies single literal (string)', () => {

            const formula = new Parser('"x"');
            expect(formula.single).toEqual({ type: 'value', value: 'x' });
        });

        it('identifies single literal (number)', () => {

            const formula = new Parser('123');
            expect(formula.single).toEqual({ type: 'value', value: 123 });
        });

        it('identifies single literal (constant)', () => {

            const formula = new Parser('x', { constants: { x: 'y' } });
            expect(formula.single).toEqual({ type: 'value', value: 'y' });
        });

        it('identifies single reference', () => {

            const formula = new Parser('x');
            expect(formula.single).toEqual({ type: 'reference', value: 'x' });
        });

        it('identifies non-single reference', () => {

            const formula = new Parser('-x');
            expect(formula.single).toBeNull();
        });
    });

    describe('_parse()', () => {

        it('parses multiple nested functions', () => {

            const functions = {
                x: (value) => value + 1,
                y: (value) => value + 2,
                z: (value) => value + 3,
                a: () => 9
            };

            const formula = new Parser('x(10) + y(z(30)) + z(x(40)) + a()', { functions });
            expect(formula.evaluate()).toEqual(11 + 33 + 2 + 41 + 3 + 9);
        });

        it('passes context as this to functions', () => {

            const functions = {
                x: function () {

                    return this.X;
                }
            };

            const formula = new Parser('x()', { functions });
            expect(formula.evaluate({ X: 1 })).toEqual(1);
        });

        it('parses parenthesis', () => {

            const formula = new Parser('(x + 4) * (x - 5) / (x ^ 2)');
            expect(formula.evaluate({ x: 10 })).toEqual((10 + 4) * (10 - 5) / (Math.pow(10, 2)));
        });

        it('parses string literals', () => {

            const formula = new Parser('"x+3" + `y()` + \'-z\'');
            expect(formula.evaluate()).toEqual('x+3y()-z');
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

            expect(() => new Parser('x + + y')).toThrow('Formula contains an operator in invalid position');
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
                x: (a, b, c) => a + b + c,
                y: (a, b) => a * b,
                z: (value) => value + 3,
                a: () => 9
            };

            const formula = new Parser('x(10, (y((1 + 2), z(30)) + a()), z(x(4, 5, 6)))', { functions });
            expect(formula.evaluate()).toEqual(10 + (((1 + 2) * (30 + 3)) + 9) + (4 + 5 + 6) + 3);
        });

        it('parses multiple nested functions with arguments (strings)', () => {

            const functions = {
                x: (a, b, c) => a + b + c,
                y: (a, b) => a + b,
                z: (value) => value + 3,
                a: () => 9
            };

            const formula = new Parser('x("10", (y(("1" + "2"), z("30")) + a()), z(x("4", "5", "6")))', { functions });
            expect(formula.evaluate()).toEqual('101230394563');
        });

        it('errors on unknown function', () => {

            expect(() => new Parser('x()')).toThrow('Formula contains unknown function x');
        });

        it('errors on invalid function arguments', () => {

            expect(() => new Parser('x(y,)', { functions: { x: () => null } })).toThrow('Formula contains function x with invalid arguments y,');
        });
    });

    describe('evaluate()', () => {

        it('handles null constant', () => {

            const formula = new Parser('0 + null', { constants: { null: null } });

            expect(formula.evaluate()).toEqual(0);
        });
    });

    describe('single()', () => {

        it('calculates -', () => {

            const formula = new Parser('-x');

            expect(formula.evaluate({ x: 1 })).toEqual(-1);
            expect(formula.evaluate({ x: -1 })).toEqual(1);
            expect(formula.evaluate({ x: 0 })).toEqual(0);
        });

        it('handles --', () => {

            const formula = new Parser('10--x');

            expect(formula.evaluate({ x: 1 })).toEqual(11);
            expect(formula.evaluate({ x: -1 })).toEqual(9);
            expect(formula.evaluate({ x: 0 })).toEqual(10);
        });

        it('calculates !', () => {

            const formula = new Parser('!x');

            expect(formula.evaluate({ x: 1 })).toEqual(false);
            expect(formula.evaluate({ x: -1 })).toEqual(false);
            expect(formula.evaluate({ x: 0 })).toEqual(true);
        });
    });

    describe('calculate()', () => {

        it('calculates +', () => {

            const formula = new Parser('x+y');

            expect(formula.evaluate({ x: 1, y: 2 })).toEqual(3);
            expect(formula.evaluate({ y: 2 })).toEqual(2);
            expect(formula.evaluate({ x: 1 })).toEqual(1);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(2);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(1);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual('12');
            expect(formula.evaluate({ y: '2' })).toEqual('2');
            expect(formula.evaluate({ x: '1' })).toEqual('1');
            expect(formula.evaluate({ x: null, y: '2' })).toEqual('2');
            expect(formula.evaluate({ x: '1', y: null })).toEqual('1');

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual('12');
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual('12');
        });

        it('calculates -', () => {

            const formula = new Parser('x-y');

            expect(formula.evaluate({ x: 1, y: 2 })).toEqual(-1);
            expect(formula.evaluate({ y: 2 })).toEqual(-2);
            expect(formula.evaluate({ x: 1 })).toEqual(1);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(-2);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(1);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual(null);
            expect(formula.evaluate({ y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1' })).toEqual(null);
            expect(formula.evaluate({ x: null, y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1', y: null })).toEqual(null);

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual(null);
        });

        it('calculates *', () => {

            const formula = new Parser('x*y');

            expect(formula.evaluate({ x: 20, y: 10 })).toEqual(200);
            expect(formula.evaluate({ y: 2 })).toEqual(0);
            expect(formula.evaluate({ x: 1 })).toEqual(0);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(0);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(0);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual(null);
            expect(formula.evaluate({ y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1' })).toEqual(null);
            expect(formula.evaluate({ x: null, y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1', y: null })).toEqual(null);

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual(null);
        });

        it('calculates /', () => {

            const formula = new Parser('x/y');

            expect(formula.evaluate({ x: 20, y: 10 })).toEqual(2);
            expect(formula.evaluate({ y: 2 })).toEqual(0);
            expect(formula.evaluate({ x: 1 })).toEqual(Infinity);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(0);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(Infinity);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual(null);
            expect(formula.evaluate({ y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1' })).toEqual(null);
            expect(formula.evaluate({ x: null, y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1', y: null })).toEqual(null);

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual(null);
        });

        it('calculates ^', () => {

            const formula = new Parser('x^y');

            expect(formula.evaluate({ x: 2, y: 3 })).toEqual(8);
            expect(formula.evaluate({ y: 2 })).toEqual(0);
            expect(formula.evaluate({ x: 1 })).toEqual(1);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(0);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(1);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual(null);
            expect(formula.evaluate({ y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1' })).toEqual(null);
            expect(formula.evaluate({ x: null, y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1', y: null })).toEqual(null);

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual(null);
        });

        it('calculates %', () => {

            const formula = new Parser('x%y');

            expect(formula.evaluate({ x: 10, y: 3 })).toEqual(1);
            expect(formula.evaluate({ y: 2 })).toEqual(0);
            expect(formula.evaluate({ x: 1 })).toEqual(NaN);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(0);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(NaN);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual(null);
            expect(formula.evaluate({ y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1' })).toEqual(null);
            expect(formula.evaluate({ x: null, y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1', y: null })).toEqual(null);

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual(null);
        });

        it('compares <', () => {

            const formula = new Parser('x<y');

            expect(formula.evaluate({ x: 10, y: 3 })).toEqual(false);
            expect(formula.evaluate({ x: 10, y: 10 })).toEqual(false);
            expect(formula.evaluate({ y: 2 })).toEqual(true);
            expect(formula.evaluate({ x: 1 })).toEqual(false);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(true);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(false);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual(true);
            expect(formula.evaluate({ x: '1', y: '1' })).toEqual(false);
            expect(formula.evaluate({ y: '2' })).toEqual(true);
            expect(formula.evaluate({ x: '1' })).toEqual(false);
            expect(formula.evaluate({ x: null, y: '2' })).toEqual(true);
            expect(formula.evaluate({ x: '1', y: null })).toEqual(false);

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(true);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual(true);
            expect(formula.evaluate({ x: 1, y: '1' })).toEqual(false);
            expect(formula.evaluate({ x: '1', y: 1 })).toEqual(false);

            expect(formula.evaluate({ x: null, y: null })).toEqual(false);
            expect(formula.evaluate({ y: null })).toEqual(false);
            expect(formula.evaluate({ x: null })).toEqual(false);
            expect(formula.evaluate()).toEqual(false);
        });

        it('compares >', () => {

            const formula = new Parser('x>y');

            expect(formula.evaluate({ x: 10, y: 3 })).toEqual(true);
            expect(formula.evaluate({ x: 10, y: 10 })).toEqual(false);
            expect(formula.evaluate({ y: 2 })).toEqual(false);
            expect(formula.evaluate({ x: 1 })).toEqual(true);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(false);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(true);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual(false);
            expect(formula.evaluate({ x: '1', y: '1' })).toEqual(false);
            expect(formula.evaluate({ y: '2' })).toEqual(false);
            expect(formula.evaluate({ x: '1' })).toEqual(true);
            expect(formula.evaluate({ x: null, y: '2' })).toEqual(false);
            expect(formula.evaluate({ x: '1', y: null })).toEqual(true);

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(false);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual(false);
            expect(formula.evaluate({ x: 1, y: '1' })).toEqual(false);
            expect(formula.evaluate({ x: '1', y: 1 })).toEqual(false);

            expect(formula.evaluate({ x: null, y: null })).toEqual(false);
            expect(formula.evaluate({ y: null })).toEqual(false);
            expect(formula.evaluate({ x: null })).toEqual(false);
            expect(formula.evaluate()).toEqual(false);
        });

        it('compares <=', () => {

            const formula = new Parser('x<=y');

            expect(formula.evaluate({ x: 10, y: 3 })).toEqual(false);
            expect(formula.evaluate({ x: 10, y: 10 })).toEqual(true);
            expect(formula.evaluate({ y: 2 })).toEqual(true);
            expect(formula.evaluate({ x: 1 })).toEqual(false);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(true);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(false);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual(true);
            expect(formula.evaluate({ x: '1', y: '1' })).toEqual(true);
            expect(formula.evaluate({ y: '2' })).toEqual(true);
            expect(formula.evaluate({ x: '1' })).toEqual(false);
            expect(formula.evaluate({ x: null, y: '2' })).toEqual(true);
            expect(formula.evaluate({ x: '1', y: null })).toEqual(false);

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(true);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual(true);
            expect(formula.evaluate({ x: 1, y: '1' })).toEqual(true);
            expect(formula.evaluate({ x: '1', y: 1 })).toEqual(true);

            expect(formula.evaluate({ x: null, y: null })).toEqual(true);
            expect(formula.evaluate({ y: null })).toEqual(true);
            expect(formula.evaluate({ x: null })).toEqual(true);
            expect(formula.evaluate()).toEqual(true);
        });

        it('compares >=', () => {

            const formula = new Parser('x>=y');

            expect(formula.evaluate({ x: 10, y: 3 })).toEqual(true);
            expect(formula.evaluate({ x: 10, y: 10 })).toEqual(true);
            expect(formula.evaluate({ y: 2 })).toEqual(false);
            expect(formula.evaluate({ x: 1 })).toEqual(true);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(false);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(true);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual(false);
            expect(formula.evaluate({ x: '1', y: '1' })).toEqual(true);
            expect(formula.evaluate({ y: '2' })).toEqual(false);
            expect(formula.evaluate({ x: '1' })).toEqual(true);
            expect(formula.evaluate({ x: null, y: '2' })).toEqual(false);
            expect(formula.evaluate({ x: '1', y: null })).toEqual(true);

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(false);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual(false);
            expect(formula.evaluate({ x: 1, y: '1' })).toEqual(true);
            expect(formula.evaluate({ x: '1', y: 1 })).toEqual(true);

            expect(formula.evaluate({ x: null, y: null })).toEqual(true);
            expect(formula.evaluate({ y: null })).toEqual(true);
            expect(formula.evaluate({ x: null })).toEqual(true);
            expect(formula.evaluate()).toEqual(true);
        });

        it('compares ==', () => {

            const formula = new Parser('x==y');

            expect(formula.evaluate({ x: 10, y: 3 })).toEqual(false);
            expect(formula.evaluate({ x: 10, y: 10 })).toEqual(true);
            expect(formula.evaluate({ y: 2 })).toEqual(false);
            expect(formula.evaluate({ x: 1 })).toEqual(false);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(false);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(false);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual(false);
            expect(formula.evaluate({ x: '1', y: '1' })).toEqual(true);
            expect(formula.evaluate({ y: '2' })).toEqual(false);
            expect(formula.evaluate({ x: '1' })).toEqual(false);
            expect(formula.evaluate({ x: null, y: '2' })).toEqual(false);
            expect(formula.evaluate({ x: '1', y: null })).toEqual(false);

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(false);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual(false);
            expect(formula.evaluate({ x: 1, y: '1' })).toEqual(false);
            expect(formula.evaluate({ x: '1', y: 1 })).toEqual(false);

            expect(formula.evaluate({ x: null, y: null })).toEqual(true);
            expect(formula.evaluate({ y: null })).toEqual(true);
            expect(formula.evaluate({ x: null })).toEqual(true);
            expect(formula.evaluate()).toEqual(true);
        });

        it('compares !=', () => {

            const formula = new Parser('x!=y');

            expect(formula.evaluate({ x: 10, y: 3 })).toEqual(true);
            expect(formula.evaluate({ x: 10, y: 10 })).toEqual(false);
            expect(formula.evaluate({ y: 2 })).toEqual(true);
            expect(formula.evaluate({ x: 1 })).toEqual(true);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(true);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(true);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual(true);
            expect(formula.evaluate({ x: '1', y: '1' })).toEqual(false);
            expect(formula.evaluate({ y: '2' })).toEqual(true);
            expect(formula.evaluate({ x: '1' })).toEqual(true);
            expect(formula.evaluate({ x: null, y: '2' })).toEqual(true);
            expect(formula.evaluate({ x: '1', y: null })).toEqual(true);

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(true);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual(true);
            expect(formula.evaluate({ x: 1, y: '1' })).toEqual(true);
            expect(formula.evaluate({ x: '1', y: 1 })).toEqual(true);

            expect(formula.evaluate({ x: null, y: null })).toEqual(false);
            expect(formula.evaluate({ y: null })).toEqual(false);
            expect(formula.evaluate({ x: null })).toEqual(false);
            expect(formula.evaluate()).toEqual(false);
        });

        it('applies logical ||', () => {

            const formula = new Parser('x || y');

            expect(formula.evaluate({ x: 10, y: 3 })).toEqual(10);
            expect(formula.evaluate({ x: 10, y: 10 })).toEqual(10);
            expect(formula.evaluate({ x: 0, y: 10 })).toEqual(10);
            expect(formula.evaluate({ x: 0, y: 0 })).toEqual(0);
            expect(formula.evaluate({ y: 2 })).toEqual(2);
            expect(formula.evaluate({ x: 1 })).toEqual(1);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(2);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(1);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual('1');
            expect(formula.evaluate({ x: '1', y: '1' })).toEqual('1');
            expect(formula.evaluate({ x: '', y: '1' })).toEqual('1');
            expect(formula.evaluate({ x: '', y: '' })).toEqual('');
            expect(formula.evaluate({ y: '2' })).toEqual('2');
            expect(formula.evaluate({ x: '1' })).toEqual('1');
            expect(formula.evaluate({ x: null, y: '2' })).toEqual('2');
            expect(formula.evaluate({ x: '1', y: null })).toEqual('1');

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(1);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual('1');
            expect(formula.evaluate({ x: 1, y: '1' })).toEqual(1);
            expect(formula.evaluate({ x: '1', y: 1 })).toEqual('1');

            expect(formula.evaluate({ x: null, y: null })).toEqual(null);
            expect(formula.evaluate({ y: null })).toEqual(null);
            expect(formula.evaluate({ x: null })).toEqual(null);
            expect(formula.evaluate()).toEqual(null);
        });

        it('applies logical &&', () => {

            const formula = new Parser('x && y');

            expect(formula.evaluate({ x: 10, y: 3 })).toEqual(3);
            expect(formula.evaluate({ x: 10, y: 10 })).toEqual(10);
            expect(formula.evaluate({ x: 0, y: 10 })).toEqual(0);
            expect(formula.evaluate({ x: 0, y: 0 })).toEqual(0);
            expect(formula.evaluate({ y: 2 })).toEqual(null);
            expect(formula.evaluate({ x: 1 })).toEqual(null);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(null);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(null);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual('2');
            expect(formula.evaluate({ x: '1', y: '1' })).toEqual('1');
            expect(formula.evaluate({ x: '', y: '1' })).toEqual('');
            expect(formula.evaluate({ x: '', y: '' })).toEqual('');
            expect(formula.evaluate({ y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1' })).toEqual(null);
            expect(formula.evaluate({ x: null, y: '2' })).toEqual(null);
            expect(formula.evaluate({ x: '1', y: null })).toEqual(null);

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual('2');
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual(2);
            expect(formula.evaluate({ x: 1, y: '1' })).toEqual('1');
            expect(formula.evaluate({ x: '1', y: 1 })).toEqual(1);

            expect(formula.evaluate({ x: null, y: null })).toEqual(null);
            expect(formula.evaluate({ y: null })).toEqual(null);
            expect(formula.evaluate({ x: null })).toEqual(null);
            expect(formula.evaluate()).toEqual(null);
        });

        it('applies logical ??', () => {

            const formula = new Parser('x ?? y');

            expect(formula.evaluate({ x: 10, y: 3 })).toEqual(10);
            expect(formula.evaluate({ x: 10, y: 10 })).toEqual(10);
            expect(formula.evaluate({ x: 0, y: 10 })).toEqual(0);
            expect(formula.evaluate({ x: 0, y: 0 })).toEqual(0);
            expect(formula.evaluate({ y: 2 })).toEqual(2);
            expect(formula.evaluate({ x: 1 })).toEqual(1);
            expect(formula.evaluate({ x: null, y: 2 })).toEqual(2);
            expect(formula.evaluate({ x: 1, y: null })).toEqual(1);

            expect(formula.evaluate({ x: '1', y: '2' })).toEqual('1');
            expect(formula.evaluate({ x: '1', y: '1' })).toEqual('1');
            expect(formula.evaluate({ x: '', y: '1' })).toEqual('');
            expect(formula.evaluate({ x: '', y: '' })).toEqual('');
            expect(formula.evaluate({ y: '2' })).toEqual('2');
            expect(formula.evaluate({ x: '1' })).toEqual('1');
            expect(formula.evaluate({ x: null, y: '2' })).toEqual('2');
            expect(formula.evaluate({ x: '1', y: null })).toEqual('1');

            expect(formula.evaluate({ x: 1, y: '2' })).toEqual(1);
            expect(formula.evaluate({ x: '1', y: 2 })).toEqual('1');
            expect(formula.evaluate({ x: 1, y: '1' })).toEqual(1);
            expect(formula.evaluate({ x: '1', y: 1 })).toEqual('1');

            expect(formula.evaluate({ x: null, y: null })).toEqual(null);
            expect(formula.evaluate({ y: null })).toEqual(null);
            expect(formula.evaluate({ x: null })).toEqual(null);
            expect(formula.evaluate()).toEqual(null);
        });
    });
});
