/*
Because 'vendor/decimaljs/decimal.js' locks the config, to run these vendor tests we had to clone the library
creating 'decimal.unlocked_vendor_test_only.mjs', use only by these tests
 */

// @deno-types="../../../vendor/decimaljs/decimal.d.ts"
import { default as Decimal } from '../../../vendor/decimaljs/decimal.unlocked_vendor_test_only.mjs';
export { Decimal };
