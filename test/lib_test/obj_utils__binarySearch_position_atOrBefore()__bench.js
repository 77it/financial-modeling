// run it with `deno bench --allow-import`

/*
    CPU | Intel(R) Core(TM) i5-10210U CPU @ 1.60GHz
Runtime | Deno 2.2.12 (x86_64-pc-windows-msvc)

file:///C:/Users/virgo/github/PUBLIC/financial-modeling/test/lib_test/obj_utils__binarySearch_position_atOrBefore()__bench.js

benchmark                                                      time/iter (avg)        iter/s      (min … max)           p75      p99     p995
-------------------------------------------------------------- ----------------------------- --------------------- --------------------------
obj utils binarySearch_position_atOrBefore(), 1.000.000 loop          324.8 ms           3.1 (307.2 ms … 359.9 ms) 331.6 ms 359.9 ms 359.9 ms
comparable test: search same keys in a map, 1.000.000 loop             6.3 ms         158.2 (  3.0 ms …  71.2 ms)   5.1 ms  71.2 ms  71.2 ms
 */

import { binarySearch_position_atOrBefore, deepFreeze } from '../../src/lib/obj_utils.js';

const loopCount = 1_000_000;

/** @type {any} */
const dataArray = [];
const keyName = 'key';
for (let i = 1; i <= 60; i++) {
  dataArray.push({ [keyName]: i });
}

// create a map with values of dataArray as keys
const dataMap = new Map();
for (let i = 0; i < dataArray.length; i++) {
  dataMap.set(dataArray[i][keyName], i);
}

// generate an array with 7 numbers from 1 to 60 to search
const fiveNumbersToSearch = [1, 10, 20, 30, 40, 50, 60];

// 5 years of 12 months of data (60 entries), 5 random searches
Deno.bench(`obj utils binarySearch_position_atOrBefore(), ${loopCount.toLocaleString('it-IT')} loop`, () => {
  const notFreezableValue = 'abc';

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    for (let j = 0; j < fiveNumbersToSearch.length; j++) {
      binarySearch_position_atOrBefore({ array: dataArray, target: fiveNumbersToSearch[j], keyName: keyName });
    }
  }
});

// 5 years of 12 months of data (60 entries), 5 random searches
Deno.bench(`comparable test: search same keys in a map, ${loopCount.toLocaleString('it-IT')} loop`, () => {
  const notFreezableValue = 'abc';

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    for (let j = 0; j < fiveNumbersToSearch.length; j++) {
      const key = fiveNumbersToSearch[j];
      queryMap(key);
    }
  }
});

/**
 * Queries the map for a given key.
 * @param {number} key - The key to query the map.
 * @returns {number} - The value associated with the key in the map.
 */
function queryMap(key) {
  return dataMap.get(key);
}
