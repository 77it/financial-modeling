import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../../deps.js';

import { toBigInt } from '../../../../src/engine/simobject/utils/simobject_utils.js';

const decimalPlaces = 4;
const roundingModeIsRound = true;

Deno.test('toBigInt() tests', async () => {
  assertEquals(toBigInt(19, decimalPlaces, roundingModeIsRound), 190000n);
  assertEquals(toBigInt(19.1, decimalPlaces, roundingModeIsRound), 191000n);
  assertEquals(toBigInt(19.1234, decimalPlaces, roundingModeIsRound), 191234n);
  assertEquals(toBigInt(19.12345, decimalPlaces, roundingModeIsRound), 191234n);
  assertEquals(toBigInt(19.123456, decimalPlaces, roundingModeIsRound), 191235n);
  assertEquals(toBigInt(19.12344000001, decimalPlaces, roundingModeIsRound), 191234n);
});
