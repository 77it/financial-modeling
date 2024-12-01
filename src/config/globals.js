import { GlobalImmutableValue } from '../lib/global_immutable_value.js';
import { SettingsDefaultValues } from './settings_default_values.js';
import { Simulation } from './settings_names.js';

//#region internal engine config

// This value is replaced, during engine execution, with value of simulation setting `$$DRIVER_PREFIXES__ZERO_IF_NOT_SET`.
export const DRIVER_PREFIXES__ZERO_IF_NOT_SET = new GlobalImmutableValue(SettingsDefaultValues[Simulation.$$DRIVER_PREFIXES__ZERO_IF_NOT_SET]);

//#endregion internal engine config
