export { Drivers };

// TODO

class Drivers {
  /** Map to store Drivers: XXX id as string key, {date: date, value: *}[] array as value. Driver with only one element will have date = new Date(0).
   * @type {Map<String, *>} */
  #driversRepo;

  /**
   * Set a Driver
   * @param {Object} p
   * @param {string} [p.scenario='base'] - Optional scenario
   * @param {string} p.unit - Driver unit
   * @param {string} p.name - Driver name
   * @param {date} [p.date] - Optional date; if missing will be set to new Date(0)
   * @param {*} p.value - Driver value
   */
  driverSet ({ scenario = 'base', unit, name, date, value }) {
    // TODO not implemented
    throw new Error('not implemented');
  }

  /**
   * Get a Driver
   * @param {Object} p
   * @param {string} [p.scenario='base'] - Optional scenario
   * @param {string} p.unit - Driver unit
   * @param {string} p.name - Driver name
   * @param {date} [p.date] - Optional date; if missing, returns first value
   * @return {*} Driver
   */
  driverGet ({ scenario = 'base', unit, name, date }) {
    // TODO not implemented
    throw new Error('not implemented');
  }
}
