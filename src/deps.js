export { validate, validateObj } from './lib/validation_utils.js';
export { sanitize, sanitizeObj } from './lib/sanitization_utils.js';
export { isInvalidDate, addMonths } from './lib/date_utils.js';


//#region number libraries
// from https://github.com/MikeMcl/big.js/ & https://www.npmjs.com/package/big.js   // backup in https://github.com/77it/big.js
// @deno-types="https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/big.js/index.d.ts"
export { Big } from "https://cdn.jsdelivr.net/npm/big.js@6.2.1/big.min.mjs";
//#endregion number libraries


//#region financial libraries
// home   https://github.com/lmammino/financial  // backup repository   https://github.com/77it/financial
// npm   https://www.npmjs.com/package/financial/v/0.1.3
// file index   https://cdn.jsdelivr.net/npm/financial@0.1.3/dist/
// @deno-types="https://cdn.jsdelivr.net/npm/financial@0.1.3/dist/financial.d.ts"
export * as financial from 'https://cdn.jsdelivr.net/npm/financial@0.1.3/dist/financial.esm.js';
//#endregion financial libraries
