// object used to validate simObjectDto
export const simObjectDto_Validation = {
  type: 'string',

  id: 'string',

  dateTime: 'Date',

  name: 'string',
  description: 'string',  // immutable, is used to generate Reports Detail
  mutableDescription: 'string',  // unused during Reports generation, can be used for debug purpose (and in the future to be shown to the user during a Drill Down of reports voices)

  metadata__Name: 'array[string]',
  metadata__Value: 'array[string]',
  metadata__PercentageWeight: 'array[number]',

  unitId: 'array[string]',

  // the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
  doubleEntrySide: '["BALANCESHEET_CREDIT", "BALANCESHEET_DEBIT", "INCOMESTATEMENT_CREDIT", "INCOMESTATEMENT_DEBIT", "MEMO"]',

  currency: '["UNDEFINED", "EUR", "USD"]',

  intercompanyInfo__VsUnitId: 'string',

  value: 'number',
  writingValue: 'number',

  alive: 'boolean',

  //#region command, command group properties
  command__Id: 'string',
  command__DebugDescription: 'string',

  commandGroup__Id: 'string',
  commandGroup__DebugDescription: 'string',
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: 'number',
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: 'array[date]',
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: 'array[number]',

  is_Link__SimObjId: 'string'
  //#endregion properties common only to some kind of SimObjects
}
