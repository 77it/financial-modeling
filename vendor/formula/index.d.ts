/**
 * Formula parser
 */
export class Parser {
    /**
     * Create a new formula parser.
     *
     * @param formula - the formula string to parse.
     * @param options - optional settings.
     */
    constructor(formula: string, options?: Options);

    /**
     * Evaluate the formula.
     *
     * @param context - optional object with runtime formula context used to resolve variables.
     *
     * @returns the resolved formula outcome (any type).
     */
    evaluate(context?: any): any;
}

export interface Options {

    /**
     * A hash of key - value pairs used to convert constants to values.
     */
    readonly constants?: Record<string, any>;

    /**
     * A regular expression used to validate token variables.
     */
    readonly tokenRx?: RegExp;

    /**
     * A variable resolver factory function.
     */
    readonly reference?: Options.Reference;

    /**
     * A hash of key-value pairs used to resolve formula functions.
     */
    readonly functions?: Record<string, Function>;

    /**
     * When true, unknown variables throw instead of returning null. Default: true.
     */
    readonly strictReferences?: boolean;

    /**
     * When true, any parse/eval error returns the original formula string. Default: false.
     */
    readonly returnOriginalOnError?: boolean;
}


export namespace Options {

    type Reference = (name: string) => (context: any) => any;
}
