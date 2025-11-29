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
     * A regular expression used to validate token variables.
     */
    readonly tokenRx?: RegExp;

    /**
     * A variable resolver factory function.
     * BEWARE! providing a custom reference resolver completely ignore the context parameter passed to `evaluate` method.
     */
    readonly reference?: Options.Reference;

    /**
     * A hash of key-value pairs used to resolve formula functions.
     */
    readonly functions?: Record<string, Function>;

    /**
     * Whether to use Decimal arithmetic for precision.
     * @default true
     */
    readonly useDecimal?: boolean;
}


export namespace Options {

    type Reference = (name: string) => (context: any) => any;
}
