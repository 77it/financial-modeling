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

/*
mail to merge:
Deno unknown   https://mail.google.com/mail/u/0/#search/deno+unknown/CwCPbnFjRftbSWCcZFlrLpVTnHwkkRL
JS ledger   https://mail.google.com/mail/u/0/#search/js+ledger/KtbxLxGkMfXgZsMMGhbXFGwxlGjGbWhzsq
 */

// dependencies
/* write as   https://exploringjs.com/impatient-js/toc.html */

// JS ledger/SimObject
/*
* SimObject class: throw exception with numbers with number of decimal (fractional) digits greater than SIMULATION_NUMBERS_DECIMAL_PLACES elements (also in principal, in every number)
* SimObject class: static method: normalizeNumber; returns a number with the right number of decimal places (from Simulation Lock SIMULATION_NUMBERS_DECIMAL_PLACES)
* SimObject class: store dates without minutes/seconds
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
  {string id, object oggetto} che vengono passate a ModulesRunner
* import an online `modulesrunner.js`  // #ModulesRunner quindi procede col "dynamic import" dei moduli
* load `modulesdata.jsonl`, deserializzando riga per riga
*/

// SimulationEngine (#SimulationEngine, #ModulesRunner, #ModulesData)
/*
#SimulationEngine accepts ModulesRunner (già inizializzato) and ModuleTables[] as input parameters

SimulationEngine, nelle varie versioni, è sempre compatibile con le versioni precedenti


#ModulesRunner

accetta nell'init della classe 3 parametri:
* modulesToLoadOnline: {string moduleName, string url}[]  // preso da modulesdata.jsonl
* modulesToLoadFromObjects: {string moduleName, string url}[]  // SimulationInit valorizza con il metodo `loadModules`


#Observablehq
Observable può definire delle tabelle di trascodifica dei moduli, il cui ID può essere nel formato "loan@7"
    che viene risolto nel caricamento del modulo di default "loan" nel folder "v7" // da https://observablehq.com/@observablehq/require + https://github.com/d3/d3-require#d3-require

 */

// # Modules (#modules)
/*
Modules import the JSDoc type file online, from the file "https://github.com/simulation99/simulation-js/simulation/types/simulation_types.js"
 */


// Ledger: da main.js riceve alcuni oggetti per scrivere su file:
/*
* logger_simObjects  // scrive il dump dei SimObjects
* logger_messages  // scrive un file di messaggi, come lista di stringhe JSON

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
