// test-import-from-https

//import { ValuesA1, ValuesA2, ValuesB1, ValuesB2 } from "https://raw.githubusercontent.com/77it/financial-modeling/master/temp-test-code2/modules-v1/moduleA.js";
import { ValuesA1, ValuesA2, ValuesB1, ValuesB2 } from "./modules-v1/moduleA.js";
//import "https://raw.githubusercontent.com/77it/financial-modeling/master/temp-test-code2/types.js";
import "./types.js";

/** @type {Pet} */
var value2 = new ValuesB1;

console.log(ValuesA1.value + " " + ValuesA2.value + " " + value2.info.name + " " + ValuesB2.value);

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


/** @type {Pet} */
var myPet = {};
var info = {};
info.name = "mimmo";
info.surname = "bello";
myPet.info = info;
console.log(myPet.info.name);
