import { GlobalImmutableValue } from '../lib/global_immutable_value.js';

// if `Simulation.$$PYTHON_ADVANCED_FORECAST_FLAG` is true, main set this variable
// with the method PYTHON_FORECAST__CLASS_METHOD_NAME of the class PYTHON_FORECAST__CLASS_NAME from file PYTHON_FORECAST__CLASS_PATH;
// constants defined in "python.js"
export const PYTHON_FORECAST_GLOBAL_INSTANCE = new GlobalImmutableValue();

// path of the module that contains the default tasklocks, loaded by the main module
export const PYTHON_FORECAST__CLASS_PATH = './py/python_pyodide_statsmodel_forecast.js';
export const PYTHON_FORECAST__CLASS_NAME = 'PythonForecast';
export const PYTHON_FORECAST__CLASS_METHOD_NAME = 'callPythonForecastFunction';
export const PYTHON_FORECAST__PYTHON_PATH_RELATIVE_TO_CLASS = 'python_pyodide_statsmodel_forecast_func.py';
