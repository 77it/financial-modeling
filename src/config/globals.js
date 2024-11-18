import { GlobalImmutableValue } from '../lib/global_immutable_value.js';
import { SettingsDefaultValues } from './settings_default_values.js';
import { Simulation } from './settings_names.js';

//#region internal engine config

// This value is replaced, during engine execution, with value of simulation setting `$$DRIVER_PREFIXES__ZERO_IF_NOT_SET`.
export const DRIVER_PREFIXES__ZERO_IF_NOT_SET = new GlobalImmutableValue(SettingsDefaultValues[Simulation.$$DRIVER_PREFIXES__ZERO_IF_NOT_SET]);

//#endregion internal engine config

//#region modules config, used by engine and Excel UI

// We need HISTORICAL_COLUMN_PREFIX to prevent mismatching of historical data with simulation data when changes the Simulation Start Date.
// We need SIMULATION_COLUMN_PREFIX to be sure that dates wrote in Excel aren't converted in other locales as happens in italian locale
// (and when dates are in tables header are string and not numbers anymore, then JavaScript can't recognize them as dates).
export const SIMULATION_COLUMN_PREFIX = new GlobalImmutableValue('#');
export const HISTORICAL_COLUMN_PREFIX = new GlobalImmutableValue('H#');

//#endregion modules config, used by engine and Excel UI
