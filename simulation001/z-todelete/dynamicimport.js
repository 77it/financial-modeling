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
