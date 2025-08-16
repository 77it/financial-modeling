// test with   deno test --allow-import

import { sanitizeModuleData } from '../../../src/modules/_utils/sanitize_module_data.js';
import { tablesInfoValidation } from '../../../src/modules/_utils/tablesinfo_validation.js';

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
  tablesInfo.tA.columns = {
    name: {
      name: '  naMe  ',
      sanitization: schema.ANY_TYPE
    },
    value: {
      name: '  vAlue ',
      sanitization: schema.ANY_TYPE
    }
  };
  tablesInfo.tB = {};
  tablesInfo.tB.tableName = 'TABB';
  tablesInfo.tB.columns = {
    name: {
      name: '  NAme',
      sanitization: schema.STRINGUPPERCASETRIMMED_TYPE
    },
    value: {
      name: '  valuE  ',
      sanitization: schema.STRINGUPPERCASETRIMMED_TYPE
    }
  };
  tablesInfo.toParse_tC = {};
  tablesInfo.toParse_tC.tableName = 'TABc';
  tablesInfo.toParse_tC.columns = {
    name: {
      name: '  naME',
      sanitization: schema.ANY_TYPE,
      parse: CONST.YAML_PARSE
    },
    value: {
      name: '  VALue  ',
      sanitization: schema.ANY_TYPE,
      parse: CONST.JSON5_PARSE
    }
  };
  //#endregion build tables info object

  // test correctness of tablesInfo
  tablesInfoValidation(tablesInfo);

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
    moduleName: 'aaa', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
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
    moduleName: 'aaa', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
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
  sanitizeModuleData({ moduleData: moduleData, tablesInfo: tablesInfo });

  // ASSERT
  assert(eqObj(moduleData, moduleData_exp));
});

t('sanitizeModuleData test: test throws', async () => {
  //#region ARRANGE
  //#region build tables info object
  const tablesInfo = {};
  tablesInfo.tA = {};
  tablesInfo.tA.tableName = 'TABA';
  tablesInfo.tA.columns = {
    mamma: {
      name: '  naMe  ',
    },
  };
  //#endregion build tables info object

  //#region build ModuleData
  const tableA_data = [
    { name: 99, value: 'ninenine' },
    { name: 'two', value: 2 },
  ];

 const moduleData = new ModuleData({
    moduleName: 'aaa', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
    tables: [
      { tableName: 'tabA', table: tableA_data },
    ]
  });
  //#endregion build ModuleData

  // assert throws: missing sanitization field in tablesInfo.columns.mamma
  assert.throws(() => {
    sanitizeModuleData({ moduleData: moduleData, tablesInfo: tablesInfo });
  }, { message: 'Sanitization is mandatory for column name in table tabA, but is missing in tablesInfo {"tableName":"TABA","columns":{"mamma":{"name":"  naMe  "}}}' });
});
