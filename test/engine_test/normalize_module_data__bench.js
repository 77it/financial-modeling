/*
    CPU | 12th Gen Intel(R) Core(TM) i5-1240P
Runtime | Deno 2.1.9 (x86_64-pc-windows-msvc)

benchmark                         time/iter (avg)        iter/s      (min … max)           p75      p99     p995
--------------------------------- ----------------------------- --------------------- --------------------------
normalizeModuleData() benchmark          616.8 ms           1.6 (582.9 ms … 673.4 ms) 626.2 ms 673.4 ms 673.4 ms
 */

// run it with `deno bench --allow-import`

import { ModuleData } from '../../src/engine/modules/module_data.js';
import { normalizeModuleData } from '../../src/engine/engine.js';
import { UNPRINTABLE_CHAR } from '../../src/config/engine.js';

Deno.bench("normalizeModuleData() benchmark", () => {
  // settings
  const NR_OF_ROW_IN_TABLE = 1000;
  const NR_OF_MODULEDATA = 1000;


  // create a table with nrOfRowInTable rows
  const table_data = [];
  for (let i = 0; i < NR_OF_ROW_IN_TABLE; i++)
    table_data.push({ Name: UNPRINTABLE_CHAR + 'vendite\u001f999\u001f', ValuE: 'ninenine', name: 55, namE: 44, 'name.1': 'v2', 'namE.1': 'v3' });

  // create a moduleData
  const moduleData = new ModuleData({
    moduleName: 'xxx', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
    tables: [ { tableName: 'tabB', table: table_data } ]
  });

  // create an array of `moduleData` with nrOfModuleData elements
  const moduleDataArray = [];
  for (let i = 0; i < NR_OF_MODULEDATA; i++)
    moduleDataArray.push(moduleData);

  // normalize the moduleData
  normalizeModuleData(moduleDataArray);
});
