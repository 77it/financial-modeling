import { SimObject_Metadata_set } from '../../../src/modules/_utils/metadata_utils.js';
import { SimObject_Metadata } from '../../../src/engine/simobject/parts/simobject_metadata.js';

import { eqObj } from '../../deps.js';
import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';

Deno.test('ActiveMetadata test: invalid input', async () => {
  //@ts-ignore
  const metadata = SimObject_Metadata_set(null);
  assert(eqObj(metadata, { metadata__Name: [], metadata__Value: [], metadata__PercentageWeight: [] }));
});

Deno.test('ActiveMetadata test: object', async () => {
  const metadata = SimObject_Metadata_set('{ type: c/c, value: bank, weight: 0.2}');
  assert(eqObj(metadata, { metadata__Name: ['c/c'], metadata__Value: ['bank'], metadata__PercentageWeight: [0.2] }));
});

Deno.test('ActiveMetadata test: array', async () => {
  const metadata = SimObject_Metadata_set('[{ type: c/c, value: bank, weight: 0.2}, {type: line of business, value: canteen, weight: 0.3 }]');
  assert(eqObj(metadata, { metadata__Name: ['c/c', 'line of business'], metadata__Value: ['bank', 'canteen'], metadata__PercentageWeight: [0.2, 0.3] }));
});

Deno.test('ActiveMetadata test: array, with sanitization of values', async () => {
  const metadata = SimObject_Metadata_set('[{ type: c/c, value: 0, weight: 0.2}, {type: line of business, value: canteen, weight: "0.3" }]');
  console.log(metadata);
  assert(eqObj(metadata, { metadata__Name: ['c/c', 'line of business'], metadata__Value: ['0', 'canteen'], metadata__PercentageWeight: [0.2, 0.3] }));
});
