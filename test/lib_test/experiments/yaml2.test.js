import {
  normalizeYamlishToJSON as j,
  DEFAULT_OPTIONS
} from '../../../src/lib/experiments/yaml2__SUPERSEDED.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

/* ---------------------------
   Meta / exports
--------------------------- */
t('version + deep-frozen defaults', () => {
  assert.throws(() => { DEFAULT_OPTIONS.unicode.stripZeroWidth = false; });
  assert.throws(() => { DEFAULT_OPTIONS.unicode = {}; });
});

/* ---------------------------
   Guards and limits
--------------------------- */
t('type/size guards', () => {
  //@ts-ignore testing bad input
  assert.throws(() => j(123), /Input must be a string/);
  assert.throws(() => j('x'.repeat(DEFAULT_OPTIONS.maxLen + 1)), /Input too large/);
});

t('maxDepth', () => {
  const deep = '['.repeat(200) + '0' + ']'.repeat(200);
  assert.throws(() => j(deep, { maxDepth: 50 }), /Max depth exceeded/);
});

t('maxNodes', () => {
  const many = '[' + Array(100_005).fill('x').join(',') + ']';
  assert.throws(() => j(many), /Max node count exceeded/);
});

t('length guards', () => {
  assert.throws(() => j('{' + 'a'.repeat(70000) + ':1}', { maxKeyLen: 1024 }), /Key too long/);
  const long = '"' + 'x'.repeat(2_000_000) + '"';
  assert.throws(() => j(long, { maxStringLen: 1024 * 1024 }), /String too long/);
});

/* ---------------------------
   Scalars and literals
--------------------------- */
t('booleans/null', () => {
  assert.equal(j('true'), 'true');
  assert.equal(j('false'), 'false');
  assert.equal(j('null'), 'null');
  assert.equal(j('trueX'), '"trueX"');
});

t('unicodeWordBoundary option + fallback', () => {
  assert.equal(j('trueé', { unicodeWordBoundary: true }), '"trueé"');
  assert.doesNotThrow(() => j('trueé', { unicodeWordBoundary: true })); // fallback safe if engine lacks \p props
});

t('numbers are emitted as strings', () => {
  assert.equal(j('0'), '"0"');
  assert.equal(j('-0'), '"-0"');
  assert.equal(j('01'), '"01"'); // not a JSON number → bare scalar
  assert.equal(j('1.23e-4'), '"1.23e-4"');
});

t('quoted strings', () => {
  assert.equal(j(`'it''s'`), `"it's"`);
});

/* ---------------------------
   Objects / keys / commas
--------------------------- */
t('split comma-unquoted keys', () => {
  assert.equal(j('{a,b}'), '{"a":null,"b":null}');
  assert.equal(j('{a,b:c}'), '{"a":null,"b":"c"}');
  assert.equal(j('{"a,b":c}'), '{"a,b":"c"}'); // quoted never splits
});

t('strictCommas behavior', () => {
  // tolerant by default
  assert.equal(j('{a:1,}'), '{"a":"1"}');
  assert.equal(j('[1,2,]'), '["1","2"]');

  // strict
  assert.throws(() => j('[,1]', { strictCommas: true }), /Leading comma/);
  assert.throws(() => j('[1,,2]', { strictCommas: true }), /Multiple commas|Trailing comma/);
  assert.throws(() => j('{,a:1}', { strictCommas: true }), /Leading comma/);
  assert.throws(() => j('{a:1,}', { strictCommas: true }), /Trailing comma/);
});

t('duplicate key policies', () => {
  assert.equal(j('{a:1,a:2}', { onDuplicateKey: 'last' }), '{"a":"2"}');
  assert.equal(j('{a:1,a:2}', { onDuplicateKey: 'first' }), '{"a":"1"}');
  assert.throws(() => j('{a:1,a:2}', { onDuplicateKey: 'error' }), /Duplicate key: a/);

  // split + first → first wins (implicit null)
  assert.equal(j('{a,a:1}', { onDuplicateKey: 'first' }), '{"a":null}');

  // nested scope independence
  assert.equal(j('{a:1, x:{a:2}}', { onDuplicateKey: 'first' }), '{"a":"1","x":{"a":"2"}}');

  // commas remain sane when suppressing duplicates
  assert.equal(j('{a:1,a:2,b:3}', { onDuplicateKey: 'first' }), '{"a":"1","b":"3"}');
  assert.equal(j('{a,a:2,b}', { onDuplicateKey: 'first' }), '{"a":null,"b":null}');
});

t('special key guard', () => {
  assert.throws(() => j('{__proto__:1}', { guardSpecialKeys: true }), /Disallowed key/);
  assert.throws(() => j('{constructor:1}', { guardSpecialKeys: true }), /Disallowed key/);
  assert.throws(() => j('{prototype:1}', { guardSpecialKeys: true }), /Disallowed key/);
});

/* ---------------------------
   Unicode preprocessing
--------------------------- */
t('unicode preprocessing toggles', () => {
  // BOM strip
  assert.equal(j('\uFEFF{"a":1}'), '{"a":"1"}');

  // smart quotes map
  assert.equal(j('{"curly”:"ok"}', { unicode: { mapSmartQuotes: true } }), '{"curly":"ok"}');

  // zero-width stripped by default (acts only on structure, not inside quotes)
  const zw = '\u200B';
  assert.equal(j(`{a${zw}:1}`), '{"a":"1"}'); // zw removed from key path

  // can disable stripping (ZW is preserved in data as part of key/values when not structural)
  assert.equal(j(`{"a${zw}":1}`, { unicode: { stripZeroWidth: false } }), `{"a${zw}":"1"}`);
});

/* ---------------------------
   Arrays, nesting, empties
--------------------------- */
t('arrays + nesting', () => {
  assert.equal(j('[{a,b},["x",2]]'), '[{"a":null,"b":null},["x","2"]]');
});

t('empty value semantics', () => {
  assert.equal(j('{a:}'), '{"a":""}'); // default: empty string
  assert.equal(j('{a:}', { emptyValueIsNull: true }), '{"a":null}'); // optional: null
  assert.equal(j('[1,,2]', { emptyValueIsNull: true }), '["1",null,"2"]');
});

/* ---------------------------
   Error UX
--------------------------- */
t('location info and trailing characters error', () => {
  assert.throws(() => j('{"a":1} garbage'), /Trailing characters/);
  try {
    j('{\n  a: 1,\n  b: [1, 2,\n  c: 3\n}', { strictCommas: true });
    assert.fail('Expected error');
  } catch (e) {
    assert.match(String(e), /at \d+:\d+ \(index \d+\)/);
    assert.match(String(e), /Near:/);
  }
});
