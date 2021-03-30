// programs to install:
/*
1) deno
2) typescript: `npm install -g typescript`  // global installation
3) cd in the source folder
4) node types: `npm i --save-dev @types/node`  // local installation
5) prettier: `npm install --save-dev --save-exact prettier`  // unused, for now
*/


import { ValuesA1, ValuesA2, ValuesB1, ValuesB2 } from "./lib/moduleA.js";
import { ClassUsingAndReturningIValueAB } from "./ClassUsingAndReturningIValueAB.js";

var value2 = new ValuesB1;
console.log(ValuesA1.value + " " + ValuesA2.value + " " + value2.info + " " + ValuesB2.value);

var c2 = new ClassUsingAndReturningIValueAB;
var valueAB = {"ValueA": "a", "ValueB": "b"};
console.log(c2.Run(valueAB));

class Student {
    public firstName;
    public middleInitial;
    public lastName;
    public fullName: string;

    constructor(p: StudentDTO) {
        this.firstName = p.firstName;
        this.middleInitial = p.middleInitial;
        this.lastName = p.lastName;
        this.fullName = p.firstName + " " + p.middleInitial + " " + p.lastName;
    }
}

interface StudentDTO {
    firstName: string;
    middleInitial: string;
    lastName: string;
}

interface Person {
    firstName: string;
    lastName: string;
}

function greeter(person: Person) {
    return "Hello, " + person.firstName + " " + person.lastName;
}

var user = new Student({firstName: "Jane", middleInitial: "M.", lastName: "User"});

console.log(greeter(user));

console.log('ciao');

console.log('end');
