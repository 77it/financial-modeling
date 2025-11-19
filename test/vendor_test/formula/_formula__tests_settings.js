export const EVALUATE_NUMBERS_AS_STRINGS = true;

/**
 * Converts a number to a string if the setting is enabled.
 * @param {*} value
 * @return {*|string}
 */
export function toStringWhenNeeded(value) {
  if (EVALUATE_NUMBERS_AS_STRINGS && typeof value === "number") {
    return value.toString();
  }
  return value;
}