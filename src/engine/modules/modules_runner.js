export { ModulesRunner };

import { Ledger } from '../ledger/ledger.js';
import { ModulesLoader } from '../../modules/_modules_loader.js';
import { ModuleData } from './module_data.js';

// TODO
// closed/expired modules
/*
There must be a way to tell - by the modules - to ModuleRunner that a module is no longer alive and should not be called anymore.
 */

/**
 * @callback modulesLoader_Resolve
 * @param {string} module - The module to resolve
 * @return {string[]} List of URL from which import a module
 */

class ModulesRunner {
  #ledger;
  #modulesLoader;
  #userInput;

  /**
   @param {Object} p
   @param {ModuleData[]} p.userInput - Array of `ModuleData` objects
   @param {modulesLoader_Resolve} p.modulesLoader_Resolve Callback to dump the transactions
   @param {Ledger} p.ledger Ledger object, already initialized
   */
  constructor ({ userInput, modulesLoader_Resolve, ledger }) {
    this.#ledger = ledger;
    this.#userInput = userInput;
    this.#modulesLoader = new ModulesLoader({ modulesLoader_Resolve });

    // TODO not implemented
    console.dir(userInput); // todo TOREMOVE
    throw new Error('not implemented');
  }
}
