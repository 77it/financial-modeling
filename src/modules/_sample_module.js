//#region documentation
// Error management
/*
#error #fatal error #throw
Every module that wants to interrupt program execution for a fatal error throws a new Error;
*/

//#endregion

export class Module {
  //#region private fields
  /** @type {boolean} */
  #_alive;

  //#endregion

  constructor () {
    this.#_alive = true;
  }

  get alive () { return this.#_alive; }
  set alive (value) { this.#_alive = value; }
}
