export class ValuesA {
    static value = "hello v0.1.1";
}

export class Module {
    static valueX = "module v0.1.1";
    /** @param {{value: string, value2: string}} p */
    constructor({value, value2}) {
        this.value = value;
        this.value2 = value2;
    }
}
