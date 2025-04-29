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
* install the `pyodide` npm package (as defined in the package.json file)
otherwise we can't set the Simulation Setting $$PYTHON_ADVANCED_FORECAST_FLAG to true.

Internals of Python inside this project:
* main reads the value of the Simulation Setting $$PYTHON_ADVANCED_FORECAST_FLAG
* if setting is TRUE then it loads the Python code whose location is defined in 'src/config/python.js' file [1]
* saves the python method [2] in the `GlobalImmutableValue` in 'src/config/python.js' PYTHON_FORECAST_GLOBAL_INSTANCE

[1] class PYTHON_FORECAST__CLASS_NAME from file PYTHON_FORECAST__CLASS_PATH
[2] method PYTHON_FORECAST__CLASS_METHOD_NAME
 */
