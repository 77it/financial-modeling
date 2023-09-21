import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';
import { sanitization } from '../../deps.js';
import { ModuleData } from '../../../src/engine/modules/module_data.js';

import { sanitizeModuleData } from '../../../src/modules/_utils/sanitization_utils.js';
import * as MODULES_CONFIG from '../../../src/config/modules.js';

Deno.test('sanitizeModuleData test', async () => {
  //#region build tables info object
  const tablesInfo = {};
  tablesInfo.tA = {};
  tablesInfo.tA.tableName = 'TABA';
  tablesInfo.tA.columns = { name: 'name', value: 'value' };
  tablesInfo.tA.sanitization = {
    [tablesInfo.tA.columns.name]: sanitization.ANY_TYPE,
    [tablesInfo.tA.columns.value]: sanitization.ANY_TYPE
  };
  tablesInfo.tB = {};
  tablesInfo.tB.tableName = 'TABB';
  tablesInfo.tB.columns = { name: 'name', value: 'value' };
  tablesInfo.tB.sanitization = {
    [tablesInfo.tB.columns.name]: sanitization.STRINGUPPERCASETRIMMED_TYPE,
    [tablesInfo.tB.columns.value]: sanitization.STRINGUPPERCASETRIMMED_TYPE
  };
  //#endregion build tables info object

  // extract the list of sanitizations, array of {tableName: string, sanitization: *, sanitizationOptions?: *}
  const list_of_sanitizations = Object.values(tablesInfo);

  //#region build ModuleData
  const tableB_1_data = [
    { name: 99, value: 'ninenine' },
    { name: 'two', value: 2 },
  ];

  const tableB_2_data = [
    { name: 99, value: 'ninenine2' },
    { name: 'two', value: 2 },
  ];

  const moduleData = new ModuleData({
    moduleName: 'xxx', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
    tables: [
      { tableName: 'tabA', table: [] },
      { tableName: 'tabB', table: tableB_1_data },
      { tableName: 'tabA', table: [] },
      { tableName: 'tabB', table: tableB_2_data }
    ]
  });
  //#endregion build ModuleData

  // sanitize the data (in place, without cloning moduleData)
  sanitizeModuleData ({ moduleData: moduleData, moduleSanitization: list_of_sanitizations });

  //#region build expected ModuleData
  const tableB_1_data_exp = [
    { name: '99', value: 'NINENINE' },
    { name: 'TWO', value: '2' },
  ];

  const tableB_2_data_exp = [
    { name: '99', value: 'NINENINE2' },
    { name: 'TWO', value: '2' },
  ];

  const moduleData_exp = new ModuleData({
    moduleName: 'xxx', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
    tables: [
      { tableName: 'tabA', table: [] },
      { tableName: 'tabB', table: tableB_1_data_exp },
      { tableName: 'tabA', table: [] },
      { tableName: 'tabB', table: tableB_2_data_exp }
    ]
  });
  //#endregion build expected ModuleData

  // test
  assertEquals(JSON.stringify(moduleData), JSON.stringify(moduleData_exp));
});
