export { Result } from './lib/result.js';
export * as validation from './lib/validation_utils.js';
export * as sanitization from './lib/sanitization_utils.js';
export { isValidDate, addMonths, toUTC, toStringYYYYMMDD, toDateYYYYMMDD } from './lib/date_utils.js';
export { isNullOrWhiteSpace } from './lib/string_utils.js';
export { parse as parseJSON5 } from './lib/json5.js';  // parse JSON5 and return undefined if not valid

//#region JSON5 libraries
// see https://json5.org/
// see also https://github.com/json5/json5
// @deno-types='https://unpkg.com/json5@2/lib/index.d.ts'
import JSON5 from 'https://unpkg.com/json5@2/dist/index.min.mjs';
export { JSON5 };
//#endregion JSON5 libraries
