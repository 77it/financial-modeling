import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';
import * as schema from '../../../src/lib/schema.js';
import { ModuleData } from '../../../src/engine/modules/module_data.js';

import { sanitizeModuleData } from '../../../src/modules/_utils/sanitization_utils.js';

Deno.test('sanitizeModuleData test: test case-insensitive & trim match of table name + object key names', async () => {
  //#region build tables info object
  const tablesInfo = {};
  tablesInfo.tA = {};
  tablesInfo.tA.tableName = 'TABA';
  tablesInfo.tA.columns = { name: '  naMe  ', value: '  vAlue ' };
  tablesInfo.tA.sanitization = {
    [tablesInfo.tA.columns.name]: schema.ANY_TYPE,
    [tablesInfo.tA.columns.value]: schema.ANY_TYPE
  };
  tablesInfo.tB = {};
  tablesInfo.tB.tableName = 'TABB';
  tablesInfo.tB.columns = { name: '  NAme', value: '  valuE  ' };
  tablesInfo.tB.sanitization = {
    [tablesInfo.tB.columns.name]: schema.STRINGUPPERCASETRIMMED_TYPE,
    [tablesInfo.tB.columns.value]: schema.STRINGUPPERCASETRIMMED_TYPE
  };
  //#endregion build tables info object

  // extract the list of sanitizations, array of {tableName: string, sanitization: *, sanitizationOptions?: *}
  const list_of_sanitizations = Object.values(tablesInfo);

  //#region build ModuleData
  const tableA_data = [
    { name: 99, value: 'ninenine' },
    { name: 'two', value: 2 },
  ];

  const tableB_1_data = [
    { name: 99, value: 'ninenine' },
    { "NAMe": 'two', value: 2 },
  ];

  const tableB_2_data = [
    { name: 99, "VALUe   ": 'ninenine2' },
    { name: 'two', value: 2 },
  ];

  const moduleData = new ModuleData({
    moduleName: 'xxx', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
    tables: [
      { tableName: 'tabA', table: tableA_data },
      { tableName: 'tabB', table: tableB_1_data },
      { tableName: 'tabA', table: [] },
      { tableName: 'tabB', table: tableB_2_data }
    ]
  });
  //#endregion build ModuleData

  // sanitize the data (in place, without cloning moduleData)
  sanitizeModuleData ({ moduleData: moduleData, moduleSanitization: list_of_sanitizations });

  //#region build expected ModuleData
  const tableA_data_exp = [
    { name: 99, value: 'ninenine' },
    { name: 'two', value: 2 },
  ];

  const tableB_1_data_exp = [
    { name: '99', value: 'NINENINE' },
    { "NAMe": 'TWO', value: '2' },
  ];

  const tableB_2_data_exp = [
    { name: '99', "VALUe   ": 'NINENINE2' },
    { name: 'TWO', value: '2' },
  ];

  const moduleData_exp = new ModuleData({
    moduleName: 'xxx', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
    tables: [
      { tableName: 'tabA', table: tableA_data_exp },
      { tableName: 'tabB', table: tableB_1_data_exp },
      { tableName: 'tabA', table: [] },
      { tableName: 'tabB', table: tableB_2_data_exp }
    ]
  });
  //#endregion build expected ModuleData

  // test
  assertEquals(JSON.stringify(moduleData), JSON.stringify(moduleData_exp));
});
