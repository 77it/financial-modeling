import "../types.js";

/** @implements {Value} */
export class ClassA {
    static value = "hello";
}

/** @implements {Pet} */
export class ClassB {
    constructor() {
        let info = {};
        info.name = "Ciccio";
        info.surname = "Pasticcio";
        this.info = info;
        this.age = 50;
      }
}

/**
 * @property {Object} info
 * @property {string} info.name
 * @property {string} info.surname
 * @property {number} age
 */
export class ClassBB {
    constructor() {
        let info = {};
        info.name = "Ciccio";
        info.surname = "Pasticcio";
        this.info = info;
        this.age = 50;
    }
}


xxx prova classe

/*
Parameter validation:

Create classes that have immutable properties

JsDoc definition for the class

classe che ha metodo With per generare classe dalla classe, solo con piccole modifiche
*/
