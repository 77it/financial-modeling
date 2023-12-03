import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../../deps.js';

import { doubleEntrySideFromSimObjectType } from '../../../../src/engine/simobject/utils/doubleentryside_from_simobject_type.js';
import { SimObjectTypes_enum } from '../../../../src/engine/simobject/enums/simobject_types_enum.js';
import { DoubleEntrySide_enum } from '../../../../src/engine/simobject/enums/doubleentryside_enum.js';

Deno.test('doubleEntrySideFromSimObjectType() test, all values', async () => {
  // get all DoubleEntrySide_enum values
  const _doubleEntrySideValues = Object.values(DoubleEntrySide_enum);

  // loop SimObjectTypes_enum keys
  for (const _simObjectType of Object.values(SimObjectTypes_enum)) {
    const _doubleEntrySide = doubleEntrySideFromSimObjectType(_simObjectType);
    console.log(`_simObjectType: ${_simObjectType}, _doubleEntrySide: ${_doubleEntrySide}`);
    assert(_doubleEntrySideValues.includes(_doubleEntrySide));
  }
});

Deno.test('doubleEntrySideFromSimObjectType() test, some lowercase values', async () => {
  const BS_CASH__BANKACCOUNT_FINANCIALACCOUNT = SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT.toLowerCase();
  assertEquals(doubleEntrySideFromSimObjectType(BS_CASH__BANKACCOUNT_FINANCIALACCOUNT), DoubleEntrySide_enum.BALANCESHEET_DEBIT);

  const BS_CREDIT__ACCRUALSCREDITS = SimObjectTypes_enum.BS_CREDIT__ACCRUALSCREDITS.toLowerCase();
  assertEquals(doubleEntrySideFromSimObjectType(BS_CREDIT__ACCRUALSCREDITS), DoubleEntrySide_enum.BALANCESHEET_DEBIT);

  const BS_EQUITYINSTRUMENTS__EQUITYINSTRUMENTS_ASSETS__FINANCIALINVESTMENT = SimObjectTypes_enum.BS_EQUITYINSTRUMENTS__EQUITYINSTRUMENTS_ASSETS__FINANCIALINVESTMENT.toLowerCase();
  assertEquals(doubleEntrySideFromSimObjectType(BS_EQUITYINSTRUMENTS__EQUITYINSTRUMENTS_ASSETS__FINANCIALINVESTMENT), DoubleEntrySide_enum.BALANCESHEET_DEBIT);

  const BS_GOOD__INVENTORIES__CONTRACTWORKINPROGRESS = SimObjectTypes_enum.BS_GOOD__INVENTORIES__CONTRACTWORKINPROGRESS.toLowerCase();
  assertEquals(doubleEntrySideFromSimObjectType(BS_GOOD__INVENTORIES__CONTRACTWORKINPROGRESS), DoubleEntrySide_enum.BALANCESHEET_DEBIT);

  const BS_EQUITY__NETINCOMEORLOSSOFTHEYEAR_EQUITY__RELATEDTOMAJORITYSHAREHOLDERS = SimObjectTypes_enum.BS_EQUITY__NETINCOMEORLOSSOFTHEYEAR_EQUITY__RELATEDTOMAJORITYSHAREHOLDERS.toLowerCase();
  assertEquals(doubleEntrySideFromSimObjectType(BS_EQUITY__NETINCOMEORLOSSOFTHEYEAR_EQUITY__RELATEDTOMAJORITYSHAREHOLDERS), DoubleEntrySide_enum.BALANCESHEET_CREDIT);

  const BS_LIABILITY__ACCRUALSDEBTS = SimObjectTypes_enum.BS_LIABILITY__ACCRUALSDEBTS.toLowerCase();
  assertEquals(doubleEntrySideFromSimObjectType(BS_LIABILITY__ACCRUALSDEBTS), DoubleEntrySide_enum.BALANCESHEET_CREDIT);

  const IS_INCOME__CAPITALGAIN = SimObjectTypes_enum.IS_INCOME__CAPITALGAIN.toLowerCase();
  assertEquals(doubleEntrySideFromSimObjectType(IS_INCOME__CAPITALGAIN), DoubleEntrySide_enum.INCOMESTATEMENT_CREDIT);

  const IS_PROFITLOSS__CHANGESININVENTORIES__CONTRACTWORKINPROGRESS = SimObjectTypes_enum.IS_PROFITLOSS__CHANGESININVENTORIES__CONTRACTWORKINPROGRESS.toLowerCase();
  assertEquals(doubleEntrySideFromSimObjectType(IS_PROFITLOSS__CHANGESININVENTORIES__CONTRACTWORKINPROGRESS), DoubleEntrySide_enum.INCOMESTATEMENT_CREDIT);

  const IS_EXPENSE__AMORTIZATION = SimObjectTypes_enum.IS_EXPENSE__AMORTIZATION.toLowerCase();
  assertEquals(doubleEntrySideFromSimObjectType(IS_EXPENSE__AMORTIZATION), DoubleEntrySide_enum.INCOMESTATEMENT_DEBIT);

  const MEMO__DATAFROMSIMULATION = SimObjectTypes_enum.MEMO__DATAFROMSIMULATION.toLowerCase();
  assertEquals(doubleEntrySideFromSimObjectType(MEMO__DATAFROMSIMULATION), DoubleEntrySide_enum.MEMO);
});
