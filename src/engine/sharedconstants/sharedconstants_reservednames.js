export { SHAREDCONSTANTS_RESERVEDNAMES };

import { deepFreeze } from '../../lib/obj_utils.js';

const SHAREDCONSTANTS_RESERVEDNAMES = {
  SIMULATION__DEBUG_FLAG: 'simulation__debug_flag',
  SIMULATION__INTERCOMPANY_TREASURY__DAILY_FUNCTION: 'simulation__intercompany_treasury__daily_function',
  UNIT__TAXES__DAILY_FUNCTION: 'unit__taxes__daily_function',
  UNIT__TREASURY__DAILY_FUNCTION: 'unit__treasury__daily_function',
};
deepFreeze(SHAREDCONSTANTS_RESERVEDNAMES);

// @ts-ignore
export const SHAREDCONSTANTS_RESERVEDNAMES_VALIDATION = Object.keys(SHAREDCONSTANTS_RESERVEDNAMES).map(key => SHAREDCONSTANTS_RESERVEDNAMES[key]);
