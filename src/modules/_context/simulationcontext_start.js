export { SimulationContextStart };

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
 * Set a SharedConstant; a SharedConstant can be set only once
 * @callback setSharedConstant
 * @param {Object} p
 * @param {string} [p.namespace] - Optional namespace; global/simulation namespace is STD_NAMES.Simulation.NAME ('$' by now); namespace can be null, undefined or '' meaning '$'
 * @param {string} p.name - SharedConstant name
 * @param {*} p.value - SharedConstant value
 * @return {boolean} true if SharedConstant is set, false if SharedConstant is already defined
 */

/**
 * Set simulation start date for a modules; every module can call it, and the resulting start date will be the earliest date of all calls
 * @callback setSimulationStartDate
 * @param {Object} p
 * @param {string} p.date - Simulation start date
 */

class SimulationContextStart {
  /**
   * @param {Object} p
   * @param {setDriver} p.setDriver
   * @param {setSharedConstant} p.setSharedConstant
   * @param {setSimulationStartDate} p.setSimulationStartDate
   */
  constructor ({ setDriver, setSharedConstant, setSimulationStartDate }) {
    this.setDriver = setDriver;
    this.setSharedConstant = setSharedConstant;
    this.setSimulationStartDate = setSimulationStartDate;
  }
}
