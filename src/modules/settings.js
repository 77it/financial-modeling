export { NAMES };

import { deepFreeze } from '../lib/obj_utils.js';
import * as STANDARD_NAMES from './_names/standardnames.js';

const NAMES = {};
NAMES.MODULE = 'settings';
NAMES.TABLES = {};
NAMES.TABLES.SET = {};
NAMES.TABLES.SET.NAME = 'set';
NAMES.TABLES.SET.COLUMNS = { UNIT: 'unit', NAME: 'name', VALUE: 'value' };
NAMES.TABLES.SET.VALIDATION = {
  [NAMES.TABLES.SET.COLUMNS.UNIT]: 'string',
  [NAMES.TABLES.SET.COLUMNS.NAME]: 'string',
  [NAMES.TABLES.SET.COLUMNS.VALUE]: 'string'
};
NAMES.TABLES.SET.SETTINGS = {
  MODULESLOADER_URI: { UNIT: STANDARD_NAMES.SIMULATION.NAME, VALUE: '$MODULESLOADER' },
  ENGINE_URI: { UNIT: STANDARD_NAMES.SIMULATION.NAME, VALUE: '$ENGINE' }
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
