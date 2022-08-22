/*
crea classe ModuleData + funzione (da altri moduli) loadSerializedModule

ModuleData non deve essere immutabile, né avere il metodo clone, perché l’oggetto viene passato solo al modulo a cui si riferisce

Prevedi che ModuleData abbia i campi necessari per far funzionare ModulesLoader :
{ moduleName, URI }

ModuleData throw se non valido

/////

testa ModulesLoader  passando ModuleData  a 'addClassFromURI' e 'get'

/////

testa con observablehq
 */

/**
 * @param {string} json - ModuleData's Json
 * @return {ModuleData} deserialized ModuleData
 *
 * @example
 *
 *     foo('hello')
 */
export function ModuleDataLoader(json)
{
}


export class ModuleData {
  //region public fields
  /** @type {string} */
  moduleName;
  /** @type {string} */
  moduleAlias;
  /** @type {string} */
  moduleEngineURI;
  /** @type {string} */
  moduleSourceLocation;
  /** @type {{tableName: string, table: {}}[]}} */
  tables;
  //endregion

  /**
   * @param {Object} p
   * @param {string} p.moduleName
   * @param {string} p.moduleAlias
   * @param {string} p.moduleEngineURI
   * @param {string} p.moduleSourceLocation
   * @param {Object} p.tables
   * @param {string} p.tables.tableName
   * @param {Object} p.tables.table
   */
  constructor({
    moduleName,
    moduleAlias,
    moduleEngineURI,
    moduleSourceLocation,
    tables:
      {tableName, table}}) {
    validate();

    if (value === '') {
      throw new Error('Empty value');
    }
    this.#value = value;

    this.value2 = value2;

    if (counter !== undefined) {
      this.#counter = counter;
    } else {
      this.#counter = 0;
    }

    function validate() {
      if (typeof value !== 'string'
        || typeof value2 !== 'string'
        || (counter !== undefined && typeof counter !== 'number'))
        throw new Error('argument exception, wrong type')
    }
  }
}
