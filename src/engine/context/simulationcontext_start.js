export { SimulationContextStart };

class SimulationContextStart {
  #setSetting;
  #setDriver;
  #setTaskLock;
  #isDefinedLock;

  get setSetting() { return this.#setSetting; }
  get setDriver() { return this.#setDriver; }
  get setTaskLock() { return this.#setTaskLock; }
  get isDefinedLock() { return this.#isDefinedLock; }

  /**
   * @param {Object} p
   * @param {setSetting} p.setSetting
   * @param {setDriver} p.setDriver
   * @param {setTaskLock} p.setTaskLock
   * @param {isDefinedLock} p.isDefinedLock
   */
  constructor ({ setSetting, setDriver, setTaskLock, isDefinedLock }) {
    this.#setSetting = setSetting;
    this.#setDriver = setDriver;
    this.#setTaskLock = setTaskLock;
    this.#isDefinedLock = isDefinedLock;
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
 * @param {{unit?: string, name: string, value: *}} p
 * unit: Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * name: TaskLock name
 * value: TaskLock value
 * @return {boolean} true if TaskLock is set, false if TaskLock is already defined
 */

/**
 * @callback isDefinedLock
 * Check if a TaskLock is defined
 * @param {{unit?: string, name: string}} p
 * unit: Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * name: TaskLock name
 * @return {boolean}
 */
