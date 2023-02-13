//#region documentation
// Error management
/*
#error #fatal error #throw
Every module that wants to interrupt program execution for a fatal error throws a new Error;
*/

//#endregion

export class Module {
  name = '_sample_module';
  //#region private fields
  #_alive;

  //#endregion

  constructor () {
    this.#_alive = true;
  }

  get alive () { return this.#_alive; }
}
