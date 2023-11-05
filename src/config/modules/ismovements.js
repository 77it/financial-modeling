// TODO to implement

export {tablesInfo};

import { schema, deepFreeze } from '../../deps.js';

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
tablesInfo.Set.columns = { categoria: 'categoria', category: 'category' };
tablesInfo.Set.sanitization = {
  [tablesInfo.Set.columns.categoria]: schema.STRING_TYPE,
  [tablesInfo.Set.columns.category]: schema.STRING_TYPE
};
deepFreeze(tablesInfo);
