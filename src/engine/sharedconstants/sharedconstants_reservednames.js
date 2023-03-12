export { SharedConstants_ReservedNames };

import { deepFreeze } from '../../lib/obj_utils.js';

const SharedConstants_ReservedNames = {
  SIMULATION__INTERCOMPANY_TREASURY__DAILY_FUNCTION: 'SIMULATION__INTERCOMPANY_TREASURY__DAILY_FUNCTION',
  UNIT__TAXES__DAILY_FUNCTION: 'UNIT__TAXES__DAILY_FUNCTION',
  UNIT__TREASURY__DAILY_FUNCTION: 'UNIT__TREASURY__DAILY_FUNCTION',
};
deepFreeze(SharedConstants_ReservedNames);

// @ts-ignore
export const SharedConstants_ReservedNames_validation = Object.keys(SharedConstants_ReservedNames).map(key => SharedConstants_ReservedNames[key]);
