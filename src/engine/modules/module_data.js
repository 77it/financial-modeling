export { ModuleData };

import { validation } from '../../deps.js';

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
  /** @type {{tableName: string, table: *[]}[]} */
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
    validation.validateObj(
      {
        obj: p,
        validation: {
          moduleName: validation.STRING_TYPE,
          moduleAlias: validation.STRING_TYPE,
          moduleEngineURI: validation.STRING_TYPE,
          moduleSourceLocation: validation.STRING_TYPE,
          tables: validation.ARRAY_OF_OBJECTS_TYPE,
        },
        errorMsg: `validation of ModuleData ${p}`,
      });

    // validate table array
    validation.validateObj(
      {
        obj: p.tables,
        validation: { tableName: validation.STRING_TYPE, table: validation.ARRAY_OF_OBJECTS_TYPE },
        errorMsg: `validation of ModuleData.tables ${p}`
      });

    this.moduleName = p.moduleName;
    this.moduleAlias = p.moduleAlias;
    this.moduleEngineURI = p.moduleEngineURI;
    this.moduleSourceLocation = p.moduleSourceLocation;
    this.tables = p.tables;
  }
}
