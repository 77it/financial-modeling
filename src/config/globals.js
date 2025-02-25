import { GlobalImmutableValue } from '../lib/global_immutable_value.js';
import { SettingsDefaultValues } from './settings_default_values.js';
import { Simulation } from './settings_names.js';

//#region internal engine config

// This value is replaced, during engine execution, with value of simulation setting `$$DRIVER_PREFIXES__ZERO_IF_NOT_SET`.
export const DRIVER_PREFIXES__ZERO_IF_NOT_SET = new GlobalImmutableValue(SettingsDefaultValues[Simulation.$$DRIVER_PREFIXES__ZERO_IF_NOT_SET]);
export const DEFAULT_ACCOUNTING_VS_TYPE = new GlobalImmutableValue(SettingsDefaultValues[Simulation.$$DEFAULT_ACCOUNTING_VS_TYPE]);
// if `Simulation.$$PYTHON_ADVANCED_FORECAST_FLAG` is true, main set this variable
// with the method PYTHON_FORECAST__CLASS_METHOD_NAME of the class PYTHON_FORECAST__CLASS_NAME from file PYTHON_FORECAST__CLASS_PATH;
// constants defined in "python.js"
export const PYTHON_FORECAST = new GlobalImmutableValue();

//#endregion internal engine config
