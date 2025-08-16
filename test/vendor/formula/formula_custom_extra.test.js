//@ts-nocheck

// based on `formula.test.js` + edits to adapt it to the new version of `formula_custom.js`
// from https://github.com/77it/formula/blob/aeb95946d444466d96cd7a9864c78a4530124f74/test/index.js
// with the addition of region "BDD Jest-like globals"

import { Parser } from '../../../vendor/formula/formula_custom.js';
import { describe, it } from '../../lib/bdd_polyfill.js';

describe('Formula', () => {

    it('evaluates a formula', () => {

        const functions = {
            x: (value) => Number(value) + 10
        };

        const constants = {
            Z: 100
        };

        const formula = new Parser('1 + a.b.c.2.4.x + [b] + x(105)', { functions, constants });
        expect(formula.evaluate({ 'a.b.c.2.4.x': 2, b: 3, 'y + 4': 5 })).toEqual(1 + 2 + 3 + 5 + 10 + 100);
        expect(formula.evaluate({ 'a.b.c.2.4.x': '2', b: 3, 'y + 4': '5' })).toEqual('123115');
    });

    it('evaluates a formula (custom reference handler)', () => {

        const functions = {
            x: (value) => Number(value) + 10
        };

        const constants = {
            Z: 100
        };

        const reference = function (name) {

            return (context) => context[name];
        };

        const formula = new Parser('1 + a.b.c.2.4.x + [b] + x(105)', { functions, constants, reference });
        expect(formula.evaluate({ 'a.b.c.2.4.x': 2, b: 3, 'y + 4': 5 })).toEqual(1 + 2 + 3 + 5 + 10 + 100);
        expect(formula.evaluate({ 'a.b.c.2.4.x': '2', b: 3, 'y + 4': '5' })).toEqual('123115');
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
            expect(formula.evaluate()).toEqual("101" + "z(30)2" + "x(40)3" + "9");

            const formula2 = new Parser('x(y,)', { functions });
            expect(formula2.evaluate()).toEqual('y,1');
        });

    });
});
