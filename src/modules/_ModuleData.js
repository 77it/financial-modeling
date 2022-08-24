import { validate } from '../lib/validation_utils.js';

/**
 * @param {string} json - ModuleData's Json
 * @return {ModuleData} deserialized ModuleData
 */
export function ModuleDataLoader (json) {
  const errorMsg = 'Error during deserialization of ModuleData';

  const deserializedModuleData = JSON.parse(json);

  return new ModuleData(deserializedModuleData);
}

// ModuleData is not immutable nor has the clone method, because the object is passed only to the modules that will use it
export class ModuleData {
  //#region public fields
  /** @type {string} */
  moduleName;
  /** @type {string} */
  moduleAlias;
  /** @type {string} */
  moduleEngineURI;
  /** @type {string} */
  moduleSourceLocation;
  /** @type {{tableName: string, table: Object}[]}} */
  tables;

  //#endregion

  /**
   * @param {Object} p
   * @param {string} p.moduleName
   * @param {string} p.moduleAlias
   * @param {string} p.moduleEngineURI
   * @param {string} p.moduleSourceLocation
   * @param {{tableName: string, table: Object}[]} p.tables
   */
  constructor (p) {
    validate(
      {
        obj: p,
        validation: {
          moduleName: 'string',
          moduleAlias: 'string',
          moduleEngineURI: 'string',
          moduleSourceLocation: 'string',
          tables: 'object',
        },
        msg: `validation of ModuleData ${p}`,
      });

    validate(
      {
        obj: p.tables,
        validation: { tableName: 'string', table: 'object' },
        msg: `validation of ModuleData.tables ${p}`,
        array: true,
      });

    this.moduleName = p.moduleName;
    this.moduleAlias = p.moduleAlias;
    this.moduleEngineURI = p.moduleEngineURI;
    this.moduleSourceLocation = p.moduleSourceLocation;
    this.tables = p.tables;
  }
}
