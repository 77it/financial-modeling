/**
 * @param {string} json - ModuleData's Json
 * @return {ModuleData} deserialized ModuleData
 */
export function ModuleDataLoader (json) {
  const errorMsg = "Error during deserialization of ModuleData"

  const deserializedModuleData = JSON.parse(json);

  const moduleName_name = "moduleName";
  const moduleAlias_name = "moduleAlias";
  const moduleEngineURI_name = "moduleEngineURI";
  const moduleSourceLocation_name = "moduleSourceLocation";
  const tables_name = "tables";

  if (deserializedModuleData[moduleName_name] === undefined)
    throw new Error(`${errorMsg}: ${moduleName_name} is missing or undefined`);
  if (deserializedModuleData[moduleAlias_name] === undefined)
    throw new Error(`${errorMsg}: ${moduleAlias_name} is missing or undefined`);
  if (deserializedModuleData[moduleEngineURI_name] === undefined)
    throw new Error(`${errorMsg}: ${moduleEngineURI_name} is missing or undefined`);
  if (deserializedModuleData[moduleSourceLocation_name] === undefined)
    throw new Error(`${errorMsg}: ${moduleSourceLocation_name} is missing or undefined`);
  if (deserializedModuleData[tables_name] === undefined)
    throw new Error(`${errorMsg}: ${tables_name} is missing or undefined`);

  xxx; // controlla nomi oggetti contenuti in Tables

  return new ModuleData({
    moduleName: deserializedModuleData[moduleName_name],
    moduleAlias: deserializedModuleData[moduleAlias_name],
    moduleEngineURI: deserializedModuleData[moduleEngineURI_name],
    moduleSourceLocation: deserializedModuleData[moduleSourceLocation_name],
    tables: deserializedModuleData[tables_name],
  });
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
  constructor ({
    moduleName,
    moduleAlias,
    moduleEngineURI,
    moduleSourceLocation,
    tables,
  }) {

    validate();

    this.moduleName = moduleName;
    this.moduleAlias = moduleAlias;
    this.moduleEngineURI = moduleEngineURI;
    this.moduleSourceLocation = moduleSourceLocation;
    this.tables = tables;

    function validate () {
      if (typeof moduleName !== 'string'
        || typeof moduleAlias !== 'string'
        || typeof moduleEngineURI !== 'string'
        || typeof moduleSourceLocation !== 'string'
        || !Array.isArray(tables)
        || !tables.every(i => (typeof i.tableName === 'string'))
        || !tables.every(i => (typeof i.table === 'object')))
        throw new Error('argument exception, wrong type');
    }
  }
}
