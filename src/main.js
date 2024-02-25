/**
 Abandon all hope, ye who enter here.
 For financial modeling is a treacherous journey,
 fraught with peril and uncertainty.
 Yet, with careful planning and analysis,
 one may navigate the labyrinthine world of finance,
 and emerge victorious on the other side.
 May this code serve as a guide and a beacon of hope,
 to all who dare to venture forth into the realm of numbers. */

// accounting for developers
/*
https://www.moderntreasury.com/journal/accounting-for-developers-part-i
https://news.ycombinator.com/item?id=32495724
https://news.ycombinator.com/item?id=23964513
*/


// debug
// https://stackoverflow.com/questions/61853754/how-to-debug-deno-in-vscode
// https://deno.land/manual@v1.21.0/vscode_deno#using-the-debugger


// deno cheat sheet: https://oscarotero.com/deno/


// [UNUSED - Simulation must never break old code then won't need versions] semantic versioning
/*
https://semver.org/

first version of libraries etc can start at 0.1.0 as specified in https://semver.org/

the version number is stored in the folder, as
https://github.com/simulation99/simulation-js/simulation/lib/v0/simulation_types.js
inspired to this real example
https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/d3/v6/index.d.ts
 */


// dependencies (#deps.js #deps.ts #global.d.ts #index.js #dependencies)
/* create file "deps.js" based on "deps.ts" in https://examples.deno.land/dependency-management

  export {
    assert,
    assertEquals,
    assertStringIncludes,
  } from 'https://deno.land/std@0.151.0/testing/asserts.ts';
*/


//#region SimulationInit (#SimulationInit)
/*
# commands

* merge-input ??? what is it ???
* init-simulation

## main.js (#SimulationEngine)

Simulation init then:
* prevede un metodo chiamato `loadModules` da usare prima dell'avvio della simulazione per passare delle classi definite come
  {string id, object oggetto} che vengono passate a ModulesLoader
* import an online `modulesloader.js`  // #ModulesLoader quindi procede col "dynamic import" dei moduli
* load `modulesdata.jsonl`, deserializzando riga per riga
*/
//#endregion SimulationInit (#SimulationInit)


//#region Ledger other minor methods (#other #minor #extra)
/*
today()
restituisce la data corrente di esecuzione
 */
//#endregion Ledger other minor methods (#other #minor #extra)


//#region UI UX GUI idea  #UI #UX GUI idea
// UI UX GUI idea  #UI #UX GUI idea
/*
 a partire dal report delta (giornaliero, mensile) generato su Excel

Mostrare grafico giornaliero di EBITDA, cassa ecc a partire dai SimObjects, sommando movimento per movimento i vari SimObjects, e mostrando anche per ogni giorno i SimObjects movimentati
 */
//#endregion UI UX GUI idea  #UI #UX GUI idea
