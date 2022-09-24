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

// JS ledger/SimObject
/*
# #digits #precision
On Ledger (not simulation lock) are defined two public constant
SIMULATION_NUMBERS_MAX_DIGITS = 15;
SIMULATION_NUMBERS_DECIMAL_PLACES, set to 2  // 2 is good because is also the default number of Excel decimal digits

## info about numbers, money, precision

from https://mikemcl.github.io/bignumber.js/
To aid in debugging, if BigNumber.DEBUG is true then an error will be thrown on an invalid n.
An error will also be thrown if n is of type number with more than 15 significant digits,
as calling toString or valueOf on these numbers may not result in the intended value.

see https://en.m.wikipedia.org/wiki/Numeric_precision_in_Microsoft_Excel & https://docs.microsoft.com/en-us/office/troubleshoot/excel/floating-point-arithmetic-inaccurate-result
Although Excel can display 30 decimal places, its precision for a specified number is confined to 15 significant figures, and calculations may have an accuracy that is even less.
// Excel has 15 significant figures max precision, then 600.000.000.000.001 is correctly retained, instead 6.000.000.000.000.001 becomes 6.000.000.000.000.000 - is lost the final 1

info about money and precision
https://opendata.stackexchange.com/questions/10346/what-specifications-are-out-there-for-the-precision-required-to-store-money
http://www.xbrl.org/WGN/precision-decimals-units/WGN-2017-01-11/precision-decimals-units-WGN-2017-01-11.html


/////
# SimObject class #SimObject
* numbers: stored with big.js http://mikemcl.github.io/big.js/
* numbers: throw exception with numbers with integer / decimal digits greater than SIMULATION_NUMBERS_INTEGER_PLACES & SIMULATION_NUMBERS_DECIMAL_PLACES elements (also in principal, in every number)

    function countDecimals (value) {
      if ((value % 1) !== 0)
        return value.toString().split(".")[1].length;
      return 0;
    }
    // per normalizzare i decimali ad un numero prefissato -> poi vedi se il numero intero è superiore al consentito (massimo 15 cifre in totale)
    function roundTo (num, decimalPlaces) {
      decimalPlaces = decimalPlaces ?? 10;
      return +num.toFixed(decimalPlaces);
    }
* numbers: throw exception with numbers with number of decimal (fractional) digits greater than SIMULATION_NUMBERS_DECIMAL_PLACES elements (also in principal, in every number)
* numbers: static method: normalizeNumber; returns a number with the right number of decimal places (normalize numbers with `roundTo` to SIMULATION_NUMBERS_DECIMAL_PLACES)
* dates: store dates without minutes/seconds


## new SimObjects / transaction class (#new #transaction)

la classe Transaction accetta 2 tipi di classi:
* NewSimObjects : {amount, metadata, etc}
* DeltaSimObjects : {id, delta, etc}

Ledger usa New/Delta per creare SimObjects che salva dentro Ledger.
New/Delta vengono distinti da Ledger interrogando la presenza dei campi 'amount' o 'delta' nell'oggetto.


## SimObject properties

// not exported properties
VersionId
OldVersionId
Quantity
UnityOfMeasure


## SimObject methods

* plus/minus, to return squared delta  // internally use Big.js
* setPrincipal {total, indefinite, plan[{day, amount}]}
  if sum of indefinite+plan != from total, throw
  return void
  // internally use Big.js

*/

/*
Deno modules from Excel modules:
* write in Excel relative path of modules
* command line option of “Deno.exe builder.js” to set the root of modules (./ or https/something) before execution from main.js

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
* logger_simObjects_writer  // scrive il dump dei SimObjects
* logger_messages_writer  // scrive un file di messaggi di errore fatale o warning, come lista di stringhe JSON #logger_messages_writer

#lock, #variables (#locks #immutable)

if needed see implementation of js lock  https://www.talkinghightech.com/en/initializing-js-lock/, but being immutable probably isn't needed...


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
Ledger crea poi la funzione lock `log_message` per consentire ai moduli di scrivere messaggi di tipo: debug, info, warning.  #log_message
tutti i messaggi sono scritti su SimObject di tipo "debug_", inserendo nella descrizione quel che si vuole (tipo messaggio, valore messaggio, ecc);
warning sono scritti anche su >logger_messages_writer.
messaggi di errore non sono previsti, vedi >error

/////
Lock function
normalizePrincipal {total, indefinite, plan[{day, amount}]}
  return squared on last plan day if plan array is present, or on indefinite
  // internally use Big.js, return numbers

*/

// errore, interruzione dell'esecuzione (#error #fatal error #throw)
/*
Qualunque modulo che voglia interrompere l'esecuzione del programma per un errore fatale esegue un `throw new Error`, che viene intercettato
con try catch da main.js, che:
* scrive su >logger_messages_writer
* scrive su SimObject di tipo "debug_"
* scrive su console
* ovviamente interrompe l'esecuzione
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
