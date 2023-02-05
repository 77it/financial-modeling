export { Ledger };

import { SimObject } from '../simobject/simobject.js';

// TODO

// init

// dates: store dates in Ledger as local dates, no UTC

/*
Js Ledger, metodi

method add(SimObject)  // add SimObject array to the transaction, keeping it open; if the transaction is closed, open it

extinguish(): accetta un id di un SO BalanceSheet, accoda alle transazioni una scrittura con: importo residuo di un SimObject + alive = false; return void. name from [1] https://www.iasplus.com/en/standards/ifric/ifric19

delta(): accetta un id e un importo delta (eventualmente precisando principal schedule e indefinite, altrimenti tutto su indefinite), crea una scrittura con una variazione del SimObject del delta indicato; restituisce l’oggetto creato, con amount in formato Big.

square(): input SimObjectType/SimObjectName or SimObjectId (es per cash o ammortamenti);
  aggiunge una scrittura di importo giusto per quadrare la transazione; restituisce l’oggetto creato, con amount in formato Big

commit(): conclude la transazione; errore se non quadra; se non c'è una transazione in corso, non fare nulla (e non andare in errore)
 */

// SimObjects storage and edits, #queue
/*
Don't provide a queue of future movements, because a SimObject can be changed by other modules.

Store, as a property of the SimObject, an object with custom properties, as the payment plans, the interest, etc.
 */

class Ledger {
  /** Map to store SimObjects: SimObject id as string key, SimObject as value.
   * @type {Map<String, SimObject>} */
  #simObjectsRepo;

  /**
   @param {Object} p
   @param {appendTrnDump} p.appendTrnDump Callback to dump the transactions
   */
  constructor ({ appendTrnDump }) {
    this.#simObjectsRepo = new Map();

    // TODO implementa altri metodi e togli codice sotto
    appendTrnDump('ciao, messaggio di prova! ' + new Date(Date.now()).toJSON() + '\n'); // todo TOREMOVE
    appendTrnDump('ciao, secondo messaggio di prova! ' + new Date(Date.now()).toJSON() + '\n'); // todo TOREMOVE
  }
}

//#region types definitions

/**
 * Callback to dump the transactions
 *
 * @callback appendTrnDump
 * @param {string} dump - The transactions dump
 */

//#endregion types definitions