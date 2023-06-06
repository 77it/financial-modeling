export { ModuleData };

import * as sanitization from '../../lib/sanitization_utils.js';

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
    // sanitize and validate p
    sanitization.sanitizeObj(
      {
        obj: p,
        sanitization: {
          moduleName: sanitization.STRING_TYPE,
          moduleAlias: sanitization.STRING_TYPE,
          moduleEngineURI: sanitization.STRING_TYPE,
          moduleSourceLocation: sanitization.STRING_TYPE,
          tables: sanitization.ARRAY_OF_OBJECTS_TYPE,
        },
        validate: true
      });

    // validate tables array
    sanitization.sanitizeObj(
      {
        obj: p.tables,
        sanitization: { tableName: sanitization.STRING_TYPE, table: sanitization.ARRAY_OF_OBJECTS_TYPE },
        validate: true
      });

    this.moduleName = p.moduleName;
    this.moduleAlias = p.moduleAlias;
    this.moduleEngineURI = p.moduleEngineURI;
    this.moduleSourceLocation = p.moduleSourceLocation;
    this.tables = p.tables;
  }
}
