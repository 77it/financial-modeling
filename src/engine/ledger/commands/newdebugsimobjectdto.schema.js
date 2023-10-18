export {newDebugSimObjectDto_Schema}

import * as sanitization from '../../../lib/sanitization_utils.js';

/**
 object used to validate NewDebugSimObjectDto
*/
const newDebugSimObjectDto_Schema = {
  type: sanitization.STRING_TYPE,

  description: sanitization.STRING_TYPE,

  command__DebugDescription: sanitization.STRING_TYPE,

  commandGroup__DebugDescription: sanitization.STRING_TYPE,
}
