// run with `deno test --allow-import --allow-read

import { ModulesLoader } from '../../src/modules/_modules_loader.js';
import { ModuleData } from '../../src/engine/modules/module_data.js';
import { modulesLoader_Resolve } from '../../src/engine/modules/modules_loader__resolve.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

class ValuesB2 {
  valueX;

  /**
   * @param {number} value
   */
  constructor (value) {
    this.valueX = value;
  }
}

const modulesLoader = new ModulesLoader({ });  // modulesLoader_Resolve: undefined

//#region test import inside import
// This test demonstrates that when a module named "_ModulesLoader_test_module.js" of a specific version ("@v0.1.19") is imported,
// any subsequent local imports (e.g. ./modules_loader_test_module2.js) from that module will also be of that version ("@v0.1.19").
t('test versioned import inside import', async () => {
  {
    const _module = await import('https://cdn.jsdelivr.net/gh/77it/financial-modeling@v0.1.19/src/modules/_ModulesLoader_test_module.js');
    assert.deepStrictEqual(_module.Module.valueX, 'module v0.1.2');
    assert.deepStrictEqual(await _module.value_from_other_file__ValuesA2(), 'tag v0.1.19');
  }

  {
    const _module = await import('https://cdn.jsdelivr.net/gh/77it/financial-modeling@v0.1.20/src/modules/_ModulesLoader_test_module.js');
    assert.deepStrictEqual(_module.Module.valueX, 'module v0.1.3');
    assert.deepStrictEqual(await _module.value_from_other_file__ValuesA2(), 'tag v0.1.20');
  }
});
//#endregion test import inside import

//#region test addClassFromObject
t('test addClassFromObject, class defined here', () => {
  const _URI = '';
  modulesLoader.addClassFromObject({ moduleName: 'ValuesB2X', moduleEngineURI: _URI, classObj: ValuesB2 });

  const query = modulesLoader.get({ moduleName: 'ValuesB2X', moduleEngineURI: _URI });
  assert(query !== undefined);

  const _ValuesB2X = query.class;
  const __ValuesB2X = new _ValuesB2X(8888);
  assert.deepStrictEqual(__ValuesB2X.valueX, 8888);
  assert.deepStrictEqual(_URI, query.cdnURI);
});
//#endregion test addClassFromObject

//#region test addClassFromURI
t('test ERROR addClassFromURI, not existing URI', async () => {
  const _URI = 'https://this-uri-is-not-existing.com';
  let _error = "";
  try {
    await modulesLoader.addClassFromURI({ moduleName: 'ValuesB2', moduleEngineURI: _URI });
  } catch (error) {
    _error = (error instanceof Error) ? error.toString() : 'Unknown error occurred';
  }
  assert(_error.includes('https://this-uri-is-not-existing.com'));
});

t('test addClassFromURI, alongside module (using ModuleData class)', async () => {
  const _URI = './tests/modules_loader_test_module.js';
  const _moduleDataParameters = {
    moduleName: 'ValuesB',
    moduleEngineURI: _URI,
    moduleAlias: '',
    moduleSourceLocation: '',
    tables: [{ tableName: 'tab', table: [] }]
  };
  const _moduleData = new ModuleData(_moduleDataParameters);
  await modulesLoader.addClassFromURI(_moduleData);

  const query = modulesLoader.get(_moduleData);
  assert(query !== undefined);

  const _ValuesB = query.class;
  const __ValuesB = new _ValuesB({ value: 9999, value2: 'bbb' });
  assert.deepStrictEqual(__ValuesB.value, 9999);
  assert.deepStrictEqual(__ValuesB.value2, 'bbb');
  assert.deepStrictEqual(_URI, query.cdnURI);
});

t('test addClassFromURI, adding \'.js\' extension', async () => {
  const _URI = './tests/modules_loader_test_module';
  await modulesLoader.addClassFromURI({ moduleName: 'ValuesB', moduleEngineURI: _URI });

  const query = modulesLoader.get({ moduleName: 'ValuesB', moduleEngineURI: _URI });
  assert(query !== undefined);

  const _ValuesB = query.class;
  const __ValuesB = new _ValuesB({ value: 9999, value2: 'bbb' });
  assert.deepStrictEqual(__ValuesB.value, 9999);
  assert.deepStrictEqual(__ValuesB.value2, 'bbb');
  assert.deepStrictEqual(`${_URI}.js`, query.cdnURI);
});

