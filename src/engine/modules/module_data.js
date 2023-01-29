export { ModuleData };

import { validateObj } from '../../deps.js';

// ModuleData is not immutable nor has the clone method, because the object is passed only to the modules that will use it
class ModuleData {
  //#region public fields
  /** @type {string} */
  moduleName;
  /** @type {string} */
  moduleAlias;
  /** @type {string} */
  moduleEngineURI;
  /** @type {string} */
  moduleSourceLocation;
  /** @type {{tableName: string, table: *[]}[]}} */
  tables;

  //#endregion

  /**
   * ModuleData class
   * @param {Object} p
   * @param {string} p.moduleName
   * @param {string} p.moduleAlias
   * @param {string} p.moduleEngineURI
   * @param {string} p.moduleSourceLocation
   * @param {{tableName: string, table: *[]}[]} p.tables
   */
  constructor (p) {
    validateObj(
      {
        obj: p,
        validation: {
          moduleName: 'string',
          moduleAlias: 'string',
          moduleEngineURI: 'string',
          moduleSourceLocation: 'string',
          tables: 'array[object]',
        },
        errorMsg: `validation of ModuleData ${p}`,
      });

    // validate table array
    validateObj(
      {
        obj: p.tables,
        validation: { tableName: 'string', table: 'array[object]' },
        errorMsg: `validation of ModuleData.tables ${p}`
      });

    this.moduleName = p.moduleName;
    this.moduleAlias = p.moduleAlias;
    this.moduleEngineURI = p.moduleEngineURI;
    this.moduleSourceLocation = p.moduleSourceLocation;
    this.tables = p.tables;
  }
}
