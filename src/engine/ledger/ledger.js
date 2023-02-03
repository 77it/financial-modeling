export { Ledger };

import { SimObject } from '../simobject/simobject.js';

// TODO

// init

// dates: store dates in Ledger as local dates, no UTC

/*
Js Ledger, metodi

newTrn()
start a new transaction

method addSO(array)  // add SimObject array to the transaction, keeping it open

extinguishSO(): accetta un id di un SO BalanceSheet, accoda alle transazioni una scrittura con: importo residuo di un SimObject + alive = false; return void. name from [1] https://www.iasplus.com/en/standards/ifric/ifric19

deltaSO(): accetta un id e un importo delta (eventualmente precisando principal schedule e indefinite, altrimenti tutto su indefinite), crea una scrittura con una variazione del SimObject del delta indicato; restituisce l’oggetto creato, con amount in formato Big.

squareTrn(): input SimObjectType/SimObjectName or SimObjectId (es per cash o ammortamenti);
  aggiunge una scrittura di importo giusto per quadrare il resto; restituisce l’oggetto creato, con amount in formato Big
  e chiude la transazione facendo automaticamente il commit

commitTrn(): conclude la transazione; errore se non quadra
 */

// SimObjects storage and edits, #queue
/*
Don't provide a queue of future movements, because a SimObject can be changed by other modules.

Store, as a property of the SimObject, an object with custom properties, as the payment plans, the interest, etc.
 */

// serialization of SimObjects
/*
serialization of the payment plan: convert `principalSchedule` to numbers, splitting amount (minus indefinite) to every date, also before today, because we can have a payment plan not regular with payments (overdue, etc.)

serialization of dates: convert to UTC only when dumping the SimObject to JSON (leaving hours/minutes/seconds: will be removed during report generation)
  sample code: const dateExportToJSON = new Date(Date.UTC(_d0.getFullYear(), _d0.getMonth(),_d0.getDate(), _d0.getHours(),_d0.getMinutes(), _d0.getSeconds(), _d0.getMilliseconds())).toJSON();
 */


/**
 * Callback to dump the transactions
 *
 * @callback appendTrnDump
 * @param {string} dump - The transactions dump
 */

class Ledger {
  /** Map to store SimObjects: SimObject id as string key, SimObject as value.
   * @type {Map<String, SimObject>} */
  #simObjectsRepo;

  /**
   @param {Object} p
   @param {appendTrnDump} p.appendTrnDump Callback to dump the transactions
   */
  constructor ( {appendTrnDump}) {
    this.#simObjectsRepo = new Map();

    // TODO implementa altri metodi e togli codice sotto
    appendTrnDump("ciao, messaggio di prova! " + new Date(Date.now()).toJSON() + "\n") // todo TOREMOVE
    appendTrnDump("ciao, secondo messaggio di prova! " + new Date(Date.now()).toJSON() + "\n") // todo TOREMOVE
  }
}
