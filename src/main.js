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

// dependencies
/* write as   https://exploringjs.com/impatient-js/toc.html */

// JS ledger/SimObject
/*
SimObject class
* public constant (not simulation lock) SIMULATION_NUMBERS_DECIMAL_PLACES, set to 15 (see https://en.m.wikipedia.org/wiki/Numeric_precision_in_Microsoft_Excel & https://docs.microsoft.com/en-us/office/troubleshoot/excel/floating-point-arithmetic-inaccurate-result)
* numbers: throw exception with numbers with number of decimal (fractional) digits greater than SIMULATION_NUMBERS_DECIMAL_PLACES elements (also in principal, in every number)
* numbers: static method: normalizeNumber; returns a number with the right number of decimal places (normalize numbers with `roundTo` to SIMULATION_NUMBERS_DECIMAL_PLACES)
* dates: store dates without minutes/seconds
*/

/*
Deno modules from Excel modules:
* write in Excel relative path of modules
* command line option of “Deno.exe builder.js” to set the root of modules (./ or https/something) before execution from main.js

/////

js lock?
https://www.talkinghightech.com/en/initializing-js-lock/
 */

// SimObject definition (#SimObject)
/*
VersionId
OldVersionId
Quantity
UnityOfMeasure
 */

// SimulationInit (#SimulationInit)
/*
# commands

* merge-input
* init-simulation

## main.js (#SimulationEngine)

Simulation init then:
* prevede un metodo chiamato `loadModules` da usare prima dell'avvio della simulazione per passare delle classi definite come
  {string id, object oggetto} che vengono passate a ModulesLoader
* import an online `modulesloader.js`  // #ModulesLoader quindi procede col "dynamic import" dei moduli
* load `modulesdata.jsonl`, deserializzando riga per riga
*/

// SimulationEngine (#SimulationEngine, #ModulesRunner, #ModulesLoader, #ModulesData)
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

// # Modules (#modules)
/*
Modules import the JSDoc type file online, from the file "https://github.com/simulation99/simulation-js/simulation/types/simulation_types.js"
 */


// Ledger: da main.js riceve alcuni oggetti per scrivere su file:
/*
* logger_simObjects  // scrive il dump dei SimObjects
* logger_messages  // scrive un file di messaggi, come lista di stringhe JSON

#lock, #variables (#locks #immutable)

Variables/lock are immutable: when defined/set can't be redefined.

Fields:
* namespace, variable, value
* Simulation/Global namespace = ""
* Any unit name is allowed
/////
get method

(value, optional namespace)
value can be string or object {value string, namespace string}
namespace can be null, undefined or "" meaning Simulation/global
/////
Ledger crea poi la funzione lock `log_message` per consentire ai moduli di scrivere messaggi.
*/

// errore, interruzione dell'esecuzione (fatal error, throw)
/*
Qualunque modulo che voglia interrompere l'esecuzione del programma per un errore fatale esegue un `throw new Error`, che viene intercettato
con try catch da main.js, che scrive il file di errore passato dalla riga di comando, e esce.
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


// report debug idea   #debug #idea
/*
to debug, create an option in the setting module that set in all SimObjects description the ModuleId from which the SimObject is created.
 */

// UI UX GUI idea  #UI #UX GUI idea
/*
 a partire dal report delta (giornaliero, mensile) generato su Excel

Mostrare grafico giornaliero di EBITDA, cassa ecc a partire dai SimObjects, sommando movimento per movimento i vari SimObjects, e mostrando anche per ogni giorno i SimObjects movimentati
 */
