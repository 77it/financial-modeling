export {newDebugSimObjectDto_Schema}

import * as schema from '../../../lib/schema.js';

/**
 object used to validate NewDebugSimObjectDto
*/
const newDebugSimObjectDto_Schema = {
  description: schema.STRING_TYPE,

  command__DebugDescription: schema.STRING_TYPE + schema.OPTIONAL,

  commandGroup__DebugDescription: schema.STRING_TYPE + schema.OPTIONAL,
}
