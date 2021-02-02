// @ts-check

// test-import-from-https

import { ValuesA1, ValuesA2, ValuesB1, ValuesB2 } from "https://raw.githubusercontent.com/77it/financial-modeling/master/temp-test-code2/modules-v1/moduleA.js";
/**
 * @typedef { import("./types").Pet } Pet
 */
/**
 * @typedef { import("https://raw.githubusercontent.com/77it/financial-modeling/master/temp-test-code2/types.d.ts").Pet } Pet2
 */

console.log(ValuesA1.value + " " + ValuesA2.value + " " + ValuesB1.value + " " + ValuesB2.value);

/**
 * This is a function.
 *
 * @param {string} n - A string param
 * @return {string} A good string
 *
 * @example
 *
 *     foo('hello')
 */
function foo(n) {
    return n
  }

//console.log(foo(5));
console.log(foo('a'));

/** @type {string[]} */
const a = ['a', '7'];

console.log(a);


/**
 * @type {Pet}
 */
var myPet;
myPet.name = "mimmo";
console.log(myPet.name);

/**
 * @type {Pet2}
 */
var myPet;
myPet.name = "mimmo2";
console.log(myPet.name);
