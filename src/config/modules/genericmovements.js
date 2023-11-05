export {tablesInfo};

import { schema, deepFreeze } from '../../deps.js';
import * as CFG from '../engine.js';

const tablesInfo = {};
tablesInfo.Settings = {};
tablesInfo.Settings.tableName = 'settings';
tablesInfo.Settings.columns = { name: 'name', value: 'value' };
tablesInfo.Settings.sanitization = {
  [tablesInfo.Settings.columns.name]: schema.STRING_TYPE,
  [tablesInfo.Settings.columns.value]: schema.ANY_TYPE
};
tablesInfo.Set = {};
tablesInfo.Set.tableName = 'set';
tablesInfo.Set.columns = { simulation_input: 'simulation input', accounting_type: 'type', accounting_opposite_type: 'vs type', simObject_name: 'name' };
tablesInfo.Set.sanitization = {
  [tablesInfo.Set.columns.simulation_input]: schema.ANY_TYPE,
  [tablesInfo.Set.columns.accounting_type]: schema.STRINGUPPERCASETRIMMED_TYPE,
  [tablesInfo.Set.columns.accounting_opposite_type]: schema.STRINGUPPERCASETRIMMED_TYPE,
  [tablesInfo.Set.columns.simObject_name]: schema.STRINGUPPERCASETRIMMED_TYPE,
};
tablesInfo.Set.simulationColumnPrefix = CFG.SIMULATION_COLUMN_PREFIX;
tablesInfo.Set.historicalColumnPrefix = CFG.HISTORICAL_COLUMN_PREFIX;
deepFreeze(tablesInfo);
