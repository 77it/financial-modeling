export {newDebugSimObjectDto_Validation}

import { sanitization } from '../../../deps.js';

/**
 object used to validate simObjectDto
*/
const newDebugSimObjectDto_Validation = {
  type: sanitization.STRING_TYPE,

  description: sanitization.STRING_TYPE,
}
