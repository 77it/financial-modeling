// debug
// https://stackoverflow.com/questions/61853754/how-to-debug-deno-in-vscode
// https://deno.land/manual@v1.21.0/vscode_deno#using-the-debugger

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

// test:
// * import from json:
//   * ../SimulationEngineSettings.json & ../SimulationEngineModules.json
// * import-from-https

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

# main.js generation / SimulationEngine

SimulationInit select the maximum supported shared version from min to max: if 1, select the last 1.3.4; …; if 3, select 3.2.3.

If there is no shared version between modules, error.

Simulation init then generate a local main.js that calls the maximum common version of SimulationEngine (as SimulationEngine_v1_0_4)
*/

// SimulationEngine (#SimulationEngine, #ModuleRunner, #ModulesData)
/*
SimulationEngine accepts ModuleRunner and ModuleTables[] as input parameters
 */

// # Modules (#modules)
/*
Every module has two exported const named: MIN_ENGINE_VERSION and MAX_ENGINE_VERSION, two strings with a single number inside.
 */


// Ledger: fornisci alcuni oggetti per scrivere su file:
// * logger_simObjects
// * logger_errors
// * logger_messages
