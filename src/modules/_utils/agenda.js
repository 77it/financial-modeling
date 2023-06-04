export { Agenda };

import { sanitization, validation, stripTime, toStringYYYYMMDD } from '../../deps.js';

class Agenda {
  /**
   Map to store things to do:
   keys are strings of ISO serialization of date (with `toStringYYYYMMDD`), values are an array of {value: number, isSimulation: boolean, info: *}
   * @type {Map<string, {value: number, isSimulation: boolean, info: *}[]>} */
  #repo;
  /**
   Map to store last returned values for each day:
   keys are string of ISO serialization of date (with `toStringYYYYMMDD`), values are number.
   * @type {Map<string, number>} */
  #lastReturnedValueForADayRepo;
  /** @type {undefined|Date} */
  #simulation_start_date__last_historical_day_is_the_day_before;

  /** This is the Agenda class that stores things to do.
   * Remember to set the simulation start date with `set__simulation_start_date` before setting any Agenda item.
   */
  constructor () {
    this.#repo = new Map();
    this.#lastReturnedValueForADayRepo = new Map();
    this.#simulation_start_date__last_historical_day_is_the_day_before = undefined;
  }

  /** Set the simulation start date (the last historical day is the day before)
   * @param {Date} value */
  setSimulationStartDate (value) {
    if (this.#simulation_start_date__last_historical_day_is_the_day_before !== undefined)  // if date is already set, throw
      throw new Error('Agenda.set__simulation_start_date: date is already set');

    validation.validate({ value: value, validation: validation.DATE_TYPE });

    this.#simulation_start_date__last_historical_day_is_the_day_before = stripTime(value);
  }

  /**
   * Append an Agenda item to a day, ignoring the time part of the date
   * @param {Object} p
   * @param {*} p.date - Date (will be sanitized to date); if the date is invalid, throw
   * @param {*} p.value - Numeric value of the item (will be sanitized to number); skip adding if sanitized value = 0
   * @param {boolean} p.isSimulation - True if the item is for the simulation, false if it is for the historical period
   * @param {*} p.info - Agenda item info
   * @throws {Error} if `set__simulation_start_date` is not called before
   * @throws {Error} if `date` is invalid
   */
  set ({ date, value, isSimulation, info }) {
    if (this.#simulation_start_date__last_historical_day_is_the_day_before === undefined)
      throw new Error('Agenda.set: simulation_start_date__last_historical_day_is_the_day_before is undefined');

    // validate input parameters
    validation.validateObj({
      obj: { date, value, isSimulation, info },
      validation: { date: validation.ANY_TYPE, value: validation.ANY_TYPE, isSimulation: validation.BOOLEAN_TYPE, info: validation.ANY_TYPE }
    });

    // sanitize `value` to number; if _value is 0, skip adding the item
    const _value = sanitization.sanitize({ value: value, sanitization: sanitization.NUMBER_TYPE });
    if (_value === 0) return;

    // sanitize date to Date (default date NaN); if the date is invalid, throw.
    let _date = sanitization.sanitize({ value: date, sanitization: sanitization.DATE_TYPE, options: { defaultDate: new Date(NaN) } });
    validation.validate({ value: _date, validation: validation.DATE_TYPE });

    const _todayIsSimulationDay = _date >= this.#simulation_start_date__last_historical_day_is_the_day_before;
    if (isSimulation !== _todayIsSimulationDay)
      return;

    const _key = toStringYYYYMMDD(_date);
    if (!this.#repo.has(_key)) this.#repo.set(_key, []);
    //@ts-ignore
    this.#repo.get(_key).push({ value, isSimulation, info });
  }

  /**
   * Get all Agenda items for a day, ignoring the time part of the date
   * @param {Object} p
   * @param {Date} p.date - Date
   * @return {{value: number, isSimulation: boolean, info: *}[]} Agenda items
   */
  get ({ date }) {
    const _key = toStringYYYYMMDD(date);
    if (!this.#repo.has(_key)) return [];
    //@ts-ignore
    return this.#repo.get(_key);
  }
}
