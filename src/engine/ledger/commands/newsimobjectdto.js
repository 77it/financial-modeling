export { NewSimObjectDto };

class NewSimObjectDto {
  /**
   * @param {Object} p
   * @param {string} p.type
   * @param {string} [p.name]
   * @param {string} [p.description]
   * @param {string} [p.mutableDescription]
   * @param {string[]} [p.metadata__Name]
   * @param {string[]} [p.metadata__Value]
   * @param {number[]} [p.metadata__PercentageWeight]
   * @param {string} p.unitId
   * @param {string} p.currency
   * @param {string} [p.intercompanyInfo__VsUnitId]
   * @param {number} p.value
   * @param {boolean} p.alive
   * @param {string} [p.command__DebugDescription]
   * @param {string} [p.commandGroup__DebugDescription]
   * @param {number} p.bs_Principal__PrincipalToPay_IndefiniteExpiryDate
   * @param {Date[]} p.bs_Principal__PrincipalToPay_AmortizationSchedule__Date
   * @param {number[]} p.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal
   * @param {string} [p.is_Link__SimObjId]
   * @param {string} [p.vsSimObjectName]
   * @param {*} [p.extras]
   */
  constructor (p) {
    this.type = p.type;
    this.name = p.name;
    this.description = p.description;
    this.mutableDescription = p.mutableDescription;
    this.metadata__Name = p.metadata__Name;
    this.metadata__Value = p.metadata__Value;
    this.metadata__PercentageWeight = p.metadata__PercentageWeight;
    this.unitId = p.unitId;
    this.currency = p.currency;
    this.intercompanyInfo__VsUnitId = p.intercompanyInfo__VsUnitId;
    this.value = p.value;
    this.alive = p.alive;
    this.command__DebugDescription = p.command__DebugDescription;
    this.commandGroup__DebugDescription = p.commandGroup__DebugDescription;
    this.bs_Principal__PrincipalToPay_IndefiniteExpiryDate = p.bs_Principal__PrincipalToPay_IndefiniteExpiryDate;
    this.bs_Principal__PrincipalToPay_AmortizationSchedule__Date = p.bs_Principal__PrincipalToPay_AmortizationSchedule__Date;
    this.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = p.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal;
    this.is_Link__SimObjId = p.is_Link__SimObjId;
    this.vsSimObjectName = p.vsSimObjectName;
    this.extras = p.extras;
  }
}
