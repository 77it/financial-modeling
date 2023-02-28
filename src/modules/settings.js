export { NAMES };

import { deepFreeze } from '../lib/obj_utils.js';
import * as STANDARD_NAMES from './_names/standardnames.js';

const NAMES = {
  MODULE: 'SETTINGS',
  TABLE_SET: 'SET',
  TABLE_SET__VALIDATION: { UNIT: 'string', NAME: 'string', VALUE: 'string' },
  TABLE_SET__COL_UNIT: 'unit',
  TABLE_SET__COL_NAME: 'name',
  TABLE_SET__COL_VALUE: 'value',
  TABLE_SET__SETTING__MODULESLOADER_URI__UNIT: STANDARD_NAMES.SIMULATION.NAME,
  TABLE_SET__SETTING__MODULESLOADER_URI__VALUE: '$MODULESLOADER',
  TABLE_SET__SETTING__ENGINE_URI__UNIT: STANDARD_NAMES.SIMULATION.NAME,
  TABLE_SET__SETTING__ENGINE_URI__VALUE: '$ENGINE',
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
