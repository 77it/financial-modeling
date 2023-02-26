export { NAMES };

import { deepFreeze } from '../lib/obj_utils.js';

const NAMES = {
  MODULE: 'SETTINGS',
  TABLE: 'SET',
  SIM_MODULESLOADER_URI: '$MODULESLOADER',
  SIM_ENGINE_URI: '$ENGINE',
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
