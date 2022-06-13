// dynamic import inside a function
export async function foo() {
    // DYNAMIC IMPORT (works with deno and browser)
    let importUrl = "./dynamicimport2.js";
    const ValuesXXX = (await import(importUrl));
    return ValuesXXX;
}
