import { Result } from '../../src/lib/result.js';

import { assert as assertDeno, assertEquals, assertFalse, assertStrictEquals, assertThrows } from '../deps.js';
import { assert } from 'https://deno.land/std@0.158.0/testing/asserts.ts';

Deno.test('Result class tests: success', () => {
  const result_success_for_void = new Result({ success: true });
  assertEquals(result_success_for_void.success, true);
  assertEquals(result_success_for_void.error, undefined);
  assertEquals(result_success_for_void.value, undefined);

  const result_success_for_void2 = new Result({ success: true, error: '' });
  assertEquals(result_success_for_void2.success, true);
  assertEquals(result_success_for_void2.error, '');
  assertEquals(result_success_for_void2.value, undefined);

  const result_success = new Result({ success: true, value: 999 });
  assertEquals(result_success.success, true);
  assertEquals(result_success.error, undefined);
  assertEquals(result_success.value, 999);

  // stack is a not standard property
  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack
  // then we return it or if not available error.toString()
  try {
    throw new Error('err reason');
  } catch (error) {
    const result_error = new Result({ success: false, error: error.stack?.toString() ?? error.toString() });
    assertEquals(result_error.success, false);
    assert(result_error.error !== undefined);
    assertEquals(result_error.value, undefined);
  }
});

Deno.test('Result class tests: errors', () => {
  assertThrows(() => new Result({success:false}));
  assertThrows(() => new Result({success:false, error: undefined}));
  assertThrows(() => new Result({success:false, error: ''}));
  assertThrows(() => new Result({success:true, error: 'error #1'}));
  assertThrows(() => new Result({success:true, value: 999, error: 'error #1'}));
});

