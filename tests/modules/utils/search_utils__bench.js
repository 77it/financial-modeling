// run it with `deno bench`

import { xlookup, moduleDataLookup } from '../../../src/modules/_utils/search_utils.js';
import { assertEquals } from 'https://deno.land/std@0.171.0/testing/asserts.ts';
import { ModuleData } from '../../../src/engine/modules/module_data.js';

Deno.bench('xlookup - benchmark', () => {
  const loopCount = 1_000_000;

  const lookup_array = [99, 1, 'two', 3, 'four', 99, ' FiVe ', 6, 'seven'];
  const return_array = ['ninenine', 'one', 2, 'three', 4, 'NINENINE', 5, 'six', 7];

  const p = { lookup_value: 99, lookup_array, return_array, return_first_match: false };

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const aaa = xlookup(p);
  }
});

Deno.bench('moduleDataLookup - benchmark', () => {
  const loopCount = 1_000_000;

  const tableB_data = [
    { name: 99, value: 'ninenine' },
    { name: 1, value: 'one' },
    { name: 'two', value: 2 },
    { name: 3, value: 'three' },
    { name: 'four', value: 4 },
    { name: 99, value: 'NINENINE' },
    { name: ' FiVe ', value: 5 },
    { name: 6, value: 'six' },
    { name: 'seven', value: 7 },
  ];

  const moduleData = new ModuleData({
    moduleName: 'xxx', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
    tables: [
      { tableName: 'tabA', table: [] },
      { tableName: 'tabB', table: tableB_data }
    ]
  });

  const p = { tableName: 'tabB', lookup_key: 'name', return_key: 'value', lookup_value: 99, return_first_match: false };

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const aaa = moduleDataLookup(moduleData, p);
  }
});
