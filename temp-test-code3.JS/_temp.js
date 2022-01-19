class MyClass {

    constructor() {
        /** @type {number} some number value */
        this.someNumber = 0;
        /** @type {string} some relevant string */
        this.someString = null;
        /** @type {Map<Number, Set<String>>} map numbers to sets of strings */
        this.strSetByNumber = new Map();
    }

    /**
     * Some sample function.
     *
     * @param {number} a - first value
     * @param {number} b - second value
     * @return {number} the resulting operation
     */
    someFunction(a, b) {
        return a + b;
    }

    /** @param {MyClass} a - an instance of the class */
    otherFunction(a) {
    }
}

let x=null
let a = false
if (x === null)
    console.log("null")
if (x === undefined)
    console.log("undefined")
