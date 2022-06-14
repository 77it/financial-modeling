export class ValuesA {
    static value = "hello v0.1.1";
}

export class ValuesB {
    static valueX = "module v0.1.1";
    /**
     * @param {Object} p
     * @param {string} p.value - Some parameter...
     * @param {string} p.value2 - Another parameter...
     */
    constructor({value, value2}) {
        this.value = value;
        this.value2 = value2;
    }
}
