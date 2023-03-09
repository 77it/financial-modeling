export { SharedConstants_ReservedNames };

import { deepFreeze } from '../../lib/obj_utils.js';

const SharedConstants_ReservedNames = {
  SIMULATION__DEBUG_FLAG: 'simulation__debug_flag',
  SIMULATION__INTERCOMPANY_TREASURY__DAILY_FUNCTION: 'simulation__intercompany_treasury__daily_function',
  UNIT__TAXES__DAILY_FUNCTION: 'unit__taxes__daily_function',
  UNIT__TREASURY__DAILY_FUNCTION: 'unit__treasury__daily_function',
};
deepFreeze(SharedConstants_ReservedNames);

// @ts-ignore
export const SharedConstants_ReservedNames_validation = Object.keys(SharedConstants_ReservedNames).map(key => SharedConstants_ReservedNames[key]);
