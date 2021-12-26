// simple class

// inspired from https://stackoverflow.com/a/57599883/5288052 + https://stackoverflow.com/questions/57599393/is-there-an-elegant-way-to-have-value-objects-in-typescript

class UserName {
    /** @type {string} */
    #_value;

    /**
     * @param {string} value - A string param
     */
    constructor(value) {
        if (value === '') {
            throw new Error('Empty value');
        }
        this.#_value = value;
    }

    /**
     * @return {string} the resulting operation
     */
    get value() { return this.#_value; }
}

a = new UserName('a')
