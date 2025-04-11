export { Agenda };

import { schema, sanitize, validate, stripTimeToLocalDate, localDateToStringYYYYMMDD } from '../deps.js';

class Agenda {
  /**
   Map to store things to do:
   keys are strings of ISO serialization of date (with `localDateToStringYYYYMMDD`), values are an array of {isSimulation: boolean, data: *}

   BEWARE: You cannot directly use a Date object as a key in a JavaScript Map because Map uses object references for keys,
   so two Date objects with the same value are treated as different keys, and to ensure consistent behavior,
   you should convert the Date to a string (e.g., ISO format) or a number (e.g., timestamp).
   * @type {Map<string, {isSimulation: boolean, data: *}[]>} */
  #repo;
  /** @type {Date} */
  #simulation_start_date__last_historical_day_is_the_day_before;
  /** @type {undefined|Date} */
  #first_date;

  /** This is the Agenda class that stores things to do.
   * @param {{simulationStartDate: Date}} p
   * simulationStartDate: simulation start date (the last historical day is the day before)
   */
  constructor ({simulationStartDate}) {
    this.#repo = new Map();
    this.#first_date = undefined;

    validate({ value: simulationStartDate, validation: schema.DATE_TYPE });
    this.#simulation_start_date__last_historical_day_is_the_day_before = stripTimeToLocalDate(simulationStartDate);
  }

  /**
   * Append an Agenda item to a day, ignoring the time part of the date.
   * If the simulation flag is true but the date is before the simulation start date, the item is ignored, otherwise it is added.
   * @param {Object} p
   * @param {*} p.date - Date (will be sanitized to local date without time); if the date is invalid, throw
   * @param {boolean} p.isSimulation - True if the item is for the simulation, false if it is for the historical period
   * @param {*} p.data - Agenda item data
   * @throws {Error} if `set__simulation_start_date` is not called before
   * @throws {Error} if `date` is invalid
   */
  set ({ date, isSimulation, data }) {
    // validate input parameters
    validate({
      value: { date,  isSimulation, data },
      validation: { date: schema.ANY_TYPE, isSimulation: schema.BOOLEAN_TYPE, data: schema.ANY_TYPE }
    });

    // sanitize date to Date (default date NaN); if the date is invalid, throw.
    const _date = sanitize({ value: date, sanitization: schema.DATE_TYPE, options: { defaultDate: new Date(NaN) } });
    validate({ value: _date, validation: schema.DATE_TYPE });

    // if the simulation flag is true but the date is before the simulation start date, the item is ignored; and vice versa.
    const _todayIsSimulationDay = _date >= this.#simulation_start_date__last_historical_day_is_the_day_before;
    if (isSimulation !== _todayIsSimulationDay)
      return;

    // save #first_date
    if (this.#first_date === undefined || _date < this.#first_date) this.#first_date = stripTimeToLocalDate(_date);

    const _key = localDateToStringYYYYMMDD(_date);
    if (!this.#repo.has(_key)) this.#repo.set(_key, []);
    this.#repo.get(_key)?.push({ isSimulation: isSimulation, data: data });
  }

  /**
   * Get all Agenda items for a day, ignoring the time part of the date.
   * Items are returned as is, without cloning.
   * @param {Object} p
   * @param {Date} p.date - Date
   * @return {{isSimulation: boolean, data: *}[]} Agenda items
   */
  get ({ date }) {
    const _key = localDateToStringYYYYMMDD(date);
    const _value = this.#repo.get(_key);
    if (_value === undefined)
      return [];
    else
      return _value;
  }

  /**
   * Get the first date of the Agenda
   * @return {undefined|Date}
   */
  getFirstDate () {
    return this.#first_date;
  }
}
