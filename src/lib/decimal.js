import { BIGINT_DECIMAL_SCALE as CFG_SCALE, ROUNDING_MODE as CFG_ROUNDING, ROUNDING_MODES } from '../config/engine.js';

export { _TEST_ONLY__SET };

let BIGINT_DECIMAL_SCALE = CFG_SCALE;
let ROUNDING_MODE = CFG_ROUNDING;

/**
 * This is a function used for testing purposes, to set the bigint decimal scale and rounding mode.
 * @param {number} test_bigintSecimalScale
 * @param {string} test_roundingMode
 */
function _TEST_ONLY__SET(test_bigintSecimalScale, test_roundingMode) {
  BIGINT_DECIMAL_SCALE = test_bigintSecimalScale;
  ROUNDING_MODE = test_roundingMode;
}
