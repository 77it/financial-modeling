// dynamic import inside a function
export async function foo() {
    // DYNAMIC IMPORT (works with deno and browser)
    let importUrl = "https://cdn.skypack.dev/d3-dsv";
    const ValuesXXX = (await import(importUrl));
    return ValuesXXX;
}
