import { SimObject_Metadata } from '../../../../src/engine/simobject/parts/simobject_metadata.js';

import { eqObj } from '../../../deps.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('SimObject_Metadata tests - test normal use, successful', async () => {
  const p1 = { name: ['AA'], value: ['BB'], weight: [0.5] };
  const _p1 = { metadata__Name: p1.name, metadata__Value: p1.value, metadata__PercentageWeight: p1.weight };
  const _1 = new SimObject_Metadata(p1);
  assert(eqObj(_1, _p1));

  const p2 = { name: ['AA', 'AAA'], value: ['BB', 'BBB'], weight: [0.5, 0.6] };
  const _p2 = { metadata__Name: p2.name, metadata__Value: p2.value, metadata__PercentageWeight: p2.weight };
  const _2 = new SimObject_Metadata(p2);
  assert(eqObj(_2, _p2));
});

t('SimObject_Metadata tests - test error, array of different length', async () => {
  let _error = '';
  try {
    const p1 = { name: ['AA'], value: ['BB'], weight: [] };
    const _1 = new SimObject_Metadata(p1);
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  assert.deepStrictEqual(_error, 'length of metadata arrays must be equal, got name = 1, value = 1, weight= 0');
});

t('SimObject_Metadata tests - test error, extraneous property not present in validation object', async () => {
  let _error = '';
  try {
    const p1 = { extraneous_property: 99, name: ['AA'], value: ['BB'], weight: [0.5] };
    const _1 = new SimObject_Metadata(p1);
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  assert.deepStrictEqual(_error, 'Validation error: ["extraneous_property is not a valid key, is missing from validation object"]');
});

t('SimObject_Metadata tests - if ANY weight > 1, ALL weights are divided by 100', async () => {
  // All weights > 1: all should be divided by 100
  const p1 = { name: ['A', 'B', 'C'], value: ['X', 'Y', 'Z'], weight: [20, 30, 50] };
  const _1 = new SimObject_Metadata(p1);
  assert.deepStrictEqual(_1.metadata__PercentageWeight, [0.2, 0.3, 0.5]);

  // Mixed: one weight > 1, so ALL should be divided by 100 (including those <= 1)
  const p2 = { name: ['A', 'B', 'C'], value: ['X', 'Y', 'Z'], weight: [0.5, 20, 30] };
  const _2 = new SimObject_Metadata(p2);
  assert.deepStrictEqual(_2.metadata__PercentageWeight, [0.005, 0.2, 0.3]);

  // All weights <= 1: none should be divided by 100
  const p3 = { name: ['A', 'B'], value: ['X', 'Y'], weight: [0.5, 0.5] };
  const _3 = new SimObject_Metadata(p3);
  assert.deepStrictEqual(_3.metadata__PercentageWeight, [0.5, 0.5]);

  // Edge case: weight exactly 1 should NOT trigger division
  const p4 = { name: ['A', 'B'], value: ['X', 'Y'], weight: [1, 0.5] };
  const _4 = new SimObject_Metadata(p4);
  assert.deepStrictEqual(_4.metadata__PercentageWeight, [1, 0.5]);

  // Edge case: weight just above 1 should trigger division for ALL
  const p5 = { name: ['A', 'B'], value: ['X', 'Y'], weight: [1.01, 0.5] };
  const _5 = new SimObject_Metadata(p5);
  assert.deepStrictEqual(_5.metadata__PercentageWeight, [0.0101, 0.005]);
});
