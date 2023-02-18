export { SHAREDCONSTANTS_RESERVEDNAMES };

import { deepFreeze } from '../../lib/obj_utils.js';

const SHAREDCONSTANTS_RESERVEDNAMES = {
  TAXES: 'taxes',
  TREASURY: 'treasury',
  DEBUG: 'debug',
};
deepFreeze(SHAREDCONSTANTS_RESERVEDNAMES);

// @ts-ignore
export const SHAREDCONSTANTS_RESERVEDNAMES_VALIDATION = Object.keys(SHAREDCONSTANTS_RESERVEDNAMES).map(key => SHAREDCONSTANTS_RESERVEDNAMES[key]);
