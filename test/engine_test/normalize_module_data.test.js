// run with   deno test --allow-import

import { ModuleData } from '../../src/engine/modules/module_data.js';
import { normalizeModuleData } from '../../src/engine/engine.js';
import { UNPRINTABLE_CHAR } from '../../src/config/engine.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('normalizeModuleData() test', async () => {
  const tableB_1_data = [
    { Name: UNPRINTABLE_CHAR + 'vendite\u001f999\u001f', ValuE: 'ninenine', name: 55, namE: 44, 'name.1': 'v2', 'namE.1': 'v3'},
    { Name: 1, Value: 'one' },
  ];

  const tableB_2_data = [
    { Name: 88, Value: 'ninenine2' },
    { Name: 2, Value: 'one' },
  ];

  const moduleData = new ModuleData({
    moduleName: 'aaa', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
    tables: [
      { tableName: 'tabB', table: tableB_1_data },
      { tableName: 'tabB', table: tableB_2_data }
    ]
  });

  normalizeModuleData([moduleData]);

  assert.deepStrictEqual(moduleData.tables[0].table[0], {'name.2': 'vendite999', value: 'ninenine', name: 55, 'name.3': 44, 'name.1': 'v2', 'name.1.1': 'v3'});
  assert.deepStrictEqual(moduleData.tables[1].table[0], {name: 88, value: 'ninenine2'});
});
