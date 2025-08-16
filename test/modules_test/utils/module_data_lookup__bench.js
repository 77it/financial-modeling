// run it with `deno bench`
/*
benchmark                      time/iter (avg)        iter/s      (min … max)           p75      p99     p995
------------------------------ ----------------------------- --------------------- --------------------------
moduleDataLookup - benchmark          443.6 ms           2.3 (403.1 ms … 478.9 ms) 457.7 ms 478.9 ms 478.9 ms
 */

import { moduleDataLookup } from '../../../src/modules/_utils/search/module_data_lookup.js';

import { ModuleData } from '../../../src/engine/modules/module_data.js';

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
    moduleName: 'aaa', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
    tables: [
      { tableName: 'tabA', table: [] },
      { tableName: 'tabB', table: tableB_data }
    ]
  });

  const p = { tableName: 'tabB', lookup_column: 'name', return_column: 'value', lookup_value: 99, return_first_match: false };

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const aaa = moduleDataLookup(moduleData, p);
    if (aaa !== 'NINENINE')
      throw new Error('moduleDataLookup() failed');
  }
});
