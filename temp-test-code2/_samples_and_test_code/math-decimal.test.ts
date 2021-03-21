// run with `deno test THIS-FILE-NAME`


import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { assert } from "https://deno.land/std/testing/asserts.ts";

// from https://github.com/MikeMcl/bignumber.js/
// @deno-types="https://raw.githubusercontent.com/MikeMcl/bignumber.js/master/bignumber.d.ts"
import {BigNumber} from "https://raw.githubusercontent.com/MikeMcl/bignumber.js/master/bignumber.mjs";

// from https://github.com/MikeMcl/decimal.js
// @deno-types="https://raw.githubusercontent.com/MikeMcl/decimal.js/master/decimal.d.ts"
import {Decimal} from "https://raw.githubusercontent.com/MikeMcl/decimal.js/master/decimal.mjs";

function toFixed(num:number, decimalPlaces:number):number {
    var pow = Math.pow(10, decimalPlaces);
    return Math.round(num*pow) / pow;
}

//#region number
// FAILING TEST
Deno.test("FAILING number: 200.30 * 3 == 600.90", () => {
	assertEquals(600.90, 200.30 * 3);
});

Deno.test("number: toFixed(200.30 * 3, 5) == 600.90", () => {
	assertEquals(600.90, toFixed(200.30 * 3, 5));
});

// FAILING TEST
Deno.test("FAILING number: 200.30 + 200.30 + 200.30 == 600.90", () => {
	assertEquals(600.90, 200.30 + 200.30 + 200.30);
});

Deno.test("number: toFixed(200.30 + 200.30 + 200.30, 5) == 600.90", () => {
	assertEquals(600.90, toFixed(200.30 + 200.30 + 200.30, 5));
});

Deno.test("number: (100 / 3) + (100 / 3) + (100 / 3) == 100", () => {
	const n_d33 = 100 / 3;
	assertEquals(100, n_d33 + n_d33 + n_d33);
});

Deno.test("number: (100 / 3) * 3 == 100", () => {
	const n_100 = 100 / 3 * 3;
	assertEquals(100, n_100);
});
//#endregion number


//#region BigNumber
Deno.test("BigNumber: 200.30 * 3 == 600.90", () => {
	assert(new BigNumber(600.90).eq(new BigNumber(200.30).times(new BigNumber(3))));
});

Deno.test("BigNumber: 200.30 + 200.30 + 200.30 == 600.90", () => {
	assert(new BigNumber(600.90).eq(new BigNumber(200.30).plus(new BigNumber(200.30)).plus(new BigNumber(200.30))));
});

// FAILING TEST
Deno.test("FAILING BigNumber: (100 / 3) + (100 / 3) + (100 / 3) == 100", () => {
	const b_d100 = new BigNumber(100);
	const b_d33 = b_d100.div(3);
	const b_d100sum = new BigNumber(0).plus(b_d33).plus(b_d33).plus(b_d33);
	assert(b_d100.eq(b_d100sum));
});

Deno.test("BigNumber: (100 / 3) + (100 / 3) + (100 / 3) == 100 [toNumber() as number]", () => {
	const b_d100 = new BigNumber(100);
	const b_d33 = b_d100.div(3);
	const b_d100sum = new BigNumber(0).plus(b_d33).plus(b_d33).plus(b_d33);
	assertEquals(b_d100.toNumber(), b_d100sum.toNumber());
});

// FAILING TEST
Deno.test("FAILING BigNumber: (100 / 3) * 3 == 100", () => {
	const b_d100 = new BigNumber(100);
	const b_d100mul = new BigNumber(100).div(3).times(3);
	assert(b_d100.eq(b_d100mul));
});

Deno.test("BigNumber: (100 / 3) * 3 == 100 [toNumber() as number]", () => {
	const b_d100 = new BigNumber(100);
	const b_d100mul = new BigNumber(100).div(3).times(3);
	assertEquals(b_d100.toNumber(), b_d100mul.toNumber());
});
//#endregion BigNumber


//#region Decimal
Deno.test("Decimal: 200.30 * 3 == 600.90", () => {
	assert(new Decimal(600.90).eq(new Decimal(200.30).times(new Decimal(3))));
});

Deno.test("Decimal: 200.30 + 200.30 + 200.30 == 600.90", () => {
	assert(new Decimal(600.90).eq(new Decimal(200.30).plus(new Decimal(200.30)).plus(new Decimal(200.30))));
});

// FAILING TEST
Deno.test("FAILING Decimal: (100 / 3) + (100 / 3) + (100 / 3) == 100", () => {
	const b_d100 = new Decimal(100);
	const b_d33 = b_d100.div(3);
	const b_d100sum = new Decimal(0).plus(b_d33).plus(b_d33).plus(b_d33);
	assert(b_d100.eq(b_d100sum));
});

Deno.test("Decimal: (100 / 3) + (100 / 3) + (100 / 3) == 100 [toNumber() as number]", () => {
	const b_d100 = new Decimal(100);
	const b_d33 = b_d100.div(3);
	const b_d100sum = new Decimal(0).plus(b_d33).plus(b_d33).plus(b_d33);
	assertEquals(b_d100.toNumber(), b_d100sum.toNumber());
});

// FAILING TEST
Deno.test("FAILING Decimal: (100 / 3) * 3 == 100", () => {
	const b_d100 = new Decimal(100);
	const b_d100mul = new Decimal(100).div(3).times(3);
	assert(b_d100.eq(b_d100mul));
});

Deno.test("Decimal: (100 / 3) * 3 == 100 [toNumber() as number]", () => {
	const b_d100 = new Decimal(100);
	const b_d100mul = new Decimal(100).div(3).times(3);
	assertEquals(b_d100.toNumber(), b_d100mul.toNumber());
});
//#endregion Decimal


/*
C# code
	decimal d100 = 100;
	decimal d33 = d100/ 3;
	decimal d100sum = d33 + d33 + d33;
	decimal d100mul = d33 * 3;
	Console.WriteLine(d33);
	Console.WriteLine(d100 == d100sum);
	Console.WriteLine(d100sum);
	Console.WriteLine(d100 == d100mul);
	Console.WriteLine(d100mul);
*/


/*
// rounding number test

// the reason why .valueOf() returns the number correctly rounded is that internally uses parseFloat(), that use the precision of number type, that is limited to 17 decimals (see https://www.w3schools.com/js/js_numbers.asp)

// with string and .parseFloat() the limit seems to be 14 decimals
console.log(Number.parseFloat("99.99999999999999999999"));
console.log(Number.parseFloat("99.999999999999999999"));
console.log(Number.parseFloat("99.99999999999999999"));
console.log(Number.parseFloat("99.9999999999999999"));
console.log(Number.parseFloat("99.999999999999999"));
console.log(Number.parseFloat("99.99999999999999"));
console.log(Number.parseFloat("99.9999999999999"));
console.log(Number.parseFloat("99.999999999999"));
console.log(Number.parseFloat("99.999999999"));
console.log(Number.parseFloat("99.999999"));
console.log(Number.parseFloat("99.999"));

*/