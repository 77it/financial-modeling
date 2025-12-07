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

    /**
     * Convert to a callable function (uses compiled version if available).
     */
    toFunction(): (context?: any) => any;
}

export interface Options {
    /**
     * A regular expression used to validate token variables.
     */
    readonly tokenRx?: RegExp;

    /**
     * A variable resolver function (receives name and context).
     */
    readonly reference?: (name: string) => (context: any) => any;

    /**
     * A hash of key-value pairs used to resolve formula functions.
     */
    readonly functions?: Record<string, (...args: any[]) => any>;

    /**
     * A hash of constant values (boolean, number, string, or null).
     */
    readonly constants?: Record<string, boolean | number | string | null>;

    /**
     * Enable compilation of formulas to JS functions.
     * @default true
     */
    readonly compile?: boolean;
}

export namespace Options {
    type Reference = (name: string, context: any) => any;
}
