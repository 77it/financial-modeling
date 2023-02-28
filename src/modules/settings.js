export { NAMES };

import { deepFreeze } from '../lib/obj_utils.js';
import * as STANDARD_NAMES from './_names/standardnames.js';

const NAMES = {
  MODULE: 'SETTINGS',
  TABLE_SET: 'SET',
  SETTING__MODULESLOADER_URI__VALUE: '$MODULESLOADER',
  SETTING__MODULESLOADER_URI__UNIT: STANDARD_NAMES.SIMULATION.NAME,
  SETTING__ENGINE_URI__VALUE: '$ENGINE',
  SETTING__ENGINE_URI__UNIT: STANDARD_NAMES.SIMULATION.NAME,
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
