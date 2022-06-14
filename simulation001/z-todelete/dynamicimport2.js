export class ValuesA {
    static value = "hello";
}

export class ValuesB {
    static valueX = "module";
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
