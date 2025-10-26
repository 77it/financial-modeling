/*
Because 'decimal.js' locks the config, to run some tests that needs to change the config we had to clone the library
creating 'decimal.unlocked_vendor_test_only.mjs', used only by these tests
 */

// @deno-types="../../../vendor/decimaljs/decimal.d.ts"
import { default as Decimal } from '../../../vendor/decimaljs/decimal.unlocked_vendor_test_only.mjs';
export { Decimal };
