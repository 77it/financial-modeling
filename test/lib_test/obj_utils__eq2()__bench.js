// run it with `node --import ./__node__register-hooks.js`
// run it with `deno run --allow-read --allow-write --allow-net --allow-import`

// docs https://benchmarkjs.com/

/*
P16s

NODEJS run

=== string & string x 14,538,364 ops/sec ±2.29% (75 runs sampled)
eq2() string & string x 13,933,386 ops/sec ±2.26% (79 runs sampled)
eq2() string & not string x 46,628,714 ops/sec ±3.45% (74 runs sampled)
eq2() object & object x 3,195,326 ops/sec ±2.68% (76 runs sampled)

DENO run

=== string & string x 12,875,491 ops/sec ±4.44% (69 runs sampled)
eq2() string & string x 11,348,766 ops/sec ±2.96% (84 runs sampled)
eq2() string & not string x 31,317,407 ops/sec ±2.91% (80 runs sampled)
eq2() object & object x 2,208,469 ops/sec ±1.16% (88 runs sampled)
 */

import { eq2 } from '../../src/lib/obj_utils.js';

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

const objectA = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };
const objectB = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };

// add tests
suite
  .add('=== string & string', function() {
    eq2('hello world', 'hello world');
  })

  .add('eq2() string & string', function() {
    eq2('hello world', '  HELLO WORLD  ');
  })

  .add('eq2() string & not string', function() {
    eq2('hello world', 999);
  })

  .add('eq2() object & object', function() {
    eq2(objectA, objectB);
  })

  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .on('error', function (event) {
    console.error(`Test "${event.target.name}" failed with error:`);
    console.error(event.target.error); // logs the actual Error object
  })
  // run async
  .run({ 'async': true });
