/**
 * Formula parser and evaluator.
 *
 * Supports both original (formula.js) and v7+ (formula_v7_x.js) versions.
 *
 * Parses mathematical and logical expressions:
 * - Arithmetic: +, -, *, /, %, ^
 * - Comparison: <, <=, >, >=, ==, !=
 * - Logical: &&, ||, !, ??
 * - Unary: - (negate), + (v7+ only)
 * - Parentheses, variables, string literals, function calls
 * - JSONX object/array literals (v7+ only)
 *
 * ## Version Differences
 *
 * | Feature                | Original             | v7+                         |
 * |------------------------|----------------------|-----------------------------|
 * | Arithmetic             | Native JS float      | Scaled BigInt (precise)     |
 * | Missing reference      | Returns `null`       | Throws Error                |
 * | String concat with `+` | Supported            | Not supported (numeric)     |
 * | Unary `+` operator     | Not supported        | Supported                   |
 * | JSONX literals         | Not supported        | Supported                   |
 * | Compilation            | Not supported        | Supported (default: true)   |
 * | `toFunction()`         | Not available        | Available                   |
 */
export class Parser {
    /**
     * Create a new formula parser.
     *
     * Parses the formula string immediately.
     *
     * **v7+**: Also compiles to JS function if `options.compile` is true (default)
     * and environment supports it (no CSP restrictions). Compilation happens
     * exactly once at construction time. If the environment supports compilation
     * but compilation fails, an error is thrown (indicates a bug).
     *
     * @param formula - the formula string to parse.
     * @param options - optional settings.
     * @throws Error if the formula contains syntax errors.
     * @throws Error (v7+) if compilation fails when environment supports it.
     */
    constructor(formula: string, options?: Options);

    /**
     * Evaluate the formula.
     *
     * **Original**: Always uses interpretation. Returns `null` for missing references.
     *
     * **v7+**: Uses compiled function if available. Falls back to interpretation
     * only when environment doesn't support compilation (e.g., CSP restrictions).
     * Throws Error for missing references.
     *
     * @param context - optional object with runtime formula context used to resolve variables.
     * @returns the resolved formula outcome (any type).
     */
    evaluate(context?: any): any;

    /**
     * Convert to a callable function.
     *
     * **v7+ only** - not available in original formula.js (will throw at runtime).
     *
     * Returns the compiled function if available, otherwise returns a bound
     * version of `evaluate()`.
     *
     * @returns a function that takes a context and returns the evaluation result.
     */
    toFunction(): (context?: any) => any;
}

export interface Options {
    /**
     * A regular expression used to validate token variables.
     */
    readonly tokenRx?: RegExp;

    /**
     * A variable resolver function.
     *
     * Receives a variable name and must return a resolver function that will
     * be called with the context during evaluation.
     *
     * Signature is the same for both original and v7+.
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
     *
     * **v7+ only** - ignored in original formula.js.
     *
     * When enabled, the formula is compiled to a native JavaScript function
     * at construction time for faster evaluation. Compilation happens exactly
     * once in the constructor.
     *
     * Compilation uses `eval()` (not `new Function()`) because `eval()` can
     * capture local scope variables (helpers, mathOps, etc.) in the closure.
     *
     * If the environment doesn't support `eval()` (e.g., blocked by Content
     * Security Policy (CSP) - a browser security feature that restricts dynamic
     * code execution to prevent XSS attacks), interpretation is used as fallback.
     * If the environment supports `eval()` but compilation fails, an error is thrown.
     *
     * @default true
     */
    readonly compile?: boolean;
}

export namespace Options {
    type Reference = (name: string, context: any) => any;
}
