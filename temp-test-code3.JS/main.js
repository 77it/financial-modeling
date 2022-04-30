// TODO: test import data from JSON

import {
    ValuesA
} from "https://raw.githubusercontent.com/77it/financial-modeling/master/temp-test-code3.JS/modules-v1/lib/ExportModuleValues3.js";
import {ClassA1, ClassB1, ClassBB1} from "./modules-v1/moduleA.js";
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
let myPet = {};
let info = {};
info.name = "mimmo";
info.surname = "bello";
myPet.info = info;
console.log(myPet.info.name);


// DYNAMIC IMPORT
let importUrl = "https://raw.githubusercontent.com/77it/financial-modeling/master/temp-test-code3.JS/modules-v1/lib/ExportModuleValues3.js";
const ValuesXXX = (await import(importUrl));
console.log(ValuesXXX);
console.log(ValuesXXX.ValuesB.value);

let classBB = new ClassBB1();
/** @type number */
let classBB_age = classBB.age;
console.log(classBB_age);
