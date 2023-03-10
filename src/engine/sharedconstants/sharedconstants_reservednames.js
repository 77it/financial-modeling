export { SharedConstants_ReservedNames };

import { deepFreeze } from '../../lib/obj_utils.js';

const SharedConstants_ReservedNames = {
  // scenario
  ACTIVE__SCENARIO: 'ACTIVE__SCENARIO',  // to get the active scenario

  SIMULATION__INTERCOMPANY_TREASURY__DAILY_FUNCTION: 'SIMULATION__INTERCOMPANY_TREASURY__DAILY_FUNCTION',
  UNIT__TAXES__DAILY_FUNCTION: 'UNIT__TAXES__DAILY_FUNCTION',
  UNIT__TREASURY__DAILY_FUNCTION: 'UNIT__TREASURY__DAILY_FUNCTION',

  // active Unit, VsUnit, etc
  ACTIVE__UNIT: 'ACTIVE__UNIT',
  ACTIVE__VSUNIT: 'ACTIVE__VSUNIT',
  ACTIVE__METADATA_TYPE: 'ACTIVE__METADATA_TYPE',
  ACTIVE__METADATA_VALUE: 'ACTIVE__METADATA_VALUE',
  ACTIVE__METADATA_PERCENTAGEWEIGHT: 'ACTIVE__METADATA_PERCENTAGEWEIGHT',
  ACTIVE__METADATA: 'ACTIVE__METADATA',
  ACTIVE__INTEREST_ON_DEPOSITS: 'ACTIVE__INTEREST_ON_DEPOSITS',
  ACTIVE__PASSIVE_INTEREST_ON_OVERDRAFTS: 'ACTIVE__PASSIVE_INTEREST_ON_OVERDRAFTS',
};
deepFreeze(SharedConstants_ReservedNames);

// @ts-ignore
export const SharedConstants_ReservedNames_validation = Object.keys(SharedConstants_ReservedNames).map(key => SharedConstants_ReservedNames[key]);
