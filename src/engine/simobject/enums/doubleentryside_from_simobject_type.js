export { doubleEntrySideFromSimObjectType };

import { DoubleEntrySide_enum } from './doubleentryside_enum.js';

/**
 * Convert a SimObject type to a DoubleEntrySide enum
 * @param {string} type
 * @returns {string}  DoubleEntrySide enum
 */
function doubleEntrySideFromSimObjectType (type) {
    const _type = type.toUpperCase();

    if (_type.startsWith('BS_CASH__') || _type.startsWith('BS_CREDIT__') || _type.startsWith('BS_EQUITYINSTRUMENTS') || _type.startsWith('BS_GOOD__'))
        return DoubleEntrySide_enum.BALANCESHEET_DEBIT;
    else if (_type.startsWith('BS_EQUITY__') || _type.startsWith('BS_LIABILITY__'))
        return DoubleEntrySide_enum.BALANCESHEET_CREDIT;
    else if (_type.startsWith('IS_EXPENSE__') || _type.startsWith('IS_PROFITLOSS__NETINCOMEORLOSS__'))  // NETINCOMEORLOSS__ is treated as a cost
        return DoubleEntrySide_enum.INCOMESTATEMENT_DEBIT;
    else if (_type.startsWith('IS_INCOME__') || _type.startsWith('IS_PROFITLOSS__'))
        return DoubleEntrySide_enum.INCOMESTATEMENT_CREDIT;
    else if (_type.startsWith('MEMO'))
        return DoubleEntrySide_enum.MEMO;
    else
        throw new Error(`doubleEntrySideFromSimObjectType: unknown type ${_type}`);
}
