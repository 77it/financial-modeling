// dynamic import inside a function
export async function loadObj () {
  // DYNAMIC IMPORT (works with deno and browser)
  let importUrl = './dynamicimport2.js'
  const ValuesXXX = (await import(importUrl))
  return ValuesXXX
}

// dynamic import inside a function, choosing the object to return from a string
export async function loadObj2 (objName) {
  // DYNAMIC IMPORT (works with deno and browser)
  let importUrl = './dynamicimport2.js'
  const ValuesXXX = (await import(importUrl))
  return ValuesXXX[objName]
}

export class ModulesRunner {
  /** @type {Object} */ //TODO definisci oggetto
    // contains id (URI/className) as key and a class as value
  #classesRepo
  #defaultClassName = 'Module'

  static valueX = 'moduleRunner v0.1.2'

  constructor () {
    this.#classesRepo = {}
  }

  // method to add classes from object to the repository
  // todo implementa caricamento anche di array di oggetti; va in errore se non è definito id; value is optional
  addClassFromObject ({ moduleName, URI, classObj }) {
    if (this.#classesRepo[`${URI}/${moduleName}`] === undefined) {
      this.#classesRepo[`${URI}/${moduleName}`] = classObj
      return true
    }
    return false
  }

  // method to add classes from URI to the repository
  // todo implementa caricamento anche di array di oggetti; va in errore se non è definito id; value is optional
  async addClassFromURI ({ moduleName, URI }) {
    if (this.#classesRepo[`${URI}/${moduleName}`] === undefined) {
      // DYNAMIC IMPORT (works with deno and browser)
      const _module = (await import(URI))
      this.#classesRepo[`${URI}/${moduleName}`] = _module[this.#defaultClassName]
      return true
    }
    return false
  }

  getClass ({ moduleName, URI }) {
    return this.#classesRepo[`${URI}/${moduleName}`]
  }
}
