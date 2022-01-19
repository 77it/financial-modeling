// dependencies
/* write as   https://exploringjs.com/impatient-js/toc.html */

// JS ledger/SimObject: Create a SimObject class that throw exception with numbers with fractional part > than 10 elements (also in principal, in every number).
/* Create static method inside SimObject class: simObjNumberValidator; returns string.Empty or the error (from constants simObjNumberValidator_Error_DecimalsMoreThanTen) */

// test: import-from-https


import { ValuesA } from "https://raw.githubusercontent.com/77it/financial-modeling/master/temp-test-code3.JS/modules-v1/lib/ExportModuleValues3.js";
//import { ValuesA1, ValuesA2, ValuesB1, ValuesB2 } from "./modules-v1/moduleA.js";
//import "https://raw.githubusercontent.com/77it/financial-modeling/master/temp-test-code2/types.js";
import "./types.js";

console.log(ValuesA.value);

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
const a = ["a", "7"];

console.log(a);


/** @type {Pet} */
var myPet = {};
var info = {};
info.name = "mimmo";
info.surname = "bello";
myPet.info = info;
console.log(myPet.info.name);


// DYNAMIC IMPORT
var importUrl = "https://raw.githubusercontent.com/77it/financial-modeling/master/temp-test-code3.JS/modules-v1/lib/ExportModuleValues3.js";
const ValuesXXX = (await import(importUrl));
console.log(ValuesXXX);
console.log(ValuesXXX.ValuesB.value);
