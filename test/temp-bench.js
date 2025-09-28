// run it with `node --import ./__node__register-hooks.js`
// run it with `deno run --allow-read --allow-write --allow-net --allow-import`

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

// loop counter
const COUNTER = 1_000;

// shared data
let data;

// add tests
suite
  .add(`sample benchmark For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = "     98798 ASHDKFHJFDS    ".trim();
    }
  })

  // add listeners
  .on('cycle', function(/** @type {Benchmark.Event} */ event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    // @ts-ignore types from benchmark may not include .filter in Deno ambient
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .on('error', function (/** @type {Benchmark.Event} */ event) {
    console.error(`Test "${event.target.name}" failed with error:`);
    // @ts-ignore ignore Deno errrors
    console.error(event.target.error); // logs the actual Error object
  })
  // run async
  .run({ 'async': true });
