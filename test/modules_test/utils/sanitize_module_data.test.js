import { sanitizeModuleData } from '../../../src/modules/_utils/sanitize_module_data.js';

import * as CONST from '../../../src/config/modules/_const.js';
import * as schema from '../../../src/lib/schema.js';
import { ModuleData } from '../../../src/engine/modules/module_data.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);
import { eqObj } from '../../deps.js';

t('sanitizeModuleData test (parse + sanitize): test case-insensitive & trim match of table name + object key names', async () => {
  //#region ARRANGE
  //#region build tables info object
  const tablesInfo = {};
  tablesInfo.tA = {};
  tablesInfo.tA.tableName = 'TABA';
  tablesInfo.tA.columns = { name: '  naMe  ', value: '  vAlue ' };
  // If obj is array, the sanitization is done on contained objects.
  // If sanitization is an array containing a single object [{obj}], the sanitization will be done with the object and an array will be returned.
  // In that case sanitization IS NOT an array, then the sanitization will be done against the object.
  tablesInfo.tA.sanitization = {
    [tablesInfo.tA.columns.name]: schema.ANY_TYPE,
    [tablesInfo.tA.columns.value]: schema.ANY_TYPE
  };
  tablesInfo.tB = {};
  tablesInfo.tB.tableName = 'TABB';
  tablesInfo.tB.columns = { name: '  NAme', value: '  valuE  ' };
  // If obj is array, the sanitization is done on contained objects.
  // If sanitization is an array containing a single object [{obj}], the sanitization will be done with the object and an array will be returned.
  // In that case sanitization IS an array, then the sanitization will be done against the object contained in the array.
  tablesInfo.tB.sanitization = [{
    [tablesInfo.tB.columns.name]: schema.STRINGUPPERCASETRIMMED_TYPE,
    [tablesInfo.tB.columns.value]: schema.STRINGUPPERCASETRIMMED_TYPE
  }];
  tablesInfo.toParse_tC = {};
  tablesInfo.toParse_tC.tableName = 'TABc';
  tablesInfo.toParse_tC.columns = { name: '  naME', value: '  VALue  ' };
  tablesInfo.toParse_tC.parse = {
    [tablesInfo.toParse_tC.columns.name]: CONST.YAML_PARSE,
    [tablesInfo.toParse_tC.columns.value]: CONST.JSON5_PARSE
  };
  // If obj is array, the sanitization is done on contained objects.
  // If sanitization is an array containing a single object [{obj}], the sanitization will be done with the object and an array will be returned.
  // In that case sanitization IS NOT an array, then the sanitization will be done against the object.
  tablesInfo.toParse_tC.sanitization = {
    [tablesInfo.toParse_tC.columns.name]: schema.ANY_TYPE,
    [tablesInfo.toParse_tC.columns.value]: schema.ANY_TYPE
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
    { name: 99, value: '  ninenine' },
    { 'NAMe': 'two', value: 2 },
  ];

  const tableB_2_data = [
    { name: 99, 'VALUe   ': '   ninenine2   ' },
    { name: 'two', value: 2 },
  ];

  const toParse_tableC = [
    { name: 88, 'VALUe   ': 99 },
    { name: 'one', value: '"two"' },
    { name: '[a, b, c]', value: '["d", "e", "f"]' },
  ];

  const moduleData = new ModuleData({
    moduleName: 'xxx', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
    tables: [
      { tableName: 'tabA', table: tableA_data },
      { tableName: 'tabB', table: tableB_1_data },
      { tableName: 'tabA', table: [] },
      { tableName: 'tabB', table: tableB_2_data },
      { tableName: 'tabc', table: toParse_tableC }
    ]
  });
  //#endregion build ModuleData

  //#region build expected ModuleData
  const tableA_data_exp = [
    { name: 99, value: 'ninenine' },
    { name: 'two', value: 2 },
  ];

  const tableB_1_data_exp = [
    { name: '99', value: 'NINENINE' },
    { 'NAMe': 'TWO', value: '2' },
  ];

  const tableB_2_data_exp = [
    { name: '99', 'VALUe   ': 'NINENINE2' },
    { name: 'TWO', value: '2' },
  ];

  const toParse_tableC_data_exp = [
    { name: 88, 'VALUe   ': 99 },
    { name: 'one', value: 'two' },
    { name: ['a', 'b', 'c'], value: ['d', 'e', 'f'] },
  ];

  const moduleData_exp = new ModuleData({
    moduleName: 'xxx', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
    tables: [
      { tableName: 'tabA', table: tableA_data_exp },
      { tableName: 'tabB', table: tableB_1_data_exp },
      { tableName: 'tabA', table: [] },
      { tableName: 'tabB', table: tableB_2_data_exp },
      { tableName: 'tabc', table: toParse_tableC_data_exp }
    ]
  });
  //#endregion build expected ModuleData
  //#endregion ARRANGE

  // ACT   sanitize the data (in place, without cloning moduleData)
  sanitizeModuleData({ moduleData: moduleData, moduleSanitization: list_of_sanitizations });

  // ASSERT
  assert(eqObj(moduleData, moduleData_exp));
});
