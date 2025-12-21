//#region Marker of unquoted formula values in JSONX (and for other uses, if needed)

export { FORMULA_MARKER };

import { UNPRINTABLE_CHAR, FML_PREFIX } from '../../../src/config/engine.js'

// Special markers for unquoted formula values in JSONX
// ASCII 31 (hidden character) + '#' (visible marker)
const FORMULA_MARKER_HIDDEN = UNPRINTABLE_CHAR;
const FORMULA_MARKER_VISIBLE = FML_PREFIX[0];
const FORMULA_MARKER = FORMULA_MARKER_HIDDEN + FORMULA_MARKER_VISIBLE;  // Combined marker

//#endregion Marker of unquoted formula values in JSONX (and for other uses, if needed)
