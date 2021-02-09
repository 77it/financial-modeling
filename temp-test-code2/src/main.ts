import { ValuesA1, ValuesA2, ValuesB1, ValuesB2 } from "./lib/moduleA.js";

var value2 = new ValuesB1;

console.log(ValuesA1.value + " " + ValuesA2.value + " " + value2.info + " " + ValuesB2.value);

class Student {
    fullName: string;
    constructor(public firstName: string, public middleInitial: string, public lastName: string) {
        this.fullName = firstName + " " + middleInitial + " " + lastName;
    }
}

interface Person {
    firstName: string;
    lastName: string;
}

function greeter(person: Person) {
    return "Hello, " + person.firstName + " " + person.lastName;
}

var user = new Student("Jane", "M.", "User");

console.log(greeter(user));

console.log('ciao');

console.log('end');
