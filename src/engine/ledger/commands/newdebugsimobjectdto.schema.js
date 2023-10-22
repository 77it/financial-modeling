export {newDebugSimObjectDto_Schema}

import * as schema from '../../../lib/schema.js';

/**
 object used to validate NewDebugSimObjectDto
*/
const newDebugSimObjectDto_Schema = {
  type: schema.STRING_TYPE,

  description: schema.STRING_TYPE,

  command__DebugDescription: schema.STRING_TYPE,

  commandGroup__DebugDescription: schema.STRING_TYPE,
}