t('test addClassFromURI, empty URI, meaningless URI', async () => {
  const _URI_spaces = '  ';
  const _moduleName = 'TESTS/MODULES_LOADER_TEST_MODULE';
  await modulesLoader.addClassFromURI({ moduleName: _moduleName, moduleEngineURI: _URI_spaces });

  const query_spaces = modulesLoader.get({ moduleName: _moduleName, moduleEngineURI: _URI_spaces });
  assert(query_spaces !== undefined);

  const _ValuesB = query_spaces.class;
  const __ValuesB = new _ValuesB({ value: 9999, value2: 'bbb' });
  assert.deepStrictEqual(__ValuesB.value, 9999);
  assert.deepStrictEqual(__ValuesB.value2, 'bbb');
  assert.deepStrictEqual(`./${_moduleName.toLowerCase()}.js`, query_spaces.cdnURI);

  //#region test other URI cases
  const _URI_backslash = ' \\ ';
  await modulesLoader.addClassFromURI({ moduleName: _moduleName, moduleEngineURI: _URI_backslash });
  const query_backslash = modulesLoader.get({ moduleName: _moduleName, moduleEngineURI: _URI_backslash });
  assert(query_backslash !== undefined);
  assert.deepStrictEqual(`./${_moduleName.toLowerCase()}.js`, query_backslash.cdnURI);

  const _URI_dotBackslash = ' .\\ ';
  await modulesLoader.addClassFromURI({ moduleName: _moduleName, moduleEngineURI: _URI_dotBackslash });
  const query_dotBackslash = modulesLoader.get({ moduleName: _moduleName, moduleEngineURI: _URI_dotBackslash });
  assert(query_dotBackslash !== undefined);
  assert.deepStrictEqual(`./${_moduleName.toLowerCase()}.js`, query_dotBackslash.cdnURI);

  const _URI_slash = ' \/ ';
  await modulesLoader.addClassFromURI({ moduleName: _moduleName, moduleEngineURI: _URI_slash });
  const query_slash = modulesLoader.get({ moduleName: _moduleName, moduleEngineURI: _URI_slash });
  assert(query_slash !== undefined);
  assert.deepStrictEqual(`./${_moduleName.toLowerCase()}.js`, query_slash.cdnURI);

  const _URI_dotSlash = ' .\/ ';
  await modulesLoader.addClassFromURI({ moduleName: _moduleName, moduleEngineURI: _URI_dotSlash });
  const query_dotSlash = modulesLoader.get({ moduleName: _moduleName, moduleEngineURI: _URI_dotSlash });
  assert(query_dotSlash !== undefined);
  assert.deepStrictEqual(`./${_moduleName.toLowerCase()}.js`, query_dotSlash.cdnURI);

  const _URI_dot = ' . ';
  await modulesLoader.addClassFromURI({ moduleName: _moduleName, moduleEngineURI: _URI_dot });
  const query_dot = modulesLoader.get({ moduleName: _moduleName, moduleEngineURI: _URI_dot });
  assert(query_dot !== undefined);
  assert.deepStrictEqual(`./${_moduleName.toLowerCase()}.js`, query_dot.cdnURI);
  //#endregion
});

t('test addClassFromURI, module from GitHub URI, not not-alongside', async () => {
  const _URI = 'https://github.com/77it/financial-modeling/blob/v0.1.11/src/modules/z_test_module.js';
  await modulesLoader.addClassFromURI({ moduleName: 'ValuesB2', moduleEngineURI: _URI });

  const query = modulesLoader.get({ moduleName: 'ValuesB2', moduleEngineURI: _URI });
  assert(query !== undefined);

  const _ValuesB2 = query.class;
  const __ValuesB2 = new _ValuesB2({ value: 9999, value2: 'bbb' });
  assert.deepStrictEqual(__ValuesB2.value, 9999);
  assert.deepStrictEqual(__ValuesB2.value2, 'bbb');
  assert.deepStrictEqual('https://cdn.jsdelivr.net/gh/77it/financial-modeling@v0.1.11/src/modules/z_test_module.js', query.cdnURI);
});

t('test ModulesLoader with fake modulesLoader_Resolve that returns the first 2 URI wrong/not existent', async () => {

  /**
   * @param {string} moduleUrl - The url of the module to resolve
   * @return {string[]} List of URL from which import a module with first 2 not existent; the third is the input `moduleUrl`
   */
  function fake_modulesLoader_Resolve (moduleUrl) {
    return [
      'fake url, totally wrong',
      'https://cdn.jsdelivr.net/gh/fake2/financial-modeling@v0.1.11/src/modules/z_test_module.js',
      'https://cdn.jsdelivr.net/gh/77it/financial-modeling@v0.1.11/src/modules/z_test_module.js'
    ];
  }

  const modulesLoader = new ModulesLoader({ modulesLoader_Resolve: fake_modulesLoader_Resolve });

  const _URI = 'https://cdn.jsdelivr.net/gh/77it/financial-modeling@v0.1.11/src/modules/z_test_module.js';
  await modulesLoader.addClassFromURI({ moduleName: 'ValuesB2', moduleEngineURI: _URI });

  const query = modulesLoader.get({ moduleName: 'ValuesB2', moduleEngineURI: _URI });
  assert(query !== undefined);

  const _ValuesB2 = query.class;
  const __ValuesB2 = new _ValuesB2({ value: 9999, value2: 'bbb' });
  assert.deepStrictEqual(__ValuesB2.value, 9999);
  assert.deepStrictEqual(__ValuesB2.value2, 'bbb');
  assert.deepStrictEqual('https://cdn.jsdelivr.net/gh/77it/financial-modeling@v0.1.11/src/modules/z_test_module.js', query.cdnURI);
});

