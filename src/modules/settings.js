export { NAMES };

import { deepFreeze } from '../lib/obj_utils.js';
import * as STD_NAMES from './_names/standard_names.js';
import { validation } from '../deps.js';

const NAMES = {};
NAMES.MODULE = 'settings';
NAMES.TABLES = {};
NAMES.TABLES.SET = {};
NAMES.TABLES.SET.NAME = 'set';
NAMES.TABLES.SET.COLUMNS = { UNIT: 'unit', NAME: 'name', VALUE: 'value' };
NAMES.TABLES.SET.VALIDATION = {
  [NAMES.TABLES.SET.COLUMNS.UNIT]: validation.STRING_TYPE,
  [NAMES.TABLES.SET.COLUMNS.NAME]: validation.STRING_TYPE,
  [NAMES.TABLES.SET.COLUMNS.VALUE]: validation.STRING_TYPE
};
NAMES.TABLES.SET.SETTINGS = {
    MODULESLOADER_URI: { UNIT: STD_NAMES.Simulation.NAME, VALUE: '$MODULESLOADER' },
    ENGINE_URI: { UNIT: STD_NAMES.Simulation.NAME, VALUE: '$ENGINE' }
};
deepFreeze(NAMES);

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
