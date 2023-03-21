export { Result } from './lib/result.js';
export * as validation from './lib/validation_utils.js';
export * as sanitization from './lib/sanitization_utils.js';
export { isValidDate, addMonths, toUTC, toStringYYYYMMDD, toDateYYYYMMDD } from './lib/date_utils.js';
export { isNullOrWhiteSpace } from './lib/string_utils.js';
export { parse as parseJSON5 } from './lib/json5.js';  // parse JSON5 and return undefined if not valid

//#region number libraries
// from https://github.com/MikeMcl/big.js/ & https://www.npmjs.com/package/big.js   // backup in https://github.com/77it/big.js
// @deno-types="https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/big.js/index.d.ts"
export { Big } from 'https://cdn.jsdelivr.net/npm/big.js@6.2.1/big.min.mjs';
//#endregion number libraries

//#region financial libraries
// home   https://github.com/lmammino/financial  // backup repository   https://github.com/77it/financial
// npm   https://www.npmjs.com/package/financial/v/0.1.3
// file index   https://cdn.jsdelivr.net/npm/financial@0.1.3/dist/
// @deno-types="https://cdn.jsdelivr.net/npm/financial@0.1.3/dist/financial.d.ts"
export * as financial from 'https://cdn.jsdelivr.net/npm/financial@0.1.3/dist/financial.esm.js';
//#endregion financial libraries

//#region JSON5 libraries
// see https://json5.org/
// see also https://github.com/json5/json5
// @deno-types='https://unpkg.com/json5@2/lib/index.d.ts'
import JSON5 from 'https://unpkg.com/json5@2/dist/index.min.mjs';
export { JSON5 };
//#endregion JSON5 libraries
