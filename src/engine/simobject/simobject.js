export { SimObject };

import { validateObj } from '../../lib/validation_utils.js';
import { simObject_Validation } from './simobject_validation.js';

// this is the SimObject stored in Ledger

// TODO SimObject

// numbers and dates
/*
* numbers: stored with big.js http://mikemcl.github.io/big.js/
* store dates in SimObject as local dates, no UTC  // dates can have hour/minutes/seconds if needed, won't be stripped/normalized
*/

// # not exported properties
/*
* extras: property that contain a class or an object with all the extra properties specific to the SimObject
* vsSimObjectId: id of the versus SimObject  // this is the id of the SimObject that is the opposite of this one, e.g. a credit is the opposite of a debit
* versionId
* previousVersionId
* quantity
* unityOfMeasure
*/

class SimObject {
  /**
   * @param {*} p
   */
  constructor (p) {
    validateObj({ obj: p, validation: simObject_Validation });
    // TODO not implemented
    throw new Error('not implemented');
  }
}