t('test modulesLoader_Resolve, GitHub URI transformation to CDN (raw and normal URL)', async () => {
  assert.deepStrictEqual(
    JSON.stringify(
      modulesLoader_Resolve('https://github.com/77it/financial-modeling/blob/v0.1.11/src/modules/z_test_module.js')),
    JSON.stringify(
      [
        'https://cdn.jsdelivr.net/gh/77it/financial-modeling@v0.1.11/src/modules/z_test_module.js',
        'https://rawcdn.githack.com/77it/financial-modeling/v0.1.11/src/modules/z_test_module.js',
        'https://cdn.statically.io/gh/77it/financial-modeling/v0.1.11/src/modules/z_test_module.js',
      ]
    ));

  assert.deepStrictEqual(
    JSON.stringify(
      modulesLoader_Resolve('https://raw.githubusercontent.com/77it/financial-modeling/v0.1.11/src/modules/z_test_module.js')),
    JSON.stringify(
      [
        'https://cdn.jsdelivr.net/gh/77it/financial-modeling@v0.1.11/src/modules/z_test_module.js',
        'https://rawcdn.githack.com/77it/financial-modeling/v0.1.11/src/modules/z_test_module.js',
        'https://cdn.statically.io/gh/77it/financial-modeling/v0.1.11/src/modules/z_test_module.js',
      ]
    ));

  assert.deepStrictEqual(
    JSON.stringify(
      modulesLoader_Resolve('https://github.com/77it/financial-modeling/blob/master/src/engine/engine.js')),
    JSON.stringify(
      [
        'https://cdn.jsdelivr.net/gh/77it/financial-modeling@master/src/engine/engine.js',
        'https://rawcdn.githack.com/77it/financial-modeling/master/src/engine/engine.js',
        'https://cdn.statically.io/gh/77it/financial-modeling/master/src/engine/engine.js',
      ]
    ));

  assert.deepStrictEqual(
    JSON.stringify(
      modulesLoader_Resolve('https://raw.githubusercontent.com/77it/financial-modeling/master/src/engine/engine.js')),
    JSON.stringify(
      [
        'https://cdn.jsdelivr.net/gh/77it/financial-modeling@master/src/engine/engine.js',
        'https://rawcdn.githack.com/77it/financial-modeling/master/src/engine/engine.js',
        'https://cdn.statically.io/gh/77it/financial-modeling/master/src/engine/engine.js',
      ]
    ));
});
//#endregion addClassFromURI

//#region test addClassFromObject & addClassFromURI
t('test add from class, get it, and then from uri (throw for same URI/name), then get the first class', async () => {
  const _URI = './tests/modules_loader_test_module.js';
  const _moduleName = 'duplicateModule';

  // add from class
  modulesLoader.addClassFromObject({ moduleName: _moduleName, moduleEngineURI: _URI, classObj: ValuesB2 });

  // get the class
  const query = modulesLoader.get({ moduleName: _moduleName, moduleEngineURI: _URI });
  assert(query !== undefined);
  const _ValuesB = query.class;
  const __ValuesB = new _ValuesB(9999);
  assert.deepStrictEqual(__ValuesB.valueX, 9999);

  // try to add from uri (throw for same URI/name)
  let _error = "";
  try {
    await modulesLoader.addClassFromURI({ moduleName: _moduleName, moduleEngineURI: _URI });
  } catch (error) {
    _error = (error instanceof Error) ? error.toString() : 'Unknown error occurred';
  }
  assert(_error.includes('moduleEngineURI/moduleName already exists'));

  // get the first class
  const query2 = modulesLoader.get({ moduleName: _moduleName, moduleEngineURI: _URI });
  assert(query2 !== undefined);
  const _ValuesB2 = query.class;
  const __ValuesB2 = new _ValuesB2(9999);
  assert.deepStrictEqual(__ValuesB2.valueX, 9999);
});
//#endregion test addClassFromObject & addClassFromURI
