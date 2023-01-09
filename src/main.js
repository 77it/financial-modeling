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
  } from "https://deno.land/std@0.151.0/testing/asserts.ts";
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


//#region SimulationEngine (#SimulationEngine, #ModulesRunner, #ModulesLoader, #ModulesData)
/*
#SimulationEngine accepts ModulesLoader (già inizializzato) and ModuleTables[] as input parameters
SimulationEngine, nelle varie versioni, è sempre compatibile con le versioni precedenti

#ModulesLoader
accetta nell'init della classe 2 parametri:
* modulesToLoadOnline: {string moduleName, string url}[]  // preso da modulesdata.jsonl
* modulesToLoadFromObjects: {string moduleName, string url}[]  // SimulationInit valorizza con il metodo `loadModules`

#ModulesRunner
accetta nell'init della classe un parametro:
# filter: {type, name, value, match}[]  // type: "+"|"-"; match: "equals" (or omitted)|"startsWith"|"includes"|"endsWith"  // match names from Javascript standard
Per generare N simulazioni con diversi scenari (ogni riga può essere inclusa/esclusa)
Crea possibilità di filtrare nei parametri iniziali di SimulationEngine comandi con blacklist/whitelist basati su tag.
Se in un filtro c'è il valore "" vuol dire che in assenza di tag si intende incluso / escluso.

*/
//#endregion SimulationEngine (#SimulationEngine, #ModulesRunner, #ModulesLoader, #ModulesData)


//#region #Globals (defined inside Ledger) (#variables, #locks)
/*
if needed see implementation of js lock  https://www.talkinghightech.com/en/initializing-js-lock/, but being immutable probably isn't needed...

Variables/lock are immutable: when defined/set can't be redefined.

/////
method globalsGet({namespace: optional string, name:string})
namespace can be null, undefined or "" meaning Simulation/global
name, string, is the global variable name

/////
method globalsSet({namespace: optional string, name: string, value: any})
namespace can be null, undefined or "" meaning Simulation/global
name, string, is the global variable name
value can be string or object

*/


// js lock boolean flag: salesAndPurchasesOnlyVsCash
/*
immutable flag (ovviamente)

serve per non muovere il CCN con acquisti e vendite, CCN che dovrebbe essere mosso da altri moduli che impostano "a mano" il livello di crediti v/clienti e debiti v/fornitori.
è un flag che non è mandatory, ma andrebbe rispettato dai vari moduli. non deve essere rispettato da crediti non commerciali, quali finanziamenti infragruppo, ecc.

in alternativa ci possono essere dei moduli che scaricano i crediti/debiti commerciali a fine giornata appena si manifestano, o ne impostano il valore perché sia sempre una certa soglia (in relazione ai ricavi/costi, ad esempio) 
*/


// some other locks
/*
# EBITDA
lockname: EBITDA

types (defined in JSDocs):
* ebitdaQuery
* ebitda

# RATE_EURIBOR
lockname: RATE_EURIBOR

types (defined in JSDocs):
* rateEuriborQuery
* rateEuribor

is a list of {Date, rate}, with the sequence of Euribor in the entire simulation range.
when the rates are stored in the lock, the module that sets the rate shouldn't save dates before start and after end
(dates from module/table "Set.SimulationSettings", settings "SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE" and "SIMULATION_END_DATE").
 */
//#endregion #Globals (defined inside Ledger) (#variables, #locks)


//#region #Logger of debug, info, warning messages (defined inside Ledger)
/*
Ledger ha 3 metodi `logDebug`, `logInfo`, `logWarning`  per consentire ai moduli di scrivere messaggi di tipo:
debug, info, warning.

i messaggi sono scritti su 3 SimObject di tipo "debug_debug", "debug_info", "debug_warning"
che portano nel campo SimObject.Description quel che si vuole loggare (tipo messaggio, valore messaggio, ecc);

messaggi di errore non sono previsti, vedi >error
 */


// report debug idea   #debug #idea
/*
for debug purposes, create an option in the setting module that set in all SimObjects.CommandGroup__DebugDescription the ModuleId from which the command group is created.
 */
//#endregion #Logger of debug, info, warning messages (defined inside Ledger)


//#region Ledger other minor methods (#other #minor #extra)
/*
today()
restituisce la data corrente di esecuzione
 */
//#endregion Ledger other minor methods (#other #minor #extra)


//#region errore, interruzione dell'esecuzione (#error #fatal error #throw)
/*
Qualunque modulo che voglia interrompere l'esecuzione del programma per un errore fatale esegue un `throw new Error`,
che viene intercettato con try catch da main.js, che:
* scrive su >logger_messages_writer
* scrive su SimObject di tipo "debug_error"
* scrive su console
* ovviamente interrompe l'esecuzione
 */
//#endregion errore, interruzione dell'esecuzione (#error #fatal error #throw)


//#region UI UX GUI idea  #UI #UX GUI idea
// UI UX GUI idea  #UI #UX GUI idea
/*
 a partire dal report delta (giornaliero, mensile) generato su Excel

Mostrare grafico giornaliero di EBITDA, cassa ecc a partire dai SimObjects, sommando movimento per movimento i vari SimObjects, e mostrando anche per ogni giorno i SimObjects movimentati
 */
//#endregion UI UX GUI idea  #UI #UX GUI idea
