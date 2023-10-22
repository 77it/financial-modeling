export { ModuleData };

import * as schema from '../../lib/schema.js';
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
          moduleName: schema.STRING_TYPE,
          moduleAlias: schema.STRING_TYPE,
          moduleEngineURI: schema.STRING_TYPE,
          moduleSourceLocation: schema.STRING_TYPE,
          tables: schema.ARRAY_OF_OBJECTS_TYPE,
        },
        validate: true
      });

    // validate tables array
    sanitization.sanitizeObj(
      {
        obj: p.tables,
        sanitization: { tableName: schema.STRING_TYPE, table: schema.ARRAY_OF_OBJECTS_TYPE },
        validate: true
      });

    this.moduleName = p.moduleName;
    this.moduleAlias = p.moduleAlias;
    this.moduleEngineURI = p.moduleEngineURI;
    this.moduleSourceLocation = p.moduleSourceLocation;
    this.tables = p.tables;
  }
}
