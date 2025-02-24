// TODO
/*
At 2025-02-23 the only solution I found is to provide Forecast.ETS (Holt-Winters) is using Pyodide
  https://www.npmjs.com/package/pyodide
  https://pyodide.org/en/stable/usage/index.html#node-js

There are Rust solutions but the ETS is not yet implemented:
* Ironcalc Rust library with JavaScript bindings, that at Release 1.0 should support also FORECAST.ETS functions
  https://github.com/ironcalc/IronCalc/issues/55
* augurs: Time series analysis for Rust, with bindings to Python and Javascript
  BEWARE: seasonality in ETS not yet implemented (2025/01)
  https://github.com/grafana/augurs
  https://crates.io/crates/augurs-ets
  Issue ETS: handle seasonal models  https://github.com/grafana/augurs/issues/27

//////////

Problems: I haven't find a solution to use the same code in Deno and in the browser.
Probably `main.js` should be different in the two environments.

Prerequisite for local execution:
1) install the `pyodide` npm package (as defined in the package.json file)
2) define a `GlobalImmutableValue` in `src/config/globals.js` to store later the forecast function

If is present a Simulation Setting enabling the advanced forecast,
Only if this module is configured/set in the input modules from the user, then the Python loading code will be executed:
3) during the setting phase of the module, the Python code [0] is loaded [1] and is kept in memory
4) save in the `GlobalImmutableValue` defined in `src/config/globals.js` the code to call python forecast function [2]
5) then, whenever in other modules is needed the forecast function, is available from 4)

[0] see sample code in https://github.com/77it/CodeSnippets/blob/963594e93ad803a53377a600eb9a82cb94a0fc65/_jsdocs/__samples/js/py/python_pyodide_B_statsmodel_forecast_test.js
[1] await pyodide.loadPackagesFromImports(py_source);
    [...]
    await loadPyodideCode(py_source);
[2] const result = await callPyodideFunction(months, values);
 */

// empty module
export class Module {
  alive = false;
}
