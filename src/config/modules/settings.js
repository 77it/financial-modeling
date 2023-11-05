export {tablesInfo};

import { schema, deepFreeze } from '../../deps.js';

const tablesInfo = {};
tablesInfo.Set = {};
tablesInfo.Set.tableName = 'set';
tablesInfo.Set.columns = { scenario: 'scenario', unit: 'unit', name: 'name', date: 'date', value: 'value' };
tablesInfo.Set.sanitization = {
  [tablesInfo.Set.columns.scenario]: schema.STRING_TYPE,
  [tablesInfo.Set.columns.unit]: schema.STRING_TYPE,
  [tablesInfo.Set.columns.name]: schema.STRING_TYPE,
  [tablesInfo.Set.columns.date]: schema.DATE_TYPE,
  [tablesInfo.Set.columns.value]: schema.ANY_TYPE
};
tablesInfo.Set.sanitizationOptions = {
  defaultDate: new Date(0)
};
tablesInfo.ActiveSet = {};
tablesInfo.ActiveSet.tableName = 'activeset';
tablesInfo.ActiveSet.columns = { scenario: 'scenario', unit: 'unit', name: 'name', date: 'date', value: 'value' };
tablesInfo.ActiveSet.sanitization = {
  [tablesInfo.ActiveSet.columns.scenario]: schema.STRING_TYPE,
  [tablesInfo.ActiveSet.columns.unit]: schema.STRING_TYPE,
  [tablesInfo.ActiveSet.columns.name]: schema.STRING_TYPE,
  [tablesInfo.ActiveSet.columns.date]: schema.DATE_TYPE,
  [tablesInfo.ActiveSet.columns.value]: schema.ANY_TYPE
};
tablesInfo.ActiveSet.sanitizationOptions = {
  defaultDate: new Date(0)
};
deepFreeze(tablesInfo);
