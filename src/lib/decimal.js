export { ROUNDING_MODES };

/**
 * inspired by https://mikemcl.github.io/decimal.js-light/#modes
 *
 * @enum {string}
 * @readonly
 */
const ROUNDING_MODES = {
  TRUNC: "TRUNC",
  ROUND_HALF_EVEN: "ROUND_HALF_EVEN",   // Rounds towards nearest neighbour. If equidistant, rounds towards even neighbour
  ROUND_HALF_UP: "ROUND_HALF_UP"        // Rounds towards nearest neighbour. If equidistant, rounds away from zero
};
Object.freeze(ROUNDING_MODES);
