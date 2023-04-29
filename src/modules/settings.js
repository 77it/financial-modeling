export { ModuleInfo };

import { validation, deepFreeze } from '../deps.js';

const MODULE_NAME = 'settings';
const tablesInfo = {};
tablesInfo.set = {};
tablesInfo.set.name = 'set';
tablesInfo.set.columns = { scenario: 'scenario', unit: 'unit', name: 'name', value: 'value' };
tablesInfo.set.validation = {
  [tablesInfo.set.columns.scenario]: validation.STRING_TYPE,
  [tablesInfo.set.columns.unit]: validation.STRING_TYPE,
  [tablesInfo.set.columns.name]: validation.STRING_TYPE,
  [tablesInfo.set.columns.value]: validation.ANY_TYPE
};
const ModuleInfo = { MODULE_NAME, tablesInfo };
deepFreeze(ModuleInfo);

// TODO to implement
export class Module {
  #name = MODULE_NAME;

  //#region private fields
  /** @type {boolean} */
  #alive;
  /** @type {undefined|Date} */
  #startDate;

  //#endregion private fields

  constructor () {
    this.#alive = true;
    this.#startDate = undefined;
  }

  get name () { return this.#name; }

  get alive () { return this.#alive; }

  /** @returns {undefined|Date} */
  get startDate () { return this.#startDate; }
}
