// TODO: to be improved, this is a minimal example

// pyodide info
/*
https://www.npmjs.com/package/pyodide
https://pyodide.org/en/stable/usage/index.html#node-js
https://til.simonwillison.net/deno/pyodide-sandbox
*/

import fs from 'node:fs';
import pyodideModule from 'pyodide/pyodide.js';

import { platformIsWindows } from '../node/platform_is_windows.js';
import { PYTHON_FORECAST__PYTHON_PATH_RELATIVE_TO_CLASS } from '../config/python.js';

export class PythonForecast {
  /** @type {*} */
  #pyodide;

  constructor() {
    if (!platformIsWindows())
      throw new Error('platform not supported');

    this.#pyodide = null;
  }

  async loadPython() {
    // read the python source file
    //
    // build a path with PYTHON_FORECAST__PYTHON_PATH_RELATIVE_TO_CLASS and this file path + normalize the path for Windows by removing the leading slash if it exists
    let srcPath = new URL(PYTHON_FORECAST__PYTHON_PATH_RELATIVE_TO_CLASS, import.meta.url).pathname;
    srcPath = srcPath.startsWith('/') ? srcPath.slice(1) : srcPath;
    const py_source = fs.readFileSync(srcPath, 'utf8');

    this.#pyodide = await pyodideModule.loadPyodide();

    // load the packages required from the Python source
    // see  https://pyodide.org/en/stable/usage/api/js-api.html#pyodide.loadPackagesFromImports
    await this.#pyodide.loadPackagesFromImports(py_source);

    // Define Python forecast function
    // see https://pyodide.org/en/stable/usage/api/js-api.html#pyodide.runPythonAsync
    await this.#pyodide.runPythonAsync(py_source);
  }

  // is an arrow function because can be used as a callback, and it needs to access the class private fields
  /**
   * @param months {number[]}
   * @param values {number[]}
   * @return {Promise<{dates: string[], mean: number[], pi_lower: number[], pi_upper: number[]}>}
   */
  callPythonForecastFunction = async (months, values) => {
    // Send data to Python
    this.#pyodide.globals.set("months", months);
    this.#pyodide.globals.set("values", values);
    await this.#pyodide.runPythonAsync("forecast_data(months, values)");

    // Retrieve data from Python
    const dates = this.#pyodide.globals.get("dates").toJs();
    const mean = this.#pyodide.globals.get("mean").toJs();
    const pi_lower = this.#pyodide.globals.get("pi_lower").toJs();
    const pi_upper = this.#pyodide.globals.get("pi_upper").toJs();

    return { dates, mean, pi_lower, pi_upper };
  }
}
