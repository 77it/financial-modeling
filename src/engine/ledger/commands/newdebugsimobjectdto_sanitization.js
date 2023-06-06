export {newDebugSimObjectDto_Sanitization}

import * as sanitization from '../../../lib/sanitization_utils.js';

/**
 object used to validate NewDebugSimObjectDto
*/
const newDebugSimObjectDto_Sanitization = {
  type: sanitization.STRING_TYPE,

  description: sanitization.STRING_TYPE,

  command__DebugDescription: sanitization.STRING_TYPE,

  commandGroup__DebugDescription: sanitization.STRING_TYPE,
}
