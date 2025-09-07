// test with   deno test --allow-import

// for a more flexible parsing standard, see YAML tests "tests/lib_tests/yaml__test.js"

import { parseJSON5strict, parseJSON5relaxed } from '../../src/lib/json5.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('JSON5 tests', () => {
  const tests = [
    // format: [input, expectedStrict, expectedRelaxed]

    // parse will go in error (invalid string), then returns undefined
    ['[ciao, mamma]', null, '[ciao, mamma]'],
    ['[1 ,, 2]', null, '[1 ,, 2]'],

    //#region parsing null and undefined
    [undefined, undefined, undefined],
    [null, null, null],
    //#endregion parsing null and undefined

    //#region parsing strings with and without quotes
    ['"ciao"', 'ciao', 'ciao'],
    ['ciao', null, 'ciao'],
    //#endregion parsing strings with and without quotes

    //#region parsing a number with decimal separated by comma
    ['"999,159"', '999,159', '999,159'],
    ['"999, 159"', '999, 159', '999, 159'],
    ['999,159', null, '999,159'],
    ['999, 159', null, '999, 159'],
    //#endregion parsing a number with decimal separated by comma

    //#region parsing numbers returns the number
    [999, 999, 999],
    //#endregion parsing numbers returns the number

    //#region parsing object returns the object
    [{ Main: 999.159, Name: 'Y88 x' }, { Main: 999.159, Name: 'Y88 x' }, { Main: 999.159, Name: 'Y88 x' }],
    //#endregion parsing object returns the object

    //#region parsing object serialized in string
    ['{Amount:999, Discount:15, Rate:"euribor"}', { Amount: 999, Discount: 15, Rate: 'euribor' }, { Amount: "999", Discount: "15", Rate: 'euribor' }],
    ['{Amount:999,Discount:15,Rate:"euribor"}', { Amount: 999, Discount: 15, Rate: 'euribor' }, { Amount: "999", Discount: "15", Rate: 'euribor' }],
    ['{Amount: 999, Discount: 15, Rate: "euribor"}', { Amount: 999, Discount: 15, Rate: 'euribor' }, { Amount: "999", Discount: "15", Rate: 'euribor' }],
    ['{\'Main\':999.159, Name:\'Y88 x\'}', { Main: 999.159, Name: 'Y88 x' }, { Main: "999.159", Name: 'Y88 x' }],
    ['{"999":"aaa"}', { 999: 'aaa' }, { 999: 'aaa' }],
    //#endregion parsing object serialized in string

    //#region invalid object parsing
    ['{999:"aaa"}', null, '{999:"aaa"}'],
    ['{aaa: 999, bbb:}', null, '{aaa: 999, bbb:}'],
    //#endregion invalid object parsing

    //#region parsing array of something
    ['[1,1,1.2,3]', [1, 1, 1.2, 3], ["1", "1", "1.2", "3"]],
    ['[1, 2, 1,1 , 2,2]', [1, 2, 1, 1, 2, 2], ["1", "2", "1", "1", "2", "2"]],
    ["[1, 2, '1,1' , '2,2']", [1, 2, '1,1', '2,2'], ["1", "2", '1,1', '2,2']],
    ['[[\'2023-01-05\' , 155343.53] , [\'2023-02-05\',100000],{start:\'2024-06-01\', NP:2, npy:2}]',
      [['2023-01-05', 155343.53], ['2023-02-05', 100000], { start: '2024-06-01', NP: 2, npy: 2 }],
      [['2023-01-05', "155343.53"], ['2023-02-05', "100000"], { start: '2024-06-01', NP: "2", npy: "2" }]
    ],
    ['[\'ciao\', "mamma"]', ['ciao', 'mamma'], ['ciao', 'mamma']],
    //#endregion parsing array of something
  ];

  for (const [input, expectedStrict, expectedRelaxed] of tests) {
    const resultStrict = parseJSON5strict(input);
    assert.deepStrictEqual(resultStrict, expectedStrict, `parseJSON5strict failed for input: ${JSON.stringify(input)}. Expected: ${JSON.stringify(expectedStrict)}, Got: ${JSON.stringify(resultStrict)}`);

    const resultRelaxed = parseJSON5relaxed(input);
    assert.deepStrictEqual(resultRelaxed, expectedRelaxed, `parseJSON5relaxed failed for input: ${JSON.stringify(input)}. Expected: ${JSON.stringify(expectedRelaxed)}, Got: ${JSON.stringify(resultRelaxed)}`);
  }
});
