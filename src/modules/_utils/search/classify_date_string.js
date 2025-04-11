export { classifyDateString, DATE_CLASSIFICATION };

import { isNullOrWhiteSpace, parseJsonToLocalDate, isValidDate } from '../../deps.js';

/**
 * @enum {string}
 * @readonly
 */
const DATE_CLASSIFICATION = {
  INVALID: "INVALID",
  HISTORICAL: "HISTORICAL",
  SIMULATION: "SIMULATION",
};
Object.freeze(DATE_CLASSIFICATION);

/** Classify an input string, checking if starts with one of the two kind of prefix (case-insensitive) that can be parsed as a Date.
 * @param {Object} p
 * @param {string} p.dateString
 * @param {string[]} p.simulationPrefix
 * @param {string[]} p.historicalPrefix
 * @returns {DATE_CLASSIFICATION} One of INVALID, HISTORICAL, SIMULATION
 */
function classifyDateString ({ dateString, simulationPrefix, historicalPrefix }) {
  try {
    if (isDateString({ dateString, prefix: simulationPrefix })) {
      return DATE_CLASSIFICATION.SIMULATION;
    } else if (isDateString({ dateString, prefix: historicalPrefix })) {
      return DATE_CLASSIFICATION.HISTORICAL;
    } else {
      return DATE_CLASSIFICATION.INVALID;
    }
  } catch (e) {
    return DATE_CLASSIFICATION.INVALID;
  }
}

/** Classify an input string, checking if starts with a specific prefix (case-insensitive) that can be parsed as a Date.
 * @param {Object} p
 * @param {string} p.dateString
 * @param {string[]} p.prefix
 * @returns {boolean}
 */
function isDateString ({dateString, prefix}) {
  if (typeof dateString !== 'string')
    return false;

  // loop prefix elements
  for (let i = 0; i < prefix.length; i++) {
    if (isNullOrWhiteSpace(prefix[i])) {  // if prefix[i] isNullOrWhiteSpace, check only if is a date
      const _parsedDate = parseJsonToLocalDate(dateString);
      if (isValidDate(_parsedDate))
        return true;
    } else if (typeof prefix[i] !== 'string') {
      // do nothing
    } else {
      const _prefix_lowercase = prefix[i].toLowerCase();
      if (dateString.toLowerCase().startsWith(_prefix_lowercase)) {
        const _parsedDate = parseJsonToLocalDate(dateString.slice(prefix[i].length));
        if (isValidDate(_parsedDate))
          return true;
      }
    }
  }
  // at this point, if nothing is returned, returns false
  return false;
}
