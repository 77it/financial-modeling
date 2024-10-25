import { GlobalValue } from '../../src/lib/global_value.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

t('global variable test', () => {
  const myGlobalVariable = new GlobalValue("default");
  assert.deepStrictEqual(myGlobalVariable.isLocked(), false);
  assert.deepStrictEqual(myGlobalVariable.get(), "default");
  assert.deepStrictEqual(myGlobalVariable.isLocked(), true);
  myGlobalVariable.set("new value");  // the set is ignored
  assert.deepStrictEqual(myGlobalVariable.get(), "default");

  const myGlobalVariable2 = new GlobalValue("default");
  assert.deepStrictEqual(myGlobalVariable2.isLocked(), false);
  myGlobalVariable2.set("new value");  // the set is accepted
  assert.deepStrictEqual(myGlobalVariable2.isLocked(), true);
  myGlobalVariable2.set("new new value");  // the second set is ignored
  assert.deepStrictEqual(myGlobalVariable2.get(), "new value");
});
