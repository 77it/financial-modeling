// run it with `deno bench`

import { doubleEntrySideFromSimObjectType } from '../../../../src/engine/simobject/enums/doubleentryside_enum.js';
import { SimObjectTypes_enum } from '../../../../src/engine/simobject/enums/simobject_types_enum.js';

Deno.bench("doubleEntrySideFromSimObjectType() benchmark", () => {
  // get all SimObjectTypes_enum values in an array
  const simObjectTypesValues = Object.values(SimObjectTypes_enum)

  // BEWARE !!!!!!
  // This benchmark is very slow, because it calls `doubleEntrySideFromSimObjectType` 10_000_000 times:
  // the test is done with a loop of 100_000 iterations * length of array SimObjectTypes_enum (~100 elements),
  const loopCount = 100_000;

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    // loop SimObjectTypes_enum values array
    for (const _simObjectType of simObjectTypesValues) {
      const _doubleEntrySide = doubleEntrySideFromSimObjectType(_simObjectType);
      if (_doubleEntrySide === '') {
        console.log(_doubleEntrySide);
        throw new Error(`doubleEntrySideFromSimObjectType(${_simObjectType}) returned undefined`);
      }
    }
  }
});
