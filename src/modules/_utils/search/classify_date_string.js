export { classifyDateString, DATE_CLASSIFICATION };

import { isNullOrWhiteSpace, parseJsonToLocalDate, isValidDate, stripTimeToLocalDate } from '../../deps.js';

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
 * @returns {{classification: DATE_CLASSIFICATION, date: undefined|Date}} One of INVALID + undefined, HISTORICAL or SIMULATION + Date
 */
function classifyDateString ({ dateString, simulationPrefix, historicalPrefix }) {
  try {
    const simulationDate = convertDateStringToLocalDateWithoutTime({ dateString, prefix: simulationPrefix });
    if (simulationDate !== undefined)
      return {classification: DATE_CLASSIFICATION.SIMULATION, date: simulationDate};

    const historicalDate = convertDateStringToLocalDateWithoutTime({ dateString, prefix: historicalPrefix });
    if (historicalDate !== undefined)
      return {classification: DATE_CLASSIFICATION.HISTORICAL, date: historicalDate};

    return {classification: DATE_CLASSIFICATION.INVALID, date: undefined};
  } catch (e) {
    return {classification: DATE_CLASSIFICATION.INVALID, date: undefined};
  }
}

/** Convert string date to local date with time stripped; if the conversion fails, returns undefined.
 * @param {Object} p
 * @param {string} p.dateString
 * @param {string[]} p.prefix
 * @returns {undefined | Date}
 */
function convertDateStringToLocalDateWithoutTime ({dateString, prefix}) {
  if (typeof dateString !== 'string')
    return undefined;

  // loop prefix elements
  for (let i = 0; i < prefix.length; i++) {
    if (isNullOrWhiteSpace(prefix[i])) {  // if prefix[i] isNullOrWhiteSpace, check only if is a date
      const _parsedDate = parseJsonToLocalDate(dateString);
      if (isValidDate(_parsedDate))
        return stripTimeToLocalDate(_parsedDate);
    } else if (typeof prefix[i] !== 'string') {
      // do nothing
    } else {
      const _prefix_lowercase = prefix[i].toLowerCase();
      if (dateString.toLowerCase().startsWith(_prefix_lowercase)) {
        const _parsedDate = parseJsonToLocalDate(dateString.slice(prefix[i].length));
        if (isValidDate(_parsedDate))
          return stripTimeToLocalDate(_parsedDate);
      }
    }
  }
  // at this point, if nothing is returned, returns false
  return undefined;
}
