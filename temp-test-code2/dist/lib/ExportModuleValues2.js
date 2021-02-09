export class ValuesA {
}
Object.defineProperty(ValuesA, "value", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: "hello"
});
export class ValuesB {
    constructor() {
        Object.defineProperty(this, "info", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "age", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.info = "Ciccio";
        this.age = 50;
    }
}
