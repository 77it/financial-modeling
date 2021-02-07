import "../types.js";

/** @implements {Value} */
export class ValuesA {
    static value = "hello";
}

/** @implements {Pet} */
export class ValuesB {
    constructor() {
        var info = {};
        info.name = "Ciccio";
        info.surname = "Pasticcio";
        this.info = info;
        this.age = 50;
      }
}
