import { GlobalValue } from '../../src/lib/global_value.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

t('global variable test', () => {
  // set a default value, get it -> lock, try to set a new value -> ignored
  const myGlobalVariable = new GlobalValue("default");
  assert.deepStrictEqual(myGlobalVariable.isLocked(), false);
  assert.deepStrictEqual(myGlobalVariable.get(), "default");
  assert.deepStrictEqual(myGlobalVariable.isLocked(), true);
  myGlobalVariable.set("new value");  // the set is ignored
  assert.deepStrictEqual(myGlobalVariable.get(), "default");

  // set a default value, set a new value, try to set a new new value -> ignored
  const myGlobalVariable2 = new GlobalValue("default");
  assert.deepStrictEqual(myGlobalVariable2.isLocked(), false);
  myGlobalVariable2.set("new value");  // the set is accepted
  assert.deepStrictEqual(myGlobalVariable2.isLocked(), true);
  myGlobalVariable2.set("new new value");  // the second set is ignored
  assert.deepStrictEqual(myGlobalVariable2.get(), "new value");

  // init without value -> not locked, try to get, throw
  const myGlobalVariable3 = new GlobalValue();
  assert.deepStrictEqual(myGlobalVariable3.isLocked(), false);
  assert.throws(() => { myGlobalVariable3.get(); });

  // init with a value -> set a new value -> locked -> try to get, success
  const myGlobalVariable3b = new GlobalValue(999);
  assert.deepStrictEqual(myGlobalVariable3b.isLocked(), false);
  myGlobalVariable3b.set("new value");  // the set is accepted
  assert.deepStrictEqual(myGlobalVariable3b.isLocked(), true);
  assert.deepStrictEqual(myGlobalVariable3b.get(), "new value");

  // init without value -> try to set without value -> throw
  const myGlobalVariable4 = new GlobalValue();
  //@ts-ignore
  assert.throws(() => { myGlobalVariable4.set(); });

  // init with a value -> try to set without value -> throw
  const myGlobalVariable5 = new GlobalValue(999);
  //@ts-ignore
  assert.throws(() => { myGlobalVariable4.set(); });
});