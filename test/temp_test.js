import { Decimal } from '../vendor/decimal/decimal.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('temp test', async () => {
  assert(true);
});

// create an array with numbers from 1 to 100
const numbers = Array.from({ length: 100 }, (_, i) => i + 1);

// create an array with numbers from 0,01 to 1,00 with step 0,01
// the array is created manually to avoid floating point precision issues
const decimalNumbers = Array.from({ length: 100 }, (_, i) => new Decimal((i + 1).toString()).dividedBy(new Decimal('100')));

console.log('decimalNumbers:', decimalNumbers);
console.log('numbers:', numbers);

// loop numbers, divide by 100, compare with decimalNumbers
for (let i = 0; i < numbers.length; i++) {
  const num = numbers[i];
  const decimalNum = decimalNumbers[i];
  const divided = num / 100;
  //console.log(`num: ${num}, divided: ${divided.toString()}, decimalNum: ${decimalNum.toString()}`);
  assert.strictEqual(divided.toString(), decimalNum.toString());
}