// dependencies
/* write as   https://exploringjs.com/impatient-js/toc.html */

// JS ledger/SimObject
/*
* SimObject class: throw exception with numbers with number of decimal (fractional) digits greater than SIMULATION_NUMBERS_DECIMAL_PLACES elements (also in principal, in every number)
* SimObject class: static method: normalizeNumber; returns a number with the right number of decimal places (from Simulation Lock SIMULATION_NUMBERS_DECIMAL_PLACES)
* SimObject class: store dates without minutes/seconds
*/

// test:
// * import from json:
//   * ../SimulationEngineSettings.json & ../SimulationEngineModules.json
// * import-from-https


import {
    ValuesA
} from "https://raw.githubusercontent.com/77it/financial-modeling/master/temp-test-code3.JS/modules-v1/lib/ExportModuleValues3.js";
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
