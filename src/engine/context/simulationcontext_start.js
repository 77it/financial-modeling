export { SimulationContextStart };

class SimulationContextStart {
  #setSetting;
  #setDriver;
  #setTaskLock;

  get setSetting() { return this.#setSetting; }
  get setDriver() { return this.#setDriver; }
  get setTaskLock() { return this.#setTaskLock; }

  /**
   * @param {Object} p
   * @param {setSetting} p.setSetting
   * @param {setDriver} p.setDriver
   * @param {setTaskLock} p.setTaskLock
   */
  constructor ({ setSetting, setDriver, setTaskLock }) {
    this.#setSetting = setSetting;
    this.#setDriver = setDriver;
    this.#setTaskLock = setTaskLock;
  }
}

/**
 * @callback setSetting
 * Set Settings from an array of scenarios, units, names, dates and value.
 * Settings can be immutable and mutable.
 * If a date is already present, the second one will be ignored.
 * @param {{scenario?: string, unit?: string, name: string, date?: Date, value: *}[]} p
 * scenario: optional; null, undefined or '' means `currentScenario` from constructor
 * unit: Setting unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * name: Setting name
 * date: optional; if missing will be set to new Date(0)
 * value: Setting value
 */

/**
 * @callback setDriver
 * Set Drivers from an array of scenarios, units, names, dates and value.
 * Drivers are immutable.
 * If a date is already present, the second one will be ignored.
 * @param {{scenario?: string, unit?: string, name: string, date?: Date, value: *}[]} p
 * scenario: optional; null, undefined or '' means `currentScenario` from constructor
 * unit: Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * name: Driver name
 * date: optional; if missing will be set to new Date(0)
 * value: Driver value, will be sanitized to number
 */

/**
 * @callback setTaskLock
 * Set a TaskLock; TaskLocks are immutable.
 * @param {Object} p
 * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * @param {string} p.name - TaskLock name
 * @param {*} p.value - TaskLock value
 * @return {boolean} true if TaskLock is set, false if TaskLock is already defined
 */
