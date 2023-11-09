import { ActiveMetadata } from '../../../src/modules/_utils/metadata_utils.js';

import { eqObj } from '../../deps.js';
import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';

Deno.test('ActiveMetadata test: invalid input', async () => {
  //@ts-ignore
  const metadata = new ActiveMetadata(null);
  assert(eqObj(metadata, { types: [], values: [], weights: [] }));
});

Deno.test('ActiveMetadata test: object', async () => {
  const metadata = new ActiveMetadata('{ type: c/c, value: bank, weight: 0.2}');
  assert(eqObj(metadata, { types: ['c/c'], values: ['bank'], weights: [0.2] }));
});

Deno.test('ActiveMetadata test: array', async () => {
  const metadata = new ActiveMetadata('[{ type: c/c, value: bank, weight: 0.2}, {type: line of business, value: canteen, weight: 0.3 }]');
  assert(eqObj(metadata, { types: ['c/c', 'line of business'], values: ['bank', 'canteen'], weights: [0.2, 0.3] }));
});

Deno.test('ActiveMetadata test: array, with sanitization of values', async () => {
  const metadata = new ActiveMetadata('[{ type: c/c, value: 0, weight: 0.2}, {type: line of business, value: canteen, weight: "0.3" }]');
  console.log(metadata);
  assert(eqObj(metadata, { types: ['c/c', 'line of business'], values: ['0', 'canteen'], weights: [0.2, 0.3] }));
});
