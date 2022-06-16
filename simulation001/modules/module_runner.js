// dynamic import inside a function
export async function loadObj() {
    // DYNAMIC IMPORT (works with deno and browser)
    let importUrl = "./dynamicimport2.js";
    const ValuesXXX = (await import(importUrl));
    return ValuesXXX;
}


// dynamic import inside a function, choosing the object to return from a string
export async function loadObj2(objName) {
    // DYNAMIC IMPORT (works with deno and browser)
    let importUrl = "./dynamicimport2.js";
    const ValuesXXX = (await import(importUrl));
    return ValuesXXX[objName];
}


export class modulesRunner {
    /** @type {Object} */ //TODO definisci oggetto 
    // contains id (URI/className) as key and a class as value
    #classesRepo;
    
    static valueX = "moduleRunner v0.1.2";
    constructor() {
        #classesRepo = {};
    }
    
    // method to add classes from object to the repository
    // todo implementa caricamento anche di array di oggetti; va in errore se non è definito id; value is optional
    addClassFromObject({className, URI, classObj}) {
      #classesRepo[URI + "/" + className] = classObj;
    }
    
    // method to add classes from URI to the repository
    // todo implementa caricamento anche di array di oggetti; va in errore se non è definito id; value is optional
    async addClassFromURI({className, URI}) { 
        // DYNAMIC IMPORT (works with deno and browser)
        const _module = (await import(URI));
        #classesRepo[URI + "/" + className] = _module[objName]; 
    }
    
    getClass({className, URI}) {
      return #classesRepo[URI + "/" + className];
    }  
}