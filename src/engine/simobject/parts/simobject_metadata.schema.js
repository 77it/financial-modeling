export { simObject_Metadata_Schema };

import * as schema from '../../../lib/schema.js';

const simObject_Metadata_Schema = {
  metadata__Name: schema.ARRAY_OF_STRINGS_TYPE,
  metadata__Value: schema.ARRAY_OF_STRINGS_TYPE,
  metadata__PercentageWeight: schema.ARRAY_OF_NUMBERS_TYPE,
};
