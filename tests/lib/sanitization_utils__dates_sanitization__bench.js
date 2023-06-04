// run it with `deno bench`

import * as S from '../../src/lib/sanitization_utils.js';
import { assertEquals } from 'https://deno.land/std@0.171.0/testing/asserts.ts';

Deno.bench("date sanitization - date parse from string sanitizations - benchmark", () => {
  const loopCount = 100_000;

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const t = S.DATE_TYPE;
    assertEquals(new Date(2022, 11, 25, 0, 0, 0), S.sanitize({ value: '2022-12-25T00:00:00.000Z', sanitization: t }));
    assertEquals(new Date(2022, 11, 25, 0, 0, 0), S.sanitize({ value: '2022-12-25', sanitization: t }));
  }
});

Deno.bench("date sanitization - many sanitizations - benchmark", () => {
  const loopCount = 100_000;

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const t = S.DATE_TYPE;
    assertEquals(new Date(2022, 11, 25), S.sanitize({ value: 44920, sanitization: t }));
    assertEquals(new Date(2022, 11, 25), S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(new Date(2022, 11, 25, 0, 0, 0), S.sanitize({ value: '2022-12-25T00:00:00.000Z', sanitization: t }));
    assertEquals(new Date(2022, 11, 25, 0, 0, 0), S.sanitize({ value: '2022-12-25', sanitization: t }));
    assertEquals(new Date(0), S.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals(new Date(1), S.sanitize({ value: true, sanitization: t }));
    assertEquals(new Date(0), S.sanitize({ value: false, sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2, }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(new Date(2022, 11, 25), S.sanitize({ value: 44920, sanitization: t2 }));
    assertEquals(new Date(1), S.sanitize({ value: true, sanitization: t2 }));
    assertEquals(new Date(0), S.sanitize({ value: false, sanitization: t2 }));
  }
});
