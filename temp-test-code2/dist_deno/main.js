import { ValuesA1, ValuesA2, ValuesB1, ValuesB2 } from "./lib/moduleA.js";
import { ClassUsingAndReturningIValueAB } from "./ClassUsingAndReturningIValueAB.js";
var value2 = new ValuesB1;
console.log(ValuesA1.value + " " + ValuesA2.value + " " + value2.info + " " + ValuesB2.value);
var c2 = new ClassUsingAndReturningIValueAB;
var valueAB = { "ValueA": "a", "ValueB": "b" };
console.log(c2.Run(valueAB));
class Student {
    firstName;
    middleInitial;
    lastName;
    fullName;
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
