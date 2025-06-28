import { GlobalImmutableValue } from '../../src/lib/global_immutable_value.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('global variable test', () => {
  // set a default value, get it -> lock, try to set a new value -> throw, reset and set a new value
  const myGlobalVariable = new GlobalImmutableValue("default");
  assert.deepStrictEqual(myGlobalVariable.isLocked(), false);
  assert.deepStrictEqual(myGlobalVariable.get(), "default");
  assert.deepStrictEqual(myGlobalVariable.isLocked(), true);
  assert.throws(() => { myGlobalVariable.setOneTimeBeforeRead("new value"); });
  myGlobalVariable.reset();  // reset
  myGlobalVariable.setOneTimeBeforeRead("new value");
  assert.deepStrictEqual(myGlobalVariable.get(), "new value");

  // set a default value, set a new value, try to set a new new value -> ignored
  const myGlobalVariable2 = new GlobalImmutableValue("default");
  assert.deepStrictEqual(myGlobalVariable2.isLocked(), false);
  myGlobalVariable2.setOneTimeBeforeRead("new value");  // the set is accepted
  assert.deepStrictEqual(myGlobalVariable2.isLocked(), true);
  assert.throws(() => { myGlobalVariable2.setOneTimeBeforeRead("new new value"); });

  // init without value -> not locked, try to get, throw
  const myGlobalVariable3 = new GlobalImmutableValue();
  assert.deepStrictEqual(myGlobalVariable3.isLocked(), false);
  assert.throws(() => { myGlobalVariable3.get(); });

  // init with a value -> set a new value -> locked -> try to get, success
  const myGlobalVariable3b = new GlobalImmutableValue([999]);
  assert.deepStrictEqual(myGlobalVariable3b.isLocked(), false);
  myGlobalVariable3b.setOneTimeBeforeRead([888]);  // the set is accepted
  assert.deepStrictEqual(myGlobalVariable3b.isLocked(), true);
  assert.deepStrictEqual(myGlobalVariable3b.get(), [888]);

  // adding or editing an element of value is not allowed, because value is deep-frozen before storage
  assert( Array.isArray(myGlobalVariable3b.get()) );
  assert.throws(() => { myGlobalVariable3b.get().push(999); });
  assert.throws(() => { myGlobalVariable3b.get()[0] = 777; });

  // init without value -> try to set without value -> throw
  const myGlobalVariable4 = new GlobalImmutableValue();
  //@ts-ignore
  assert.throws(() => { myGlobalVariable4.setOneTimeBeforeRead(); });

  // init with a value -> try to set without value -> throw
  const myGlobalVariable5 = new GlobalImmutableValue(999);
  //@ts-ignore
  assert.throws(() => { myGlobalVariable5.setOneTimeBeforeRead(); });
});
