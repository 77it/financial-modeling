import { Result } from '../../src/lib/result.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('Result class tests: success', () => {
  const result_success_for_void = new Result({ success: true });
  assert.deepStrictEqual(result_success_for_void.success, true);
  assert.deepStrictEqual(result_success_for_void.error, '');  // error is sanitized to string
  assert.deepStrictEqual(result_success_for_void.value, undefined);

  //@ts-ignore
  const result_success_for_void2 = new Result({ success: 1, error: '' });
  assert.deepStrictEqual(result_success_for_void2.success, true);  // success is sanitized to boolean
  assert.deepStrictEqual(result_success_for_void2.error, '');
  assert.deepStrictEqual(result_success_for_void2.value, undefined);

  const result_success = new Result({ success: true, value: 999 });
  assert.deepStrictEqual(result_success.success, true);
  assert.deepStrictEqual(result_success.error, '');  // error is sanitized to string
  assert.deepStrictEqual(result_success.value, 999);

  // stack is a not standard property
  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack
  // then we return it or if not available error.toString()
  try {
    throw new Error('err reason');
  } catch (error) {
    const result_error =
      new Result({
        success: false,
        error: (error instanceof Error) ? error.stack?.toString() ?? error.toString() : 'Unknown error occurred'
      });
    assert.deepStrictEqual(result_error.success, false);
    assert(result_error.error !== undefined);
    assert.deepStrictEqual(result_error.value, undefined);
  }
});

t('Result class tests: errors', () => {
  assert.throws(() => new Result({success:false}));
  assert.throws(() => new Result({success:false, error: undefined}));
  assert.throws(() => new Result({success:false, error: ''}));
  assert.throws(() => new Result({success:true, error: 'error #1'}));
  assert.throws(() => new Result({success:true, value: 999, error: 'error #1'}));
});

