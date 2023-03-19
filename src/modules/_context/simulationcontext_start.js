export { SimulationContextStart };

// TODO UPDATE
/**
 Set drivers from an array of drivers dates and values
 @callback setSetting
 @param {{unit?: string, name: string, date?: Date, value: number}[]} p
 scenario: optional; default is SCENARIO.BASE ('base' by now); scenario can be null, undefined or '' meaning 'base'
 unit: driver unit
 name: driver name
 date: optional; if missing will be set to new Date(0)
 value: driver value
 */

/**
 Set drivers from an array of drivers dates and values
 @callback setDriver
 @param {{scenario?: string, unit: string, name: string, date?: Date, value: number}[]} p
 scenario: optional; default is SCENARIO.BASE ('base' by now); scenario can be null, undefined or '' meaning 'base'
 unit: driver unit
 name: driver name
 date: optional; if missing will be set to new Date(0)
 value: driver value
 */

/**
 * Set a TaskLock; a TaskLock can be set only once
 * @callback setTaskLock
 * @param {{unit?: string, name: string, value: *}} p
 * unit: optional; null, undefined or '' means `defaultUnit` from constructor
 * name: TaskLock name
 * value: TaskLock value
 * @return {boolean} true if TaskLock is set, false if TaskLock is already defined
 */

/**
 * Set simulation start date for a modules; every module can call it, and the resulting start date will be the earliest date of all calls
 * @callback setSimulationStartDate
 * @param {{date: Date}} p
 */

class SimulationContextStart {
  setSetting;
  setDriver;
  setTaskLock;
  setSimulationStartDate;

  /**
   * @param {Object} p
   * @param {setSetting} p.setSetting
   * @param {setDriver} p.setDriver
   * @param {setTaskLock} p.setTaskLock
   * @param {setSimulationStartDate} p.setSimulationStartDate
   */
  constructor ({ setSetting, setDriver, setTaskLock, setSimulationStartDate }) {
    this.setSetting = setSetting;
    this.setDriver = setDriver;
    this.setTaskLock = setTaskLock;
    this.setSimulationStartDate = setSimulationStartDate;
  }
}
