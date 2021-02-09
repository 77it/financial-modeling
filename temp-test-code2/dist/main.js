import { ValuesA1, ValuesA2, ValuesB1, ValuesB2 } from "./lib/moduleA.js";
var value2 = new ValuesB1;
console.log(ValuesA1.value + " " + ValuesA2.value + " " + value2.info + " " + ValuesB2.value);
class Student {
    constructor(firstName, middleInitial, lastName) {
        Object.defineProperty(this, "firstName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: firstName
        });
        Object.defineProperty(this, "middleInitial", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: middleInitial
        });
        Object.defineProperty(this, "lastName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: lastName
        });
        Object.defineProperty(this, "fullName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
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
