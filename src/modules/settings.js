export { ModuleInfo };

import { deepFreeze } from '../lib/obj_utils.js';
import { validation } from '../deps.js';

const MODULE_NAME = 'settings';
const TablesInfo = {};
TablesInfo.Set = {};
TablesInfo.Set.NAME = 'set';
TablesInfo.Set.Columns = { SCENARIO: 'scenario', UNIT: 'unit', NAME: 'name', VALUE: 'value' };
TablesInfo.Set.Validation = {
  [TablesInfo.Set.Columns.SCENARIO]: validation.STRING_TYPE,
  [TablesInfo.Set.Columns.UNIT]: validation.STRING_TYPE,
  [TablesInfo.Set.Columns.NAME]: validation.STRING_TYPE,
  [TablesInfo.Set.Columns.VALUE]: validation.ANY_TYPE
};
const ModuleInfo = {MODULE_NAME, TablesInfo}
deepFreeze(ModuleInfo);

// TODO to implement
export class Module {
  name = 'settings';

  //#region private fields
  #_alive;

  //#endregion

  constructor () {
    this.#_alive = true;
  }

  get alive () { return this.#_alive; }
}
