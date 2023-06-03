// run it with `deno bench`

import { doubleEntrySideFromSimObjectType } from '../../../../src/engine/simobject/utils/doubleentryside_from_simobject_type.js';
import { SimObjectTypes_enum } from '../../../../src/engine/simobject/simobject_types_enum.js';
import { DoubleEntrySide_enum } from '../../../../src/engine/simobject/enums/doubleentryside_enum.js';

Deno.bench("doubleEntrySideFromSimObjectType() benchmark", () => {
  // get all DoubleEntrySide_enum values
  const _doubleEntrySideValues = Object.values(DoubleEntrySide_enum);
  // get all SimObjectTypes_enum values
  const simObjectTypesValues = Object.values(SimObjectTypes_enum)

  const loopCount = 100_000;

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    // loop SimObjectTypes_enum keys
    for (const _simObjectType of simObjectTypesValues) {
      const _doubleEntrySide = doubleEntrySideFromSimObjectType(_simObjectType);
    }
  }
});
