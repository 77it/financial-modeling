"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moduleA_js_1 = require("./lib/moduleA.js");
const ClassUsingAndReturningIValueAB_js_1 = require("./ClassUsingAndReturningIValueAB.js");
var value2 = new moduleA_js_1.ValuesB1;
console.log(moduleA_js_1.ValuesA1.value + " " + moduleA_js_1.ValuesA2.value + " " + value2.info + " " + moduleA_js_1.ValuesB2.value);
var c2 = new ClassUsingAndReturningIValueAB_js_1.ClassUsingAndReturningIValueAB;
var valueAB = { "ValueA": "a", "ValueB": "b" };
console.log(c2.Run(valueAB));
class Student {
    constructor(firstName, middleInitial, lastName) {
        this.firstName = firstName;
        this.middleInitial = middleInitial;
        this.lastName = lastName;
        this.fullName = firstName + " " + middleInitial + " " + lastName;
    }
}
function greeter(person) {
    return "Hello, " + person.firstName + " " + person.lastName;
}
var user = new Student("Jane", "M.", "User");
console.log(greeter(user));
console.log('ciao');
console.log('end');
