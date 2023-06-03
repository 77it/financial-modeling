export { Agenda };

import { toStringYYYYMMDD } from '../../deps.js';

class Agenda {
  /**
   Map to store things to do:
   keys are strings of ISO serialization of date (with `toStringYYYYMMDD`), values are *.
   * @type {Map<string, *>} */
  #repo;
  /**
   Map to store last returned values for each day:
   keys are string of ISO serialization of date (with `toStringYYYYMMDD`), values are number.
   * @type {Map<string, number>} */
  #lastReturnedValueForADayRepo;

  constructor () {
    this.#repo = new Map();
    this.#lastReturnedValueForADayRepo = new Map();
  }

  /**
   * Append an Agenda item to a day, ignoring the time part of the date
   * @param {Object} p
   * @param {Date} p.date - Date
   * @param {*} p.value - Agenda item
   */
  set ({ date, value }) {
    const _key = toStringYYYYMMDD(date);
    if (!this.#repo.has(_key)) this.#repo.set(_key, []);
    this.#repo.get(_key).push(value);
  }

  /**
   * Get all Agenda items for a day, ignoring the time part of the date
   * @param {Object} p
   * @param {Date} p.date - Date
   * @return {*[]} Agenda items
   */
  get ({ date }) {
    const _key = toStringYYYYMMDD(date);
    if (!this.#repo.has(_key)) return [];
    return this.#repo.get(_key);
  }
}
